
var express = require('express');
var router = express.Router();
var multer = require('multer');
var crypto = require('crypto');
var mongoose=require('mongoose');
var jwt = require('jsonwebtoken');
var Area = require('../models/areaMaster');
var PropertyType = require('../models/propertyType');
var Property = require('../models/propertyMaster');
var User = require('../models/userMaster');
var PropertyImage = require('../models/propertyImage');
var Aminity = require('../models/aminityMaster');
var UserRequest = require("../models/userRequest");
var UserReview = require("../models/userReview");
var Shortlisted = require("../models/shortlistMaster");
var Inquiry = require("../models/inquiryMaster");
var Visit = require("../models/visitDetails");
var Payment = require("../models/paymentMaster");
var AdminMessage = require("../models/adminMessage");
var Chat = require("../models/chatMaster");
var Conversation = require("../models/conversation");
var Message = require("../models/message");
var Notification = require("../models/notification");
var LeadEvent = require("../models/leadEvent");
var MoveInConfirmation = require("../models/moveInConfirmation");
var AuditLog = require("../models/auditLog");
var CityState = require("../models/cityStateMaster");
var WalletPayout = require("../models/walletPayout");
var PropertyUpdateRequest = require("../models/propertyUpdateRequest");
const { hashPassword, isHashedPassword, verifyPassword } = require('../utils/security');
const { validateObjectIdParam } = require('../middleware/resilience');
const messageSecret = crypto.createHash('sha256').update(process.env.MESSAGE_SECRET || process.env.SESSION_SECRET || 'stayji-local-message-secret').digest()
const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'stayji-local-jwt-secret'
const MVP_CITY = 'Bangalore'
const MVP_STATE = 'Karnataka'
const MVP_CITY_REGEX = /^(bangalore|bengaluru)$/i

const wrapAsync = (handler) => (req, res, next) => {
    try {
        const result = handler(req, res, next)
        if (result && typeof result.catch === 'function') result.catch(next)
    } catch (error) {
        next(error)
    }
}

;['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    const original = router[method].bind(router)
    router[method] = (...args) => original(...args.map((arg) => (typeof arg === 'function' ? wrapAsync(arg) : arg)))
})

router.param('messageId', validateObjectIdParam('messageId'))
router.param('id', (req, res, next, value) => {
    if (req.originalUrl.includes('/user/saved-searches/')) return next()
    return validateObjectIdParam('id')(req, res, next, value)
})

const normalizeText = (value = '') => value.toString().trim().replace(/\s+/g, ' ')

const canonicalLocationName = (value = '') => {
    const normalized = normalizeText(value)
    if (/^(bengaluru|bangalore)$/i.test(normalized)) return 'Bangalore'
    return normalized
}

const isBangaloreValue = (value = '') => MVP_CITY_REGEX.test(normalizeText(value))
const bangalorePropertyScope = () => ({ cityName: MVP_CITY_REGEX })
const blankLegacyCityScope = [
    { assignedCity: { $exists: false } },
    { assignedCity: '' },
    { city: { $exists: false } },
    { city: '' },
]
const bangaloreUserScope = () => ({ $or: [{ assignedCity: MVP_CITY_REGEX }, { city: MVP_CITY_REGEX }, { cityName: MVP_CITY_REGEX }, ...blankLegacyCityScope] })
const propertyOwnerExpression = () => ({ $ifNull: ['$property.vendorId', '$property.userIDFK'] })

const parseStringList = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((item) => item.toString().trim()).filter(Boolean)
    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed.map((item) => item.toString().trim()).filter(Boolean)
    } catch (error) {
        // Fall back to comma/newline separated URLs.
    }
    return value.toString().split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
}

const parseRoomInventory = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((item) => ({
        sharingType: item.sharingType || '',
        totalRooms: Number(item.totalRooms) || 0,
        occupiedRooms: Number(item.occupiedRooms) || 0,
        vacantRooms: Number(item.vacantRooms) || 0,
        bedsPerRoom: Number(item.bedsPerRoom) || 1,
        vacantBeds: Number(item.vacantBeds) || 0,
        waitingList: Number(item.waitingList) || 0,
        bathroom: item.bathroom || '',
        balcony: toBoolean(item.balcony),
        ac: toBoolean(item.ac),
        furnishing: item.furnishing || '',
        foodPreference: item.foodPreference || '',
        gender: item.gender || '',
        monthlyRent: item.monthlyRent || '',
    })).filter((item) => item.sharingType)
    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parseRoomInventory(parsed)
    } catch (error) {
        return []
    }
    return []
}

const parseJsonValue = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback
    if (typeof value === 'object') return value
    try {
        return JSON.parse(value)
    } catch (error) {
        return fallback
    }
}

const toBoolean = (value) => value === true || value === 'true' || value === 'on' || value === '1'

const normalizeRating = (value) => Math.max(1, Math.min(5, Number(value) || 0))

const escapeRegex = (value = '') => value.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalizedRegexSource = (value = '') => escapeRegex(normalizeText(value)).replace(/\s+/g, '\\s+')
const normalizedRegex = (value = '', flags = 'i') => new RegExp(normalizedRegexSource(value), flags)

const newestTimestamp = (item = {}) => {
    const value = item.updatedOn || item.addedOn || item.visitDate || item.createdAt || 0
    const time = new Date(value).getTime()
    return Number.isFinite(time) ? time : 0
}

const stayjiIdFromObjectId = (id) => (id ? `SJ-${id.toString().slice(-6).toUpperCase()}` : '')
const stayjiIdSearchExpr = (search = '') => {
    const suffix = search.trim().replace(/^SJ[-\s]?/i, '')
    if (!/^[a-fA-F0-9]{6}$/.test(suffix)) return null
    return {
        $expr: {
            $regexMatch: {
                input: { $toString: '$_id' },
                regex: `${escapeRegex(suffix)}$`,
                options: 'i',
            },
        },
    }
}

const propertySearchClauses = (regex) => [
    { propertyName: regex },
    { description: regex },
    { address: regex },
    { cityName: regex },
    { areaName: regex },
    { propertyCategory: regex },
    { aminityFeatures: regex },
    { sharing: regex },
    { genderType: regex },
    { sharingAvailability: regex },
    { mealsAvailable: regex },
    { customFeatures: regex },
    { securityFeatures: regex },
    { nearbyLandmarks: regex },
    { 'roomInventory.sharingType': regex },
    { 'roomInventory.foodPreference': regex },
    { 'roomInventory.gender': regex },
    { 'roomTypes.label': regex },
    { 'roomTypes.foodPreference': regex },
    { 'roomTypes.gender': regex },
]

const dedupeLatestByKey = (items = [], keyGetter) => {
    const map = new Map()
    items.forEach((item) => {
        const key = keyGetter(item)
        if (!key) return
        const existing = map.get(key)
        if (!existing || newestTimestamp(item) >= newestTimestamp(existing)) map.set(key, item)
    })
    return Array.from(map.values()).sort((a, b) => newestTimestamp(b) - newestTimestamp(a))
}

const publicCityGate = async () => {
    return bangalorePropertyScope()
}

const refreshPropertyRating = async (propertyId) => {
    if (!propertyId) return null
    const [summary] = await UserReview.aggregate([
        { $match: { isActive: true, status: { $nin: ['suspended', 'flagged', 'archived'] }, propertyIDFK: asObjectId(propertyId) } },
        { $group: { _id: '$propertyIDFK', avgRating: { $avg: { $toDouble: '$rating' } }, reviewsCount: { $sum: 1 } } },
    ])
    const rating = summary?.avgRating ? Number(summary.avgRating.toFixed(1)) : 4.6
    await Property.updateOne({ _id: propertyId }, { $set: { rating, reviewSummary: { averageRating: rating, reviewsCount: summary?.reviewsCount || 0, updatedOn: new Date() } } })
    return { rating, reviewsCount: summary?.reviewsCount || 0 }
}

const toNumberOrUndefined = (value) => {
    if (value === undefined || value === null || value === '') return undefined
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : undefined
}

const slugify = (value = '') => value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const suspiciousPhonePattern = /^(\d)\1{7,}$|^(1234567890|9876543210|0000000000)$/
const phoneInTextPattern = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/
const callbackIntentPattern = /\b(call|callback|phone|whatsapp|contact|number|mobile)\b/i

const normalizeAccountType = (value) => {
    const normalized = (value || '').toString().trim().toLowerCase()
    if (['owner', 'host', 'hostel', 'vendor', 'pg owner', 'flat owner'].includes(normalized)) return 'owner'
    if (['personal', 'student', 'user'].includes(normalized)) return 'user'
    if (['admin', 'super_admin', 'super admin', 'super-admin', 'superadmin'].includes(normalized)) return 'admin'
    return normalized
}

const accountTypeVariants = (value) => {
    const normalized = normalizeAccountType(value)
    if (normalized === 'owner') return ['Owner', 'owner', 'Vendor', 'vendor']
    if (normalized === 'user') return ['User', 'Personal', 'Student', 'user', 'personal', 'student']
    if (normalized === 'admin') return ['Admin', 'admin', 'Super Admin', 'super admin', 'super_admin', 'super-admin', 'superadmin']
    return [value]
}

const officialRoleName = (value) => {
    const normalized = normalizeAccountType(value)
    if (normalized === 'owner') return 'Owner'
    if (normalized === 'admin') return 'Admin'
    return 'User'
}

const defaultPermissionsByRole = (value) => {
    const normalized = normalizeAccountType(value)
    if (normalized === 'admin') return ['manage_users', 'manage_properties', 'manage_finance', 'manage_admins', 'manage_dummy_data', 'manage_seo', 'manage_moderation', 'view_global_analytics', 'view_city_analytics']
    if (normalized === 'owner') return ['manage_own_properties', 'view_own_leads', 'view_own_finance']
    return ['browse_properties', 'manage_own_profile']
}

const tokenRoleName = (value) => {
    const normalized = normalizeAccountType(value)
    if (normalized === 'owner') return 'owner'
    if (normalized === 'admin') return 'admin'
    return 'user'
}

const signAuthToken = (user) => jwt.sign({
    id: user._id.toString(),
    userId: user._id.toString(),
    email: user.userEmail,
    userType: user.userType,
    role: tokenRoleName(user.userType),
    permissions: user.permissions?.length ? user.permissions : defaultPermissionsByRole(user.userType),
    assignedCity: user.assignedCity || user.city || '',
    assignedState: user.assignedState || '',
}, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const getBearerToken = (req) => {
    const header = req.headers.authorization || req.headers.Authorization || ''
    if (!header || !header.toString().startsWith('Bearer ')) return null
    return header.toString().slice(7).trim()
}

const attachAuthenticatedUser = async (req, res, next) => {
    try {
        const token = getBearerToken(req)
        if (!token) return res.status(401).json({ result: 'failure', msg: 'Authentication token is required.', data: null })

        const decoded = jwt.verify(token, jwtSecret)
        const user = await User.findOne({ _id: decoded.id || decoded.userId, isActive: true }).select('-userPassword -resetOtp -resetOtpExpiresAt')
        if (!user || ['suspended', 'blocked'].includes(user.accountStatus)) {
            return res.status(401).json({ result: 'failure', msg: 'Account is inactive.', data: null })
        }

        if (user.forceLogoutAt && decoded.iat && user.forceLogoutAt.getTime() > decoded.iat * 1000) {
            return res.status(401).json({ result: 'failure', msg: 'Session expired. Please login again.', data: null })
        }

        req.auth = {
            token: decoded,
            user,
            role: normalizeAccountType(user.userType),
            permissions: user.permissions?.length ? user.permissions : defaultPermissionsByRole(user.userType),
            assignedCity: user.assignedCity || user.city || '',
            assignedState: user.assignedState || '',
        }
        next()
    } catch (error) {
        return res.status(401).json({ result: 'failure', msg: 'Invalid or expired authentication token.', data: null })
    }
}

const attachOptionalAuthenticatedUser = async (req, res, next) => {
    if (!getBearerToken(req)) return next()
    return attachAuthenticatedUser(req, res, next)
}

const requireRoles = (allowedRoles = []) => async (req, res, next) => {
    if (!req.auth) {
        return attachAuthenticatedUser(req, res, () => requireRoles(allowedRoles)(req, res, next))
    }
    const role = normalizeAccountType(req.auth.user.userType)
    if (!allowedRoles.includes(role)) {
        return res.status(403).json({ result: 'failure', msg: 'You do not have permission to access this resource.', data: null })
    }
    next()
}

const isAdminRequest = (req) => req.auth?.role === 'admin'

const requireAdminGovernance = (req, res, next) => {
    if (!isAdminRequest(req)) {
        return res.status(403).json({ result: 'failure', msg: 'Only Admin can access this governance workflow.', data: null })
    }
    next()
}

const adminCityScope = (req) => {
    return bangalorePropertyScope()
}

const adminAssignedCity = () => MVP_CITY

const adminUserCityScope = (req) => {
    return bangaloreUserScope()
}

const applyScope = (filters = {}, scope = {}) => {
    if (!scope || !Object.keys(scope).length) return filters
    if (!Object.keys(filters).length) return { ...scope }
    return { $and: [filters, scope] }
}

const syncAdminCityAssignment = async (adminId, targetCityName, targetStateName) => {
    if (!mongoose.Types.ObjectId.isValid(adminId)) return
    const normalizedCity = targetCityName ? canonicalLocationName(targetCityName) : ''
    const normalizedState = targetStateName ? normalizeText(targetStateName) : ''
    let removeQuery
    if (!normalizedCity) {
        removeQuery = { assignedAdmins: adminId }
    } else if (normalizedState) {
        removeQuery = {
            assignedAdmins: adminId,
            $or: [
                { cityName: { $not: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i') } },
                { stateName: { $not: new RegExp(`^${escapeRegex(normalizedState)}$`, 'i') } },
            ],
        }
    } else {
        removeQuery = { assignedAdmins: adminId, cityName: { $not: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i') } }
    }
    await CityState.updateMany(removeQuery, { $pull: { assignedAdmins: adminId }, updatedOn: new Date() })
    if (!normalizedCity) return
    const targetCity = await CityState.findOne({ cityName: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i'), stateName: normalizedState ? new RegExp(`^${escapeRegex(normalizedState)}$`, 'i') : { $exists: true } })
    if (!targetCity) return
    await CityState.updateMany({ assignedAdmins: adminId, _id: { $ne: targetCity._id } }, { $pull: { assignedAdmins: adminId }, updatedOn: new Date() })
    await CityState.findOneAndUpdate({ _id: targetCity._id }, { $set: { assignedAdmins: [adminId], updatedOn: new Date() } }, { new: true })
}

const assertAdminCanManageUser = (req, targetUser) => {
    if (!targetUser) return { ok: false, status: 404, msg: 'User not found.' }
    return { ok: true }
}

const encryptMessage = (text = '') => {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', messageSecret, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

const decryptMessage = (value = '') => {
    try {
        const [ivValue, tagValue, encryptedValue] = value.split(':')
        if (!ivValue || !tagValue || !encryptedValue) return value
        const decipher = crypto.createDecipheriv('aes-256-gcm', messageSecret, Buffer.from(ivValue, 'base64'))
        decipher.setAuthTag(Buffer.from(tagValue, 'base64'))
        return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64')), decipher.final()]).toString('utf8')
    } catch (error) {
        return ''
    }
}

const asObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) return null
    return new mongoose.Types.ObjectId(value)
}

const MESSAGE_MAX_LENGTH = 1000

const messagingPermissionForRole = (role = '') => {
    if (role === 'user') return 'browse_properties'
    if (role === 'owner') return 'view_own_leads'
    return ''
}

const assertMessagingAccess = (req, res) => {
    const role = req.auth?.role
    const permission = messagingPermissionForRole(role)
    if (!['user', 'owner'].includes(role) || (permission && !req.auth.permissions.includes(permission))) {
        res.status(403).json({ result: 'failure', msg: 'You do not have permission to use user-owner messaging.', data: null })
        return false
    }
    return true
}

const authenticatedUserId = (req) => req.auth?.user?._id?.toString()
const assertSelfOrRoles = (req, res, targetId, roles = []) => {
    const selfId = authenticatedUserId(req)
    if (selfId && targetId && selfId === targetId.toString()) return true
    if (roles.includes(req.auth?.role)) return true
    res.status(403).json({ result: 'failure', msg: 'You do not have permission to access this record.', data: null })
    return false
}

const assertBangaloreRequest = (res, city, state = MVP_STATE) => {
    if (city && !isBangaloreValue(city)) {
        res.status(400).json({ result: 'failure', msg: 'StayJi MVP is currently available only in Bangalore.', data: null })
        return false
    }
    if (state && normalizeText(state).toLowerCase() !== MVP_STATE.toLowerCase()) {
        res.status(400).json({ result: 'failure', msg: 'StayJi MVP is currently available only in Bangalore, Karnataka.', data: null })
        return false
    }
    return true
}

const cleanMessageText = (value = '') => normalizeText(value)

const messageDto = (message = {}) => {
    const row = typeof message.toObject === 'function' ? message.toObject() : message
    return {
        ...row,
        id: row._id,
        text: decryptMessage(row.text) || row.text,
    }
}

const conversationDto = (conversation = {}) => {
    const row = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation
    return {
        ...row,
        id: row._id,
        lastMessagePreview: decryptMessage(row.lastMessagePreview) || row.lastMessagePreview || '',
    }
}

const createNotification = async (payload = {}) => {
    try {
        const recipientId = asObjectId(payload.recipientId)
        const actorId = asObjectId(payload.actorId)
        const propertyId = asObjectId(payload.propertyId)
        if (!recipientId && !payload.recipientRole) return null
        return Notification.create({
            recipientId,
            recipientRole: payload.recipientRole || 'user',
            actorId,
            propertyId,
            type: payload.type || 'general',
            title: payload.title || 'StayJi update',
            message: payload.message || '',
            link: payload.link || '/',
            metadata: payload.metadata || {},
        })
    } catch (error) {
        console.error('Notification creation failed:', error.message)
        return null
    }
}

const createLeadEvent = async (payload = {}) => {
    try {
        const userId = asObjectId(payload.userId || payload.userIDFK)
        const propertyId = asObjectId(payload.propertyId || payload.propertyIDFK)
        let vendorId = asObjectId(payload.vendorId)
        if (!vendorId && propertyId) {
            const property = await Property.findOne({ _id: propertyId }).select('userIDFK vendorId')
            vendorId = asObjectId(property?.vendorId || property?.userIDFK)
        }
        if (!userId || !propertyId) return null
        return LeadEvent.create({
            userId,
            vendorId,
            propertyId,
            sourceType: payload.sourceType || 'interest',
            status: payload.status || 'Interested',
            note: payload.note || '',
            metadata: payload.metadata || {},
        })
    } catch (error) {
        console.error('Lead event creation failed:', error.message)
        return null
    }
}

const notifyAdmins = async (payload = {}) => {
    const admins = await User.find({ userType: { $in: accountTypeVariants('Admin') }, isActive: true }).select('_id userType')
    await Promise.all(admins.map((admin) => createNotification({ ...payload, recipientId: admin._id, recipientRole: 'admin' })))
}

const recordAudit = async ({ performerId, performerRole, action, entityType, entityId, previousValue = {}, updatedValue = {}, metadata = {}, city, state } = {}) => {
    try {
        return AuditLog.create({
            performerId: asObjectId(performerId),
            performerRole,
            action,
            entityType,
            entityId: asObjectId(entityId),
            previousValue,
            updatedValue,
            metadata,
            city,
            state,
        })
    } catch (error) {
        console.error('Audit log failed:', error.message)
        return null
    }
}

const requestConsentMetadata = (req, source) => ({
    acceptedOn: new Date(),
    ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || '',
    userAgent: req.headers['user-agent'] || '',
    consentVersion: process.env.CONSENT_VERSION || '2026-05-25',
    source,
})

const notifyPropertyOwner = async (propertyId, payload = {}) => {
    const property = await Property.findOne({ _id: propertyId }).select('userIDFK vendorId propertyName')
    const ownerId = property?.vendorId || property?.userIDFK
    if (!ownerId) return null
    return createNotification({
        ...payload,
        recipientId: ownerId,
        recipientRole: 'vendor',
        propertyId,
        link: payload.link || `/dashboard/vendor/properties/${propertyId}`,
        metadata: { ...(payload.metadata || {}), propertyName: property.propertyName },
    })
}

const publicUserDto = (user = {}) => ({
    _id: user?._id,
    id: user?._id,
    stayjiId: stayjiIdFromObjectId(user?._id),
    name: [user?.userFname, user?.userLname].filter(Boolean).join(' ') || user?.userName || user?.userEmail || 'StayJi user',
    email: user?.userEmail,
    contact: user?.contact,
    role: user?.userType,
})

const visitStatusLabel = (status) => {
    if (status === '0') return 'Pending'
    if (status === '1') return 'Approved'
    if (status === '2') return 'Completed'
    if (status === '3') return 'Rejected'
    if (status === '4') return 'Cancelled'
    return status || 'Pending'
}

const normalizeVisitDto = (visit = {}) => ({
    ...(visit.toObject?.() || visit),
    id: visit._id,
    statusLabel: visitStatusLabel(visit.status),
    property: propertyDto(visit.propertyIDFK || visit.propertyId || {}),
    user: publicUserDto(visit.userIDFK || visit.userId || {}),
})

const normalizeInquiryDto = (inquiry = {}) => ({
    ...(inquiry.toObject?.() || inquiry),
    id: inquiry._id,
    statusLabel: inquiry.reply ? 'Replied' : 'Open',
    property: propertyDto(inquiry.propertyIDFK || inquiry.propertyId || {}),
    user: publicUserDto(inquiry.userIDFK || {}),
})

const propertyPopulate = () => [
    { path: 'userIDFK', select: ['userFname', 'userLname', 'userType', 'userEmail', 'contact', 'verificationStatus'] },
    { path: 'vendorId', select: ['userFname', 'userLname', 'userType', 'userEmail', 'contact', 'verificationStatus'] },
    { path: 'assignedAdmin', select: ['userFname', 'userLname', 'userEmail', 'assignedCity', 'assignedState'] },
    { path: 'propertyTypeIDFK', select: ['typeName'] },
]

const buildPropertyFilters = (source = {}, includeInactive = false) => {
    const filters = {}
    const andFilters = []
    if (!includeInactive) filters.isActive = true
    if (source.status === 'inactive') filters.isActive = false
    if (source.approvalStatus) filters.approvalStatus = source.approvalStatus
    if (source.cityName || source.city) filters.cityName = new RegExp(`^${normalizedRegexSource(canonicalLocationName(source.cityName || source.city))}$`, 'i')
    if (source.areaName || source.area || source.locality) filters.areaName = new RegExp(`^${normalizedRegexSource(source.areaName || source.area || source.locality)}$`, 'i')
    if (source.category) filters.propertyCategory = new RegExp(`^${normalizedRegexSource(source.category)}$`, 'i')
    if (source.categories) {
        const categoryRegexes = parseStringList(source.categories).map((item) => normalizedRegex(item))
        if (categoryRegexes.length) andFilters.push({ $or: categoryRegexes.map((regex) => ({ propertyCategory: regex })) })
    }
    if (source.gender) {
        const genderValues = Array.isArray(source.gender) ? source.gender : source.gender.toString().split(',')
        const genderRegexes = genderValues.map((item) => normalizeText(item)).filter(Boolean).map((item) => normalizedRegex(item))
        if (genderRegexes.length) {
            andFilters.push({ $or: genderRegexes.map((regex) => ({ genderType: regex })) })
        }
    }
    if (source.sharingType || source.sharing) {
        const sharingValues = Array.isArray(source.sharingType || source.sharing)
            ? (source.sharingType || source.sharing)
            : (source.sharingType || source.sharing).toString().split(',')
        const sharingRegexes = sharingValues.map((item) => normalizeText(item)).filter(Boolean).map((item) => normalizedRegex(item))
        if (sharingRegexes.length) {
            andFilters.push({
                $or: sharingRegexes.flatMap((regex) => [
                    { sharing: regex },
                    { sharingAvailability: regex },
                    { 'roomInventory.sharingType': regex },
                    { 'roomTypes.label': regex },
                ]),
            })
        }
    }
    if (toBoolean(source.foodIncluded) || toBoolean(source.food)) {
        andFilters.push({
            $or: [
                { mealsAvailable: { $exists: true, $ne: [] } },
                { aminityFeatures: /food|meal|breakfast|lunch|dinner/i },
                { 'roomInventory.foodPreference': /veg|non-veg|both/i },
                { 'roomTypes.foodPreference': /veg|non-veg|both/i },
            ],
        })
    }
    if (source.amenities) {
        const amenityRegexes = parseStringList(source.amenities).map((item) => normalizedRegex(item))
        if (amenityRegexes.length) {
            andFilters.push({
                $and: amenityRegexes.map((regex) => ({
                    $or: [
                        { aminityFeatures: regex },
                        { customFeatures: regex },
                        { securityFeatures: regex },
                        { nearbyLandmarks: regex },
                    ],
                })),
            })
        }
    }
    if (toBoolean(source.ac)) {
        andFilters.push({ $or: [{ acAvailable: true }, { aminityFeatures: /ac|air conditioning/i }, { 'roomInventory.ac': true }, { 'roomTypes.ac': true }] })
    }
    if (toBoolean(source.parking)) {
        andFilters.push({ $or: [{ parkingAvailable: true }, { aminityFeatures: /parking/i }] })
    }
    if (toBoolean(source.attachedBathroom)) {
        andFilters.push({ $or: [{ aminityFeatures: /bathroom/i }, { 'roomInventory.bathroom': 'attached' }, { 'roomTypes.bathroom': 'attached' }] })
    }
    if (toBoolean(source.availableNow)) {
        andFilters.push({ $or: [{ isAvailable: true }, { availableBeds: { $gt: 0 } }, { vacancyStatus: { $not: /fully occupied/i } }] })
    }
    if (source.rating) filters.rating = { $gte: Number(source.rating) || 0 }
    const minBudget = toNumberOrUndefined(source.minPrice || source.minBudget || source.budgetMin)
    const maxBudget = toNumberOrUndefined(source.maxPrice || source.maxBudget || source.budgetMax)
    if (minBudget !== undefined || maxBudget !== undefined) {
        const rentNumberExpression = {
            $convert: {
                input: {
                    $replaceAll: {
                        input: { $replaceAll: { input: '$rent', find: ',', replacement: '' } },
                        find: '₹',
                        replacement: '',
                    },
                },
                to: 'double',
                onError: 0,
                onNull: 0,
            },
        }
        andFilters.push({
            $expr: {
                $and: [
                    ...(minBudget !== undefined ? [{ $gte: [rentNumberExpression, minBudget] }] : []),
                    ...(maxBudget !== undefined ? [{ $lte: [rentNumberExpression, maxBudget] }] : []),
                ],
            },
        })
    }
    if (source.userIDFK || source.vendorId || source.ownerId) {
        const ownerId = source.userIDFK || source.vendorId || source.ownerId
        andFilters.push({ $or: [{ userIDFK: ownerId }, { vendorId: ownerId }] })
    }

    const search = normalizeText(source.q || source.search || source.name || source.propertyName || '')
    if (search) {
        const normalizedSearch = canonicalLocationName(search)
        const regexes = [...new Set([search, normalizedSearch])]
            .map((value) => normalizedRegex(value))
        const tokenRegexes = search
            .split(/\s+/)
            .map((token) => normalizeText(token))
            .filter((token) => token && !['near', 'nearby', 'in', 'at', 'for'].includes(token.toLowerCase()))
            .map((token) => normalizedRegex(token))

        andFilters.push({ $or: [
            ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: new mongoose.Types.ObjectId(search) }] : []),
            ...(stayjiIdSearchExpr(search) ? [stayjiIdSearchExpr(search)] : []),
            ...regexes.flatMap(propertySearchClauses),
            ...(tokenRegexes.length > 1 ? [{
                $and: tokenRegexes.map((regex) => ({ $or: propertySearchClauses(regex) })),
            }] : []),
        ] })
    }
    if (andFilters.length) filters.$and = [...(filters.$and || []), ...andFilters]

    return filters
}

const publicApprovalQuery = {
    $or: [
        { approvalStatus: "Approved" },
        { approvalStatus: "Verified" },
        { approvalStatus: { $exists: false } }
    ]
}

const publicPropertyQuery = {
    isActive: true,
    status: { $nin: ['archived', 'suspended'] },
    $or: [
        { isDummy: true },
        { isDummy: { $ne: true }, ...publicApprovalQuery }
    ]
}

router.get('/city-options', async (req, res) => {
    const rows = await CityState.find({ isActive: true, cityName: MVP_CITY_REGEX }).select('stateName cityName localities dummyVisible').sort({ stateName: 1, cityName: 1 }).lean()
    const fallback = rows.length ? rows : [
        { stateName: 'Karnataka', cityName: 'Bangalore', dummyVisible: false, localities: [] },
    ]
    const options = fallback.reduce((acc, item) => {
        if (!acc[item.stateName]) acc[item.stateName] = []
        if (!acc[item.stateName].includes(item.cityName)) acc[item.stateName].push(item.cityName)
        return acc
    }, {})
    res.json({ result: 'success', msg: 'City options found.', data: { options, items: fallback } })
})


var storage = multer.diskStorage({
    destination: function (req, res, cb) {
        var docimg = req.body.docimg;
        if (docimg == "PropertyImage") {
            cb(null, './public/upload/PropertyImage')
        } else if (docimg == "PropertyTypeImage") {
            cb(null, './public/upload/PropertyTypeImage')
        } else if (docimg == "PropertyImages") {
            cb(null, './public/upload/PropertyImages')
        } else if (docimg == "UserImage") {
            cb(null, './public/upload/UserImage')
        }
        else {
            cb(null, './public/upload')
        }

    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp' || file.mimetype === 'video/mp4' || file.mimetype === 'video/webm' || file.mimetype === 'video/quicktime') {
        cb(null, true);
    } else {
        cb(null, false);
    }

}
var upload = multer({
    storage: storage,

    limits: {
        fileSize: 1024 * 1024 * 20
    },
    fileFilter: fileFilter

});

router.post('/addUser', async (req, res) => {
    if (!toBoolean(req.body.acceptTerms) || !toBoolean(req.body.acceptPrivacy)) {
        return res.json({ result: "failure", msg: "Accept StayJi Terms & Conditions and Privacy Policy to continue.", data: 0 });
    }
    const consentMetadata = requestConsentMetadata(req, 'public_signup')

    if (!strongPasswordPattern.test(req.body.userPassword || '')) {
        return res.json({ result: "failure", msg: "Password must be at least 8 characters and include uppercase, lowercase, and a number.", data: 0 });
    }
    const signupCity = canonicalLocationName(req.body.city || req.body.cityName || MVP_CITY)
    const signupState = normalizeText(req.body.state || req.body.stateName || MVP_STATE)
    if (!assertBangaloreRequest(res, signupCity, signupState)) return
    if (normalizeAccountType(req.body.userType || 'User') === 'owner') {
        const managedCityCount = await CityState.countDocuments({ isActive: true, cityName: MVP_CITY_REGEX })
        const managedCity = managedCityCount ? await CityState.findOne({ isActive: true, stateName: new RegExp(`^${escapeRegex(MVP_STATE)}$`, 'i'), cityName: MVP_CITY_REGEX }) : true
        if (!managedCity) return res.json({ result: "failure", msg: "Bangalore operations are not marked live yet.", data: 0 });
    }

    if (req.body.contact && suspiciousPhonePattern.test(req.body.contact.toString().replace(/\D/g, ''))) {
        return res.json({ result: "failure", msg: "Enter a valid phone number for account verification.", data: 0 });
    }

    const officialRole = officialRoleName(req.body.userType || 'User')
    const normalizedNewRole = normalizeAccountType(officialRole)
    const roleVariants = accountTypeVariants(officialRole)
    const existingUser = await User.findOne({
        userEmail: new RegExp(`^${req.body.userEmail}$`, 'i'),
        userType: { $in: roleVariants },
    });

    if (existingUser) {
        return res.json({
            result: "failure",
            msg: "An account already exists with this email for the selected account type.",
            data: 0
        });
    }

    var objUser = new User();
    objUser.userName = "",
        objUser.userFname = req.body.userFname,
        objUser.userLname = req.body.userLname,
        objUser.userEmail = req.body.userEmail,
        objUser.userPassword = hashPassword(req.body.userPassword),
        objUser.dob = "",
        objUser.gender = req.body.gender,
        objUser.contact = req.body.contact || "",
        objUser.occupation = "",
        objUser.city = signupCity,
        objUser.state = signupState,
        objUser.assignedCity = req.body.assignedCity || signupCity,
        objUser.assignedState = req.body.assignedState || signupState,
        objUser.userType = officialRole,
        objUser.profile = "",
        objUser.accountStatus = normalizedNewRole === 'owner' ? "pending_verification" : "active",
        objUser.approvalStatus = normalizedNewRole === 'owner' ? "Pending" : "Approved",
        objUser.permissions = defaultPermissionsByRole(officialRole),
        objUser.isVerified = normalizedNewRole === 'user',
        objUser.status = "active",
        objUser.termsAcceptedAt = consentMetadata.acceptedOn,
        objUser.privacyAcceptedAt = consentMetadata.acceptedOn,
        objUser.termsConsent = { ...consentMetadata, type: 'terms_and_conditions' },
        objUser.privacyConsent = { ...consentMetadata, type: 'privacy_policy' },
        objUser.consentHistory = [
            { ...consentMetadata, type: 'terms_and_conditions', accepted: true },
            { ...consentMetadata, type: 'privacy_policy', accepted: true },
        ],
        objUser.addedOn = new Date(),
        objUser.isActive = true;
    console.log();

    const inserted = await objUser.save();

    if (inserted != null) {
        await recordAudit({ action: 'account_created', entityType: 'user', entityId: inserted._id, updatedValue: { userType: officialRole, approvalStatus: objUser.approvalStatus }, metadata: { source: 'public_signup' } })
        res.json({ result: "success", msg: normalizedNewRole === 'owner' ? "Owner account created. Admin approval is required before listing properties." : "User Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "User Not Inserted", data: 0 });
    }
});

router.post('/googleAuth', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return res.json({ result: "failure", msg: "Google sign up is not configured", data: 0 });
    }

    if (!req.body.credential || !req.body.contact) {
        return res.json({ result: "failure", msg: "Google account and phone number are required", data: 0 });
    }
    if (!toBoolean(req.body.acceptTerms) || !toBoolean(req.body.acceptPrivacy)) {
        return res.json({ result: "failure", msg: "Accept StayJi Terms & Conditions and Privacy Policy to continue.", data: 0 });
    }
    const consentMetadata = requestConsentMetadata(req, 'google_signup')

    try {
        const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(req.body.credential)}`);
        const googleUser = await verifyResponse.json();

        if (!verifyResponse.ok || googleUser.aud !== clientId || !googleUser.email_verified) {
            return res.json({ result: "failure", msg: "Google verification failed", data: 0 });
        }

        const existingUser = await User.findOne({ userEmail: new RegExp(`^${googleUser.email}$`, 'i'), isActive: true });
        if (existingUser) {
            existingUser.userPassword = undefined;
            return res.json({ result: "success", msg: "login Successfully", data: existingUser });
        }

        const fullName = (googleUser.name || '').trim().split(/\s+/);
        const objUser = new User();
        objUser.userName = googleUser.name || "";
        objUser.userFname = googleUser.given_name || fullName[0] || "";
        objUser.userLname = googleUser.family_name || fullName.slice(1).join(' ') || "";
        objUser.userEmail = googleUser.email;
        objUser.userPassword = hashPassword(crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${googleUser.sub}`);
        objUser.gender = req.body.gender || "";
        objUser.contact = req.body.contact;
        objUser.occupation = "";
        const officialGoogleRole = officialRoleName(req.body.userType || "User");
        const normalizedGoogleRole = normalizeAccountType(officialGoogleRole);
        const googleCity = canonicalLocationName(req.body.city || req.body.cityName || MVP_CITY);
        const googleState = normalizeText(req.body.state || req.body.stateName || MVP_STATE);
        if (!assertBangaloreRequest(res, googleCity, googleState)) return
        if (normalizedGoogleRole === 'owner') {
            const managedCityCount = await CityState.countDocuments({ isActive: true, cityName: MVP_CITY_REGEX })
            const managedCity = managedCityCount ? await CityState.findOne({ isActive: true, stateName: new RegExp(`^${escapeRegex(MVP_STATE)}$`, 'i'), cityName: MVP_CITY_REGEX }) : true
            if (!managedCity) return res.json({ result: "failure", msg: "Bangalore operations are not marked live yet.", data: 0 });
        }
        objUser.userType = officialGoogleRole;
        objUser.city = googleCity;
        objUser.state = googleState;
        objUser.assignedCity = req.body.assignedCity || googleCity;
        objUser.assignedState = req.body.assignedState || googleState;
        objUser.profile = googleUser.picture || "";
        objUser.accountStatus = normalizedGoogleRole === 'owner' ? "pending_verification" : "active";
        objUser.approvalStatus = normalizedGoogleRole === 'owner' ? "Pending" : "Approved";
        objUser.permissions = defaultPermissionsByRole(officialGoogleRole);
        objUser.isVerified = normalizedGoogleRole === 'user';
        objUser.emailVerified = true;
        objUser.termsAcceptedAt = consentMetadata.acceptedOn;
        objUser.privacyAcceptedAt = consentMetadata.acceptedOn;
        objUser.termsConsent = { ...consentMetadata, type: 'terms_and_conditions' };
        objUser.privacyConsent = { ...consentMetadata, type: 'privacy_policy' };
        objUser.consentHistory = [
            { ...consentMetadata, type: 'terms_and_conditions', accepted: true },
            { ...consentMetadata, type: 'privacy_policy', accepted: true },
        ];
        objUser.addedOn = new Date();
        objUser.isActive = true;

        const inserted = await objUser.save();
        inserted.userPassword = undefined;
        res.json({ result: "success", msg: "Google signup successful", data: inserted });
    } catch (error) {
        res.json({ result: "failure", msg: "Google verification failed", data: 0 });
    }
});

router.get('/getUserList', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const objUser = await User.find(adminUserCityScope(req)).select('-userPassword');

    if (objUser != null) {
        res.json({ result: "success", msg: "User List Found", data: objUser });

    } else {
        res.json({ result: "failure", msg: "User List Not Found", data: objUser });

    }
});

router.post('/loginByUser', async (req, res) => {

    const objUser = await User.findOne({ userEmail: req.body.userEmail, isActive: true });

    if (objUser != null && verifyPassword(req.body.userPassword, objUser.userPassword)) {
        if (['suspended', 'blocked'].includes(objUser.accountStatus)) {
            return res.json({ result: "fail", msg: "This account is not active. Contact StayJi admin support.", data: null });
        }
        const actualRole = normalizeAccountType(objUser.userType)
        const requestedRole = normalizeAccountType(req.body.accountType || req.body.role || req.body.userType)
        const portal = (req.body.authPortal || 'public').toString().toLowerCase()
        if (portal === 'public' && actualRole === 'admin') {
            return res.json({ result: "fail", msg: "Use the dedicated admin login portal.", data: null });
        }
        if (portal === 'admin' && actualRole !== 'admin') {
            return res.json({ result: "fail", msg: "Only Admin accounts can use this portal.", data: null });
        }
        if (requestedRole && actualRole !== requestedRole) {
            return res.json({ result: "fail", msg: "Account type mismatch. Select the correct account type to continue.", data: null });
        }
        if (!isHashedPassword(objUser.userPassword) || !objUser.userPassword.startsWith('$2')) {
            await User.updateOne({ _id: objUser._id }, { userPassword: hashPassword(req.body.userPassword) })
        }
        await User.updateOne({ _id: objUser._id }, { lastLogin: new Date() })
        const token = signAuthToken(objUser)
        objUser.userPassword = undefined
        res.json({ result: "success", msg: "login Successfully", data: objUser, token, role: tokenRoleName(objUser.userType) });
    }
    else {
        res.json({ result: "fail", msg: "login UnSuccessfuly", data: objUser });
    }
});

router.post('/updateUserPhoto', upload.single('profile'), async (req, res) => {

    console.log("File");
    console.log(req);
    const objUser = await User.updateOne({
        _id: req.body.id
    }, {
        profile: req.file.filename,
    });
    if (objUser != null) {
        res.json({
            result: "success",
            msg: "User Photo Updated",
            data: 1
        });
    } else {
        res.json({
            result: "failure",
            msg: "User Photo Not Updated",
            data: 0
        });
    }
});

router.post('/getUser', attachAuthenticatedUser, async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.id, ['admin'])) return
    const objUser = await User.findOne({ _id: req.body.id, isActive: true });

    if (objUser != null) {
        res.json({ result: "success", msg: "User Found", data: objUser });

    } else {
        res.json({ result: "failure", msg: "User Not Found", data: objUser });

    }
});

