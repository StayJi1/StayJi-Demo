const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');

const DEFAULT_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

const idFields = [
    'id',
    '_id',
    'userId',
    'userIDFK',
    'ownerId',
    'vendorId',
    'adminId',
    'performerId',
    'reviewedBy',
    'propertyId',
    'propertyIDFK',
    'propertyTypeIDFK',
    'conversationId',
    'messageId',
    'moveInId',
    'recipientId',
    'assignedAdmin',
];

function createHttpError(statusCode, message, code, details) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode;
    error.code = code;
    error.details = details;
    return error;
}

function isApiRequest(req) {
    return req.path.startsWith('/api') || req.path.startsWith('/client') || req.xhr || req.headers.accept?.includes('application/json');
}

function requestContext(req, res, next) {
    const requestId = req.headers['x-request-id'] || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
    req.requestId = requestId;
    req.startedAt = Date.now();
    res.setHeader('X-Request-Id', requestId);
    next();
}

function structuredResponses(req, res, next) {
    res.success = function success(payload = {}) {
        const statusCode = payload.statusCode || 200;
        return res.status(statusCode).json({
            result: 'success',
            msg: payload.msg || payload.message || 'Success',
            data: payload.data === undefined ? null : payload.data,
            meta: payload.meta,
            requestId: req.requestId,
        });
    };

    res.failure = function failure(payload = {}) {
        const statusCode = payload.statusCode || 400;
        const message = payload.msg || payload.message || 'Request failed';
        return res.status(statusCode).json({
            result: 'failure',
            msg: message,
            data: payload.data === undefined ? null : payload.data,
            error: {
                code: payload.code || 'REQUEST_FAILED',
                message,
                details: payload.details,
            },
            requestId: req.requestId,
        });
    };

    next();
}

function requestLogger(req, res, next) {
    res.on('finish', () => {
        const durationMs = Date.now() - (req.startedAt || Date.now());
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        const log = {
            event: 'request_completed',
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        };
        console[level](JSON.stringify(log));
    });
    next();
}

function timeoutHandler(timeoutMs = DEFAULT_TIMEOUT_MS) {
    return function timeoutMiddleware(req, res, next) {
        let completed = false;
        const timer = setTimeout(() => {
            if (completed || res.headersSent) return;
            req.timedout = true;
            next(createHttpError(503, 'Request timed out.', 'REQUEST_TIMEOUT', { timeoutMs }));
        }, timeoutMs);

        res.on('finish', () => {
            completed = true;
            clearTimeout(timer);
        });
        res.on('close', () => {
            completed = true;
            clearTimeout(timer);
        });

        next();
    };
}

function validateObjectIdValue(value) {
    if (value === undefined || value === null || value === '') return true;
    if (Array.isArray(value)) return value.every(validateObjectIdValue);
    return mongoose.Types.ObjectId.isValid(value);
}

function collectInvalidIds(source = {}, sourceName = 'body') {
    return idFields
        .filter((field) => Object.prototype.hasOwnProperty.call(source, field))
        .filter((field) => !validateObjectIdValue(source[field]))
        .map((field) => ({ field: `${sourceName}.${field}`, value: source[field] }));
}

function validateKnownObjectIds(req, res, next) {
    const invalidIds = [
        ...collectInvalidIds(req.body, 'body'),
        ...collectInvalidIds(req.query, 'query'),
    ];

    if (invalidIds.length) {
        return next(createHttpError(400, 'One or more IDs are invalid.', 'VALIDATION_ERROR', invalidIds));
    }

    next();
}

function validateObjectIdParam(paramName = 'id') {
    return function validateParam(req, res, next, value) {
        if (!validateObjectIdValue(value)) {
            return next(createHttpError(400, `Invalid ${paramName}.`, 'VALIDATION_ERROR', [{ field: `params.${paramName}`, value }]));
        }
        next();
    };
}

function notFoundHandler(req, res) {
    const message = `Route not found: ${req.method} ${req.originalUrl}`;
    if (!isApiRequest(req) && req.method === 'GET') {
        return res.status(404).send(message);
    }

    return res.status(404).json({
        result: 'failure',
        msg: 'Route not found.',
        data: null,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message,
        },
        requestId: req.requestId,
    });
}

function normalizeError(error) {
    if (error instanceof multer.MulterError) {
        return {
            statusCode: 400,
            code: `UPLOAD_${error.code || 'ERROR'}`,
            message: error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large.' : error.message,
            details: error.field ? [{ field: error.field }] : undefined,
        };
    }

    if (error.type === 'entity.parse.failed' || error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return {
            statusCode: 400,
            code: 'INVALID_JSON',
            message: 'Request body contains invalid JSON.',
        };
    }

    if (error.name === 'ValidationError') {
        return {
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            message: 'Validation failed.',
            details: Object.values(error.errors || {}).map((item) => ({
                field: item.path,
                message: item.message,
            })),
        };
    }

    if (error.name === 'CastError') {
        return {
            statusCode: 400,
            code: 'INVALID_ID',
            message: `Invalid ${error.path || 'identifier'}.`,
            details: [{ field: error.path, value: error.value }],
        };
    }

    if (error.code === 11000) {
        return {
            statusCode: 409,
            code: 'DUPLICATE_KEY',
            message: 'A record with the same unique value already exists.',
            details: error.keyValue,
        };
    }

    if (error.message === 'CORS Not Allowed') {
        return {
            statusCode: 403,
            code: 'CORS_NOT_ALLOWED',
            message: 'This origin is not allowed.',
        };
    }

    return {
        statusCode: error.statusCode || error.status || 500,
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.statusCode || error.status ? error.message : 'Internal server error.',
        details: error.details,
    };
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const normalized = normalizeError(error);
    const statusCode = normalized.statusCode >= 400 && normalized.statusCode < 600 ? normalized.statusCode : 500;
    const log = {
        event: 'request_failed',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        code: normalized.code,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    };
    console[statusCode >= 500 ? 'error' : 'warn'](JSON.stringify(log));

    if (!isApiRequest(req) && req.method === 'GET') {
        return res.status(statusCode).send(normalized.message);
    }

    return res.status(statusCode).json({
        result: 'failure',
        msg: normalized.message,
        data: null,
        error: {
            code: normalized.code,
            message: normalized.message,
            details: normalized.details,
        },
        requestId: req.requestId,
    });
}

function registerProcessErrorLogging() {
    if (global.__stayjiProcessErrorLoggingRegistered) return;
    global.__stayjiProcessErrorLoggingRegistered = true;

    process.on('unhandledRejection', (reason) => {
        console.error(JSON.stringify({
            event: 'unhandled_rejection',
            message: reason && reason.message ? reason.message : String(reason),
            stack: process.env.NODE_ENV === 'production' ? undefined : reason && reason.stack,
        }));
    });

    process.on('uncaughtException', (error) => {
        console.error(JSON.stringify({
            event: 'uncaught_exception',
            message: error && error.message ? error.message : String(error),
            stack: process.env.NODE_ENV === 'production' ? undefined : error && error.stack,
        }));
    });
}

module.exports = {
    createHttpError,
    errorHandler,
    notFoundHandler,
    registerProcessErrorLogging,
    requestContext,
    requestLogger,
    structuredResponses,
    timeoutHandler,
    validateKnownObjectIds,
    validateObjectIdParam,
};
