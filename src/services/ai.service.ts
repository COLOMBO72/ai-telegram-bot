import fetch from 'node-fetch';

const PROXY_URL = 'https://ai-telegram-bot-production-2000.up.railway.app/openai';

interface OpenAIChoice {
  message?: {
    role: string;
    content: string;
  };
  text?: string;
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  [key: string]: any;
}

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const body = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    };

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // 🔹 Здесь говорим TypeScript: "поверь, это OpenAIResponse"
    const data = (await response.json()) as OpenAIResponse;
    console.log('OpenAI Response:', JSON.stringify(data, null, 2));

    const text =
      data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '🤷‍♂️ Пустой ответ';

    return text;
  } catch (err) {
    console.error('Ошибка generateAIResponse:', err);
    return 'Ошибка при генерации ответа';
  }
}
