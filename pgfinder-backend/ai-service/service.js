const { getAiConfig } = require('./config');
const { createProvider } = require('./providers/baseProvider');
const Property = require('../models/propertyMaster');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

const normalizeText = (input = '') => String(input || '').trim();

const detectIntent = (messageText) => {
    const text = normalizeText(messageText).toLowerCase();
    if (!text) return 'general';

    const humanHandoffKeywords = ['talk to a human', 'talk to human', 'customer support', 'agent', 'representative', 'human agent', 'contact support', 'speak to someone', 'need a person', 'help me with a person'];
    const propertyKeywords = ['pg', 'room', 'rooms', 'property', 'rent', 'budget', 'boys', 'girls', 'unisex', 'flat', 'apartment', 'near', 'area', 'sharing', 'paying', 'monthly rent', 'for rent'];

    if (humanHandoffKeywords.some((keyword) => text.includes(keyword))) {
        return 'human_handoff';
    }

    if (propertyKeywords.some((keyword) => text.includes(keyword))) {
        return 'property_search';
    }

    return 'general';
};

const extractNumericBudget = (messageText) => {
    const text = normalizeText(messageText);
    const matches = text.match(/(?:rs\.?\s*|inr\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|lakhs?|lakh|thousand)?/gi) || [];
    let bestValue = null;

    for (const match of matches) {
        const normalized = match.replace(/[^0-9.]/g, '');
        if (!normalized) continue;
        const parsed = Number(normalized);
        if (Number.isFinite(parsed) && parsed > 0) {
            bestValue = parsed;
        }
    }

    if (bestValue === null) return null;
    return bestValue;
};

const parseSearchRequest = (messageText) => {
    const text = normalizeText(messageText);
    const lower = text.toLowerCase();

    const cityMatch = text.match(/(?:in|for|near|around)\s+([A-Za-z][A-Za-z\s-]+?)(?:\s+(?:pg|room|roommate|property)|$)/i);
    const areaMatch = text.match(/(?:in|near|around|at)\s+([A-Za-z][A-Za-z\s-]+?)(?:\s+(?:city|area)|,|$)/i);
    const genderMatch = lower.match(/(boys|girls|unisex|male|female|mixed)/i);
    const sharingMatch = lower.match(/(single|double|triple|shared|private|1 sharing|2 sharing|3 sharing|4 sharing)/i);
    const budget = extractNumericBudget(text);

    return {
        city: cityMatch ? cityMatch[1].trim() : '',
        area: areaMatch ? areaMatch[1].trim() : '',
        gender: genderMatch ? genderMatch[1].trim() : '',
        sharing: sharingMatch ? sharingMatch[1].trim() : '',
        budget,
        raw: text,
    };
};

const buildPropertyFilters = (params = {}) => {
    const filters = {
        isActive: true,
        isDummy: { $ne: true },
    };

    const city = normalizeText(params.city);
    const area = normalizeText(params.area);
    const gender = normalizeText(params.gender);
    const sharing = normalizeText(params.sharing);

    if (city) {
        filters.cityName = { $regex: city, $options: 'i' };
    }

    if (area) {
        filters.areaName = { $regex: area, $options: 'i' };
    }

    if (gender) {
        const normalizedGender = gender.toLowerCase();
        if (normalizedGender.includes('boy')) filters.genderType = { $regex: 'boys|male', $options: 'i' };
        else if (normalizedGender.includes('girl')) filters.genderType = { $regex: 'girls|female', $options: 'i' };
        else if (normalizedGender.includes('uni')) filters.genderType = { $regex: 'unisex|mixed', $options: 'i' };
    }

    if (sharing) {
        const sharingText = sharing.toLowerCase();
        if (sharingText.includes('single')) {
            filters.sharing = { $regex: 'single|private', $options: 'i' };
        } else if (sharingText.includes('double')) {
            filters.sharing = { $regex: 'double|2 sharing', $options: 'i' };
        } else if (sharingText.includes('triple')) {
            filters.sharing = { $regex: 'triple|3 sharing', $options: 'i' };
        } else if (sharingText.includes('shared')) {
            filters.sharing = { $regex: 'shared|sharing', $options: 'i' };
        }
    }

    return filters;
};

const toPropertySummary = (property) => ({
    id: property._id ? String(property._id) : null,
    name: property.propertyName || 'Property',
    city: property.cityName || '',
    area: property.areaName || '',
    rent: property.rent || '',
    sharing: property.sharing || '',
    genderType: property.genderType || '',
    propertyType: property.propertyType || property.propertyCategory || '',
    image: Array.isArray(property.propertyImageUrls) && property.propertyImageUrls.length ? property.propertyImageUrls[0] : (property.propertyImage || ''),
});

