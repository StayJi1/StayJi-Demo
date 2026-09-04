const normalizeProvider = (value = '') => {
    const provider = String(value || '').trim().toLowerCase();
    if (!provider) return '';
    if (provider === 'google') return 'gemini';
    if (provider === 'openai' || provider === 'gpt') return 'openai';
    if (provider === 'gemini') return 'gemini';
    return provider;
};

const getAiConfig = () => {
    const provider = normalizeProvider(process.env.AI_PROVIDER);
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    const baseUrl = process.env.AI_BASE_URL || '';
    const configured = Boolean(provider && apiKey);

    return {
        provider,
        apiKey,
        model,
        baseUrl,
        configured,
    };
};

module.exports = {
    normalizeProvider,
    getAiConfig,
};
