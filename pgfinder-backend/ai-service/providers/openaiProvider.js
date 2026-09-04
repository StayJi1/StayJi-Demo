const { BaseAiProvider } = require('./baseProvider');

class OpenAiProvider extends BaseAiProvider {
    async generateResponse({ systemPrompt, userPrompt, model }) {
        if (!this.config.apiKey) {
            throw new Error('AI provider is missing a valid API key.');
        }

        const requestUrl = this.config.baseUrl || 'https://api.openai.com/v1/chat/completions';
        const payload = {
            model: model || this.config.model || 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        };

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
        }

        const json = await response.json();
        return json.choices?.[0]?.message?.content || 'I am unable to generate a response right now.';
    }
}

module.exports = {
    OpenAiProvider,
};