const findMatchingProperties = async (messageText) => {
    const params = parseSearchRequest(messageText);
    const filters = buildPropertyFilters(params);
    const propertyList = await Property.find(filters).limit(150).lean();

    const budgetLimit = Number.isFinite(params.budget) ? params.budget : null;
    const normalizedGender = normalizeText(params.gender).toLowerCase();
    const normalizedSharing = normalizeText(params.sharing).toLowerCase();

    const matches = propertyList.filter((property) => {
        const text = `${property.propertyName || ''} ${property.cityName || ''} ${property.areaName || ''} ${property.description || ''}`.toLowerCase();
        if (params.city && !text.includes(params.city.toLowerCase())) return false;
        if (params.area && !text.includes(params.area.toLowerCase())) return false;

        if (budgetLimit) {
            const rentValue = Number(String(property.rent || '').replace(/[^0-9.]/g, ''));
            if (Number.isFinite(rentValue) && rentValue > budgetLimit * 1000) return false;
        }

        if (normalizedGender) {
            const genderText = String(property.genderType || '').toLowerCase();
            if (normalizedGender.includes('boy') && !genderText.includes('boys') && !genderText.includes('male')) return false;
            if (normalizedGender.includes('girl') && !genderText.includes('girls') && !genderText.includes('female')) return false;
            if (normalizedGender.includes('uni') && !genderText.includes('unisex') && !genderText.includes('mixed')) return false;
        }

        if (normalizedSharing) {
            const sharingText = String(property.sharing || '').toLowerCase();
            if (normalizedSharing.includes('single') && !sharingText.includes('single') && !sharingText.includes('private')) return false;
            if (normalizedSharing.includes('double') && !sharingText.includes('double') && !sharingText.includes('2')) return false;
            if (normalizedSharing.includes('triple') && !sharingText.includes('triple') && !sharingText.includes('3')) return false;
            if (normalizedSharing.includes('shared') && !sharingText.includes('shared') && !sharingText.includes('sharing')) return false;
        }

        return true;
    });

    return {
        params,
        total: matches.length,
        matches: matches.slice(0, 5).map(toPropertySummary),
    };
};

const buildSystemPrompt = (userName = 'user', intent = 'general', propertySummary = []) => `You are a helpful assistant for StayJi. Respond as a property assistant for the user ${userName}.\n- If the user asks for a property search, use the provided property results from the database and explain them courteously.\n- If the user asks for a human handoff, inform them a human agent will help and suggest they can also continue the property search.\n- Keep responses concise, factual, and useful.\n- If no useful property results are available, say so clearly and ask a follow-up question.\n- Current intent: ${intent}.\n- Property data available: ${JSON.stringify(propertySummary)}.`;

const callAiProvider = async ({ messageText, intent, user, propertyMatches }) => {
    const aiConfig = getAiConfig();

    if (!aiConfig.configured) {
        return {
            result: 'failure',
            code: 'AI_PROVIDER_NOT_CONFIGURED',
            msg: 'AI provider is not configured. Set AI_PROVIDER, AI_API_KEY, and AI_MODEL in your environment before using the AI chat service.',
            data: {
                intent,
                propertyMatches: propertyMatches?.matches || [],
            },
        };
    }

    const provider = createProvider(aiConfig);
    const responseText = await provider.generateResponse({
        systemPrompt: buildSystemPrompt(user?.userFname || user?.userEmail || 'user', intent, propertyMatches?.matches || []),
        userPrompt: messageText,
        model: aiConfig.model,
    });

    return {
        result: 'success',
        code: 'AI_RESPONSE_OK',
        msg: 'AI response generated successfully.',
        data: {
            intent,
            provider: aiConfig.provider,
            response: responseText,
            propertyMatches: propertyMatches?.matches || [],
            totalProperties: propertyMatches?.total || 0,
        },
    };
};

const createHumanHandoff = async ({ userId, propertyId, ownerId, messageText }) => {
    if (!propertyId || !ownerId) {
        return { created: false, reason: 'No property or owner context was provided for a human handoff.' };
    }

    const existingConversation = await Conversation.findOne({
        userId,
        ownerId,
        propertyId,
        conversationType: 'user_owner',
        isActive: true,
    });

    const conversation = existingConversation || await Conversation.create({
        userId,
        ownerId,
        propertyId,
        participants: [userId, ownerId],
        conversationType: 'user_owner',
        status: 'active',
        isActive: true,
        lastMessagePreview: messageText.slice(0, 140),
        lastMessageAt: new Date(),
        updatedOn: new Date(),
    });

    await Message.create({
        conversationId: conversation._id,
        propertyId,
        fromUserIDFK: userId,
        toUserIDFK: ownerId,
        senderRole: 'user',
        text: messageText,
        metadata: { source: 'ai_handoff', handoff: true },
    });

    return {
        created: true,
        conversationId: String(conversation._id),
        ownerId: String(ownerId),
        propertyId: String(propertyId),
    };
};

const processAiMessage = async ({ messageText, user = null, propertyId = null, ownerId = null }) => {
    const text = normalizeText(messageText);
    if (!text) {
        return {
            result: 'failure',
            code: 'EMPTY_MESSAGE',
            msg: 'A message is required before contacting the AI assistant.',
            data: null,
        };
    }

    const intent = detectIntent(text);

    if (intent === 'human_handoff') {
        const handoff = user ? await createHumanHandoff({ userId: user._id, propertyId, ownerId, messageText: text }) : { created: false, reason: 'No authenticated user context was available.' };

        return {
            result: 'success',
            code: 'HUMAN_HANDOFF_REQUESTED',
            msg: 'A human support handoff has been requested.',
            data: {
                intent,
                requiresHumanHandoff: true,
                handoff,
                response: 'I have flagged this as a human handoff request. A support team member or property owner can continue from the existing messaging flow.',
            },
        };
    }

    if (intent === 'property_search') {
        const propertyMatches = await findMatchingProperties(text);
        return callAiProvider({
            messageText: text,
            intent,
            user,
            propertyMatches,
        });
    }

    return callAiProvider({
        messageText: text,
        intent,
        user,
        propertyMatches: { total: 0, matches: [] },
    });
};

module.exports = {
    detectIntent,
    parseSearchRequest,
    findMatchingProperties,
    processAiMessage,
};