router.post('/authStatus', async (req, res) => {
    if (!req.body.id) {
        return res.json({ result: "failure", msg: "User ID is required", data: null });
    }

    const token = getBearerToken(req)
    let decoded = null
    if (token) {
        try {
            decoded = jwt.verify(token, jwtSecret)
        } catch (error) {
            return res.status(401).json({ result: "inactive", msg: "Session expired. Please login again.", data: null });
        }
        if ((decoded.id || decoded.userId) !== req.body.id) {
            return res.status(403).json({ result: "inactive", msg: "Session does not match this user.", data: null });
        }
    }

    const objUser = await User.findOne({ _id: req.body.id }).select('-userPassword');
    if (!objUser || objUser.isActive === false || ['suspended', 'blocked'].includes(objUser.accountStatus)) {
        return res.json({ result: "inactive", msg: "Account is inactive", data: null });
    }
    if (decoded && objUser.forceLogoutAt && decoded.iat && objUser.forceLogoutAt.getTime() > decoded.iat * 1000) {
        return res.status(401).json({ result: "inactive", msg: "Session expired. Please login again.", data: null });
    }

    res.json({ result: "success", msg: "Account active", data: objUser });
});

router.post('/updateUser', attachAuthenticatedUser, async (req, res) => {
    const targetId = req.body._id || req.body.id
    if (!assertSelfOrRoles(req, res, targetId, ['admin'])) return
    const updateFields = {}
    if (req.body.userFname !== undefined) updateFields.userFname = req.body.userFname
    if (req.body.userLname !== undefined) updateFields.userLname = req.body.userLname
    if (req.body.contact !== undefined) {
        const cleanContact = req.body.contact.toString().replace(/\D/g, '')
        if (cleanContact && !/^[6-9]\d{9}$/.test(cleanContact)) {
            return res.json({ result: "failure", msg: "Enter a valid 10 digit Indian mobile number.", data: null })
        }
        updateFields.contact = cleanContact
    }
    if (req.body.occupation !== undefined) updateFields.occupation = req.body.occupation
    if (req.body.gender !== undefined) updateFields.gender = req.body.gender
    if (req.body.dob !== undefined) updateFields.dob = req.body.dob
    if (req.body.bio !== undefined) updateFields.bio = req.body.bio
    if (req.body.city !== undefined || req.body.cityName !== undefined) updateFields.city = MVP_CITY
    if (req.body.state !== undefined || req.body.stateName !== undefined) updateFields.state = MVP_STATE
    if (req.body.socialLinks !== undefined) updateFields.socialLinks = parseStringList(req.body.socialLinks)

    const objResult = await User.updateOne({ _id: targetId }, { $set: updateFields })
    if (objResult.modifiedCount > 0) {
        const updatedUser = await User.findOne({ _id: targetId }).select('-userPassword')
        res.json({ result: "success", msg: "User Updated", data: updatedUser })
    } else {
        const existingUser = await User.findOne({ _id: targetId }).select('-userPassword')
        if (existingUser) {
            res.json({ result: "success", msg: "No changes needed", data: existingUser })
        } else {
            res.json({ result: "failure", msg: "User Not Updated", data: null })
        }
    }
});


router.get('/getPropertyList', async (req, res) => {
    const publicFilters = buildPropertyFilters({ ...req.query, cityName: MVP_CITY })
    const { page, limit, skip } = pageOptions(req.query)
    publicFilters.cityName = MVP_CITY_REGEX
    if (req.query.analyticsMode === 'real' || req.query.includeDummy === 'false') publicFilters.isDummy = false
    if (req.query.analyticsMode === 'demo') publicFilters.isDummy = true
    if (req.query.status) publicFilters.status = req.query.status
    const cityGate = await publicCityGate()
    const filters = { $and: [publicPropertyQuery, publicFilters, ...(cityGate ? [cityGate] : [])] }
    const [total, objProperty] = await Promise.all([
        Property.countDocuments(filters),
        Property.find(filters)
            .populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact'])
            .populate('propertyTypeIDFK', ['typeName'])
            .sort({ isFeatured: -1, localityPriority: -1, addedOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    ])
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty, meta: { page, limit, total, pages: Math.ceil(total / limit) } });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getAreaListByCity', async (req, res) => {
    const cityName = canonicalLocationName(req.body.cityName || req.body.city || MVP_CITY)
    if (!assertBangaloreRequest(res, cityName)) return
    const objArea = await Area.find({ cityName: new RegExp(`^${normalizedRegexSource(cityName)}$`, 'i'), isActive: true });
    if (objArea != null) {
        res.json({ result: "success", msg: "Area List Found", data: objArea });

    } else {
        res.json({ result: "failure", msg: "Area List Not Found", data: objArea });

    }
});

