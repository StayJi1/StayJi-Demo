class BaseAiProvider {
    constructor(config = {}) {
        this.config = config;
    }

    async generateResponse() {
        throw new Error('AI provider must implement generateResponse().');
    }
}

const createProvider = (config = {}) => {
    const providerName = (config.provider || '').toLowerCase();

    if (!providerName) {
        throw new Error('AI provider is not configured. Set AI_PROVIDER, AI_API_KEY, and AI_MODEL in your environment.');
    }

    if (providerName === 'openai') {
        const { OpenAiProvider } = require('./openaiProvider');
        return new OpenAiProvider(config);
    }

    if (providerName === 'gemini') {
        const { GeminiProvider } = require('./geminiProvider');
        return new GeminiProvider(config);
    }

    throw new Error(`Unsupported AI provider: ${config.provider}. Supported providers: openai, gemini.`);
};

module.exports = {
    BaseAiProvider,
    createProvider,
};
