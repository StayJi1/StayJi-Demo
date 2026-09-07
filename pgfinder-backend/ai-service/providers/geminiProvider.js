const { BaseAiProvider } = require('./baseProvider');

class GeminiProvider extends BaseAiProvider {
    async generateResponse({ systemPrompt, userPrompt, model }) {
        if (!this.config.apiKey) {
            throw new Error('Gemini provider is missing a valid API key.');
        }

        const modelName = model || this.config.model || 'gemini-1.5-flash';
        const requestUrl = `${this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models'}/${modelName}:generateContent?key=${this.config.apiKey}`;

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                    },
                ],
                generationConfig: {
                    temperature: 0.4,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
        }

        const json = await response.json();
        return json.candidates?.[0]?.content?.parts?.[0]?.text || 'I am unable to generate a response right now.';
    }
}

module.exports = {
    GeminiProvider,
};