router.post('/getPropertyByCity', async (req, res) => {
    const cityGate = await publicCityGate()
    const cityName = canonicalLocationName(req.body.cityName || req.body.city || MVP_CITY)
    if (!assertBangaloreRequest(res, cityName)) return
    const publicFilters = buildPropertyFilters({ ...req.body, cityName: MVP_CITY })
    const objProperty = await Property.find({ $and: [publicPropertyQuery, publicFilters, ...(cityGate ? [cityGate] : [])] });
    if (objProperty != null) {
        res.json({ result: "success", msg: "PropertyByCity List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "PropertyByCity List Not Found", data: objProperty });

    }
});

router.post('/getPropertyByArea', async (req, res) => {
    const cityGate = await publicCityGate()
    const publicFilters = buildPropertyFilters({ ...req.body, cityName: MVP_CITY, areaName: req.body.areaName || req.body.area || req.body.locality })
    const objProperty = await Property.find({ $and: [publicPropertyQuery, publicFilters, ...(cityGate ? [cityGate] : [])] });
    if (objProperty != null) {
        res.json({ result: "success", msg: "PropertyByArea List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "PropertyByArea List Not Found", data: objProperty });

    }
});

router.post('/getVisitorList', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    if (req.auth.role === 'owner' && !assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    let objData = [];
    const ownerObjectId = asObjectId(req.body.userIDFK)
    if (!ownerObjectId) return res.json({ result: 'failure', msg: 'Owner user ID is required.', data: [] })

    const pipeline =
    [
        {
          '$lookup': {
            'from': 'propertymasters', 
            'localField': 'propertyIDFK', 
            'foreignField': '_id', 
            'as': 'property'
          }
        }, {
          '$addFields': {
            'property': {
              '$arrayElemAt': [
                '$property', 0
              ]
            }
          }
        }, {
          '$lookup': {
            'from': 'usermasters', 
            'localField': 'userIDFK', 
            'foreignField': '_id', 
            'as': 'visituser'
          }
        }, {
          '$addFields': {
            'visituser': {
              '$arrayElemAt': [
                '$visituser', 0
              ]
            }
          }
        }, {
          '$addFields': {
            'propertyOwnerId': propertyOwnerExpression()
          }
        }, {
          '$lookup': {
            'from': 'usermasters', 
            'localField': 'propertyOwnerId',
            'foreignField': '_id', 
            'as': 'user'
          }
        }, {
          '$addFields': {
            'user': {
              '$arrayElemAt': [
                '$user', 0
              ]
            }
          }
        }, {
          '$match': {
            'propertyOwnerId': ownerObjectId,
          }
        }, {
          '$unset': ['visituser.userPassword', 'user.userPassword', 'propertyOwnerId']
        }
      ]
        ;
    const aggCursor = Visit.aggregate(pipeline);
    for await (const doc of aggCursor) {
        objData.push(doc);
    }
    objData = dedupeLatestByKey(objData, (item) => {
        const userId = item.visituser?._id || item.userIDFK || item.userId
        const propertyId = item.property?._id || item.propertyIDFK || item.propertyId
        return userId && propertyId ? `${userId}-${propertyId}` : item._id?.toString()
    })



    if (objData != null) {
        res.json({
            result: "success",
            msg: "Visit List Found",
            data: objData
        });
    } else {
        res.json({
            result: "failure",
            msg: "Visit List Not Found",
            data: objData
        });
    }
});

// router.post('/getVisitorList', async (req, res) => {

//     console.log(req.body.userIDFK);
//     const objProperty = await Property.find({ userIDFK: req.body.userIDFK });

//     console.log(objProperty);
//     var objdata = [];
//     for (const element of objProperty) {
//         const objVisit = await Visit.find({ propertyIDFK: element._id, isActive: true }).
//             populate({
//                 path: 'userIDFK',
//                 model: 'userMaster', 
//                 select: ['userType', 'userFname', 'contact', 'userLname']
//             })
//             .populate({
//                 path: 'propertyIDFK',
//                 model: 'propertyMaster',
//                 select: ['propertyName', 'userIDFK'],
//                 populate: [{
//                     path: 'userIDFK',
//                     model: 'userMaster',
//                     select: ['userType', 'userFname', 'contact', 'userLname']
//                 }]

//             });
            
//         objdata.push(objVisit);
//     }
//     if (objdata != null) {
//         res.json({ result: "success", msg: "Visitor List Found", data: objdata });

//     } else {
//         res.json({ result: "failure", msg: "Visitor List Not Found", data: objdata });

//     }
// });

router.post('/getVisitorListStatus', async (req, res) => {
    const objVisit = await Visit.find({ userIDFK: req.body.userIDFK, isActive: true, status: "1" }).
        populate('userIDFK', ['userFname', 'userLname', 'userType']).populate('propertyIDFK', ['propertyName']);
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    console.log(req.body.userIDFK);
    if (objVisit != null) {
        res.json({ result: "success", msg: "Visitor List Found", data: objVisit });

    } else {
        res.json({ result: "failure", msg: "Visitor List Not Found", data: objVisit });

    }
});


router.post('/getVisitById', async (req, res) => {
    const objVisit = await Visit.find({ userIDFK: req.body.userIDFK, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname']).populate('propertyIDFK', ['propertyName']);
    if (objVisit != null) {
        res.json({ result: "success", msg: "Visitor List Found", data: objVisit });

    } else {
        res.json({ result: "failure", msg: "Visitor List Not Found", data: objVisit });

    }
});

router.post('/getInquiryById', async (req, res) => {
    const objInquiry = await Inquiry.find({ userIDFK: req.body.userIDFK, isActive: true }).
        populate('userIDFK', ['userType', 'userFname', 'contact', 'userLname'])
        .populate({
            path: 'propertyIDFK',
            model: 'propertyMaster',
            select: ['propertyName', 'userIDFK'],
            populate: [{
                path: 'userIDFK',
                model: 'userMaster',
                select: ['userType', 'userFname', 'contact', 'userLname']
            }]

        });
    if (objInquiry != null) {
        res.json({ result: "success", msg: "Inquiry List Found", data: objInquiry });

    } else {
        res.json({ result: "failure", msg: "Inquiry List Not Found", data: objInquiry });

    }
});

router.post('/getInquiry', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    if (req.auth.role === 'owner' && !assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    let objData = [];
    const ownerObjectId = asObjectId(req.body.userIDFK)
    if (!ownerObjectId) return res.json({ result: 'failure', msg: 'Owner user ID is required.', data: [] })

    const pipeline =
    [
        {
            '$lookup': {
                'from': 'propertymasters', 
                'localField': 'propertyIDFK', 
                'foreignField': '_id', 
                'as': 'property'
            }
        }, {
            '$addFields': {
                'property': {
                    '$arrayElemAt': [
                        '$property', 0
                    ]
                }
            }
        }, {
            '$addFields': {
                'propertyOwnerId': propertyOwnerExpression()
            }
        }, {
            '$lookup': {
                'from': 'usermasters', 
                'localField': 'propertyOwnerId',
                'foreignField': '_id', 
                'as': 'user'
            }
        }, {
            '$addFields': {
                'user': {
                    '$arrayElemAt': [
                        '$user', 0
                    ]
                }
            }
        }, {
            '$lookup': {
                'from': 'usermasters', 
                'localField': 'userIDFK', 
                'foreignField': '_id', 
                'as': 'inquiryuser'
            }
        }, {
            '$addFields': {
                'inquiryuser': {
                    '$arrayElemAt': [
                        '$inquiryuser', 0
                    ]
                }
            }
        }, {
            '$match': {
                'propertyOwnerId': ownerObjectId,
            }
        }, {
            '$unset': ['inquiryuser.userPassword', 'user.userPassword', 'propertyOwnerId']
        }
    ]
        ;
    const aggCursor = Inquiry.aggregate(pipeline);
    for await (const doc of aggCursor) {
        objData.push(doc);
    }
    objData = dedupeLatestByKey(objData, (item) => {
        const userId = item.inquiryuser?._id || item.userIDFK
        const propertyId = item.property?._id || item.propertyIDFK || item.propertyId
        return userId && propertyId ? `${userId}-${propertyId}` : item._id?.toString()
    })



    if (objData != null) {
        res.json({
            result: "success",
            msg: "Inquiry List Found",
            data: objData
        });
    } else {
        res.json({
            result: "failure",
            msg: "Inquiry List Not Found",
            data: objData
        });
    }
});

// router.get('/getInquiry', async (req, res) => {
//     const objInquiry = await Inquiry.find({ isActive: true }).
//         populate('userIDFK', ['userFname', 'userLname']).populate('propertyIDFK', ['propertyName']);
//     if (objInquiry != null) {
//         res.json({ result: "success", msg: "Inquiry List Found", data: objInquiry });

//     } else {
//         res.json({ result: "failure", msg: "Inquiry List Not Found", data: objInquiry });

//     }
// });


router.post('/getPropertyById', attachOptionalAuthenticatedUser, async (req, res) => {
    const privateRequested = toBoolean(req.body.includePrivate) && req.auth
    const cityGate = privateRequested ? bangalorePropertyScope() : await publicCityGate()
    let filters = privateRequested
        ? { _id: req.body.id, ...bangalorePropertyScope() }
        : { $and: [{ _id: req.body.id, ...publicPropertyQuery }, ...(cityGate ? [cityGate] : [])] }
    if (privateRequested && req.auth.role === 'owner') {
        filters = { ...filters, $or: [{ userIDFK: req.auth.user._id }, { vendorId: req.auth.user._id }] }
    }
    if (privateRequested && req.auth.role === 'admin') {
        filters = { _id: req.body.id, ...adminCityScope(req) }
    }
    const objProperty = await Property.findOne(filters).
        populate(propertyPopulate());
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getPropertyByUserId', async (req, res) => {
    const objProperty = await Property.findOne({ userIDFK: req.body.id, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname']).populate('propertyTypeIDFK', ['typeName']);
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getAminityById', async (req, res) => {
    const objAminity = await Aminity.find({ propertyTypeIDFK: req.body.propertyTypeIDFK, isActive: true })
    if (objAminity != null) {
        res.json({ result: "success", msg: "Aminity List Found", data: objAminity });

    } else {
        res.json({ result: "failure", msg: "Aminity List Not Found", data: objAminity });

    }
});


router.post('/getPropertyImageById', async (req, res) => {
    const objImage = await PropertyImage.find({ propertyIDFK: req.body.propertyIDFK, isActive: true })
        .populate('propertyIDFK', ['propertyName'])
    if (objImage != null) {
        res.json({ result: "success", msg: "PropertyImage List Found", data: objImage });

    } else {
        res.json({ result: "failure", msg: "PropertyImage List Not Found", data: objImage });

    }
});

router.post('/getReviewById', async (req, res) => {
    const objReview = await UserReview.find({ propertyIDFK: req.body.propertyIDFK, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname']).populate('propertyIDFK', ['propertyName'])
    if (objReview != null) {
        res.json({ result: "success", msg: "Review List Found", data: objReview });

    } else {
        res.json({ result: "failure", msg: "Review List Not Found", data: objReview });

    }
});

router.post('/updateUser', attachAuthenticatedUser, async (req, res) => {
    const targetId = req.body.id || req.body._id
    if (!assertSelfOrRoles(req, res, targetId, ['admin'])) return

    const updateFields = {}
    if (req.body.userName !== undefined) updateFields.userName = req.body.userName
    if (req.body.userFname !== undefined) updateFields.userFname = req.body.userFname
    if (req.body.userLname !== undefined) updateFields.userLname = req.body.userLname
    if (req.body.dob !== undefined) updateFields.dob = req.body.dob
    if (req.body.gender !== undefined) updateFields.gender = req.body.gender
    if (req.body.contact !== undefined) updateFields.contact = req.body.contact
    if (req.body.occupation !== undefined) updateFields.occupation = req.body.occupation
    if (req.body.bio !== undefined) updateFields.bio = req.body.bio
    if (req.body.city !== undefined || req.body.cityName !== undefined) updateFields.city = MVP_CITY
    if (req.body.state !== undefined || req.body.stateName !== undefined) updateFields.state = MVP_STATE
    if (req.body.socialLinks !== undefined) updateFields.socialLinks = parseStringList(req.body.socialLinks)

    const objUser = await User.updateOne({ _id: targetId }, { $set: updateFields });
    // res.send(objStudent);
    if (objUser != null) {
        res.json({ result: "success", msg: "User updated Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/getShortlistById', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    const objShort = await Shortlisted.find({ userIDFK: req.body.userIDFK, isActive: true })
        .populate('userIDFK', ['userFname', 'userLname'])
        .populate('propertyIDFK', ['propertyName', 'propertyImage', 'rent', 'address', 'areaName', 'isActive', 'approvalStatus']);

    if (objShort != null) {
        const visibleShortlist = objShort.filter((item) => item.propertyIDFK && item.propertyIDFK.isActive !== false && ['Approved', 'Verified'].includes(item.propertyIDFK.approvalStatus || 'Approved'));
        res.json({ result: 'success', msg: 'ShortList Found', data: visibleShortlist });
    } else {
        res.json({ result: 'failure', msg: 'ShortList Not Found', data: objShort });
    }
});

router.post('/getShortlistByVendor', async (req, res) => {
    if (!req.body.userIDFK) {
        return res.json({ result: 'failure', msg: 'Vendor user ID is required', data: [] });
    }

    const ownerObjectId = asObjectId(req.body.userIDFK);
    if (!ownerObjectId) return res.json({ result: 'failure', msg: 'Vendor user ID is invalid', data: [] });
    const properties = await Property.find({ $or: [{ userIDFK: ownerObjectId }, { vendorId: ownerObjectId }], isActive: true }).select('_id');
    const propertyIds = properties.map((property) => property._id);

    if (!propertyIds.length) {
        return res.json({ result: 'success', msg: 'No shortlist activity found', data: [] });
    }

    const shortlistSummary = await Shortlisted.aggregate([
        { $match: { propertyIDFK: { $in: propertyIds }, isActive: true } },
        { $group: { _id: '$propertyIDFK', wishlistCount: { $sum: 1 }, latestActivity: { $max: '$addedOn' } } },
        { $lookup: { from: 'propertymasters', localField: '_id', foreignField: '_id', as: 'property' } },
        { $unwind: '$property' },
        {
            $project: {
                _id: 0,
                propertyId: '$_id',
                wishlistCount: 1,
                latestActivity: 1,
                property: {
                    _id: '$property._id',
                    propertyName: '$property.propertyName',
                    rent: '$property.rent',
                    address: '$property.address',
                    areaName: '$property.areaName',
                    cityName: '$property.cityName',
                    approvalStatus: '$property.approvalStatus',
                    isActive: '$property.isActive',
                },
            },
        },
    ]);

    const visibleShortlist = shortlistSummary.filter((item) => item.property && item.property.isActive !== false && ['Approved', 'Verified'].includes(item.property.approvalStatus || 'Approved'));
    res.json({ result: 'success', msg: 'Shortlist analytics found', data: visibleShortlist });
});

router.post('/getShortlistByPropertyId', async (req, res) => {
    if (req.body.userIDFK == "" || req.body.propertyIDFK == "") {
        res.json({
            result: "failure",
            msg: "user id or property id Not Found",
            data: 0
        });
    }
    else {
        const objShortlist = await Shortlisted.findOne({
            userIDFK: req.body.userIDFK,
            propertyIDFK: req.body.propertyIDFK,
            isActive: true
        }).populate('userIDFK', ['userFname', 'userLname'])
            .populate('propertyIDFK', ['propertyName', 'propertyImage', 'rent', 'address', 'areaName'])

        if (objShortlist != null) {
            res.json({
                result: "success",
                msg: "shortlist Found",
                data: objShortlist
            });
        } else {
            res.json({
                result: "failure",
                msg: "shortlist Not Found",
                data: objShortlist
            });
        }
    }


});

router.post('/addInquiry', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    const property = await Property.findOne({ _id: req.body.propertyIDFK, ...bangalorePropertyScope() }).select('userIDFK vendorId')
    if (!property) return res.json({ result: 'failure', msg: 'Bangalore property not found.', data: 0 })
    var objInquiry = new Inquiry({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK });
    objInquiry.propertyIDFK = req.body.propertyIDFK,
        objInquiry.propertyId = req.body.propertyIDFK,
        objInquiry.vendorId = property?.vendorId || property?.userIDFK,
        objInquiry.subject = req.body.subject,
        objInquiry.description = req.body.description,
        objInquiry.userIDFK = req.body.userIDFK,
        objInquiry.reply = "",
        objInquiry.status = false,
        objInquiry.addedOn = new Date(),
        objInquiry.isActive = true;

    const inserted = await objInquiry.save();

    if (inserted != null) {
        await createLeadEvent({
            userId: req.body.userIDFK,
            propertyId: req.body.propertyIDFK,
            vendorId: property?.vendorId || property?.userIDFK,
            sourceType: 'callback',
            status: 'Callback Requested',
            note: req.body.subject || 'Callback requested',
        })
        await notifyPropertyOwner(req.body.propertyIDFK, {
            actorId: req.body.userIDFK,
            type: 'callback_request',
            title: 'New callback request',
            message: 'A user asked for more details about your property.',
        })
        await notifyAdmins({
            actorId: req.body.userIDFK,
            propertyId: req.body.propertyIDFK,
            type: 'lead_update',
            title: 'New property inquiry',
            message: 'A new inquiry was created from a property detail page.',
            link: `/dashboard/admin/properties/${req.body.propertyIDFK}`,
        })
        res.json({ result: "success", msg: "Inquiry Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "Inquiry Not Inserted", data: 0 });
    }
});

router.post('/addInterest', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    const property = await Property.findOne({ _id: req.body.propertyIDFK, ...bangalorePropertyScope() }).select('userIDFK vendorId')
    if (!property) return res.json({ result: 'failure', msg: 'Bangalore property not found.', data: 0 })
    const inquiryPayload = {
        propertyIDFK: req.body.propertyIDFK,
        propertyId: req.body.propertyIDFK,
        vendorId: property?.vendorId || property?.userIDFK,
        subject: req.body.subject || 'Property interest',
        description: req.body.description || 'A user has expressed interest in this property.',
        preferredVisitTime: req.body.preferredVisitTime || req.body.visitTime || '',
        moveInPreference: req.body.moveInPreference || '',
        leadStage: 'qualified',
        isConverted: false,
        userIDFK: req.body.userIDFK,
        reply: '',
        status: false,
        addedOn: new Date(),
        isActive: true,
    }
    const inserted = await Inquiry.findOneAndUpdate(
        { userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK, subject: inquiryPayload.subject },
        { $set: inquiryPayload },
        { new: true, upsert: true }
    )

    if (inserted != null) {
        await createLeadEvent({
            userId: req.body.userIDFK,
            propertyId: req.body.propertyIDFK,
            vendorId: property?.vendorId || property?.userIDFK,
            sourceType: 'interest',
            status: 'Interested',
            note: inserted.subject,
            metadata: { preferredVisitTime: inserted.preferredVisitTime, moveInPreference: inserted.moveInPreference },
        })
        await notifyPropertyOwner(req.body.propertyIDFK, {
            actorId: req.body.userIDFK,
            type: 'callback_request',
            title: 'New interested lead',
            message: 'A user requested a callback for your property.',
        })
        await notifyAdmins({
            actorId: req.body.userIDFK,
            propertyId: req.body.propertyIDFK,
            type: 'lead_update',
            title: 'New interested lead',
            message: 'A user expressed interest in a property.',
            link: `/dashboard/admin/properties/${req.body.propertyIDFK}`,
        })
        res.json({ result: 'success', msg: 'Interest submitted', data: 1 });
    } else {
        res.json({ result: 'failure', msg: 'Interest could not be submitted', data: 0 });
    }
});

router.post('/addPropertyImages', upload.single('propertyImage'), async (req, res) => {

    const objPropertyImage = new PropertyImage();
    objPropertyImage.propertyIDFK = req.body.propertyIDFK,
        console.log("id" + req.body.propertyIDFK);
    objPropertyImage.image = req.file.filename,
        objPropertyImage.addedOn = new Date(),
        objPropertyImage.isActive = true
    await objPropertyImage.save();

    res.json({ result: "success", msg: "Images Inserted", data: 1 });
});

router.post('/addVisit', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    const property = await Property.findOne({ _id: req.body.propertyIDFK, ...bangalorePropertyScope() }).select('userIDFK vendorId')
    if (!property) return res.json({ result: 'failure', msg: 'Bangalore property not found.', data: 0 })
    const visitPayload = {
        visitDate: req.body.visitDate,
        visitTime: req.body.visitTime || "-",
        moveInPreference: req.body.moveInPreference || "",
        leadStage: "qualified",
        isConverted: false,
        userIDFK: req.body.userIDFK,
        userId: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        propertyId: req.body.propertyIDFK,
        vendorId: property?.vendorId || property?.userIDFK,
        status: "0",
        addedOn: new Date(),
        isActive: true,
    }
    const inserted = await Visit.findOneAndUpdate(
        { userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK, status: { $in: ['0', '1'] }, isActive: true },
        { $set: visitPayload },
        { new: true, upsert: true }
    )

    if (inserted != null) {
        await createLeadEvent({
            userId: req.body.userIDFK,
            propertyId: req.body.propertyIDFK,
            vendorId: property?.vendorId || property?.userIDFK,
            sourceType: 'visit',
            status: 'Visit Requested',
            note: 'Visit requested',
            metadata: { visitDate: inserted.visitDate, visitTime: inserted.visitTime, moveInPreference: inserted.moveInPreference },
        })
        await notifyPropertyOwner(req.body.propertyIDFK, {
            actorId: req.body.userIDFK,
            type: 'visit_request',
            title: 'New visit request',
            message: 'A user requested a property visit.',
        })
        await notifyAdmins({
            actorId: req.body.userIDFK,
            propertyId: req.body.propertyIDFK,
            type: 'visit_request',
            title: 'New visit request',
            message: 'A new visit request needs tracking.',
            link: `/dashboard/admin/properties/${req.body.propertyIDFK}`,
        })
        res.json({ result: "success", msg: "Visit Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "Visit Not Inserted", data: 0 });
    }
});

router.post('/markLeadConverted', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    const allowedTypes = ['visit', 'inquiry']
    if (!allowedTypes.includes(req.body.type) || !req.body.id) {
        return res.json({ result: 'failure', msg: 'Lead type and ID are required', data: 0 })
    }

    const Model = req.body.type === 'visit' ? Visit : Inquiry
    const lead = await Model.findOne({ _id: req.body.id }).select('userIDFK propertyIDFK vendorId')
    if (!lead) return res.json({ result: 'failure', msg: 'Lead not found.', data: 0 })
    if (req.auth.role === 'owner' && (lead.vendorId || '').toString() !== req.auth.user._id.toString()) {
        return res.status(403).json({ result: 'failure', msg: 'Owners can only update their own leads.', data: 0 })
    }
    if (req.auth.role === 'admin') {
        const property = await Property.findOne({ _id: lead.propertyIDFK, ...adminCityScope(req) }).select('_id')
        if (!property) return res.status(403).json({ result: 'failure', msg: 'Lead is outside Bangalore admin scope.', data: 0 })
    }
    const updated = await Model.updateOne({ _id: req.body.id }, { isConverted: true, leadStage: 'converted' })
    if (updated.modifiedCount > 0) {
        if (lead) {
            await createNotification({
                recipientId: lead.userIDFK,
                recipientRole: 'user',
                propertyId: lead.propertyIDFK,
                type: 'lead_update',
                title: 'Lead converted',
                message: 'Your StayJi lead was marked as converted.',
                link: `/properties/${lead.propertyIDFK}`,
            })
            await createNotification({
                recipientId: lead.vendorId,
                recipientRole: 'vendor',
                propertyId: lead.propertyIDFK,
                type: 'lead_update',
                title: 'Conversion recorded',
                message: 'A lead for your property was marked as converted.',
                link: `/dashboard/vendor/properties/${lead.propertyIDFK}`,
            })
        }
        return res.json({ result: 'success', msg: 'Lead marked as converted', data: 1 })
    }
    res.json({ result: 'failure', msg: 'Lead conversion was not updated', data: 0 })
});

router.post('/addReview', async (req, res) => {
    const userId = asObjectId(req.body.userIDFK || req.body.userId)
    const propertyId = asObjectId(req.body.propertyIDFK || req.body.propertyId)
    const rating = normalizeRating(req.body.rating)
    if (!userId || !propertyId || !rating || !(req.body.details || '').trim()) {
        return res.json({ result: "failure", msg: "User, property, rating, and review details are required.", data: null });
    }
    const property = await Property.findOne({ _id: propertyId, isActive: true }).select('_id propertyName userIDFK vendorId')
    if (!property) return res.json({ result: "failure", msg: "Property not found.", data: null });

    const review = await UserReview.findOneAndUpdate(
        { userIDFK: userId, propertyIDFK: propertyId },
        {
            $set: {
                propertyIDFK: propertyId,
                propertyId,
                details: req.body.details.trim(),
                rating: rating.toString(),
                tags: parseStringList(req.body.tags),
                sentiment: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral',
                userIDFK: userId,
                userId,
                status: 'active',
                updatedOn: new Date(),
                isActive: true,
            },
            $setOnInsert: { addedOn: new Date() },
        },
        { new: true, upsert: true }
    )
    const summary = await refreshPropertyRating(propertyId)
    await createNotification({
        recipientId: property.vendorId || property.userIDFK,
        recipientRole: 'vendor',
        actorId: userId,
        propertyId,
        type: 'review',
        title: 'New property review',
        message: `${rating}/5 review received for ${property.propertyName || 'your property'}.`,
        link: `/dashboard/vendor/properties/${propertyId}`,
    })
    res.json({ result: "success", msg: "Review saved.", data: { review, summary } });
});

router.get('/reviews', async (req, res) => {
    const filters = { isActive: true, status: { $nin: ['suspended', 'flagged', 'archived'] } }
    if (req.query.propertyId && mongoose.Types.ObjectId.isValid(req.query.propertyId)) filters.propertyIDFK = new mongoose.Types.ObjectId(req.query.propertyId)
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) filters.userIDFK = new mongoose.Types.ObjectId(req.query.userId)
    if (req.query.status) filters.status = req.query.status
    const items = await UserReview.find(filters)
        .populate('userIDFK', ['userFname', 'userLname', 'userEmail'])
        .populate('propertyIDFK', ['propertyName', 'cityName', 'areaName'])
        .sort({ rating: -1, updatedOn: -1, addedOn: -1 })
        .limit(Math.min(100, Number(req.query.limit || 30)))
    res.json({ result: 'success', msg: 'Reviews found.', data: items })
})

router.post('/reviews/:id/reply', async (req, res) => {
    const review = await UserReview.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { $set: { ownerReply: (req.body.reply || '').trim(), ownerReplyOn: new Date() } },
        { new: true }
    )
    if (!review) return res.json({ result: 'failure', msg: 'Review not found.', data: null })
    await createNotification({
        recipientId: review.userIDFK,
        recipientRole: 'user',
        propertyId: review.propertyIDFK,
        type: 'review',
        title: 'Owner replied to your review',
        message: 'The property owner responded to your StayJi review.',
        link: `/properties/${review.propertyIDFK}`,
    })
    res.json({ result: 'success', msg: 'Review reply saved.', data: review })
})

router.post('/reviews/:id/moderate', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const status = ['active', 'flagged', 'suspended', 'archived'].includes(req.body.status) ? req.body.status : 'active'
    const review = await UserReview.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status, isActive: status !== 'archived', moderatedBy: req.auth.user._id, moderatedOn: new Date() } },
        { new: true }
    )
    if (!review) return res.json({ result: 'failure', msg: 'Review not found.', data: null })
    const summary = await refreshPropertyRating(review.propertyIDFK)
    await recordAudit({ performerId: req.auth.user._id, performerRole: req.auth.user.userType, action: 'review_moderated', entityType: 'review', entityId: review._id, updatedValue: { status }, city: req.body.city, state: req.body.state })
    res.json({ result: 'success', msg: 'Review moderated.', data: { review, summary } })
})

router.post('/addShortlist', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    const targetProperty = await Property.findOne({ _id: req.body.propertyIDFK, ...publicPropertyQuery, ...bangalorePropertyScope() }).select('_id')
    if (!targetProperty) return res.json({ result: 'failure', msg: 'Bangalore property not available for saving.', data: 0 })
    let objShortlist = await Shortlisted.findOne({
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
    });

    if (objShortlist != null) {
        if (objShortlist.isActive) {
            objShortlist.addedOn = new Date();
            await objShortlist.save();
            return res.json({
                result: 'success',
                msg: 'Property already shortlisted. Latest save time refreshed.',
                data: 1,
            });
        }

        objShortlist.isActive = true;
        objShortlist.addedOn = new Date();
        await objShortlist.save();
        await notifyPropertyOwner(req.body.propertyIDFK, {
            actorId: req.body.userIDFK,
            type: 'wishlist_activity',
            title: 'Property wishlisted again',
            message: 'A user saved your property to their wishlist.',
        })

        return res.json({
            result: 'success',
            msg: 'Shortlist reactivated successfully',
            data: 1,
        });
    }

    objShortlist = new Shortlisted();
    objShortlist.userIDFK = req.body.userIDFK;
    objShortlist.propertyIDFK = req.body.propertyIDFK;
    objShortlist.isActive = true;
    objShortlist.addedOn = new Date();
    const inserted = await objShortlist.save();

    if (inserted != null) {
        await notifyPropertyOwner(req.body.propertyIDFK, {
            actorId: req.body.userIDFK,
            type: 'wishlist_activity',
            title: 'New wishlist save',
            message: 'A user saved your property to their wishlist.',
        })
        res.json({
            result: 'success',
            msg: 'Shortlist Inserted Successfully',
            data: 1,
        });
    } else {
        res.json({
            result: 'failure',
            msg: 'UnSuccessful',
            data: 0,
        });
    }
});

const removeShortlist = async (req, res) => {
    if (!assertSelfOrRoles(req, res, req.body.userIDFK, [])) return

    const objShortlist = await Shortlisted.updateOne({
        propertyIDFK: req.body.propertyIDFK,
        userIDFK: req.body.userIDFK,
        isActive: true
    }, { isActive: false });
    if (objShortlist != null) {
        res.json({
            result: "success",
            msg: "Shortlist updated Successfully",
            data: 1
        });
    } else {
        res.json({
            result: "failure",
            msg: "UnSuccessful",
            data: 0
        });
    }
}

router.delete('/deleteShortlist', attachAuthenticatedUser, requireRoles(['user']), removeShortlist);
router.post('/deleteShortlist', attachAuthenticatedUser, requireRoles(['user']), removeShortlist);

router.get('/getPropertyType', async (req, res) => {
    const objtype = await PropertyType.find({ isActive: true });
    console.log(objtype)
    if (objtype != null) {
        res.json({ result: "success", msg: "PropertyType List Found", data: objtype });

    } else {
        res.json({ result: "failure", msg: "PropertyType List Not Found", data: objtype });

    }
});

router.post('/addProperty', attachAuthenticatedUser, requireRoles(['owner']), upload.fields([{ name: 'propertyImage', maxCount: 10 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    req.body.userIDFK = req.auth.user._id.toString()
    req.body.vendorId = req.auth.user._id.toString()
    req.body.cityName = MVP_CITY
    req.body.stateName = MVP_STATE
    if (!req.body.areaName || !req.body.cityName || (!req.body.stateName && !req.body.state) || !req.body.latitude || !req.body.longitude) {
        return res.json({ result: "failure", msg: "State, city, locality, and map coordinates are required for StayJi locality pages.", data: 0 });
    }
    const imageUrls = parseStringList(req.body.propertyImageUrls)
    const mealsAvailable = parseStringList(req.body.mealsAvailable || req.body.foodOptions)
    const menuPhotoUrls = parseStringList(req.body.menuPhotoUrls)
    const ownerId = req.body.vendorId || req.body.userIDFK
    const owner = ownerId ? await User.findOne({ _id: ownerId }).select('userType approvalStatus isActive accountStatus city state assignedCity assignedState') : null
    if (!owner || normalizeAccountType(owner.userType) !== 'owner') {
        return res.json({ result: "failure", msg: "Only approved Owners can submit properties.", data: 0 });
    }
    if (owner.isActive === false || owner.accountStatus === 'suspended' || !['Approved', 'Verified'].includes(owner.approvalStatus || '')) {
        return res.json({ result: "failure", msg: "Owner approval is required before listing properties.", data: 0 });
    }
    const ownerAgreementAccepted = toBoolean(req.body.referralAgreementAccepted) && toBoolean(req.body.leadPricingAccepted) && toBoolean(req.body.ownerTermsAccepted)
    if (!ownerAgreementAccepted) {
        return res.json({ result: "failure", msg: "Accept referral agreement, lead pricing, and StayJi owner terms before submitting a property.", data: 0 });
    }
    const ownerConsentMetadata = requestConsentMetadata(req, 'property_creation')
    const uploadedImages = (req.files?.propertyImage || []).map((file) => file.filename)
    const uploadedVideo = req.files?.video?.[0]?.filename || ''
    const primaryImage = uploadedImages[0]
        ? uploadedImages[0]
        : (req.body.propertyImage || imageUrls[0] || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80')
    var objProperty = new Property({ userIDFK: req.body.userIDFK, vendorId: req.body.vendorId || req.body.userIDFK });
    objProperty.userIDFK = req.body.userIDFK,
        objProperty.vendorId = req.body.vendorId || req.body.userIDFK,
        objProperty.propertyName = normalizeText(req.body.propertyName),
        objProperty.description = normalizeText(req.body.description),
        objProperty.address = normalizeText(req.body.address),
        objProperty.rent = req.body.rent,
        objProperty.sharing = req.body.sharing,
        objProperty.genderType = req.body.genderType,
        objProperty.areaName = normalizeText(req.body.areaName),
        objProperty.localitySlug = req.body.localitySlug || slugify(req.body.areaName),
        objProperty.cityName = canonicalLocationName(req.body.cityName),
        objProperty.stateName = normalizeText(req.body.stateName || req.body.state || owner?.assignedState || owner?.state || ""),
        objProperty.latitude = toNumberOrUndefined(req.body.latitude),
        objProperty.longitude = toNumberOrUndefined(req.body.longitude),
        objProperty.aminityFeatures = req.body.aminityFeatures || "",
        objProperty.mealsAvailable = mealsAvailable,
        objProperty.menuPhoto = req.body.menuPhoto || menuPhotoUrls[0] || "",
        objProperty.menuPhotoUrls = menuPhotoUrls,
        objProperty.propertyImage = primaryImage,
        objProperty.propertyImageUrls = [...uploadedImages, ...imageUrls].length ? [...uploadedImages, ...imageUrls] : [primaryImage],
        objProperty.videoUrl = uploadedVideo || req.body.videoUrl || "",
        objProperty.depositAmount = req.body.depositAmount || "",
        objProperty.availableBeds = toNumberOrUndefined(req.body.availableBeds) || 0,
        objProperty.roomInventory = parseRoomInventory(req.body.roomInventory),
        objProperty.roomTypes = parseJsonValue(req.body.roomTypes, []),
        objProperty.customFeatures = parseStringList(req.body.customFeatures),
        objProperty.vacancyStatus = req.body.vacancyStatus || "Available",
        objProperty.availableFrom = req.body.availableFrom || "",
        objProperty.sharingAvailability = req.body.sharingAvailability || "",
        objProperty.parkingAvailable = toBoolean(req.body.parkingAvailable),
        objProperty.acAvailable = toBoolean(req.body.acAvailable),
        objProperty.rating = toNumberOrUndefined(req.body.rating) || 4.6,
        objProperty.propertyCategory = req.body.propertyCategory || req.body.propertySegment || "PG",
        objProperty.pricingUnit = req.body.pricingUnit || "month",
        objProperty.dailyRate = req.body.dailyRate || "",
        objProperty.perDayCheckIn = toBoolean(req.body.perDayCheckIn),
        objProperty.isAvailable = true,
        objProperty.isDummy = toBoolean(req.body.isDummy),
        objProperty.isVerified = false,
        objProperty.status = toBoolean(req.body.isDummy) ? "demo" : "active",
        objProperty.ownerAgreement = {
            referralAgreementAccepted: toBoolean(req.body.referralAgreementAccepted),
            leadPricingAccepted: toBoolean(req.body.leadPricingAccepted),
            termsAccepted: toBoolean(req.body.ownerTermsAccepted),
            acceptedOn: ownerConsentMetadata.acceptedOn,
            acceptedBy: ownerId,
            acceptedIp: ownerConsentMetadata.ip,
            acceptedUserAgent: ownerConsentMetadata.userAgent,
            consentVersion: ownerConsentMetadata.consentVersion,
            consentSource: ownerConsentMetadata.source,
        },
        objProperty.addedOn = new Date(),
        objProperty.isActive = false,
        objProperty.approvalStatus = "Pending"
    if (req.body.propertyTypeIDFK) {
        objProperty.propertyTypeIDFK = req.body.propertyTypeIDFK
    }

    const inserted = await objProperty.save();

    if (inserted != null) {
        await User.updateOne({ _id: req.body.userIDFK }, { $set: { userType: "Owner", city: owner?.city || objProperty.cityName, state: owner?.state || objProperty.stateName, assignedCity: owner?.assignedCity || objProperty.cityName, assignedState: owner?.assignedState || objProperty.stateName } });
        await recordAudit({ performerId: req.body.userIDFK, performerRole: 'Owner', action: 'property_submitted', entityType: 'property', entityId: inserted._id, updatedValue: { approvalStatus: 'Pending', isDummy: inserted.isDummy }, city: inserted.cityName, state: objProperty.stateName })
        res.json({ result: "success", msg: "Property Inserted", data: inserted._id });
    } else {
        res.json({ result: "failure", msg: "Property Not Inserted", data: 0 });
    }

});


router.post('/resetPassword', attachAuthenticatedUser, async (req, res) => {
    const targetEmail = (req.body.userEmail || req.body.email || '').trim()
    const target = await User.findOne({ userEmail: new RegExp(`^${targetEmail}$`, 'i'), isActive: true })
    if (!target) return res.json({ result: "failure", msg: "User not found.", data: 0 });
    const sameUser = target._id.toString() === req.auth.user._id.toString()
    if (!sameUser && !isAdminRequest(req)) {
        return res.status(403).json({ result: "failure", msg: "Only Admin can reset another user's password.", data: 0 });
    }
    if (!strongPasswordPattern.test(req.body.userPassword || req.body.password || '')) {
        return res.json({ result: "failure", msg: "Password must be at least 8 characters and include uppercase, lowercase, and a number.", data: 0 });
    }
    await User.updateOne({ _id: target._id }, {
        userPassword: hashPassword(req.body.userPassword || req.body.password),
        forceLogoutAt: new Date(),
        resetOtp: '',
        resetOtpExpiresAt: null,
    });
    res.json({ result: "success", msg: "Password reset successfully. Please login again.", data: 1 });
});

router.post('/updateVisitTime', async (req, res) => {
    const objVisit = await Visit.updateOne({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK }, {
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        visitTime: req.body.visitTime,
        status: "1"
    });
    // res.send(objUser);

    if (objVisit != null) {
        res.json({ result: "success", msg: "Visit Time update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateVisitStatus', async (req, res) => {
    const objVisit = await Visit.updateOne({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK }, {
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        status: "2"
    });
    if (objVisit != null) {
        res.json({ result: "success", msg: "Visit status update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateAminityFeature', async (req, res) => {

    const objProperty = await Property.updateOne({
        _id: req.body.id,
    },
        {
            aminityFeatures: req.body.aminityFeatures,
        });
    if (objProperty != null) {
        res.json({ result: "success", msg: "Aminity Features update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateReply', async (req, res) => {
    const objInquiry = await Inquiry.updateOne({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK }, {
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        reply: req.body.reply,
        status: true
    });
    if (objInquiry != null) {
        await createNotification({
            recipientId: req.body.userIDFK,
            recipientRole: 'user',
            propertyId: req.body.propertyIDFK,
            type: 'vendor_reply',
            title: 'Vendor replied to your inquiry',
            message: req.body.reply || 'The vendor replied to your property inquiry.',
            link: `/properties/${req.body.propertyIDFK}`,
        })
        res.json({ result: "success", msg: "Inquiry update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

var nodemailer = require('nodemailer');
router.post('/getemailbydata', async (req, res) => {
    objUser = await User.findOne({
        userEmail: req.body.userEmail,
        isActive: true
    });
    var transporter = nodemailer.createTransport({
        host: 'mail.metanoiainfotech.com',
        port: 465,
        secure: true,
        auth: {
            user: 'contact@metanoiainfotech.com',
            pass: 'Metanoia@#$%!2018'
        }
    });

    var mailOptions = {
        from: 'contact@metanoiainfotech.com',
        to: req.body.userEmail,
        subject: 'Sending OTP',
        text: Math.floor(1000 + Math.random() * 9000).toString()
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    res.json({
        result: "success",
        msg: "otp  Found",
        data: mailOptions.text
    });
});


router.post('/getPropertyListByUser', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    if (req.auth.role === 'owner' && !assertSelfOrRoles(req, res, req.body.userIDFK, [])) return
    req.body.cityName = MVP_CITY
    const objProperty = await Property.find(buildPropertyFilters(req.body)).
        populate(propertyPopulate());
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });
    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });
    }
});

router.get('/getAllPropertyList', async (req, res) => {
    const objProperty = await Property.find(buildPropertyFilters(req.query)).
        populate(propertyPopulate());
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });
    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });
    }
});

router.post('/reviewProperty', async (req, res) => {
    const allowedStatuses = ["Pending", "Approved", "Rejected"]
    if (!allowedStatuses.includes(req.body.approvalStatus)) {
        return res.json({ result: "failure", msg: "Invalid approval status", data: 0 })
    }

    const updated = await Property.updateOne(
        { _id: req.body.id },
        { approvalStatus: req.body.approvalStatus }
    )

    if (updated.modifiedCount > 0) {
        const objProperty = await Property.findOne({ _id: req.body.id, isActive: true }).
            populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName'])
        res.json({ result: "success", msg: "Property review updated", data: objProperty })
    } else {
        res.json({ result: "failure", msg: "Property review not updated", data: 0 })
    }
})

router.post('/moveIns', upload.fields([{ name: 'paymentScreenshot', maxCount: 1 }, { name: 'roomImage', maxCount: 1 }]), async (req, res) => {
    const userId = asObjectId(req.body.userId || req.body.userIDFK)
    const propertyId = asObjectId(req.body.propertyId || req.body.propertyIDFK)
    if (!userId || !propertyId || !req.body.ownerName || !req.body.joiningDate) {
        return res.json({ result: 'failure', msg: 'User, property, owner name, and joining date are required.', data: null })
    }
    const property = await Property.findOne({ _id: propertyId }).select('userIDFK vendorId propertyName')
    if (!property) return res.json({ result: 'failure', msg: 'Property not found.', data: null })

    const duplicate = await MoveInConfirmation.findOne({ userId, propertyId, isActive: true, status: { $in: ['Pending', 'Verified'] } })
    const leadEvent = await createLeadEvent({
        userId,
        propertyId,
        vendorId: property.vendorId || property.userIDFK,
        sourceType: 'move_in',
        status: 'Moved In',
        note: 'User submitted move-in confirmation',
    })
    const moveIn = await MoveInConfirmation.create({
        userId,
        vendorId: property.vendorId || property.userIDFK,
        propertyId,
        leadEventId: leadEvent?._id,
        ownerName: req.body.ownerName,
        joiningDate: req.body.joiningDate,
        paymentScreenshot: req.files?.paymentScreenshot?.[0]?.filename || req.body.paymentScreenshot || '',
        roomImage: req.files?.roomImage?.[0]?.filename || req.body.roomImage || '',
        userNote: req.body.userNote || '',
        duplicateRisk: Boolean(duplicate),
        commissionAmount: Math.min(3000, Math.max(1500, Number(req.body.commissionAmount) || 2000)),
        cashbackAmount: Math.min(300, Math.max(200, Number(req.body.cashbackAmount) || 250)),
        rewardCoins: Math.min(300, Math.max(200, Number(req.body.cashbackAmount) || 250)),
        status: duplicate ? 'Suspicious' : 'Pending',
    })
    await notifyAdmins({
        actorId: userId,
        propertyId,
        type: 'move_in',
        title: duplicate ? 'Suspicious move-in submitted' : 'Move-in verification needed',
        message: `A user submitted move-in proof for ${property.propertyName || 'a StayJi property'}.`,
        link: '/dashboard/admin',
    })
    await createNotification({
        recipientId: property.vendorId || property.userIDFK,
        recipientRole: 'vendor',
        actorId: userId,
        propertyId,
        type: 'move_in',
        title: 'Move-in proof submitted',
        message: 'A user submitted move-in proof. Admin verification is pending.',
        link: '/dashboard/vendor',
    })
    res.json({ result: 'success', msg: 'Move-in submitted for admin verification.', data: moveIn })
})

router.get('/moveIns', async (req, res) => {
    const filters = { isActive: true }
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) filters.userId = new mongoose.Types.ObjectId(req.query.userId)
    if (req.query.vendorId && mongoose.Types.ObjectId.isValid(req.query.vendorId)) filters.vendorId = new mongoose.Types.ObjectId(req.query.vendorId)
    if (req.query.status) filters.status = req.query.status
    const cityScope = adminCityScope(req)
    if (cityScope.cityName) {
        filters.propertyId = { $in: await Property.find(cityScope).distinct('_id') }
    }
    const items = await MoveInConfirmation.find(filters)
        .populate('userId', ['userFname', 'userLname', 'userEmail', 'contact'])
        .populate('vendorId', ['userFname', 'userLname', 'userEmail', 'contact'])
        .populate('propertyId', ['propertyName', 'areaName', 'cityName', 'rent'])
        .sort({ addedOn: -1 })
        .limit(Math.min(100, Number(req.query.limit || 30)))
    res.json({ result: 'success', msg: 'Move-ins found', data: items })
})

router.post('/moveIns/:id/owner-confirm', async (req, res) => {
    const ownerId = asObjectId(req.body.ownerId || req.body.vendorId)
    if (!ownerId) return res.json({ result: 'failure', msg: 'Owner ID is required.', data: null })
    const moveIn = await MoveInConfirmation.findOneAndUpdate(
        { _id: req.params.id, vendorId: ownerId, isActive: true },
        { $set: { ownerConfirmed: true, ownerConfirmedOn: new Date(), ownerConfirmationNote: req.body.note || 'Tenant joined successfully.' } },
        { new: true }
    )
    if (!moveIn) return res.json({ result: 'failure', msg: 'Move-in request not found for this owner.', data: null })
    await notifyAdmins({
        actorId: ownerId,
        propertyId: moveIn.propertyId,
        type: 'move_in',
        title: 'Owner confirmed tenant',
        message: 'Owner confirmed the tenant joined successfully. Reward approval can now be completed.',
        link: '/dashboard/admin',
    })
    res.json({ result: 'success', msg: 'Tenant joined confirmation saved.', data: moveIn })
})

router.post('/moveIns/:id/review', async (req, res) => {
    const adminId = asObjectId(req.body.adminId)
    const admin = adminId ? await User.findOne({ _id: adminId, userType: { $in: accountTypeVariants('Admin') }, isActive: true }).select('_id userType') : null
    if (!admin) return res.json({ result: 'failure', msg: 'Only StayJi admin can verify move-ins.', data: null })
    const status = ['Verified', 'Rejected', 'Suspicious'].includes(req.body.status) ? req.body.status : 'Pending'
    const existingMoveIn = await MoveInConfirmation.findOne({ _id: req.params.id, isActive: true })
    if (!existingMoveIn) return res.json({ result: 'failure', msg: 'Move-in not found.', data: null })
    if (status === 'Verified' && !existingMoveIn.ownerConfirmed) {
        return res.json({ result: 'failure', msg: 'Owner confirmation is required before approving rewards.', data: null })
    }
    const moveIn = await MoveInConfirmation.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { $set: { status, adminNote: req.body.adminNote || '', rewardCoins: existingMoveIn.rewardCoins || existingMoveIn.cashbackAmount || 0, verifiedOn: status === 'Verified' ? new Date() : undefined } },
        { new: true }
    )
    if (status === 'Verified') {
        await LeadEvent.create({
            userId: moveIn.userId,
            vendorId: moveIn.vendorId,
            propertyId: moveIn.propertyId,
            sourceType: 'move_in',
            status: 'Converted',
            note: `Commission ₹${moveIn.commissionAmount}, cashback ₹${moveIn.cashbackAmount}`,
            metadata: { moveInId: moveIn._id, commissionAmount: moveIn.commissionAmount, cashbackAmount: moveIn.cashbackAmount },
        })
    }
    await Promise.all([
        createNotification({
            recipientId: moveIn.userId,
            recipientRole: 'user',
            propertyId: moveIn.propertyId,
            type: 'move_in',
            title: `Move-in ${status.toLowerCase()}`,
            message: status === 'Verified' ? 'Your cashback is now eligible for processing.' : 'StayJi admin reviewed your move-in submission.',
            link: '/dashboard/user',
        }),
        createNotification({
            recipientId: moveIn.vendorId,
            recipientRole: 'vendor',
            propertyId: moveIn.propertyId,
            type: 'move_in',
            title: `Move-in ${status.toLowerCase()}`,
            message: status === 'Verified' ? 'Commission is due for a verified move-in.' : 'StayJi admin reviewed a move-in submission.',
            link: '/dashboard/vendor',
        }),
    ])
    res.json({ result: 'success', msg: 'Move-in reviewed.', data: moveIn })
})

router.get('/payment-requests', async (req, res) => {
    req.url = '/moveIns'
    return router.handle(req, res)
})

router.post('/payment-requests/:id/review', async (req, res) => {
    req.url = `/moveIns/${req.params.id}/review`
    return router.handle(req, res)
})

router.post('/reactivateProperty', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    const propertyQuery = { _id: req.body.id }
    if (req.auth?.role === 'admin') {
        Object.assign(propertyQuery, adminCityScope(req))
    } else {
        propertyQuery.$or = [{ userIDFK: req.auth.user._id }, { vendorId: req.auth.user._id }]
    }
    const objUpdateProperty = await Property.updateOne(propertyQuery, { isActive: true, approvalStatus: "Pending" })
    if (objUpdateProperty.modifiedCount > 0) {
        const objProperty = await Property.findOne({ _id: req.body.id }).populate(propertyPopulate())
        res.json({ result: "success", msg: "Property reactivated and moved to pending review", data: objProperty })
    } else {
        res.json({ result: "failure", msg: "Property could not be reactivated", data: 0 })
    }
})

router.post('/updateProperty', attachAuthenticatedUser, requireRoles(['owner', 'admin']), upload.fields([{ name: 'propertyImage', maxCount: 10 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    if (req.auth.role === 'owner') {
        req.body.userIDFK = req.auth.user._id.toString()
        req.body.vendorId = req.auth.user._id.toString()
        req.body.ownerId = req.auth.user._id.toString()
        delete req.body.adminId
        delete req.body.performerRole
    }
    const updateFields = {}
    if (req.body.propertyName !== undefined) updateFields.propertyName = normalizeText(req.body.propertyName)
    if (req.body.description !== undefined) updateFields.description = normalizeText(req.body.description)
    if (req.body.address !== undefined) updateFields.address = normalizeText(req.body.address)
    if (req.body.rent !== undefined) updateFields.rent = req.body.rent
    if (req.body.sharing !== undefined) updateFields.sharing = req.body.sharing
    if (req.body.genderType !== undefined) updateFields.genderType = req.body.genderType
    if (req.body.areaName !== undefined) updateFields.areaName = normalizeText(req.body.areaName)
    if (req.body.areaName !== undefined || req.body.localitySlug !== undefined) updateFields.localitySlug = req.body.localitySlug || slugify(req.body.areaName)
    if (req.body.cityName !== undefined || req.body.city !== undefined) updateFields.cityName = MVP_CITY
    if (req.body.stateName !== undefined || req.body.state !== undefined) updateFields.stateName = MVP_STATE
    if (req.body.latitude !== undefined) updateFields.latitude = toNumberOrUndefined(req.body.latitude)
    if (req.body.longitude !== undefined) updateFields.longitude = toNumberOrUndefined(req.body.longitude)
    if (req.body.aminityFeatures !== undefined) updateFields.aminityFeatures = req.body.aminityFeatures
    if (req.body.mealsAvailable !== undefined || req.body.foodOptions !== undefined) updateFields.mealsAvailable = parseStringList(req.body.mealsAvailable || req.body.foodOptions)
    if (req.body.menuPhoto !== undefined) updateFields.menuPhoto = req.body.menuPhoto
    if (req.body.menuPhotoUrls !== undefined) {
        const menuPhotoUrls = parseStringList(req.body.menuPhotoUrls)
        updateFields.menuPhotoUrls = menuPhotoUrls
        if (!updateFields.menuPhoto && menuPhotoUrls.length) updateFields.menuPhoto = menuPhotoUrls[0]
    }
    const uploadedImages = (req.files?.propertyImage || []).map((file) => file.filename)
    const uploadedVideo = req.files?.video?.[0]?.filename || ''
    if (req.body.propertyImage !== undefined) updateFields.propertyImage = req.body.propertyImage
    if (req.body.propertyImageUrls !== undefined) {
        const imageUrls = [...uploadedImages, ...parseStringList(req.body.propertyImageUrls)]
        updateFields.propertyImageUrls = imageUrls
        if (!updateFields.propertyImage && imageUrls.length) updateFields.propertyImage = imageUrls[0]
    } else if (uploadedImages.length) {
        updateFields.propertyImageUrls = uploadedImages
        updateFields.propertyImage = uploadedImages[0]
    }
    if (req.body.videoUrl !== undefined || uploadedVideo) updateFields.videoUrl = uploadedVideo || req.body.videoUrl
    if (req.body.depositAmount !== undefined) updateFields.depositAmount = req.body.depositAmount
    if (req.body.availableBeds !== undefined) updateFields.availableBeds = toNumberOrUndefined(req.body.availableBeds) || 0
    if (req.body.roomInventory !== undefined) updateFields.roomInventory = parseRoomInventory(req.body.roomInventory)
    if (req.body.roomTypes !== undefined) updateFields.roomTypes = parseJsonValue(req.body.roomTypes, [])
    if (req.body.customFeatures !== undefined) updateFields.customFeatures = parseStringList(req.body.customFeatures)
    if (req.body.vacancyStatus !== undefined) updateFields.vacancyStatus = req.body.vacancyStatus
    if (req.body.availableFrom !== undefined) updateFields.availableFrom = req.body.availableFrom
    if (req.body.sharingAvailability !== undefined) updateFields.sharingAvailability = req.body.sharingAvailability
    if (req.body.parkingAvailable !== undefined) updateFields.parkingAvailable = toBoolean(req.body.parkingAvailable)
    if (req.body.acAvailable !== undefined) updateFields.acAvailable = toBoolean(req.body.acAvailable)
    if (req.body.rating !== undefined) updateFields.rating = toNumberOrUndefined(req.body.rating) || 4.6
    if (req.body.isFeatured !== undefined) updateFields.isFeatured = toBoolean(req.body.isFeatured)
    if (req.body.boostScore !== undefined) updateFields.boostScore = toNumberOrUndefined(req.body.boostScore) || 0
    if (req.body.localityPriority !== undefined) updateFields.localityPriority = toNumberOrUndefined(req.body.localityPriority) || 0
    if (req.body.propertyCategory !== undefined) updateFields.propertyCategory = req.body.propertyCategory
    if (req.body.propertySegment !== undefined) updateFields.propertyCategory = req.body.propertySegment
    if (req.body.pricingUnit !== undefined) updateFields.pricingUnit = req.body.pricingUnit
    if (req.body.dailyRate !== undefined) updateFields.dailyRate = req.body.dailyRate
    if (req.body.perDayCheckIn !== undefined) updateFields.perDayCheckIn = toBoolean(req.body.perDayCheckIn)
    if (req.body.propertyTypeIDFK !== undefined) updateFields.propertyTypeIDFK = req.body.propertyTypeIDFK
    if (req.body.approvalStatus !== undefined) updateFields.approvalStatus = req.body.approvalStatus
    if (req.body.isDummy !== undefined) updateFields.isDummy = toBoolean(req.body.isDummy)
    if (req.body.isVerified !== undefined) updateFields.isVerified = toBoolean(req.body.isVerified)
    if (req.body.status !== undefined) updateFields.status = req.body.status
    if (req.body.commissionConfig !== undefined) updateFields.commissionConfig = parseJsonValue(req.body.commissionConfig, {})
    if (req.body.referralAgreementAccepted !== undefined || req.body.leadPricingAccepted !== undefined || req.body.ownerTermsAccepted !== undefined) {
        const agreementAccepted = toBoolean(req.body.referralAgreementAccepted) && toBoolean(req.body.leadPricingAccepted) && toBoolean(req.body.ownerTermsAccepted)
        const agreementMetadata = requestConsentMetadata(req, 'property_update')
        updateFields.ownerAgreement = {
            referralAgreementAccepted: toBoolean(req.body.referralAgreementAccepted),
            leadPricingAccepted: toBoolean(req.body.leadPricingAccepted),
            termsAccepted: toBoolean(req.body.ownerTermsAccepted),
            acceptedOn: agreementAccepted ? agreementMetadata.acceptedOn : undefined,
            acceptedBy: req.body.userIDFK || req.body.vendorId,
            acceptedIp: agreementAccepted ? agreementMetadata.ip : undefined,
            acceptedUserAgent: agreementAccepted ? agreementMetadata.userAgent : undefined,
            consentVersion: agreementAccepted ? agreementMetadata.consentVersion : undefined,
            consentSource: agreementMetadata.source,
        }
    }
    if (req.body.isAvailable !== undefined) {
        updateFields.isAvailable = req.body.isAvailable === 'false' ? false : req.body.isAvailable === 'true' ? true : req.body.isAvailable
    }
    if (req.body.verificationChecklist !== undefined) {
        try {
            updateFields.verificationChecklist = typeof req.body.verificationChecklist === 'string' ? JSON.parse(req.body.verificationChecklist) : req.body.verificationChecklist
        } catch (error) {
            updateFields.verificationChecklist = {}
        }
    }

    const isAdminUpdate = req.auth?.role === 'admin'
    const propertyQuery = { _id: req.body.id }
    if (isAdminUpdate) {
        Object.assign(propertyQuery, adminCityScope(req))
    } else {
        propertyQuery.$or = [{ userIDFK: req.auth.user._id }, { vendorId: req.auth.user._id }]
    }
    const existingForGovernance = await Property.findOne(propertyQuery).select('userIDFK vendorId propertyName propertyImage propertyImageUrls address areaName cityName stateName latitude longitude')
    if (!existingForGovernance) return res.json({ result: "failure", msg: "Property not found or access denied.", data: null })

    if (req.auth?.role === 'admin') {
        if (updateFields.cityName && !isBangaloreValue(updateFields.cityName)) {
            return res.status(403).json({ result: "failure", msg: "StayJi MVP only supports Bangalore properties.", data: null })
        }
        if (updateFields.stateName && normalizeText(updateFields.stateName).toLowerCase() !== MVP_STATE.toLowerCase()) {
            return res.status(403).json({ result: "failure", msg: "StayJi MVP only supports Bangalore, Karnataka.", data: null })
        }
    }

    const protectedFields = ['propertyName', 'propertyImage', 'propertyImageUrls', 'address', 'areaName', 'cityName', 'stateName', 'latitude', 'longitude']
    const requesterId = (req.body.ownerId || req.body.vendorId || req.body.userIDFK || '').toString()
    const ownerId = (existingForGovernance?.vendorId || existingForGovernance?.userIDFK || '').toString()
    const isOwnerSelfUpdate = requesterId && ownerId && requesterId === ownerId && !req.body.adminId && !req.body.performerRole
    const protectedChanges = {}
    if (isOwnerSelfUpdate) {
        protectedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(updateFields, field)) {
                protectedChanges[field] = updateFields[field]
                delete updateFields[field]
            }
        })
        if (Object.keys(protectedChanges).length) {
            await PropertyUpdateRequest.create({
                propertyId: existingForGovernance._id,
                ownerId: existingForGovernance.vendorId || existingForGovernance.userIDFK,
                requestedChanges: protectedChanges,
                previousValue: protectedFields.reduce((acc, field) => ({ ...acc, [field]: existingForGovernance[field] }), {}),
            })
            await notifyAdmins({
                actorId: requesterId,
                propertyId: existingForGovernance._id,
                type: 'property_update_request',
                title: 'Property update approval needed',
                message: 'An owner edited protected listing details. Changes are waiting for admin approval.',
                link: `/dashboard/admin/properties/${existingForGovernance._id}`,
            })
        }
    }

    if (!Object.keys(updateFields).length && Object.keys(protectedChanges || {}).length) {
        return res.json({ result: "success", msg: "Protected changes submitted for admin approval.", data: existingForGovernance })
    }

    const updated = await Property.updateOne(propertyQuery, { $set: updateFields })
    if (updated.modifiedCount > 0) {
        const objProperty = await Property.findOne({ _id: req.body.id, isActive: true }).populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName'])
        res.json({ result: "success", msg: "Property Updated", data: objProperty })
    } else {
        const existingProperty = await Property.findOne({ _id: req.body.id, isActive: true })
        if (existingProperty) {
            res.json({ result: "success", msg: "No changes made", data: existingProperty })
        } else {
            res.json({ result: "failure", msg: "Property Not Updated", data: null })
        }
    }
})

router.post('/deleteProperty', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    const ownerId = req.auth.role === 'owner' ? req.auth.user._id : asObjectId(req.body.ownerId || req.body.vendorId || req.body.userIDFK)
    const propertyQuery = { _id: req.body.id }
    if (req.auth?.role === 'admin') {
        Object.assign(propertyQuery, adminCityScope(req))
    } else {
        propertyQuery.$or = [{ userIDFK: req.auth.user._id }, { vendorId: req.auth.user._id }]
    }
    const property = await Property.findOne(propertyQuery).select('userIDFK vendorId propertyName isActive status approvalStatus')
    if (!property) return res.json({ result: "failure", msg: "Property not found or access denied.", data: 0 })
    const propertyOwnerId = (property.vendorId || property.userIDFK || '').toString()
    const isOwnerDeleteRequest = ownerId && propertyOwnerId && ownerId.toString() === propertyOwnerId && !req.body.adminId && !req.body.performerRole
    if (isOwnerDeleteRequest) {
        const request = await PropertyUpdateRequest.create({
            propertyId: property._id,
            ownerId,
            requestedChanges: { status: 'archived', isActive: false },
            previousValue: { status: property.status, isActive: property.isActive, approvalStatus: property.approvalStatus },
        })
        await notifyAdmins({
            actorId: ownerId,
            propertyId: property._id,
            type: 'property_update_request',
            title: 'Property deletion approval needed',
            message: 'An owner requested property deletion/archive. Admin approval is required.',
            link: `/dashboard/admin/properties/${property._id}`,
        })
        return res.json({ result: "success", msg: "Delete request submitted for admin approval.", data: request })
    }
    const objDeleteProperty = await Property.updateOne(propertyQuery, { isActive: false })
    if (objDeleteProperty.modifiedCount > 0) {
        res.json({ result: "success", msg: "Property deleted successfully", data: 1 })
    } else {
        res.json({ result: "failure", msg: "Property could not be deleted", data: 0 })
    }
})

router.get('/getAdminStats', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const userCityScope = adminUserCityScope(req)
    const propertyCityScope = adminCityScope(req)
    const scopedPropertyIds = await Property.find(propertyCityScope).distinct('_id')
    const leadScope = { isActive: true, propertyIDFK: { $in: scopedPropertyIds } }
    const conversationScope = { isActive: true, propertyId: { $in: scopedPropertyIds } }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)

    const queries = [
        User.countDocuments({ isActive: true, userType: { $nin: accountTypeVariants('Admin') }, ...userCityScope }),
        User.countDocuments({ isActive: true, userType: { $in: accountTypeVariants('Owner') }, ...userCityScope }),
        Property.countDocuments({ isActive: true, ...propertyCityScope }),
        Property.countDocuments({ isActive: false, ...propertyCityScope }),
        Property.countDocuments({ isActive: true, approvalStatus: 'Pending', ...propertyCityScope }),
        Property.countDocuments({ isActive: true, approvalStatus: { $in: ['Approved', 'Verified'] }, ...propertyCityScope }),
        Property.countDocuments({ approvalStatus: 'Rejected', ...propertyCityScope }),
        Conversation.aggregate([
            { $match: conversationScope },
            { $group: { _id: null, conversations: { $sum: 1 }, unreadMessages: { $sum: { $add: ['$unreadByUser', '$unreadByOwner'] } } } },
        ]),
        AuditLog.find({ isActive: true }).sort({ addedOn: -1, createdAt: -1 }).limit(12).lean(),
    ]

    const [users, vendors, activeProperties, inactiveProperties, pendingProperties, approvedProperties, rejectedProperties, messageSummary, latestActivities] = await Promise.all(queries)
    const messages = messageSummary[0]?.conversations || 0
    const unreadMessages = messageSummary[0]?.unreadMessages || 0

    const [
        inquiries,
        visitLeads,
        visitsToday,
        monthlyVisits,
        convertedVisits,
        convertedInquiries,
    ] = await Promise.all([
        Inquiry.countDocuments(leadScope),
        Visit.countDocuments(leadScope),
        Visit.countDocuments({ ...leadScope, $or: [{ addedOn: { $gte: todayStart } }, { visitDate: { $gte: todayStart.toISOString().slice(0, 10) } }] }),
        Visit.countDocuments({ ...leadScope, $or: [{ addedOn: { $gte: monthStart } }, { visitDate: { $gte: monthStart.toISOString().slice(0, 10) } }] }),
        Visit.countDocuments({ ...leadScope, isConverted: true }),
        Inquiry.countDocuments({ ...leadScope, isConverted: true }),
    ])

    res.json({
        result: "success",
        msg: "Admin stats found",
        data: { users, owners: vendors, vendors, properties: activeProperties, totalProperties: activeProperties + inactiveProperties, inactiveProperties, pendingProperties, approvedProperties, rejectedProperties, visitsToday, todayVisits: visitsToday, monthlyVisits, messages, unreadMessages, latestActivities, inquiries, leads: inquiries + visitLeads, conversions: convertedVisits + convertedInquiries },
    })
})

router.get('/getAdminVendorLeadSummary', async (req, res) => {
    const [visitSummary, inquirySummary] = await Promise.all([
        Visit.aggregate([
            { $match: { isActive: true } },
            { $lookup: { from: 'propertymasters', localField: 'propertyIDFK', foreignField: '_id', as: 'property' } },
            { $unwind: '$property' },
            { $group: { _id: '$property.userIDFK', visitCount: { $sum: 1 } } },
            { $lookup: { from: 'usermasters', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { _id: 0, vendorId: '$_id', visitCount: 1, vendor: { _id: '$vendor._id', name: '$vendor.userFname', email: '$vendor.userEmail', contact: '$vendor.contact' } } },
        ]),
        Inquiry.aggregate([
            { $match: { isActive: true } },
            { $lookup: { from: 'propertymasters', localField: 'propertyIDFK', foreignField: '_id', as: 'property' } },
            { $unwind: '$property' },
            { $group: { _id: '$property.userIDFK', inquiryCount: { $sum: 1 } } },
            { $lookup: { from: 'usermasters', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { _id: 0, vendorId: '$_id', inquiryCount: 1, vendor: { _id: '$vendor._id', name: '$vendor.userFname', email: '$vendor.userEmail', contact: '$vendor.contact' } } },
        ]),
    ])

    const summaryMap = new Map()
    visitSummary.forEach((item) => {
        summaryMap.set(item.vendorId.toString(), { vendor: item.vendor, visitCount: item.visitCount, inquiryCount: 0 })
    })
    inquirySummary.forEach((item) => {
        const key = item.vendorId.toString()
        const existing = summaryMap.get(key)
        if (existing) {
            existing.inquiryCount = item.inquiryCount
        } else {
            summaryMap.set(key, { vendor: item.vendor, visitCount: 0, inquiryCount: item.inquiryCount })
        }
    })

    const vendorLeads = Array.from(summaryMap.values()).map((item) => ({
        vendor: item.vendor,
        visitCount: item.visitCount,
        inquiryCount: item.inquiryCount,
        totalLeads: item.visitCount + item.inquiryCount,
    }))

    res.json({ result: 'success', msg: 'Vendor lead summary found', data: { totalLeads: vendorLeads.reduce((sum, item) => sum + item.totalLeads, 0), vendors: vendorLeads } })
})

// Admin/Vendor synchronized full-profile endpoints

const selectUserSafe = (u = {}) => ({
    _id: u._id,
    userFname: u.userFname,
    userLname: u.userLname,
    userName: u.userName,
    userEmail: u.userEmail,
    contact: u.contact,
    userType: u.userType,
    profile: u.profile,
})

const toObjectIdIfValid = (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null
    return new mongoose.Types.ObjectId(id)
}

const pageOptions = (source = {}) => {
    const page = Math.max(1, Number(source.page || 1))
    const defaultLimit = Number(process.env.DEFAULT_PAGE_LIMIT || 24)
    const limit = Math.min(100, Math.max(1, Number(source.limit || defaultLimit)))
    return { page, limit, skip: (page - 1) * limit }
}

const vendorName = (user = {}) => [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userName || user.userEmail || ''

const safeUserDto = (user = {}) => ({
    id: user._id,
    _id: user._id,
    objectId: user._id,
    stayjiId: stayjiIdFromObjectId(user._id),
    name: vendorName(user),
    firstName: user.userFname,
    lastName: user.userLname,
    email: user.userEmail,
    phone: user.contact,
    contact: user.contact,
    gender: user.gender,
    dob: user.dob,
    occupation: user.occupation,
    city: user.city,
    bio: user.bio,
    role: user.userType,
    userType: user.userType,
    profile: user.profile,
    isActive: user.isActive !== false,
    accountStatus: user.accountStatus || (user.isActive === false ? 'suspended' : 'active'),
    verificationStatus: user.verificationStatus || (user.isActive === false ? 'Inactive' : 'Verified'),
    approvalStatus: user.approvalStatus || 'Pending',
    permissions: user.permissions?.length ? user.permissions : defaultPermissionsByRole(user.userType),
    assignedCity: user.assignedCity,
    assignedState: user.assignedState,
    preferences: user.preferences || {},
    notificationPreferences: user.preferences?.notifications || {},
    analyticsSummary: user.leadAnalytics || {},
    addedOn: user.addedOn,
    createdAt: user.createdAt || user.addedOn,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin || user.updatedAt || user.addedOn,
    isDummy: user.isDummy || false,
    isVerified: user.isVerified || false,
    status: user.status || 'active',
})

const propertyDto = (property = {}, analytics = {}) => {
    const owner = property.vendorId || property.userIDFK || {}
    const rooms = Number(property.availableBeds) || 0
    const operationalStatus = property.status === 'archived'
        ? 'ARCHIVED'
        : property.status === 'suspended' || property.approvalStatus === 'Suspended'
            ? 'SUSPENDED'
            : property.isActive === false
                ? 'HIDDEN'
                : property.isDummy
                    ? 'DEMO'
                    : ['Approved', 'Verified'].includes(property.approvalStatus)
                        ? 'LIVE'
                        : 'PENDING'
    const publicVisibility = property.isActive !== false && property.status !== 'archived' && property.status !== 'suspended' && ['Approved', 'Verified'].includes(property.approvalStatus)
    return {
        ...(property.toObject?.() || property),
        id: property._id,
        vendorId: owner?._id || property.vendorId || property.userIDFK,
        owner: safeUserDto(owner),
        vendor: safeUserDto(owner),
        ownerProfile: safeUserDto(owner),
        assignedAdmin: property.assignedAdmin ? safeUserDto(property.assignedAdmin) : null,
        name: property.propertyName,
        city: property.cityName,
        area: property.areaName,
        category: property.propertyCategory,
        occupancy: rooms > 0 ? Math.max(0, Math.min(100, Math.round(((10 - rooms) / 10) * 100))) : (property.isAvailable === false ? 100 : 0),
        roomInventory: property.roomInventory || [],
        verificationChecklist: property.verificationChecklist || {},
        leadsCount: analytics.leadsCount || 0,
        totalLeads: analytics.leadsCount || 0,
        totalVisits: analytics.visitCount || 0,
        inquiryCount: analytics.inquiryCount || 0,
        wishlistCount: analytics.wishlistCount || 0,
        reviewsCount: analytics.reviewsCount || 0,
        complaintsCount: analytics.complaintsCount || 0,
        isActive: property.isActive !== false,
        isDummy: property.isDummy || false,
        isVerified: property.isVerified || false,
        status: property.status || 'active',
        operationalStatus,
        publicVisibility,
        demoLiveStatus: property.isDummy ? 'DEMO' : 'LIVE',
        launchReadiness: Math.round(([
            property.propertyName,
            property.cityName,
            property.areaName,
            property.propertyImage || property.propertyImageUrls?.length,
            property.rent,
            property.isVerified || ['Approved', 'Verified'].includes(property.approvalStatus),
        ].filter(Boolean).length / 6) * 100),
        roomTypes: property.roomTypes || [],
        customFeatures: property.customFeatures || [],
        commissionConfig: property.commissionConfig || {},
        ownerAgreement: property.ownerAgreement || {},
    }
}

const buildAdminPropertyQuery = (query = {}) => {
    const filters = {}
    if (query.status === 'inactive' || query.active === 'false') filters.isActive = false
    else if (query.status === 'active' || query.active === 'true') filters.isActive = true
    if (query.approvalStatus && query.approvalStatus !== 'all') filters.approvalStatus = query.approvalStatus
    if (query.city) filters.cityName = new RegExp(`^${normalizedRegexSource(canonicalLocationName(query.city))}$`, 'i')
    if (query.area || query.locality) filters.areaName = new RegExp(`^${normalizedRegexSource(query.area || query.locality)}$`, 'i')
    if (query.propertyType && query.propertyType !== 'all') filters.propertyCategory = new RegExp(`^${normalizedRegexSource(query.propertyType)}$`, 'i')
    if (query.vendorId && mongoose.Types.ObjectId.isValid(query.vendorId)) {
        const vendorObjId = new mongoose.Types.ObjectId(query.vendorId)
        filters.$or = [{ userIDFK: vendorObjId }, { vendorId: vendorObjId }]
    }
    if (query.owner) {
        filters.__ownerSearch = query.owner
    }
    if (query.dateFrom || query.dateTo) {
        filters.addedOn = {}
        if (query.dateFrom) filters.addedOn.$gte = new Date(query.dateFrom)
        if (query.dateTo) filters.addedOn.$lte = new Date(query.dateTo)
    }
    if (query.rating) filters.rating = { $gte: Number(query.rating) || 0 }
    if (query.occupancy === 'vacant') filters.$or = [...(filters.$or || []), { isAvailable: true }, { availableBeds: { $gt: 0 } }]
    if (query.occupancy === 'full') filters.isAvailable = false
    if (query.analyticsMode === 'real' || query.dummyMode === 'real' || query.demoLive === 'live') filters.isDummy = false
    if (query.analyticsMode === 'demo' || query.dummyMode === 'demo' || query.demoLive === 'demo') filters.isDummy = true
    if (query.verificationStatus === 'verified') filters.isVerified = true
    if (query.verificationStatus === 'unverified') filters.isVerified = false
    if (query.propertyStatus === 'live') Object.assign(filters, { isDummy: false, isActive: true, status: { $nin: ['archived', 'suspended'] }, approvalStatus: { $in: ['Approved', 'Verified'] } })
    if (query.propertyStatus === 'demo') Object.assign(filters, { isDummy: true })
    if (query.propertyStatus === 'hidden') filters.$or = [...(filters.$or || []), { isActive: false }, { status: 'archived' }]
    if (query.propertyStatus === 'pending') filters.approvalStatus = 'Pending'
    if (query.propertyStatus === 'verified') Object.assign(filters, { isVerified: true, approvalStatus: { $in: ['Approved', 'Verified'] } })
    if (query.propertyStatus === 'suspended') filters.$or = [...(filters.$or || []), { status: 'suspended' }, { approvalStatus: 'Suspended' }]
    if (query.propertyStatus === 'archived') filters.status = 'archived'
    if (query.status && ['active', 'archived', 'demo', 'suspended'].includes(query.status)) filters.status = query.status

    const search = (query.q || query.search || '').trim()
    if (search) {
        const normalizedSearch = canonicalLocationName(search)
        const regexes = [...new Set([search, normalizedSearch])].map((value) => normalizedRegex(value))
        const tokenRegexes = search
            .split(/\s+/)
            .map((token) => normalizeText(token))
            .filter((token) => token && !['near', 'nearby', 'in', 'at', 'for'].includes(token.toLowerCase()))
            .map((token) => normalizedRegex(token))
        const propertySearch = [
            ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: new mongoose.Types.ObjectId(search) }] : []),
            ...regexes.flatMap(propertySearchClauses),
            ...(tokenRegexes.length > 1 ? [{
                $and: tokenRegexes.map((regex) => ({ $or: propertySearchClauses(regex) })),
            }] : []),
        ]
        filters.$and = [...(filters.$and || []), { $or: [...(filters.$or || []), ...propertySearch] }]
        delete filters.$or
    }
    return filters
}

const propertyAnalyticsMap = async (propertyIds = []) => {
    const [visits, inquiries, shortlists, reviews, complaints] = await Promise.all([
        Visit.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 }, converted: { $sum: { $cond: ['$isConverted', 1, 0] } } } }]),
        Inquiry.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 }, converted: { $sum: { $cond: ['$isConverted', 1, 0] } } } }]),
        Shortlisted.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 } } }]),
        UserReview.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 }, avgRating: { $avg: { $toDouble: '$rating' } } } }]),
        UserRequest.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 } } }]),
    ])
    const map = new Map()
    const ensure = (id) => {
        const key = id?.toString()
        if (!map.has(key)) map.set(key, { visitCount: 0, inquiryCount: 0, leadsCount: 0, wishlistCount: 0, reviewsCount: 0, complaintsCount: 0, converted: 0 })
        return map.get(key)
    }
    visits.forEach((item) => { const row = ensure(item._id); row.visitCount = item.count; row.converted += item.converted; row.leadsCount += item.count })
    inquiries.forEach((item) => { const row = ensure(item._id); row.inquiryCount = item.count; row.converted += item.converted; row.leadsCount += item.count })
    shortlists.forEach((item) => { ensure(item._id).wishlistCount = item.count })
    reviews.forEach((item) => { const row = ensure(item._id); row.reviewsCount = item.count; row.avgRating = item.avgRating })
    complaints.forEach((item) => { ensure(item._id).complaintsCount = item.count })
    return map
}

