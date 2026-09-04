const express = require('express');
const { attachAiAuthenticatedUser } = require('./auth');
const { getAiConfig } = require('./config');
const { processAiMessage } = require('./service');
const Property = require('../models/propertyMaster');

const router = express.Router();

router.get('/status', (req, res) => {
    const config = getAiConfig();
    res.json({
        result: config.configured ? 'success' : 'failure',
        msg: config.configured ? 'AI provider is configured.' : 'AI provider is not configured.',
        data: {
            provider: config.provider || null,
            model: config.model || null,
            configured: config.configured,
            missing: config.configured ? [] : ['AI_PROVIDER', 'AI_API_KEY', 'AI_MODEL'],
        },
    });
});

router.post('/chat', attachAiAuthenticatedUser, async (req, res) => {
    try {
        const messageText = (req.body && (req.body.message || req.body.text || req.body.prompt)) || '';
        const propertyId = req.body && req.body.propertyId ? req.body.propertyId : null;
        const ownerId = req.body && req.body.ownerId ? req.body.ownerId : null;

        if (!messageText || !String(messageText).trim()) {
            return res.status(400).json({ result: 'failure', msg: 'Message is required.', data: null });
        }

        let resolvedOwnerId = ownerId;
        if (propertyId && !resolvedOwnerId) {
            const property = await Property.findOne({ _id: propertyId, isActive: true }).select('vendorId userIDFK');
            if (property) {
                resolvedOwnerId = property.vendorId || property.userIDFK || null;
            }
        }

        const result = await processAiMessage({
            messageText,
            user: req.auth.user,
            propertyId,
            ownerId: resolvedOwnerId,
        });

        return res.status(result.result === 'failure' ? 400 : 200).json(result);
    } catch (error) {
        console.error('AI chat error:', error);
        return res.status(500).json({
            result: 'failure',
            code: 'AI_CHAT_ERROR',
            msg: 'An unexpected server error occurred while processing the AI request.',
            data: null,
        });
    }
});

module.exports = router;
