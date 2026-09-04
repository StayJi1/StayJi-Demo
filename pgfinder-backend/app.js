require('dotenv').config();
var mongoose = require('mongoose');
var express = require('express');
var mgClient = require('./connection/dbconnect');

var app = express();

var bodyParser = require("body-parser");

const path = require('path');

const PORT = process.env.PORT || 3000;

const session = require('express-session');

var cors = require("cors");
var helmet = require("helmet");
var rateLimit = require("express-rate-limit");
const {
    errorHandler,
    notFoundHandler,
    requestContext,
    requestLogger,
    registerProcessErrorLogging,
    structuredResponses,
    timeoutHandler,
    validateKnownObjectIds
} = require('./middleware/resilience');

registerProcessErrorLogging();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestContext);
app.use(structuredResponses);
app.use(requestLogger);
app.use(timeoutHandler());

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
const corsOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://pg-finder-alpha.vercel.app",
    "https://stayji-stayji.vercel.app",
    "https://stayji.com",
    "https://www.stayji.com",
    "https://stayji-demo.vercel.app",
    ...configuredCorsOrigins
].filter((origin, index, origins) => origins.indexOf(origin) === index);

const isLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin);

app.use(cors({
    origin: function(origin, callback) {

        if (!origin) {
            return callback(null, true);
        }

        if (corsOrigins.indexOf(origin.replace(/\/$/, '')) !== -1 || isLocalDevOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS Not Allowed"));
        }
    },
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false
}));
/*
|--------------------------------------------------------------------------
| Security Headers
|--------------------------------------------------------------------------
*/

app.use(function(req, res, next) {

    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
});

/*
|--------------------------------------------------------------------------
| Body Parser
|--------------------------------------------------------------------------
*/

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(validateKnownObjectIds);

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
*/

app.use('/upload', express.static(path.join(__dirname, 'public', 'upload'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    fallthrough: true
}));

app.use('/upload', express.static(path.join(__dirname, 'upload'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    fallthrough: true
}));

app.use('/public', express.static(path.join(__dirname, 'public')));

/*
|--------------------------------------------------------------------------
| Session Configuration
|--------------------------------------------------------------------------
*/

app.use(session({
    secret: process.env.SESSION_SECRET || 'stayji_secret_key',

    saveUninitialized: false,

    resave: false,

    rolling: true,

    cookie: {
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

/*
|--------------------------------------------------------------------------
| View Engine
|--------------------------------------------------------------------------
*/

app.engine('html', require('ejs').renderFile);

app.set("view engine", "html");

app.set("views", "views");

/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {

    res.send('StayJi Backend Running Successfully 🚀');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' })
})

/*
|--------------------------------------------------------------------------
| Controllers
|--------------------------------------------------------------------------
*/

const adminController = require('./controllers/adminController');

const clientController = require('./controllers/clientController');

app.use('/admin', adminController);

app.use('/client', clientController);

/*
|--------------------------------------------------------------------------
| Modern REST API Aliases
|--------------------------------------------------------------------------
*/

// AUTH APIs

app.post('/api/auth/login', (req, res, next) => {

    req.url = '/loginByUser';

    clientController(req, res, next);
});

app.post('/api/auth/signup', (req, res, next) => {

    req.url = '/addUser';

    clientController(req, res, next);
});

// PROPERTY APIs

app.get('/api/properties', (req, res, next) => {

    req.url = '/getPropertyList';

    clientController(req, res, next);
});

app.post('/api/properties', (req, res, next) => {

    req.url = '/addProperty';

    clientController(req, res, next);
});

// ADMIN APIs

app.get('/api/admin/stats', (req, res, next) => {

    req.url = '/getAdminStats';

    clientController(req, res, next);
});

/*
|--------------------------------------------------------------------------
| API Route Groups
|--------------------------------------------------------------------------
*/

app.use('/api/auth', clientController);

app.use('/api/properties', clientController);

app.use('/api/vendors', clientController);

app.use('/api/ads', (req, res, next) => {
    req.url = req.url === '/' ? '/ads' : `/ads${req.url}`;
    clientController(req, res, next);
});

app.use('/api/admin', clientController);

app.use('/api/ai', require('./ai-service/router'));

app.use('/api/leads', (req, res, next) => {
    req.url = req.url === '/' ? '/leads' : `/leads${req.url}`;
    clientController(req, res, next);
});

app.use('/api/notifications', (req, res, next) => {
    req.url = req.url === '/' ? '/notifications' : `/notifications${req.url}`;
    clientController(req, res, next);
});

app.use(notFoundHandler);
app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

if (require.main === module) {
    const server = app.listen(PORT, () => {
        process.stdout.write(`StayJi backend connected to port ${PORT}\n`);
    });

    /*
    |--------------------------------------------------------------------------
    | Error Handling
    |--------------------------------------------------------------------------
    */

    server.on('error', (error) => {

        if (error.code === 'EADDRINUSE') {

            console.error(`Port ${PORT} is already in use.`);

            return;
        }

        if (error.code === 'EPERM') {

            console.error(`Permission denied while opening port ${PORT}.`);

            return;
        }

        throw error;
    });
}

module.exports = app;