router.get('/user/overview', attachAuthenticatedUser, requireRoles(['user', 'admin']), async (req, res) => {
    const userId = asObjectId(req.query.userId || req.query.userIDFK)
    if (!userId) return res.json({ result: 'failure', msg: 'User ID is required.', data: null })
    if (!assertSelfOrRoles(req, res, userId, ['admin'])) return
    const user = await User.findOne({ _id: userId }).select('-userPassword')
    if (!user) return res.json({ result: 'failure', msg: 'User not found.', data: null })

    const [
        shortlist,
        visits,
        inquiries,
        moveIns,
        notifications,
        conversations,
        leadEvents,
        reviews,
        payouts,
    ] = await Promise.all([
        Shortlisted.find({ userIDFK: userId, isActive: true }).populate('propertyIDFK').sort({ addedOn: -1 }).limit(30),
        Visit.find({ userIDFK: userId, isActive: true }).populate('propertyIDFK').sort({ addedOn: -1 }).limit(50),
        Inquiry.find({ userIDFK: userId, isActive: true }).populate('propertyIDFK').sort({ addedOn: -1 }).limit(50),
        MoveInConfirmation.find({ userId, isActive: true }).populate('propertyId').sort({ addedOn: -1 }).limit(30),
        Notification.find({ isActive: true, $or: [{ recipientId: userId }, { recipientRole: 'user' }, { recipientRole: 'all' }] }).sort({ addedOn: -1 }).limit(30),
        Conversation.find({ userId, isActive: true }).populate('ownerId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType']).populate('propertyId', ['propertyName cityName areaName']).sort({ lastMessageAt: -1 }).limit(60),
        LeadEvent.find({ userId, isActive: true }).populate('propertyId').sort({ addedOn: -1 }).limit(60),
        UserReview.find({ userIDFK: userId, isActive: true }).populate('propertyIDFK').sort({ addedOn: -1 }).limit(20),
        WalletPayout.find({ userId, isActive: true }).sort({ addedOn: -1 }).limit(20),
    ])

    const approvedRewards = moveIns.filter((item) => item.status === 'Verified' && item.ownerConfirmed)
    const totalCoins = approvedRewards.reduce((sum, item) => sum + (Number(item.rewardCoins || item.cashbackAmount) || 0), 0)
    const latestShortlist = dedupeLatestByKey(shortlist, (item) => (item.propertyIDFK?._id || item.propertyIDFK || item.propertyId)?.toString())
    const latestInquiries = dedupeLatestByKey(inquiries, (item) => (item.propertyIDFK?._id || item.propertyIDFK || item.propertyId)?.toString())
    res.json({
        result: 'success',
        msg: 'User operational overview found.',
        data: {
            shortlist: latestShortlist.length,
            shortlistItems: latestShortlist.map((item) => ({ id: item._id, property: propertyDto(item.propertyIDFK || {}) })),
            visits: visits.map(normalizeVisitDto),
            inquiries: latestInquiries.map(normalizeInquiryDto),
            moveIns,
            notifications,
            chats: conversations.map(conversationDto),
            unreadMessages: conversations.reduce((sum, item) => sum + (Number(item.unreadByUser) || 0), 0),
            leadEvents,
            reviews,
            payouts,
            savedSearches: user.savedSearches || [],
            viewedProperties: user.viewedProperties || [],
            wallet: {
                totalCoins,
                approvedRewards: approvedRewards.length,
                pendingRewards: moveIns.filter((item) => ['Pending', 'Suspicious'].includes(item.status)).length,
                payoutPending: payouts.filter((item) => item.status === 'Pending').reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
                payoutPaid: payouts.filter((item) => item.status === 'Paid').reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
            },
        },
    })
})

