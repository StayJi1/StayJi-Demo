const jwt = require('jsonwebtoken');
const User = require('../models/userMaster');

const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'stayji-local-secret';

const normalizeAccountType = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (['owner', 'vendor'].includes(normalized)) return 'owner';
    if (['admin', 'administrator'].includes(normalized)) return 'admin';
    return 'user';
};

const getBearerToken = (req) => {
    const header = req.headers.authorization || req.headers.Authorization || '';
    if (!header || !header.toString().startsWith('Bearer ')) return null;
    return header.toString().slice(7).trim();
};

const attachAiAuthenticatedUser = async (req, res, next) => {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ result: 'failure', msg: 'Authentication token is required.', data: null });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findOne({ _id: decoded.id || decoded.userId, isActive: true }).select('-userPassword -resetOtp -resetOtpExpiresAt');

        if (!user || ['suspended', 'blocked'].includes(user.accountStatus)) {
            return res.status(401).json({ result: 'failure', msg: 'Account is inactive.', data: null });
        }

        req.auth = {
            token: decoded,
            user,
            role: normalizeAccountType(user.userType),
        };
        next();
    } catch (error) {
        return res.status(401).json({ result: 'failure', msg: 'Invalid or expired authentication token.', data: null });
    }
};

module.exports = {
    attachAiAuthenticatedUser,
    getBearerToken,
};
