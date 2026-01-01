export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AiOptions {
    provider: string;
    apiKey: string;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
    baseUrl?: string;
}

/**
 * AI 请求适配器
 * 支持多供应商扩展
 */
export async function callAiProvider(messages: ChatMessage[], options: AiOptions) {
    const { provider, apiKey, modelName, temperature, baseUrl } = options;

    switch (provider.toLowerCase()) {
        case 'gemini':
            return callGemini(messages, apiKey, modelName, temperature);
        case 'openai':
        case 'deepseek':
            const finalBaseUrl = baseUrl || (provider.toLowerCase() === 'deepseek' ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
            return callOpenAiCompatible(messages, apiKey, modelName, temperature, finalBaseUrl);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}

async function callGemini(messages: ChatMessage[], apiKey: string, model: string, temp = 0.7) {
    // 转换格式为 Gemini 格式
    // system -> 转为 contents 的第一个 message 或专用 systemInstruction (需 API 支持)
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemMsg }] },
            contents: history,
            generationConfig: {
                temperature: temp,
                maxOutputTokens: 1000,
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini API Error: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 没有返回内容';
}

async function callOpenAiCompatible(messages: ChatMessage[], apiKey: string, model: string, temp = 0.7, baseUrl = 'https://api.openai.com/v1') {
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temp,
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI-Compatible API Error: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'AI 没有返回内容';
}