router.post('/user/viewed-properties', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    const userId = asObjectId(req.body.userId || req.body.userIDFK)
    const propertyId = asObjectId(req.body.propertyId || req.body.propertyIDFK)
    if (!userId || !propertyId) return res.json({ result: 'failure', msg: 'User and property are required.', data: null })
    if (!assertSelfOrRoles(req, res, userId, [])) return
    const property = await Property.findOne({ _id: propertyId }).select('propertyName cityName areaName rent')
    const entry = {
        propertyId,
        propertyName: property?.propertyName || req.body.propertyName || '',
        city: property?.cityName || req.body.city || '',
        locality: property?.areaName || req.body.locality || '',
        visitInterest: Boolean(req.body.visitInterest),
        viewedOn: new Date(),
    }
    await User.updateOne({ _id: userId }, { $pull: { viewedProperties: { propertyId } } })
    const user = await User.findOneAndUpdate({ _id: userId }, { $push: { viewedProperties: { $each: [entry], $position: 0, $slice: 50 } } }, { new: true }).select('viewedProperties')
    res.json({ result: 'success', msg: 'Viewed property stored.', data: user?.viewedProperties || [] })
})

router.post('/user/saved-searches', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    const userId = asObjectId(req.body.userId || req.body.userIDFK)
    if (!userId) return res.json({ result: 'failure', msg: 'User ID is required.', data: null })
    if (!assertSelfOrRoles(req, res, userId, [])) return
    const searchId = req.body.searchId || new mongoose.Types.ObjectId().toString()
    const entry = {
        id: searchId,
        city: req.body.city || req.body.cityName || '',
        locality: req.body.locality || req.body.areaName || '',
        budget: req.body.budget || req.body.rent || '',
        sharingType: req.body.sharingType || req.body.sharing || '',
        nearbyPreferences: parseStringList(req.body.nearbyPreferences),
        filters: req.body.filters || {},
        queryString: req.body.queryString || '',
        pagination: req.body.pagination || req.body.filters?.pagination || {},
        addedOn: new Date(),
    }
    await User.updateOne({ _id: userId }, { $pull: { savedSearches: { id: searchId } } })
    const user = await User.findOneAndUpdate({ _id: userId }, { $push: { savedSearches: { $each: [entry], $position: 0, $slice: 25 } } }, { new: true }).select('savedSearches')
    res.json({ result: 'success', msg: 'Saved search stored.', data: user?.savedSearches || [] })
})

router.delete('/user/saved-searches/:id', attachAuthenticatedUser, requireRoles(['user']), async (req, res) => {
    const userId = asObjectId(req.body.userId || req.query.userId || req.query.userIDFK)
    if (!userId) return res.json({ result: 'failure', msg: 'User ID is required.', data: null })
    if (!assertSelfOrRoles(req, res, userId, [])) return
    const user = await User.findOneAndUpdate({ _id: userId }, { $pull: { savedSearches: { id: req.params.id } } }, { new: true }).select('savedSearches')
    res.json({ result: 'success', msg: 'Saved search deleted.', data: user?.savedSearches || [] })
})

router.get('/chats', attachAuthenticatedUser, async (req, res) => {
    if (!assertMessagingAccess(req, res)) return
    const viewerId = req.auth.user._id
    const viewerRole = req.auth.role
    const conversationId = asObjectId(req.query.conversationId)
    const filters = { isActive: true, conversationType: 'user_owner' }
    if (viewerRole === 'user') filters.userId = viewerId
    if (viewerRole === 'owner') filters.ownerId = viewerId

    const conversations = await Conversation.find(filters)
        .populate('userId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType'])
        .populate('ownerId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType'])
        .populate('propertyId', ['propertyName cityName areaName'])
        .sort({ lastMessageAt: -1, updatedOn: -1 })
        .limit(Math.min(100, Math.max(1, Number(req.query.limit || 50))))

    let messages = []
    let activeConversation = null
    if (conversationId) {
        activeConversation = await Conversation.findOne({ _id: conversationId, ...filters })
            .populate('userId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType'])
            .populate('ownerId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType'])
            .populate('propertyId', ['propertyName cityName areaName'])
        if (!activeConversation) return res.status(404).json({ result: 'failure', msg: 'Conversation not found.', data: null })
        messages = await Message.find({ conversationId, isActive: true }).sort({ addedOn: 1 }).limit(Math.min(200, Math.max(1, Number(req.query.messageLimit || 100))))
        if (viewerRole === 'user') {
            await Promise.all([
                Conversation.updateOne({ _id: conversationId }, { $set: { unreadByUser: 0, updatedOn: new Date() } }),
                Message.updateMany({ conversationId, toUserIDFK: viewerId, readAt: { $exists: false } }, { $set: { readAt: new Date() } }),
            ])
            activeConversation.unreadByUser = 0
        }
        if (viewerRole === 'owner') {
            await Promise.all([
                Conversation.updateOne({ _id: conversationId }, { $set: { unreadByOwner: 0, updatedOn: new Date() } }),
                Message.updateMany({ conversationId, toUserIDFK: viewerId, readAt: { $exists: false } }, { $set: { readAt: new Date() } }),
            ])
            activeConversation.unreadByOwner = 0
        }
    }

    const unreadTotal = conversations.reduce((sum, item) => sum + (Number(viewerRole === 'user' ? item.unreadByUser : item.unreadByOwner) || 0), 0)
    res.json({
        result: 'success',
        msg: 'Conversations found.',
        data: {
            conversations: conversations.map(conversationDto),
            conversation: activeConversation ? conversationDto(activeConversation) : null,
            messages: messages.map(messageDto),
            unreadTotal,
        },
    })
})

router.post('/chats', attachAuthenticatedUser, async (req, res) => {
    if (!assertMessagingAccess(req, res)) return
    const viewerId = req.auth.user._id
    const viewerRole = req.auth.role
    const cleanMessage = cleanMessageText(req.body.text || req.body.message || '')
    if (!cleanMessage) return res.json({ result: 'failure', msg: 'Message is required.', data: null })
    if (cleanMessage.length > MESSAGE_MAX_LENGTH) return res.json({ result: 'failure', msg: `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`, data: null })

    let conversation = null
    let propertyId = asObjectId(req.body.propertyId || req.body.propertyIDFK)
    let recipientId = null
    let senderRole = viewerRole

    if (viewerRole === 'user') {
        if (!propertyId) return res.json({ result: 'failure', msg: 'Property is required to message an owner.', data: null })
        const property = await Property.findOne({ _id: propertyId, isActive: true }).select('userIDFK vendorId propertyName cityName')
        if (!property) return res.json({ result: 'failure', msg: 'Property not found.', data: null })
        recipientId = asObjectId(property.vendorId || property.userIDFK)
        if (!recipientId || recipientId.toString() === viewerId.toString()) return res.json({ result: 'failure', msg: 'Property owner could not be determined.', data: null })
        const owner = await User.findOne({ _id: recipientId, userType: { $in: accountTypeVariants('Owner') }, isActive: true }).select('_id')
        if (!owner) return res.json({ result: 'failure', msg: 'Owner account is not available for messaging.', data: null })
        conversation = await Conversation.findOneAndUpdate(
            { userId: viewerId, ownerId: recipientId, propertyId, conversationType: 'user_owner', isActive: true },
            {
                $setOnInsert: { userId: viewerId, ownerId: recipientId, propertyId, participants: [viewerId, recipientId], conversationType: 'user_owner', status: 'active', isActive: true, addedOn: new Date() },
                $set: { lastMessagePreview: encryptMessage(cleanMessage.slice(0, 140)), lastMessageAt: new Date(), updatedOn: new Date() },
                $inc: { unreadByOwner: 1 },
            },
            { new: true, upsert: true }
        )
    } else if (viewerRole === 'owner') {
        const conversationId = asObjectId(req.body.conversationId)
        if (!conversationId) return res.json({ result: 'failure', msg: 'Conversation is required to reply.', data: null })
        conversation = await Conversation.findOne({ _id: conversationId, ownerId: viewerId, conversationType: 'user_owner', isActive: true })
        if (!conversation) return res.status(403).json({ result: 'failure', msg: 'You can only reply to your own conversations.', data: null })
        recipientId = conversation.userId
        propertyId = conversation.propertyId
        await Conversation.updateOne(
            { _id: conversation._id },
            { $set: { lastMessagePreview: encryptMessage(cleanMessage.slice(0, 140)), lastMessageAt: new Date(), updatedOn: new Date() }, $inc: { unreadByUser: 1 } }
        )
    }

    const message = await Message.create({
        conversationId: conversation._id,
        propertyId,
        fromUserIDFK: viewerId,
        toUserIDFK: recipientId,
        senderRole,
        text: encryptMessage(cleanMessage),
        metadata: { source: 'dashboard_chat' },
    })

    if (viewerRole === 'user') {
        const leadGenerated = phoneInTextPattern.test(cleanMessage) || callbackIntentPattern.test(cleanMessage)
        await Promise.all([
            createLeadEvent({
                userId: viewerId,
                vendorId: recipientId,
                propertyId,
                sourceType: leadGenerated ? 'chat_detection' : 'inquiry',
                status: leadGenerated ? 'Contact Shared' : 'Inquiry Started',
                note: leadGenerated ? 'Lead generated from chat/contact intent.' : 'User-owner message started.',
                metadata: { conversationId: conversation._id, messageId: message._id, detection: leadGenerated ? 'contact_or_callback_intent' : 'message' },
            }),
            createNotification({ recipientId, recipientRole: 'vendor', actorId: viewerId, propertyId, type: 'message', title: 'New user message', message: cleanMessage.slice(0, 120), link: '/dashboard/owner/messages' }),
            notifyAdmins({ actorId: viewerId, propertyId, type: leadGenerated ? 'lead_update' : 'message', title: leadGenerated ? 'Lead generated in chat' : 'User-owner chat activity', message: leadGenerated ? 'A chat shared contact/callback intent.' : 'A user-owner message was sent.', link: propertyId ? `/dashboard/admin/properties/${propertyId}` : '/dashboard/admin' }),
        ])
    } else {
        await createNotification({ recipientId, recipientRole: 'user', actorId: viewerId, propertyId, type: 'message', title: 'Owner replied', message: cleanMessage.slice(0, 120), link: '/dashboard/user/messages' })
    }

    const populatedConversation = await Conversation.findOne({ _id: conversation._id })
        .populate('userId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType'])
        .populate('ownerId', ['userFname', 'userLname', 'userEmail', 'contact', 'userType'])
        .populate('propertyId', ['propertyName cityName areaName'])
    res.json({ result: 'success', msg: 'Message sent.', data: { conversation: conversationDto(populatedConversation), message: messageDto(message) } })
})

