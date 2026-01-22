import fetch from 'node-fetch';

const PROXY_URL = process.env.PROXY_URL!;

interface OpenAIChoice {
  message?: { role: string; content: string };
  text?: string;
  image_url?: string;
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  [key: string]: any;
}

export async function generateAIResponse(
  prompt: string,
): Promise<{ text: string; imageUrl?: string }> {
  try {
    const body = {
      model: 'gpt-4o-multimodal', // мультимодальная версия
      messages: [
        {
          role: 'system',
          content: `Ты - эксперт по ИИ и современным трендам 2026 года. 
Отвечай кратко и цепляюще, и генерируй картинку по запросу.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    };

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as OpenAIResponse;

    // Берём текст
    const text =
      data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '🤷‍♂️ Пустой ответ';

    // Берём URL картинки, если есть
    const imageUrl = data.choices?.[0]?.image_url;

    return { text, imageUrl };
  } catch (err) {
    console.error('Ошибка generateAIResponse:', err);
    return { text: 'Ошибка при генерации ответа' };
  }
}
