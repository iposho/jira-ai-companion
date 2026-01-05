import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;

let groqClient: Groq | null = null;

/**
 * Get or create Groq client instance
 */
export function getGroqClient(): Groq {
    if (!groqApiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    if (!groqClient) {
        groqClient = new Groq({ apiKey: groqApiKey });
    }

    return groqClient;
}

/**
 * Analyze report content with LLM
 */
export async function analyzeWithLLM(
    prompt: string,
    systemPrompt?: string
): Promise<string> {
    const client = getGroqClient();

    const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: systemPrompt || 'Ты — опытный технический менеджер проектов. Отвечай кратко, практично и на русском языке.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.7,
        max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || '';
}

/**
 * Check if Groq is configured
 */
export function isGroqConfigured(): boolean {
    return Boolean(groqApiKey);
}