router.post('/visits/:id/status', attachAuthenticatedUser, requireRoles(['user', 'owner', 'admin']), async (req, res) => {
    const statusMap = { pending: '0', approve: '1', approved: '1', complete: '2', completed: '2', reject: '3', rejected: '3', cancel: '4', cancelled: '4' }
    const update = {}
    if (req.body.visitDate !== undefined) update.visitDate = req.body.visitDate
    if (req.body.visitTime !== undefined) update.visitTime = req.body.visitTime
    if (req.body.moveInPreference !== undefined) update.moveInPreference = req.body.moveInPreference
    if (req.body.status || req.body.action) update.status = statusMap[(req.body.status || req.body.action).toString().toLowerCase()] || req.body.status
    const existingVisit = await Visit.findOne({ _id: req.params.id, isActive: true }).populate('propertyIDFK')
    if (!existingVisit) return res.json({ result: 'failure', msg: 'Visit not found.', data: null })
    if (req.auth.role === 'user') {
        const visitUserId = (existingVisit.userIDFK || existingVisit.userId || '').toString()
        if (visitUserId !== req.auth.user._id.toString()) {
            return res.status(403).json({ result: 'failure', msg: 'Users can only update their own visits.', data: null })
        }
        const requestedStatus = update.status || existingVisit.status
        if (!['0', '4'].includes(requestedStatus)) {
            return res.status(403).json({ result: 'failure', msg: 'Users can only reschedule pending visits or cancel visits.', data: null })
        }
    }
    if (req.auth.role === 'owner') {
        const ownerId = (existingVisit.vendorId || existingVisit.propertyIDFK?.vendorId || existingVisit.propertyIDFK?.userIDFK || '').toString()
        if (ownerId !== req.auth.user._id.toString()) {
            return res.status(403).json({ result: 'failure', msg: 'Owners can only update visits for their own properties.', data: null })
        }
    }
    if (req.auth.role === 'admin') {
        const propertyId = existingVisit.propertyIDFK?._id || existingVisit.propertyIDFK
        const property = await Property.findOne({ _id: propertyId, ...adminCityScope(req) }).select('_id')
        if (!property) return res.status(403).json({ result: 'failure', msg: 'Visit is outside Bangalore admin scope.', data: null })
    }
    const visit = await Visit.findOneAndUpdate({ _id: req.params.id, isActive: true }, { $set: update }, { new: true }).populate('propertyIDFK userIDFK')
    if (!visit) return res.json({ result: 'failure', msg: 'Visit not found.', data: null })
    await createLeadEvent({
        userId: visit.userIDFK?._id || visit.userIDFK,
        vendorId: visit.vendorId,
        propertyId: visit.propertyIDFK?._id || visit.propertyIDFK,
        sourceType: 'visit',
        status: update.status === '1' ? 'Visit Confirmed' : update.status === '4' ? 'Cancelled' : 'Visit Requested',
        note: `Visit ${visitStatusLabel(update.status || visit.status).toLowerCase()}`,
        metadata: { visitDate: visit.visitDate, visitTime: visit.visitTime },
    })
    await createNotification({ recipientId: visit.userIDFK?._id || visit.userIDFK, recipientRole: 'user', propertyId: visit.propertyIDFK?._id || visit.propertyIDFK, type: 'visit_update', title: 'Visit updated', message: `Your visit is ${visitStatusLabel(visit.status)}.`, link: '/dashboard/user' })
    res.json({ result: 'success', msg: 'Visit updated.', data: normalizeVisitDto(visit) })
})

router.post('/wallet/payouts', upload.single('upiQr'), async (req, res) => {
    const userId = asObjectId(req.body.userId || req.body.userIDFK)
    const moveInId = asObjectId(req.body.moveInId)
    if (!userId || !req.body.upiId && !req.file && !req.body.upiQr) return res.json({ result: 'failure', msg: 'User and UPI payout details are required.', data: null })
    const verifiedMoveIns = await MoveInConfirmation.find({ userId, isActive: true, status: 'Verified', ownerConfirmed: true })
    const earned = verifiedMoveIns.reduce((sum, item) => sum + (Number(item.rewardCoins || item.cashbackAmount) || 0), 0)
    const existingPaid = await WalletPayout.aggregate([{ $match: { userId, isActive: true, status: { $in: ['Pending', 'Approved', 'Paid'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    const available = Math.max(0, earned - (existingPaid[0]?.total || 0))
    if (available <= 0) return res.json({ result: 'failure', msg: 'No verified coins are available for payout yet.', data: null })
    const payout = await WalletPayout.create({
        userId,
        moveInId,
        upiId: req.body.upiId || '',
        upiQr: req.file?.filename || req.body.upiQr || '',
        bankDetails: parseJsonValue(req.body.bankDetails, {}),
        coins: Math.min(available, Number(req.body.coins || available)),
        amount: Math.min(available, Number(req.body.amount || available)),
    })
    await notifyAdmins({ actorId: userId, type: 'cashback_payout', title: 'Cashback payout requested', message: 'A user submitted UPI/bank details for verified StayJi coins.', link: '/dashboard/admin' })
    res.json({ result: 'success', msg: 'Payout request submitted.', data: payout })
})

router.get('/wallet/payouts', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const filters = { isActive: true }
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) filters.userId = new mongoose.Types.ObjectId(req.query.userId)
    if (req.query.status) filters.status = req.query.status
    const userScope = adminUserCityScope(req)
    if (userScope.$or) filters.userId = { $in: await User.find(userScope).distinct('_id') }
    const items = await WalletPayout.find(filters).populate('userId', ['userFname', 'userLname', 'userEmail', 'contact', 'city']).sort({ addedOn: -1 }).limit(Math.min(100, Number(req.query.limit || 50)))
    res.json({ result: 'success', msg: 'Wallet payouts found.', data: items })
})

router.post('/wallet/payouts/:id/review', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const status = ['Pending', 'Approved', 'Paid', 'Rejected'].includes(req.body.status) ? req.body.status : 'Pending'
    const payout = await WalletPayout.findOneAndUpdate({ _id: req.params.id, isActive: true }, { $set: { status, adminNote: req.body.adminNote || '', reviewedBy: req.body.adminId || req.body.reviewedBy, reviewedOn: new Date(), paidOn: status === 'Paid' ? new Date() : undefined } }, { new: true })
    if (!payout) return res.json({ result: 'failure', msg: 'Payout not found.', data: null })
    await createNotification({ recipientId: payout.userId, recipientRole: 'user', type: 'cashback_payout', title: `Payout ${status.toLowerCase()}`, message: status === 'Paid' ? 'Your StayJi cashback payout is marked paid.' : 'StayJi admin updated your cashback payout request.', link: '/dashboard/user' })
    res.json({ result: 'success', msg: 'Payout reviewed.', data: payout })
})

router.post('/properties/:id/occupancy', attachAuthenticatedUser, requireRoles(['owner', 'admin']), async (req, res) => {
    const propertyQuery = { _id: req.params.id }
    if (req.auth?.role === 'admin') {
        Object.assign(propertyQuery, adminCityScope(req))
    } else {
        propertyQuery.$or = [{ userIDFK: req.auth.user._id }, { vendorId: req.auth.user._id }]
    }
    const property = await Property.findOne(propertyQuery)
    if (!property) return res.json({ result: 'failure', msg: 'Property not found.', data: null })
    const update = {}
    if (req.body.availableBeds !== undefined) update.availableBeds = toNumberOrUndefined(req.body.availableBeds) || 0
    if (req.body.vacancyStatus !== undefined) update.vacancyStatus = req.body.vacancyStatus
    if (req.body.availableFrom !== undefined) update.availableFrom = req.body.availableFrom
    if (req.body.sharingAvailability !== undefined) update.sharingAvailability = req.body.sharingAvailability
    if (req.body.roomInventory !== undefined) update.roomInventory = parseRoomInventory(req.body.roomInventory)
    if (req.body.roomTypes !== undefined) update.roomTypes = parseJsonValue(req.body.roomTypes, [])
    if (req.body.isAvailable !== undefined) update.isAvailable = toBoolean(req.body.isAvailable)
    const updated = await Property.findOneAndUpdate(propertyQuery, { $set: update }, { new: true }).populate(propertyPopulate())
    await createNotification({ recipientRole: 'all', propertyId: updated._id, type: 'vacancy_alert', title: 'Vacancy updated', message: `${updated.propertyName || 'A StayJi property'} updated room availability.`, link: `/properties/${updated._id}` })
    res.json({ result: 'success', msg: 'Occupancy updated.', data: propertyDto(updated) })
})

router.post('/properties/:id/update-request', attachAuthenticatedUser, requireRoles(['owner']), async (req, res) => {
    const ownerId = req.auth.user._id
    const property = await Property.findOne({ _id: req.params.id, $or: [{ userIDFK: ownerId }, { vendorId: ownerId }] })
    if (!ownerId || !property) return res.json({ result: 'failure', msg: 'Only the property owner can request protected updates.', data: null })
    const protectedFields = ['propertyName', 'propertyImage', 'propertyImageUrls', 'address', 'areaName', 'cityName', 'stateName', 'latitude', 'longitude']
    const requestedChanges = {}
    protectedFields.forEach((field) => {
        if (req.body[field] !== undefined) requestedChanges[field] = field.endsWith('Urls') ? parseStringList(req.body[field]) : req.body[field]
    })
    if (!Object.keys(requestedChanges).length) return res.json({ result: 'failure', msg: 'No protected update supplied.', data: null })
    const previousValue = protectedFields.reduce((acc, field) => ({ ...acc, [field]: property[field] }), {})
    const request = await PropertyUpdateRequest.create({ propertyId: property._id, ownerId, requestedChanges, previousValue })
    await notifyAdmins({ actorId: ownerId, propertyId: property._id, type: 'property_update_request', title: 'Property update approval needed', message: 'An owner requested changes to protected listing details.', link: `/dashboard/admin/properties/${property._id}` })
    res.json({ result: 'success', msg: 'Update request submitted for admin approval.', data: request })
})

router.get('/property-update-requests', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const filters = { isActive: true }
    if (req.query.status) filters.status = req.query.status
    if (req.query.propertyId && mongoose.Types.ObjectId.isValid(req.query.propertyId)) filters.propertyId = new mongoose.Types.ObjectId(req.query.propertyId)
    const cityScope = adminCityScope(req)
    if (cityScope.cityName) filters.propertyId = { $in: await Property.find(cityScope).distinct('_id') }
    const items = await PropertyUpdateRequest.find(filters).populate('propertyId ownerId adminId', ['propertyName', 'cityName', 'areaName', 'userFname', 'userLname', 'userEmail']).sort({ addedOn: -1 }).limit(Math.min(100, Number(req.query.limit || 50)))
    res.json({ result: 'success', msg: 'Property update requests found.', data: items })
})

router.post('/property-update-requests/:id/review', attachAuthenticatedUser, requireRoles(['admin']), async (req, res) => {
    const status = ['Approved', 'Rejected'].includes(req.body.status) ? req.body.status : 'Rejected'
    const request = await PropertyUpdateRequest.findOne({ _id: req.params.id, isActive: true })
    if (!request) return res.json({ result: 'failure', msg: 'Update request not found.', data: null })
    if (req.auth?.role === 'admin') {
        const property = await Property.findOne({ _id: request.propertyId, ...adminCityScope(req) }).select('_id')
        if (!property) return res.status(403).json({ result: 'failure', msg: 'Admins can only review Bangalore property update requests during the MVP launch.', data: null })
    }
    if (status === 'Approved') await Property.updateOne({ _id: request.propertyId }, { $set: request.requestedChanges })
    const updated = await PropertyUpdateRequest.findOneAndUpdate({ _id: request._id }, { $set: { status, adminId: req.body.adminId, adminNote: req.body.adminNote || '', reviewedOn: new Date() } }, { new: true })
    await recordAudit({ performerId: req.body.adminId, performerRole: req.body.performerRole || 'Admin', action: 'property_update_request_reviewed', entityType: 'property', entityId: request.propertyId, previousValue: request.previousValue, updatedValue: status === 'Approved' ? request.requestedChanges : { rejected: request.requestedChanges } })
    await createNotification({ recipientId: request.ownerId, recipientRole: 'vendor', propertyId: request.propertyId, type: 'property_update_request', title: `Update request ${status.toLowerCase()}`, message: status === 'Approved' ? 'Admin approved your protected property update.' : 'Admin rejected your protected property update.', link: `/dashboard/owner/properties/${request.propertyId}` })
    res.json({ result: 'success', msg: 'Property update request reviewed.', data: updated })
})

// POST /client/admin/searchProperty
// Input: { q, limit?: number }
// Output: { result, data: { properties: [ { property, owner, leads:{visits:[], inquiries:[]} } ] } }
router.use(
    ['/admin', '/analytics', '/properties', '/vendors', '/users', '/create-account', '/auditLogs', '/governance', '/dummy-transition', '/city-states', '/leads', '/moveIns', '/payment-requests', '/getAdminUsers', '/getAdminStats'],
    attachAuthenticatedUser,
    requireRoles(['admin'])
)

router.post('/admin/searchProperty', async (req, res) => {
    const q = (req.body?.q || req.body?.search || '').toString().trim()
    const limit = Math.max(1, Number(req.body?.limit || 10))

    if (!q) {
        return res.json({ result: 'failure', msg: 'Search query q is required', data: { properties: [] } })
    }

    try {
        const normalizedSearch = canonicalLocationName(q)
        const regexes = [...new Set([q, normalizedSearch])].map((value) => normalizedRegex(value))
        const isCityOnlySearch = q.split(/\s+/).filter(Boolean).length === 1
        const scopedQuery = { ...publicPropertyQuery, isActive: true, ...adminCityScope(req) }

        const textMatchClause = {
            $or: regexes.flatMap((regex) => [
                { propertyName: regex },
                { description: regex },
                { address: regex },
                { cityName: regex },
                { areaName: regex },
                { propertyCategory: regex },
                { aminityFeatures: regex },
            ]),
        }

        const propertyQuery = {
            ...scopedQuery,
            $and: [textMatchClause],
        }

        if (isCityOnlySearch) {
            propertyQuery.$and.push({
                $or: [
                    { cityName: regexes[0] },
                    { areaName: regexes[0] },
                    { address: regexes[0] },
                ],
            })
        }

        const propertyMatches = await Property.find(propertyQuery)
            .limit(limit)
            .select('_id userIDFK vendorId propertyName description address rent sharing genderType areaName cityName propertyTypeIDFK aminityFeatures propertyImage propertyImageUrls videoUrl propertyCategory approvalStatus isActive isAvailable roomInventory verificationChecklist')

        const properties = propertyMatches || []
        const propertyIds = properties.map((p) => p._id)

        const ownerIds = properties
            .flatMap((p) => [p.vendorId, p.userIDFK])
            .filter(Boolean)
            .map((id) => id.toString())
        const owners = await User.find({ _id: { $in: [...new Set(ownerIds)] } }).select('_id userFname userLname userName userEmail userType contact profile')
        const ownerMap = new Map(owners.map((o) => [o._id.toString(), o]))

        const visits = await Visit.find({
            isActive: true,
            propertyIDFK: { $in: propertyIds },
        }).select('_id visitDate visitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK addedOn')

        const inquiries = await Inquiry.find({
            isActive: true,
            propertyIDFK: { $in: propertyIds },
        }).select('_id subject description preferredVisitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK reply addedOn')

        const leadUserIds = Array.from(new Set([...visits.map((v) => v.userIDFK), ...inquiries.map((i) => i.userIDFK)].filter(Boolean)))
        const leadUsers = leadUserIds.length
            ? await User.find({ _id: { $in: leadUserIds } }).select('_id userFname userLname userName userEmail userType contact profile')
            : []
        const leadUserMap = new Map(leadUsers.map((u) => [u._id.toString(), u]))

        const visitsByProperty = new Map()
        visits.forEach((v) => {
            const key = v.propertyIDFK.toString()
            if (!visitsByProperty.has(key)) visitsByProperty.set(key, [])
            visitsByProperty.get(key).push({
                _id: v._id,
                visitDate: v.visitDate,
                visitTime: v.visitTime,
                moveInPreference: v.moveInPreference,
                leadStage: v.leadStage,
                isConverted: v.isConverted,
                status: v.status,
                addedOn: v.addedOn,
                user: selectUserSafe(leadUserMap.get(v.userIDFK.toString())) ,
            })
        })

        const inquiriesByProperty = new Map()
        inquiries.forEach((i) => {
            const key = i.propertyIDFK.toString()
            if (!inquiriesByProperty.has(key)) inquiriesByProperty.set(key, [])
            inquiriesByProperty.get(key).push({
                _id: i._id,
                subject: i.subject,
                description: i.description,
                preferredVisitTime: i.preferredVisitTime,
                moveInPreference: i.moveInPreference,
                leadStage: i.leadStage,
                isConverted: i.isConverted,
                status: i.status,
                reply: i.reply,
                addedOn: i.addedOn,
                user: selectUserSafe(leadUserMap.get(i.userIDFK.toString())),
            })
        })

        const data = {
            properties: properties.map((p) => {
                const owner = ownerMap.get((p.vendorId || p.userIDFK)?.toString())
                return {
                    property: p,
                    owner: selectUserSafe(owner),
                    leads: {
                        visits: visitsByProperty.get(p._id.toString()) || [],
                        inquiries: inquiriesByProperty.get(p._id.toString()) || [],
                    },
                }
            }),
        }

        return res.json({ result: 'success', msg: 'Properties found', data })
    } catch (e) {
        return res.json({ result: 'failure', msg: e?.message || 'Search failed', data: { properties: [] } })
    }
})

// POST /client/admin/getVendorFullProfile
// Input: { vendorId }
const getVendorFullProfile = async (req, res) => {
    const vendorId = req.body?.vendorId || req.body?.id
    const vendorObjId = toObjectIdIfValid(vendorId)
    if (!vendorObjId) {
        return res.json({ result: 'failure', msg: 'vendorId is required', data: null })
    }

    try {
        const vendor = await User.findOne({ _id: vendorObjId, userType: { $in: accountTypeVariants('Owner') } }).select('_id userFname userLname userName userEmail userType contact profile verificationStatus approvalStatus accountStatus isActive isVerified permissions assignedCity assignedState addedOn')
        if (!vendor) {
            return res.json({ result: 'failure', msg: 'Vendor not found', data: null })
        }

        const propertyScope = req.auth?.role === 'admin' ? adminCityScope(req) : {}
        const properties = await Property.find({ $and: [{ $or: [{ userIDFK: vendorObjId }, { vendorId: vendorObjId }] }, propertyScope] }).select('_id userIDFK vendorId propertyName description address rent sharing genderType areaName cityName propertyTypeIDFK propertyImage propertyImageUrls videoUrl propertyCategory approvalStatus isAvailable isActive roomInventory verificationChecklist rating vacancyStatus')
        const propertyIds = properties.map((p) => p._id)

        const [visits, inquiries] = await Promise.all([
            Visit.find({ isActive: true, propertyIDFK: { $in: propertyIds } }).select('_id visitDate visitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK addedOn'),
            Inquiry.find({ isActive: true, propertyIDFK: { $in: propertyIds } }).select('_id subject description preferredVisitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK reply addedOn'),
        ])


        // collect users for visits/inquiries
        const leadUserIds = Array.from(new Set([...visits.map((v) => v.userIDFK), ...inquiries.map((i) => i.userIDFK)].filter(Boolean)))
        const leadUsers = leadUserIds.length
            ? await User.find({ _id: { $in: leadUserIds } }).select('_id userFname userLname userName userEmail userType contact profile')
            : []
        const leadUserMap = new Map(leadUsers.map((u) => [u._id.toString(), u]))

        const visitsByProperty = new Map()
        visits.forEach((v) => {
            const key = v.propertyIDFK.toString()
            if (!visitsByProperty.has(key)) visitsByProperty.set(key, [])
            visitsByProperty.get(key).push({
                _id: v._id,
                visitDate: v.visitDate,
                visitTime: v.visitTime,
                moveInPreference: v.moveInPreference,
                leadStage: v.leadStage,
                isConverted: v.isConverted,
                status: v.status,
                addedOn: v.addedOn,
                user: selectUserSafe(leadUserMap.get(v.userIDFK.toString())),
            })
        })

        const inquiriesByProperty = new Map()
        inquiries.forEach((i) => {
            const key = i.propertyIDFK.toString()
            if (!inquiriesByProperty.has(key)) inquiriesByProperty.set(key, [])
            inquiriesByProperty.get(key).push({
                _id: i._id,
                subject: i.subject,
                description: i.description,
                preferredVisitTime: i.preferredVisitTime,
                moveInPreference: i.moveInPreference,
                leadStage: i.leadStage,
                isConverted: i.isConverted,
                status: i.status,
                reply: i.reply,
                addedOn: i.addedOn,
                user: selectUserSafe(leadUserMap.get(i.userIDFK.toString())),
            })
        })

        const propertiesWithLeads = properties.map((p) => ({
            property: p,
            leads: {
                visits: visitsByProperty.get(p._id.toString()) || [],
                inquiries: inquiriesByProperty.get(p._id.toString()) || [],
            },
        }))

        return res.json({ result: 'success', msg: 'Vendor full profile found', data: { vendor: selectUserSafe(vendor), properties: propertiesWithLeads } })
    } catch (e) {
        return res.json({ result: 'failure', msg: e?.message || 'Vendor profile failed', data: null })
    }
}

router.post('/admin/getVendorFullProfile', getVendorFullProfile)

// POST /client/vendor/getVendorFullProfile
router.post('/vendor/getVendorFullProfile', async (req, res) => {
    const vendorId = req.body?.vendorId || req.body?.id
    req.body = { ...req.body, vendorId }
    return getVendorFullProfile(req, res)
})




const getAdminUsersHandler = async (req, res) => {
    const filters = {}
    if (req.query.status === 'inactive') filters.isActive = false
    else if (req.query.status !== 'all') filters.isActive = true
    const requestedRole = req.query.role && req.query.role !== 'all' ? req.query.role : ''
    const protectedRoles = accountTypeVariants('Admin')
    if (requestedRole) filters.userType = { $in: accountTypeVariants(requestedRole) }
    else filters.userType = { $nin: protectedRoles }
    if (req.query.city) filters.$and = [...(filters.$and || []), { $or: [{ assignedCity: new RegExp(req.query.city, 'i') }, { city: new RegExp(req.query.city, 'i') }] }]
    if (req.query.ownerType && req.query.ownerType !== 'all') {
        filters.vendorType = new RegExp(req.query.ownerType, 'i')
        if (!requestedRole) filters.userType = { $in: accountTypeVariants('Owner') }
    }

    const search = (req.query.search || '').trim()
    if (search) {
        const regex = new RegExp(search, 'i')
        const stayjiSearch = stayjiIdSearchExpr(search)
        filters.$or = [
            ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: new mongoose.Types.ObjectId(search) }] : []),
            ...(stayjiSearch ? [stayjiSearch] : []),
            { userFname: regex },
            { userLname: regex },
            { userEmail: regex },
            { contact: regex },
            { occupation: regex },
            { assignedCity: regex },
            { city: regex },
        ]
    }
    const userScope = adminUserCityScope(req)
    if (userScope.$or) {
        filters.$and = [...(filters.$and || []), userScope]
        if (!requestedRole) filters.userType = { $nin: protectedRoles }
    }

    const users = await User.find(filters).select('-userPassword -resetOtp -resetOtpExpiresAt').sort({ addedOn: -1 }).lean()
    const userIds = users.map((user) => user._id)
    const [wishlistCounts, inquiryCounts, visitCounts, propertyCounts] = await Promise.all([
        Shortlisted.aggregate([{ $match: { isActive: true, userIDFK: { $in: userIds } } }, { $group: { _id: '$userIDFK', count: { $sum: 1 } } }]),
        Inquiry.aggregate([{ $match: { isActive: true, userIDFK: { $in: userIds } } }, { $group: { _id: '$userIDFK', count: { $sum: 1 } } }]),
        Visit.aggregate([{ $match: { isActive: true, userIDFK: { $in: userIds } } }, { $group: { _id: '$userIDFK', count: { $sum: 1 }, converted: { $sum: { $cond: ['$isConverted', 1, 0] } } } }]),
        Property.aggregate([
            { $match: { $or: [{ userIDFK: { $in: userIds } }, { vendorId: { $in: userIds } }] } },
            { $group: { _id: { $ifNull: ['$vendorId', '$userIDFK'] }, count: { $sum: 1 } } },
        ]),
    ])
    const countMap = (rows, field = 'count') => new Map(rows.map((row) => [row._id?.toString(), row[field] || 0]))
    const wishlistMap = countMap(wishlistCounts)
    const inquiryMap = countMap(inquiryCounts)
    const visitMap = countMap(visitCounts)
    const convertedMap = countMap(visitCounts, 'converted')
    const propertyMap = countMap(propertyCounts)
    res.json({
        result: "success",
        msg: "Admin users found",
        data: users.map((user) => ({
            ...user,
            objectId: user._id,
            stayjiId: stayjiIdFromObjectId(user._id),
            wishlistCount: wishlistMap.get(user._id.toString()) || user.wishlistHistory?.length || 0,
            leadCount: (inquiryMap.get(user._id.toString()) || 0) + (visitMap.get(user._id.toString()) || 0),
            bookingCount: convertedMap.get(user._id.toString()) || 0,
            propertyCount: propertyMap.get(user._id.toString()) || 0,
            analyticsSummary: {
                wishlists: wishlistMap.get(user._id.toString()) || 0,
                inquiries: inquiryMap.get(user._id.toString()) || 0,
                visits: visitMap.get(user._id.toString()) || 0,
                conversions: convertedMap.get(user._id.toString()) || 0,
                properties: propertyMap.get(user._id.toString()) || 0,
            },
        })),
    })
}

router.get('/getAdminUsers', getAdminUsersHandler)

const updateUserStatusHandler = async (req, res) => {
    const updateFields = {}
    if (req.body.isActive !== undefined) updateFields.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (req.body.verificationStatus !== undefined) updateFields.verificationStatus = req.body.verificationStatus
    if (req.body.approvalStatus !== undefined) updateFields.approvalStatus = req.body.approvalStatus
    if (req.body.accountStatus !== undefined) updateFields.accountStatus = req.body.accountStatus
    if (req.body.isVerified !== undefined) updateFields.isVerified = req.body.isVerified === true || req.body.isVerified === 'true'
    if (req.body.permissions !== undefined) updateFields.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : parseStringList(req.body.permissions)
    if (req.body.assignedCity !== undefined) {
        updateFields.assignedCity = canonicalLocationName(req.body.assignedCity)
        updateFields.city = updateFields.assignedCity
    }
    if (req.body.assignedState !== undefined) {
        updateFields.assignedState = normalizeText(req.body.assignedState)
        updateFields.state = updateFields.assignedState
    }
    if (req.body.forceLogout) updateFields.forceLogoutAt = new Date()
    if (!Object.keys(updateFields).length) return res.json({ result: "failure", msg: "No user status update supplied", data: null })

    const previous = await User.findOne({ _id: req.body.id }).select('-userPassword')
    const access = assertAdminCanManageUser(req, previous)
    if (!access.ok) return res.status(access.status).json({ result: 'failure', msg: access.msg, data: null })
    if (normalizeAccountType(previous?.userType) === 'admin' && (updateFields.assignedCity !== undefined || updateFields.assignedState !== undefined)) {
        await syncAdminCityAssignment(previous._id, updateFields.assignedCity ?? previous.assignedCity, updateFields.assignedState ?? previous.assignedState)
    }
    const user = await User.findOneAndUpdate({ _id: req.body.id }, { $set: updateFields }, { new: true }).select('-userPassword')
    if (user) {
        await recordAudit({ performerId: req.body.adminId || req.body.performerId, performerRole: req.body.performerRole || 'Admin', action: 'account_status_changed', entityType: 'user', entityId: req.body.id, previousValue: previous?.toObject?.() || previous || {}, updatedValue: updateFields, city: user?.assignedCity, state: user?.assignedState })
        await createNotification({
            recipientId: req.body.id,
            recipientRole: normalizeAccountType(user?.userType || 'user'),
            type: updateFields.isActive === false ? 'account_deactivated' : 'account_updated',
            title: updateFields.isActive === false ? 'Account deactivated' : 'Account status updated',
            message: updateFields.isActive === false ? 'Your StayJi account was deactivated by admin. Active sessions will be signed out.' : 'Your StayJi account status was updated.',
            link: '/login',
        })
        res.json({ result: "success", msg: "User updated", data: user })
    } else {
        res.json({ result: "failure", msg: "User not found", data: 0 })
    }
}

router.post('/updateUserStatus', updateUserStatusHandler)

router.post('/users/:id', async (req, res) => {
    const updateFields = {}
    if (req.body.name !== undefined && req.body.userFname === undefined && req.body.userLname === undefined) {
        const parts = req.body.name.toString().trim().split(/\s+/)
        updateFields.userFname = parts.shift() || ''
        updateFields.userLname = parts.join(' ')
        updateFields.userName = req.body.name.toString().trim()
    }
    if (req.body.userFname !== undefined) updateFields.userFname = req.body.userFname
    if (req.body.userLname !== undefined) updateFields.userLname = req.body.userLname
    if (req.body.userEmail !== undefined || req.body.email !== undefined) updateFields.userEmail = (req.body.userEmail || req.body.email || '').trim().toLowerCase()
    if (req.body.contact !== undefined) updateFields.contact = req.body.contact
    if (req.body.phone !== undefined) updateFields.contact = req.body.phone
    if (req.body.gender !== undefined) updateFields.gender = req.body.gender
    if (req.body.dob !== undefined) updateFields.dob = req.body.dob
    if (req.body.occupation !== undefined) updateFields.occupation = req.body.occupation
    if (req.body.city !== undefined) updateFields.city = req.body.city
    if (req.body.state !== undefined) updateFields.state = req.body.state
    if (req.body.bio !== undefined) updateFields.bio = req.body.bio
    if (req.body.userType !== undefined) {
        updateFields.userType = officialRoleName(req.body.userType)
        updateFields.permissions = defaultPermissionsByRole(updateFields.userType)
    }
    if (req.body.permissions !== undefined) updateFields.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : parseStringList(req.body.permissions)
    if (req.body.assignedCity !== undefined) {
        updateFields.assignedCity = canonicalLocationName(req.body.assignedCity)
        updateFields.city = updateFields.assignedCity
    }
    if (req.body.assignedState !== undefined) {
        updateFields.assignedState = normalizeText(req.body.assignedState)
        updateFields.state = updateFields.assignedState
    }
    if (req.body.businessName !== undefined) updateFields.businessName = req.body.businessName
    if (req.body.vendorType !== undefined) updateFields.vendorType = req.body.vendorType
    if (req.body.isDummy !== undefined) updateFields.isDummy = toBoolean(req.body.isDummy)
    if (req.body.status !== undefined) updateFields.status = req.body.status
    if (req.body.isVerified !== undefined) updateFields.isVerified = toBoolean(req.body.isVerified)
    if (req.body.accountStatus !== undefined) {
        updateFields.accountStatus = req.body.accountStatus
        updateFields.isActive = req.body.accountStatus === 'active'
    }
    if (req.body.verificationStatus !== undefined) updateFields.verificationStatus = req.body.verificationStatus
    if (!Object.keys(updateFields).length) return res.json({ result: 'failure', msg: 'No editable user fields supplied.', data: null })

    if (updateFields.userEmail) {
        const existing = await User.findOne({
            _id: { $ne: req.params.id },
            userEmail: new RegExp(`^${updateFields.userEmail}$`, 'i'),
            userType: { $in: accountTypeVariants(req.body.userType || req.body.role || 'User') },
        })
        if (existing) return res.json({ result: 'failure', msg: 'Email already exists for this account type.', data: null })
    }

    const previous = await User.findOne({ _id: req.params.id }).select('-userPassword')
    const access = assertAdminCanManageUser(req, previous)
    if (!access.ok) return res.status(access.status).json({ result: 'failure', msg: access.msg, data: null })
    const previousRole = normalizeAccountType(previous?.userType)
    const nextRole = updateFields.userType ? normalizeAccountType(updateFields.userType) : previousRole
    if (previousRole === 'admin' && nextRole !== 'admin') {
        await CityState.updateMany({ assignedAdmins: previous._id }, { $pull: { assignedAdmins: previous._id }, updatedOn: new Date() })
    }
    if (nextRole === 'admin' && (updateFields.assignedCity !== undefined || updateFields.assignedState !== undefined || previousRole !== 'admin')) {
        await syncAdminCityAssignment(previous._id, updateFields.assignedCity ?? previous.assignedCity, updateFields.assignedState ?? previous.assignedState)
    }
    if (updateFields.userType && previous && previous.userType !== updateFields.userType) {
        updateFields.roleHistory = [...(previous.roleHistory || []), { from: previous.userType, to: updateFields.userType, changedBy: req.body.adminId || req.body.performerId, changedOn: new Date() }]
    }
    const user = await User.findOneAndUpdate({ _id: req.params.id }, { $set: updateFields }, { new: true }).select('-userPassword')
    if (user) {
        await recordAudit({ performerId: req.body.adminId || req.body.performerId, performerRole: req.body.performerRole || 'Admin', action: updateFields.userType ? 'role_changed' : 'account_updated', entityType: 'user', entityId: user._id, previousValue: previous?.toObject?.() || previous || {}, updatedValue: updateFields, city: user.assignedCity, state: user.assignedState })
    }
    res.json({ result: user ? 'success' : 'failure', msg: user ? 'User updated' : 'User not found', data: user })
})

router.post('/requestPasswordReset', async (req, res) => {
    const email = (req.body.userEmail || req.body.email || '').trim()
    const user = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i'), isActive: true })
    if (user) {
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`
        await User.updateOne({ _id: user._id }, { resetOtp: hashPassword(otp), resetOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) })
        console.log(`StayJi password reset OTP for ${email}: ${otp}`)
    }
    res.json({ result: 'success', msg: 'If this email exists, a verification code has been sent.', data: 1 })
})

router.post('/resetPasswordWithOtp', async (req, res) => {
    const email = (req.body.userEmail || req.body.email || '').trim()
    const user = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i'), isActive: true })
    if (!user || !user.resetOtp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date() || !verifyPassword(req.body.otp || '', user.resetOtp)) {
        return res.json({ result: 'failure', msg: 'Invalid or expired verification code.', data: 0 })
    }
    if (!strongPasswordPattern.test(req.body.userPassword || req.body.password || '')) {
        return res.json({ result: 'failure', msg: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.', data: 0 })
    }
    await User.updateOne({ _id: user._id }, { userPassword: hashPassword(req.body.userPassword || req.body.password), resetOtp: '', resetOtpExpiresAt: null, forceLogoutAt: new Date() })
    res.json({ result: 'success', msg: 'Password reset successfully.', data: 1 })
})

router.post('/changePassword', attachAuthenticatedUser, async (req, res) => {
    const user = await User.findOne({ _id: req.auth.user._id, isActive: true }).select('userPassword')
    if (!user || !verifyPassword(req.body.oldPassword || '', user.userPassword)) {
        return res.json({ result: 'failure', msg: 'Old password is incorrect.', data: 0 })
    }
    if (!strongPasswordPattern.test(req.body.newPassword || req.body.userPassword || '')) {
        return res.json({ result: 'failure', msg: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.', data: 0 })
    }
    await User.updateOne({ _id: user._id }, { userPassword: hashPassword(req.body.newPassword || req.body.userPassword), forceLogoutAt: new Date() })
    res.json({ result: 'success', msg: 'Password changed. Please login again.', data: 1 })
})

router.post('/users/:id/reset-password', requireAdminGovernance, async (req, res) => {
    const temporaryPassword = req.body.temporaryPassword || `StayJi${Math.floor(100000 + Math.random() * 900000)}`
    if (!strongPasswordPattern.test(temporaryPassword)) {
        return res.json({ result: 'failure', msg: 'Temporary password must be at least 8 characters and include uppercase, lowercase, and a number.', data: null })
    }
    const user = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { userPassword: hashPassword(temporaryPassword), forceLogoutAt: new Date(), resetOtp: '', resetOtpExpiresAt: null } },
        { new: true }
    ).select('-userPassword -resetOtp -resetOtpExpiresAt')
    if (!user) return res.json({ result: 'failure', msg: 'User not found or cannot be reset through this workflow.', data: null })
    await recordAudit({ performerId: req.auth.user._id, performerRole: 'Admin', action: 'password_reset_by_admin', entityType: 'user', entityId: user._id, city: user.assignedCity || user.city, state: user.assignedState || user.state })
    res.json({ result: 'success', msg: 'Temporary password generated.', data: { user, temporaryPassword } })
})

router.get('/analytics', async (req, res) => {
    try {
        const dataMode = req.query.demoLive === 'demo' ? 'demo' : req.query.demoLive === 'live' ? 'real' : (req.query.mode || req.query.analyticsMode || 'real')
        const dataScope = dataMode === 'combined' ? {} : { isDummy: dataMode === 'demo' }
        const propertyCityScope = adminCityScope(req)
        const userCityScope = adminUserCityScope(req)
        if (req.query.city) propertyCityScope.cityName = new RegExp(req.query.city, 'i')
        const scopedPropertyIds = Object.keys(propertyCityScope || {}).length ? await Property.find(propertyCityScope).distinct('_id') : null
        const activeLeadScope = { isActive: true, ...dataScope }
        if (scopedPropertyIds) activeLeadScope.propertyIDFK = { $in: scopedPropertyIds }
        const activeEventScope = { isActive: true, ...dataScope }
        if (scopedPropertyIds) activeEventScope.propertyId = { $in: scopedPropertyIds }
        const activeConversationScope = { isActive: true }
        if (scopedPropertyIds) activeConversationScope.propertyId = { $in: scopedPropertyIds }
        const activePropertyScope = { isActive: true, approvalStatus: { $in: ['Approved', 'Verified'] }, ...dataScope, ...propertyCityScope }
        if (req.query.approvalStatus) activePropertyScope.approvalStatus = req.query.approvalStatus
        if (req.query.active === 'false') activePropertyScope.isActive = false
        if (req.query.active === 'true') activePropertyScope.isActive = true
        if (req.query.locality) activePropertyScope.areaName = new RegExp(req.query.locality, 'i')
        if (req.query.propertyStatus === 'hidden') activePropertyScope.isActive = false
        if (req.query.propertyStatus === 'pending') activePropertyScope.approvalStatus = 'Pending'
        if (req.query.propertyStatus === 'verified') activePropertyScope.isVerified = true
        if (req.query.propertyStatus === 'suspended') activePropertyScope.status = 'suspended'
        if (req.query.propertyStatus === 'archived') activePropertyScope.status = 'archived'
        if (req.query.dateFrom || req.query.dateTo) {
            activePropertyScope.addedOn = {}
            activeLeadScope.addedOn = {}
            activeEventScope.addedOn = {}
            if (req.query.dateFrom) {
                activePropertyScope.addedOn.$gte = new Date(req.query.dateFrom)
                activeLeadScope.addedOn.$gte = new Date(req.query.dateFrom)
                activeEventScope.addedOn.$gte = new Date(req.query.dateFrom)
            }
            if (req.query.dateTo) {
                activePropertyScope.addedOn.$lte = new Date(req.query.dateTo)
                activeLeadScope.addedOn.$lte = new Date(req.query.dateTo)
                activeEventScope.addedOn.$lte = new Date(req.query.dateTo)
            }
        }
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
        const visitDateOrAddedOnScope = (startDate) => ({
            ...activeLeadScope,
            $or: [
                { addedOn: { $gte: startDate } },
                { visitDate: { $gte: startDate } },
            ],
        })
        const auditScope = {}
        const assignedCity = adminAssignedCity(req)
        if (assignedCity) auditScope.city = new RegExp(`^${escapeRegex(assignedCity)}$`, 'i')
        const [
            users,
            activeUsers,
            vendors,
            activeListings,
            demoProperties,
            realProperties,
            inactiveListings,
            pendingProperties,
            approvedProperties,
            rejectedProperties,
            todayVisits,
            monthlyVisits,
            visitLeads,
            inquiryLeads,
            convertedVisits,
            convertedInquiries,
            leadEvents,
            verifiedMoveIns,
            pendingMoveIns,
            messageSummary,
            revenue,
            cityHeatmap,
            topProperties,
            trendRows,
            latestActivities,
        ] = await Promise.all([
            User.countDocuments({ userType: { $nin: accountTypeVariants('Admin') }, ...dataScope, ...userCityScope }),
            User.countDocuments({ isActive: true, userType: { $nin: accountTypeVariants('Admin') }, ...dataScope, ...userCityScope }),
            User.countDocuments({ isActive: true, userType: { $in: accountTypeVariants('Owner') }, ...dataScope, ...userCityScope }),
            Property.countDocuments(activePropertyScope),
            Property.countDocuments({ isDummy: true, ...propertyCityScope }),
            Property.countDocuments({ isDummy: false, ...propertyCityScope }),
            Property.countDocuments({ isActive: false, ...dataScope, ...propertyCityScope }),
            Property.countDocuments({ approvalStatus: 'Pending', ...dataScope, ...propertyCityScope }),
            Property.countDocuments({ approvalStatus: { $in: ['Approved', 'Verified'] }, ...dataScope, ...propertyCityScope }),
            Property.countDocuments({ approvalStatus: 'Rejected', ...dataScope, ...propertyCityScope }),
            Visit.countDocuments(visitDateOrAddedOnScope(todayStart)),
            Visit.countDocuments(visitDateOrAddedOnScope(monthStart)),
            Visit.countDocuments(activeLeadScope),
            Inquiry.countDocuments(activeLeadScope),
            Visit.countDocuments({ ...activeLeadScope, isConverted: true }),
            Inquiry.countDocuments({ ...activeLeadScope, isConverted: true }),
            LeadEvent.countDocuments(activeEventScope),
            MoveInConfirmation.countDocuments({ ...activeEventScope, status: 'Verified' }),
            MoveInConfirmation.countDocuments({ ...activeEventScope, status: { $in: ['Pending', 'Suspicious'] } }),
            Conversation.aggregate([
                { $match: activeConversationScope },
                { $group: { _id: null, conversations: { $sum: 1 }, unreadMessages: { $sum: { $add: ['$unreadByUser', '$unreadByOwner'] } } } },
            ]),
            Payment.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }]),
            Property.aggregate([{ $match: activePropertyScope }, { $group: { _id: '$cityName', listings: { $sum: 1 }, vacancies: { $sum: { $cond: ['$isAvailable', 1, 0] } } } }, { $sort: { listings: -1 } }, { $limit: 12 }]),
            Inquiry.aggregate([
                { $match: activeLeadScope },
                { $group: { _id: '$propertyIDFK', inquiries: { $sum: 1 } } },
                { $sort: { inquiries: -1 } },
                { $limit: 8 },
                { $lookup: { from: 'propertymasters', localField: '_id', foreignField: '_id', as: 'property' } },
                { $unwind: '$property' },
                { $match: { 'property.isActive': true, 'property.approvalStatus': { $in: ['Approved', 'Verified'] } } },
                { $project: { propertyId: '$_id', name: '$property.propertyName', city: '$property.cityName', inquiries: 1 } },
            ]),
            Inquiry.find(activeLeadScope).select('addedOn isConverted').lean(),
            AuditLog.find(auditScope).sort({ addedOn: -1, createdAt: -1 }).limit(12).lean(),
        ])
        const leads = Math.max(visitLeads + inquiryLeads, leadEvents)
        const conversions = convertedVisits + convertedInquiries + verifiedMoveIns
        const liveVacancies = cityHeatmap.reduce((sum, row) => sum + (row.vacancies || 0), 0)
        const occupancyRate = activeListings ? Math.round(((activeListings - liveVacancies) / activeListings) * 100) : 0
        const trendMap = new Map()
        trendRows.forEach((lead) => {
            const date = new Date(lead.addedOn)
            const key = Number.isNaN(date.getTime()) ? 'Unknown' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            if (!trendMap.has(key)) trendMap.set(key, { month: key, leads: 0, conversions: 0 })
            const row = trendMap.get(key)
            row.leads += 1
            if (lead.isConverted) row.conversions += 1
        })
        res.json({
            result: 'success',
            msg: 'Admin analytics found',
            data: {
                summary: {
                    analyticsMode: dataMode,
                    totalUsers: users,
                    activeUsers,
                    vendors,
                    owners: vendors,
                    activeListings,
                    demoProperties,
                    realProperties,
                    inactiveListings,
                    liveVacancies,
                    pendingProperties,
                    pendingVerification: pendingProperties,
                    approvedProperties,
                    rejectedProperties,
                    todayVisits,
                    monthlyVisits,
                    occupancyRate,
                    leads,
                    leadEvents,
                    verifiedMoveIns,
                    pendingMoveIns,
                    messages: messageSummary[0]?.conversations || 0,
                    unreadMessages: messageSummary[0]?.unreadMessages || 0,
                    commissionDue: verifiedMoveIns * 2000,
                    cashbackDue: verifiedMoveIns * 250,
                    conversionRate: leads ? Math.round((conversions / leads) * 100) : 0,
                    conversions,
                    revenue: revenue[0]?.total || 0,
                },
                trends: Array.from(trendMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
                cityHeatmap: cityHeatmap.map((row) => ({ city: row._id || 'Unknown', listings: row.listings, vacancies: row.vacancies })),
                topProperties,
                latestActivities,
            },
        })
    } catch (error) {
        res.json({ result: 'failure', msg: error?.message || 'Analytics failed', data: null })
    }
})

router.get('/properties', async (req, res) => {
    try {
        const { page, limit, skip } = pageOptions(req.query)
        const filters = buildAdminPropertyQuery(req.query)
        const ownerSearch = filters.__ownerSearch
        delete filters.__ownerSearch
        const scopedFilters = applyScope(filters, adminCityScope(req))
        const search = (req.query.q || req.query.search || '').trim()
        const ownerNeedle = ownerSearch || search
        if (ownerNeedle) {
            const regex = new RegExp(escapeRegex(normalizeText(ownerNeedle)), 'i')
            const vendorIds = await User.find({ $or: [{ userFname: regex }, { userLname: regex }, { userEmail: regex }, { contact: regex }] }).distinct('_id')
            const vendorConditions = [{ userIDFK: { $in: vendorIds } }, { vendorId: { $in: vendorIds } }]
            if (search && scopedFilters.$and?.[0]?.$and?.[0]?.$or) scopedFilters.$and[0].$and[0].$or.push(...vendorConditions)
            else if (search && scopedFilters.$and?.[0]?.$or) scopedFilters.$and[0].$or.push(...vendorConditions)
            else scopedFilters.$and = [...(scopedFilters.$and || []), { $or: vendorConditions }]
        }
        const sortMap = {
            newest: { addedOn: -1 },
            oldest: { addedOn: 1 },
            'rent-low': { rent: 1 },
            'rent-high': { rent: -1 },
            rating: { rating: -1 },
        }
        const [total, rows] = await Promise.all([
            Property.countDocuments(scopedFilters),
            Property.find(scopedFilters).populate(propertyPopulate()).sort(sortMap[req.query.sort] || sortMap.newest).skip(skip).limit(limit),
        ])
        const analytics = await propertyAnalyticsMap(rows.map((row) => row._id))
        res.json({
            result: 'success',
            msg: 'Admin properties found',
            data: {
                items: rows.map((row) => propertyDto(row, analytics.get(row._id.toString()) || {})),
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        res.json({ result: 'failure', msg: error?.message || 'Admin properties failed', data: { items: [], total: 0 } })
    }
})

router.get('/properties/:id', async (req, res) => {
    try {
        const property = await Property.findOne({ _id: req.params.id, ...adminCityScope(req) }).populate(propertyPopulate())
        if (!property) return res.json({ result: 'failure', msg: 'Property not found', data: null })
        const propertyIds = [property._id]
        const analytics = await propertyAnalyticsMap(propertyIds)
        const [visits, inquiries, reviews, complaints, shortlists, images] = await Promise.all([
            Visit.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).sort({ addedOn: -1 }),
            Inquiry.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).sort({ addedOn: -1 }),
            UserReview.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail']).sort({ addedOn: -1 }),
            UserRequest.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).sort({ addedOn: -1 }),
            Shortlisted.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail']).sort({ addedOn: -1 }),
            PropertyImage.find({ isActive: true, propertyIDFK: property._id }).sort({ addedOn: -1 }),
        ])
        res.json({
            result: 'success',
            msg: 'Admin property detail found',
            data: {
                property: propertyDto(property, analytics.get(property._id.toString()) || {}),
                leads: { visits, inquiries },
                reviews,
                complaints,
                shortlists,
                images,
            },
        })
    } catch (error) {
        res.json({ result: 'failure', msg: error?.message || 'Property detail failed', data: null })
    }
})

router.post('/properties/:id/status', async (req, res) => {
    const update = {}
    if (req.body.approvalStatus) update.approvalStatus = req.body.approvalStatus
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (req.body.isAvailable !== undefined) update.isAvailable = req.body.isAvailable === true || req.body.isAvailable === 'true'
    if (req.body.isVerified !== undefined) update.isVerified = req.body.isVerified === true || req.body.isVerified === 'true'
    if (req.body.isDummy !== undefined) update.isDummy = req.body.isDummy === true || req.body.isDummy === 'true'
    if (req.body.status) update.status = req.body.status
    if (req.body.cityName || req.body.city) update.cityName = canonicalLocationName(req.body.cityName || req.body.city)
    if (req.body.areaName || req.body.locality) update.areaName = req.body.areaName || req.body.locality
    if (req.body.assignedAdmin && mongoose.Types.ObjectId.isValid(req.body.assignedAdmin)) {
        update.assignedAdmin = new mongoose.Types.ObjectId(req.body.assignedAdmin)
    }
    if (!Object.keys(update).length) return res.json({ result: 'failure', msg: 'No status update supplied', data: null })
    const previous = await Property.findOne({ _id: req.params.id, ...adminCityScope(req) }).select('approvalStatus isActive isAvailable isVerified status propertyName cityName areaName')
    const updated = await Property.findOneAndUpdate({ _id: req.params.id, ...adminCityScope(req) }, { $set: update }, { new: true }).populate(propertyPopulate())
    if (updated) {
        await recordAudit({ performerId: req.body.adminId, performerRole: req.body.performerRole || 'Admin', action: 'property_status_changed', entityType: 'property', entityId: updated._id, previousValue: previous?.toObject?.() || previous || {}, updatedValue: update, city: updated.cityName })
        const owner = updated.vendorId || updated.userIDFK
        await createNotification({
            recipientId: owner?._id || owner,
            recipientRole: 'vendor',
            propertyId: updated._id,
            type: update.approvalStatus ? 'property_review' : 'property_status',
            title: update.approvalStatus ? `Property ${update.approvalStatus}` : 'Property status updated',
            message: update.approvalStatus ? `Admin marked ${updated.propertyName} as ${update.approvalStatus}.` : `Admin updated ${updated.propertyName}.`,
            link: `/dashboard/vendor/properties/${updated._id}`,
        })
    }
    res.json({ result: updated ? 'success' : 'failure', msg: updated ? 'Property updated' : 'Property not found', data: updated ? propertyDto(updated) : null })
})

router.post('/properties/:id/commission', async (req, res) => {
    const previous = await Property.findOne({ _id: req.params.id, ...adminCityScope(req) }).select('commissionConfig propertyName cityName')
    const commissionConfig = {
        referralCommission: Number(req.body.referralCommission || req.body.commissionConfig?.referralCommission || 0),
        perLeadCharge: Number(req.body.perLeadCharge || req.body.commissionConfig?.perLeadCharge || 0),
        conversionCharge: Number(req.body.conversionCharge || req.body.commissionConfig?.conversionCharge || 0),
        cashbackAmount: Number(req.body.cashbackAmount || req.body.commissionConfig?.cashbackAmount || 0),
        promotionalPricing: toBoolean(req.body.promotionalPricing || req.body.commissionConfig?.promotionalPricing),
        notes: req.body.notes || req.body.commissionConfig?.notes || '',
        updatedBy: req.body.adminId || req.body.performerId,
        updatedOn: new Date(),
    }
    const updated = await Property.findOneAndUpdate({ _id: req.params.id, ...adminCityScope(req) }, { $set: { commissionConfig } }, { new: true }).populate(propertyPopulate())
    if (updated) {
        await recordAudit({ performerId: req.body.adminId || req.body.performerId, performerRole: req.body.performerRole || 'Admin', action: 'commission_changed', entityType: 'property', entityId: updated._id, previousValue: previous?.commissionConfig || {}, updatedValue: commissionConfig, city: updated.cityName })
    }
    res.json({ result: updated ? 'success' : 'failure', msg: updated ? 'Commission updated' : 'Property not found', data: updated ? propertyDto(updated) : null })
})

router.post('/properties/bulk', async (req, res) => {
    const ids = (req.body.ids || []).filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
    const update = {}
    if (req.body.action === 'approve') update.approvalStatus = 'Approved'
    if (req.body.action === 'reject') update.approvalStatus = 'Rejected'
    if (req.body.action === 'deactivate') update.isActive = false
    if (req.body.action === 'activate') update.isActive = true
    if (req.body.action === 'mark_live') Object.assign(update, { isDummy: false, status: 'active', isActive: true, approvalStatus: 'Approved', isVerified: true })
    if (req.body.action === 'mark_demo') Object.assign(update, { isDummy: true, status: 'demo', isActive: true })
    if (req.body.action === 'hide_publicly') update.isActive = false
    if (req.body.action === 'unhide_publicly') Object.assign(update, { isActive: true, status: 'active' })
    if (req.body.action === 'archive') Object.assign(update, { status: 'archived', isActive: false })
    if (req.body.action === 'unarchive') Object.assign(update, { status: 'active', isActive: true })
    if (req.body.action === 'verify') Object.assign(update, { isVerified: true, approvalStatus: 'Verified' })
    if (req.body.action === 'suspend') Object.assign(update, { status: 'suspended', approvalStatus: 'Suspended', isActive: false })
    if (req.body.action === 'assign_city' && (req.body.city || req.body.cityName)) update.cityName = canonicalLocationName(req.body.city || req.body.cityName)
    if (req.body.action === 'assign_city' && (req.body.state || req.body.stateName)) update.stateName = normalizeText(req.body.state || req.body.stateName)
    if (req.body.action === 'assign_city' && (req.body.locality || req.body.areaName)) update.areaName = normalizeText(req.body.locality || req.body.areaName)
    if (req.body.action === 'assign_admin' && mongoose.Types.ObjectId.isValid(req.body.adminId || req.body.assignedAdmin)) update.assignedAdmin = new mongoose.Types.ObjectId(req.body.adminId || req.body.assignedAdmin)
    if (req.body.approvalStatus) update.approvalStatus = req.body.approvalStatus
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (req.body.status) update.status = req.body.status
    if (req.body.isDummy !== undefined) update.isDummy = req.body.isDummy === true || req.body.isDummy === 'true'
    if (req.body.isVerified !== undefined) update.isVerified = req.body.isVerified === true || req.body.isVerified === 'true'
    if (!ids.length || !Object.keys(update).length) return res.json({ result: 'failure', msg: 'No properties selected', data: { modifiedCount: 0 } })
    const scopedFilter = { _id: { $in: ids }, ...adminCityScope(req) }
    const previousRows = await Property.find(scopedFilter).select('_id propertyName cityName stateName areaName isDummy status isActive isVerified approvalStatus userIDFK vendorId').lean()
    const result = await Property.updateMany(scopedFilter, { $set: update })
    const rows = await Property.find(scopedFilter).select('_id propertyName cityName stateName userIDFK vendorId')
    await recordAudit({
        performerId: req.body.adminId || req.body.performerId || req.auth?.user?._id,
        performerRole: req.body.performerRole || req.auth?.user?.userType || 'Admin',
        action: `bulk_${req.body.action || 'property_update'}`,
        entityType: 'property',
        previousValue: { count: previousRows.length, sample: previousRows.slice(0, 5) },
        updatedValue: update,
        metadata: { ids: rows.map((row) => row._id), modifiedCount: result.modifiedCount || 0 },
        city: adminAssignedCity(req) || req.body.city || rows[0]?.cityName,
        state: req.body.state || rows[0]?.stateName,
    })
    await Promise.all(rows.map((row) => createNotification({
        recipientId: row.vendorId || row.userIDFK,
        recipientRole: 'vendor',
        propertyId: row._id,
        type: 'property_status',
        title: 'Property status updated',
        message: `Admin updated ${row.propertyName}.`,
        link: `/dashboard/vendor/properties/${row._id}`,
    })))
    res.json({ result: 'success', msg: 'Bulk property update complete', data: { modifiedCount: result.modifiedCount || 0 } })
})

router.get('/vendors', async (req, res) => {
    const { page, limit, skip } = pageOptions(req.query)
    const filters = { userType: { $in: ['Vendor', 'Owner', 'vendor', 'owner'] } }
    const userScope = adminUserCityScope(req)
    if (userScope.$or) filters.$and = [...(filters.$and || []), userScope]
    if (req.query.status === 'inactive') filters.isActive = false
    else if (req.query.status !== 'all') filters.isActive = true
    const search = (req.query.q || req.query.search || '').trim()
    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i')
        filters.$or = [{ userFname: regex }, { userLname: regex }, { userEmail: regex }, { contact: regex }]
    }
    const [total, vendors] = await Promise.all([
        User.countDocuments(filters),
        User.find(filters).select('-userPassword').sort({ addedOn: -1 }).skip(skip).limit(limit),
    ])
    const vendorIds = vendors.map((vendor) => vendor._id)
    const propertyCounts = await Property.aggregate([
        { $match: { $or: [{ userIDFK: { $in: vendorIds } }, { vendorId: { $in: vendorIds } }] } },
        { $group: { _id: { $ifNull: ['$vendorId', '$userIDFK'] }, totalProperties: { $sum: 1 }, activeProperties: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ])
    const countMap = new Map(propertyCounts.map((item) => [item._id?.toString(), item]))
    res.json({ result: 'success', msg: 'Admin vendors found', data: { items: vendors.map((vendor) => ({ ...safeUserDto(vendor), ...(countMap.get(vendor._id.toString()) || { totalProperties: 0, activeProperties: 0 }) })), page, limit, total, pages: Math.ceil(total / limit) } })
})

router.get('/vendors/:id', async (req, res) => {
    req.body = { vendorId: req.params.id }
    return getVendorFullProfile(req, res)
})

router.get('/users', async (req, res) => {
    req.query = { ...req.query }
    return getAdminUsersHandler(req, res)
})

router.post('/users/:id/status', async (req, res) => {
    req.body = { ...req.body, id: req.params.id }
    return updateUserStatusHandler(req, res)
})

router.post('/create-account', async (req, res) => {
    const role = officialRoleName(req.body.userType || req.body.role || 'User')
    const performerRole = req.auth?.role || normalizeAccountType(req.body.performerRole || 'admin')
    const existing = await User.findOne({ userEmail: new RegExp(`^${req.body.userEmail || req.body.email}$`, 'i'), userType: { $in: accountTypeVariants(role) } })
    if (existing) return res.json({ result: 'failure', msg: 'Account already exists.', data: null })
    const tempPassword = req.body.temporaryPassword || req.body.password || `StayJi${Math.floor(100000 + Math.random() * 900000)}`
    if (!strongPasswordPattern.test(tempPassword)) {
        return res.json({ result: 'failure', msg: 'Temporary password must be at least 8 characters and include uppercase, lowercase, and a number.', data: null })
    }
    const scopedCity = canonicalLocationName(req.body.assignedCity || req.body.city || MVP_CITY)
    const scopedState = normalizeText(req.body.assignedState || req.body.state || MVP_STATE)
    if (!assertBangaloreRequest(res, scopedCity, scopedState)) return
    const user = await User.create({
        userName: req.body.name || '',
        userFname: req.body.firstName || req.body.userFname || (req.body.name || '').split(' ')[0] || '',
        userLname: req.body.lastName || req.body.userLname || (req.body.name || '').split(' ').slice(1).join(' '),
        userEmail: req.body.userEmail || req.body.email,
        contact: req.body.contact || req.body.phone || '',
        city: req.body.city || scopedCity || req.body.locality || '',
        state: req.body.state || scopedState || '',
        userPassword: hashPassword(tempPassword),
        userType: role,
        permissions: req.body.permissions ? (Array.isArray(req.body.permissions) ? req.body.permissions : parseStringList(req.body.permissions)) : defaultPermissionsByRole(role),
        assignedCity: scopedCity,
        assignedState: scopedState,
        accountStatus: normalizeAccountType(role) === 'owner' ? 'pending_verification' : 'active',
        approvalStatus: normalizeAccountType(role) === 'owner' ? 'Pending' : 'Approved',
        isVerified: ['user', 'admin'].includes(normalizeAccountType(role)),
        addedOn: new Date(),
        isActive: true,
    })
    if (normalizeAccountType(role) === 'admin' && (user.assignedCity || user.assignedState)) {
        await syncAdminCityAssignment(user._id, user.assignedCity, user.assignedState)
    }
    await recordAudit({ performerId: req.body.performerId || req.body.adminId, performerRole: req.body.performerRole || 'Admin', action: 'admin_created_account', entityType: 'user', entityId: user._id, updatedValue: { userType: role, permissions: user.permissions, assignedCity: user.assignedCity }, city: user.assignedCity, state: user.assignedState })
    const clean = user.toObject()
    delete clean.userPassword
    res.json({ result: 'success', msg: 'Account created with temporary password.', data: { user: clean, temporaryPassword: tempPassword } })
})

router.get('/auditLogs', async (req, res) => {
    const { page, limit, skip } = pageOptions(req.query)
    const filters = { isActive: true }
    if (req.query.action) filters.action = req.query.action
    if (req.query.entityType) filters.entityType = req.query.entityType
    if (req.query.city) filters.city = new RegExp(req.query.city, 'i')
    const [total, items] = await Promise.all([
        AuditLog.countDocuments(filters),
        AuditLog.find(filters).populate('performerId', ['userFname', 'userLname', 'userEmail', 'userType']).sort({ addedOn: -1 }).skip(skip).limit(limit),
    ])
    res.json({ result: 'success', msg: 'Audit logs found', data: { items, page, limit, total, pages: Math.ceil(total / limit) } })
})

router.get('/governance', async (req, res) => {
    if (!isAdminRequest(req)) {
        return res.status(403).json({ result: 'failure', msg: 'Only Admin can access global governance.', data: null })
    }
    const [
        realProperties,
        dummyProperties,
        liveProperties,
        hiddenProperties,
        pendingProperties,
        realUsers,
        dummyUsers,
        admins,
        ownersPending,
        suspiciousMoveIns,
        auditLogs,
        cityRows,
        cityStates,
    ] = await Promise.all([
        Property.countDocuments({ isDummy: false }),
        Property.countDocuments({ isDummy: true }),
        Property.countDocuments({ isDummy: false, isActive: true, status: { $nin: ['archived', 'suspended'] }, approvalStatus: { $in: ['Approved', 'Verified'] } }),
        Property.countDocuments({ $or: [{ isActive: false }, { status: 'archived' }] }),
        Property.countDocuments({ approvalStatus: 'Pending' }),
        User.countDocuments({ isDummy: false, userType: { $nin: accountTypeVariants('Admin') } }),
        User.countDocuments({ isDummy: true }),
        User.countDocuments({ userType: { $in: accountTypeVariants('Admin') } }),
        User.countDocuments({ userType: { $in: accountTypeVariants('Owner') }, approvalStatus: 'Pending' }),
        MoveInConfirmation.countDocuments({ status: 'Suspicious', isActive: true }),
        AuditLog.find({ isActive: true }).sort({ addedOn: -1 }).limit(12).populate('performerId', ['userFname', 'userLname', 'userEmail', 'userType']),
        Property.aggregate([{ $group: { _id: '$cityName', real: { $sum: { $cond: ['$isDummy', 0, 1] } }, demo: { $sum: { $cond: ['$isDummy', 1, 0] } }, active: { $sum: { $cond: ['$isActive', 1, 0] } }, live: { $sum: { $cond: [{ $and: [{ $eq: ['$isDummy', false] }, { $eq: ['$isActive', true] }, { $in: ['$approvalStatus', ['Approved', 'Verified']] }, { $not: [{ $in: ['$status', ['archived', 'suspended']] }] }] }, 1, 0] } }, hidden: { $sum: { $cond: [{ $or: [{ $eq: ['$isActive', false] }, { $eq: ['$status', 'archived'] }] }, 1, 0] } } } }, { $sort: { real: -1 } }]),
        CityState.find({ isActive: true }).populate('assignedAdmins', ['userFname', 'userLname', 'userEmail']).lean(),
    ])
    const cityStateMap = new Map(cityStates.map((city) => [city.cityName?.toLowerCase(), city]))
    const cityRowsWithState = cityRows.map((row) => {
        const state = cityStateMap.get((row._id || '').toLowerCase())
        const readiness = row.real + row.demo ? Math.min(100, Math.round(((row.live * 0.7) + (row.real * 0.3)) / Math.max(row.real + row.demo, 1) * 100)) : 0
        return {
            id: state?._id || row._id || 'Unknown',
            cityStateId: state?._id,
            city: row._id || 'Unknown',
            state: state?.stateName || '',
            status: state?.status || (row.live > 0 ? 'live' : 'demo'),
            real: row.real,
            demo: row.demo,
            active: row.active,
            live: row.live,
            hidden: row.hidden,
            admin: state?.assignedAdmins?.map((admin) => [admin.userFname, admin.userLname].filter(Boolean).join(' ') || admin.userEmail).filter(Boolean).join(', ') || '-',
            launchReadiness: state?.launchReadiness || readiness,
            dummyVisible: state?.dummyVisible ?? true,
        }
    })
    res.json({
        result: 'success',
        msg: 'Governance summary found',
        data: {
            summary: { realProperties, dummyProperties, liveProperties, hiddenProperties, pendingProperties, realUsers, dummyUsers, admins, ownersPending, suspiciousMoveIns, dummyRatio: realProperties + dummyProperties ? Math.round((dummyProperties / (realProperties + dummyProperties)) * 100) : 0 },
            cityRows: cityRowsWithState,
            auditLogs,
        },
    })
})

router.post('/dummy-transition', async (req, res) => {
    if (!isAdminRequest(req)) {
        return res.status(403).json({ result: 'failure', msg: 'Only Admin can control dummy/live visibility.', data: null })
    }
    return res.status(410).json({ result: 'failure', msg: 'Demo inventory transitions are disabled for the Bangalore-only MVP launch.', data: null })
})

router.get('/city-states', requireAdminGovernance, async (req, res) => {
    const filters = { cityName: MVP_CITY_REGEX }
    if (req.query.active !== undefined) filters.isActive = req.query.active === 'true'
    if (req.query.state) filters.stateName = new RegExp(req.query.state, 'i')
    if (req.query.city) filters.cityName = new RegExp(req.query.city, 'i')
    const items = await CityState.find(filters).populate('assignedAdmins', ['userFname', 'userLname', 'userEmail', 'assignedCity', 'assignedState']).sort({ stateName: 1, cityName: 1 })
    res.json({ result: 'success', msg: 'City/state list found.', data: { items } })
})

router.post('/city-states', requireAdminGovernance, async (req, res) => {
    if (!req.body.stateName || !req.body.cityName) {
        return res.json({ result: 'failure', msg: 'State and city are required.', data: null })
    }
    const payload = {
        stateName: MVP_STATE,
        cityName: MVP_CITY,
        isActive: req.body.isActive === undefined ? true : toBoolean(req.body.isActive),
        dummyVisible: false,
        status: ['live', 'paused'].includes(req.body.status) ? req.body.status : 'live',
        localities: Array.isArray(req.body.localities)
            ? req.body.localities.map((item) => ({ ...item, name: normalizeText(item.name || item) }))
            : parseStringList(req.body.localities).map((name) => ({ name: normalizeText(name), isActive: true, dummyVisible: false })),
        monetizationRules: parseJsonValue(req.body.monetizationRules, {}),
        operationalScope: parseJsonValue(req.body.operationalScope, {}),
        assignedAdmins: (req.body.assignedAdmins || []).filter((id) => mongoose.Types.ObjectId.isValid(id)),
        updatedOn: new Date(),
    }
    const city = await CityState.findOneAndUpdate(
        { stateName: new RegExp(`^${payload.stateName}$`, 'i'), cityName: new RegExp(`^${payload.cityName}$`, 'i') },
        { $set: payload, $setOnInsert: { addedOn: new Date() } },
        { new: true, upsert: true }
    )
    if (payload.assignedAdmins.length) {
        await User.updateMany({ _id: { $in: payload.assignedAdmins }, userType: { $in: accountTypeVariants('Admin') } }, { $set: { assignedCity: payload.cityName, assignedState: payload.stateName, city: payload.cityName, state: payload.stateName } })
    }
    await recordAudit({ performerId: req.auth.user._id, performerRole: 'Admin', action: 'city_state_upserted', entityType: 'city_state', entityId: city._id, updatedValue: payload, city: payload.cityName, state: payload.stateName })
    res.json({ result: 'success', msg: 'City/state saved.', data: city })
})

router.post('/city-states/:id/assign-admins', requireAdminGovernance, async (req, res) => {
    const adminIds = (req.body.adminIds || req.body.assignedAdmins || []).filter((id) => mongoose.Types.ObjectId.isValid(id))
    const city = await CityState.findOne({ _id: req.params.id })
    if (!city) return res.json({ result: 'failure', msg: 'City/state not found.', data: null })
    if (!isBangaloreValue(city.cityName)) return res.status(403).json({ result: 'failure', msg: 'StayJi MVP only supports Bangalore admin assignment.', data: null })
    await CityState.updateMany({ assignedAdmins: { $in: adminIds }, _id: { $ne: city._id } }, { $pull: { assignedAdmins: { $in: adminIds } }, updatedOn: new Date() })
    city.assignedAdmins = adminIds
    city.updatedOn = new Date()
    await city.save()
    await User.updateMany({ _id: { $in: adminIds }, userType: { $in: accountTypeVariants('Admin') } }, { $set: { assignedCity: city.cityName, assignedState: city.stateName, city: city.cityName, state: city.stateName } })
    await recordAudit({ performerId: req.auth.user._id, performerRole: 'Admin', action: 'city_admins_assigned', entityType: 'city_state', entityId: city._id, updatedValue: { adminIds }, city: city.cityName, state: city.stateName })
    res.json({ result: 'success', msg: 'Admins assigned.', data: city })
})

router.post('/city-states/:id/launch', requireAdminGovernance, async (req, res) => {
    const city = await CityState.findOne({ _id: req.params.id })
    if (!city) return res.json({ result: 'failure', msg: 'City/state not found.', data: null })
    if (!isBangaloreValue(city.cityName)) return res.status(403).json({ result: 'failure', msg: 'StayJi MVP only supports Bangalore launch controls.', data: null })

    const cityFilter = { cityName: new RegExp(`^${city.cityName}$`, 'i') }
    const [realListings, demoListings] = await Promise.all([
        Property.countDocuments({ ...cityFilter, isDummy: false }),
        Property.countDocuments({ ...cityFilter, isDummy: true }),
    ])
    const readiness = realListings + demoListings ? Math.min(100, Math.round((realListings / Math.max(realListings + demoListings, 1)) * 100)) : 0
    const hideDemo = req.body.hideDemo !== false

    const [demoUpdate, realUpdate, updatedCity] = await Promise.all([
        hideDemo ? Property.updateMany({ ...cityFilter, isDummy: true }, { $set: { status: 'archived', isActive: false } }) : Promise.resolve({ modifiedCount: 0 }),
        Property.updateMany({ ...cityFilter, isDummy: false, status: { $nin: ['archived', 'suspended'] }, isActive: true }, { $set: { boostScore: 25 } }),
        CityState.findOneAndUpdate(
            { _id: city._id },
            { $set: { status: 'live', dummyVisible: !hideDemo, launchedOn: new Date(), launchReadiness: readiness, updatedOn: new Date() } },
            { new: true }
        ).populate('assignedAdmins', ['userFname', 'userLname', 'userEmail'])
    ])

    await recordAudit({
        performerId: req.auth.user._id,
        performerRole: 'Admin',
        action: 'city_launched',
        entityType: 'city_state',
        entityId: city._id,
        previousValue: { status: city.status || 'demo', dummyVisible: city.dummyVisible, realListings, demoListings },
        updatedValue: { status: 'live', hideDemo, demoModified: demoUpdate.modifiedCount || 0, realModified: realUpdate.modifiedCount || 0, launchReadiness: readiness },
        city: city.cityName,
        state: city.stateName,
    })

    res.json({
        result: 'success',
        msg: `${city.cityName} launched. Demo listings ${hideDemo ? 'hidden' : 'kept visible'} and real listings prioritized.`,
        data: { city: updatedCity, demoModified: demoUpdate.modifiedCount || 0, realModified: realUpdate.modifiedCount || 0, launchReadiness: readiness },
    })
})

router.get('/leads', async (req, res) => {
    const { page, limit, skip } = pageOptions(req.query)
    const match = { isActive: true }
    if (req.query.propertyId && mongoose.Types.ObjectId.isValid(req.query.propertyId)) match.propertyIDFK = new mongoose.Types.ObjectId(req.query.propertyId)
    if (req.query.status) match.status = req.query.status
    if (req.query.dateFrom || req.query.dateTo) {
        match.addedOn = {}
        if (req.query.dateFrom) match.addedOn.$gte = new Date(req.query.dateFrom)
        if (req.query.dateTo) match.addedOn.$lte = new Date(req.query.dateTo)
    }
    const cityScope = adminCityScope(req)
    if (cityScope && Object.keys(cityScope).length) {
        const propertyIds = await Property.find(cityScope).distinct('_id')
        match.propertyIDFK = match.propertyIDFK
            ? { $in: propertyIds.filter((id) => id.toString() === match.propertyIDFK.toString()) }
            : { $in: propertyIds }
    }
    const [visits, inquiries] = await Promise.all([
        Visit.find(match).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).populate({ path: 'propertyIDFK', populate: { path: 'userIDFK', select: ['userFname', 'userLname', 'userEmail', 'contact'] } }).sort({ addedOn: -1 }).skip(skip).limit(limit),
        Inquiry.find(match).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).populate({ path: 'propertyIDFK', populate: { path: 'userIDFK', select: ['userFname', 'userLname', 'userEmail', 'contact'] } }).sort({ addedOn: -1 }).skip(skip).limit(limit),
    ])
    const items = [
        ...visits.map((lead) => ({ id: lead._id, type: 'visit', user: safeUserDto(lead.userIDFK), property: propertyDto(lead.propertyIDFK || {}), addedOn: lead.addedOn, isConverted: lead.isConverted, status: lead.status })),
        ...inquiries.map((lead) => ({ id: lead._id, type: 'inquiry', user: safeUserDto(lead.userIDFK), property: propertyDto(lead.propertyIDFK || {}), subject: lead.subject, addedOn: lead.addedOn, isConverted: lead.isConverted, status: lead.status })),
    ].sort((a, b) => new Date(b.addedOn || 0) - new Date(a.addedOn || 0)).slice(0, limit)
    res.json({ result: 'success', msg: 'Admin leads found', data: { items, page, limit, total: items.length } })
})

router.get('/vendors/:id/messages', async (req, res) => {
    const viewer = ['owner', 'vendor'].includes(req.query.viewer) ? 'owner' : 'admin'
    const deleteFilter = viewer === 'owner' ? { deletedForOwner: { $ne: true }, deletedForVendor: { $ne: true } } : { deletedForAdmin: { $ne: true } }
    const messages = await AdminMessage.find({ vendorId: req.params.id, isActive: true, ...deleteFilter })
        .populate('adminId', ['userFname', 'userLname', 'userEmail'])
        .populate('vendorId', ['userFname', 'userLname', 'userEmail'])
        .populate('propertyId', ['propertyName'])
        .sort({ addedOn: 1 })
    res.json({ result: 'success', msg: 'Vendor messages found', data: messages.map((item) => ({ ...item.toObject(), message: decryptMessage(item.message) })) })
})

router.post('/vendors/:id/messages', async (req, res) => {
    if (!req.body.message || !req.body.message.trim()) {
        return res.json({ result: 'failure', msg: 'Message is required.', data: null })
    }
    const cleanMessage = req.body.message.trim()
    const abusivePattern = /\b(fuck|shit|bitch|asshole|scam|fraudster)\b/i
    if (abusivePattern.test(cleanMessage)) {
        await notifyAdmins({
            actorId: req.params.id,
            propertyId: req.body.propertyId,
            type: 'moderation',
            title: 'Chat moderation alert',
            message: 'A private message was flagged for abusive or suspicious language.',
            link: `/dashboard/admin/vendors/${req.params.id}`,
        })
    }
    const message = await AdminMessage.create({
        vendorId: req.params.id,
        adminId: req.body.adminId,
        propertyId: req.body.propertyId || null,
        senderRole: req.body.senderRole || 'admin',
        message: encryptMessage(cleanMessage),
    })
    if (['vendor', 'owner'].includes(req.body.senderRole || 'admin')) {
        await notifyAdmins({
            actorId: req.params.id,
            propertyId: req.body.propertyId,
            type: 'message',
            title: 'Vendor replied',
            message: 'A vendor replied in the private support thread.',
            link: `/dashboard/admin/vendors/${req.params.id}`,
        })
    } else {
        await createNotification({
            recipientId: req.params.id,
            recipientRole: 'vendor',
            actorId: req.body.adminId,
            propertyId: req.body.propertyId,
            type: 'message',
            title: 'New admin message',
            message: 'StayJi admin sent you a private message.',
            link: '/dashboard/vendor',
        })
    }
    res.json({ result: 'success', msg: 'Message sent.', data: { ...message.toObject(), message: cleanMessage } })
})

router.post('/vendors/:id/messages/:messageId/delete', async (req, res) => {
    const scope = req.body.scope || 'self'
    const viewer = ['owner', 'vendor'].includes(req.body.viewer) ? 'owner' : 'admin'
    const update = {}
    if (scope === 'both') {
        const admin = req.body.adminId && await User.findOne({ _id: req.body.adminId, userType: { $in: ['Admin', 'admin'] }, isActive: true }).select('_id')
        if (!admin) {
            return res.json({ result: 'failure', msg: 'Only StayJi admin can permanently delete messages.', data: null })
        }
        update.isActive = false
    }
    else if (viewer === 'owner') update.deletedForOwner = true
    else update.deletedForAdmin = true
    const message = await AdminMessage.findOneAndUpdate({ _id: req.params.messageId, vendorId: req.params.id }, { $set: update }, { new: true })
    res.json({ result: message ? 'success' : 'failure', msg: message ? 'Message deleted.' : 'Message not found.', data: message })
})

router.get('/notifications', async (req, res) => {
    const userId = asObjectId(req.query.userId || req.query.recipientId)
    const role = normalizeAccountType(req.query.role || req.query.recipientRole || 'user')
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)))
    const filters = { isActive: true }
    const recipients = [{ recipientRole: 'all' }]
    if (userId) recipients.push({ recipientId: userId })
    if (role) recipients.push({ recipientRole: role })
    filters.$or = recipients
    if (req.query.unreadOnly === 'true') filters.readAt = { $exists: false }

    const [items, unreadCount] = await Promise.all([
        Notification.find(filters).sort({ addedOn: -1 }).limit(limit).lean(),
        Notification.countDocuments({ ...filters, readAt: { $exists: false } }),
    ])
    res.json({ result: 'success', msg: 'Notifications found', data: { items, unreadCount } })
})

router.post('/notifications/:id/read', async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { readAt: new Date() } },
        { new: true },
    )
    res.json({ result: notification ? 'success' : 'failure', msg: notification ? 'Notification read' : 'Notification not found', data: notification })
})

router.post('/notifications/mark-read', async (req, res) => {
    const userId = asObjectId(req.body.userId || req.body.recipientId)
    const role = normalizeAccountType(req.body.role || req.body.recipientRole || 'user')
    const recipients = [{ recipientRole: 'all' }]
    if (userId) recipients.push({ recipientId: userId })
    if (role) recipients.push({ recipientRole: role })
    const result = await Notification.updateMany({ isActive: true, readAt: { $exists: false }, $or: recipients }, { $set: { readAt: new Date() } })
    res.json({ result: 'success', msg: 'Notifications marked as read', data: { modifiedCount: result.modifiedCount || 0 } })
})

router.post('/getPropertyListByType', async (req, res) => {
    const objProperty = await Property.find({ propertyTypeIDFK: req.body.propertyTypeIDFK, ...publicPropertyQuery }).
        populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName']);;
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getPropertyListByTypeId', async (req, res) => {
    const objProperty = await Property.find({ userIDFK: req.body.userIDFK, propertyTypeIDFK: req.body.propertyTypeIDFK, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName']);;
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/updateuserPassword', async (req, res) => {
    const objUser = await User.findOne({ _id: req.body.id, isActive: true });

    if (objUser != null && verifyPassword(req.body.oldPassword, objUser.userPassword)) {
        const updated = await User.updateOne({ _id: req.body.id }, {
            userPassword: hashPassword(req.body.userPassword),
        });
        if (updated != null) {
            res.json({ result: "success", msg: "User password updated Successfully", data: 1 });
        } else {
            res.json({ result: "failure", msg: "UnSuccessful", data: 0 });
        }
    } else {
        res.json({ result: "failure", msg: "old password doesn't match", data: 0 })
    }
    // res.send(objStudent);

});


module.exports = router;
