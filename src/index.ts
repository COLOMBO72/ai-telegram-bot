import 'dotenv/config';
import './proxy'; // прокси подключаем первым, если нужен
import OpenAI from 'openai';
import { Telegraf } from 'telegraf';

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

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => ctx.reply('Привет! Я ИИ-бот. Задай вопрос.'));

const PROXY_URL = process.env.PROXY_URL2!;
const PROXY_IMAGE_URL = process.env.PROXY_IMAGE_URL;

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
Ты - эксперт. Отвечай кратко, понятно и цепляюще. Ответ должен быть не больше 4000 символов`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    };

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as OpenAIResponse;
    const text =
      data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '🤷‍♂️ Пустой ответ';

    return text;
  } catch (err) {
    console.error('❌ Ошибка generateAIResponse:', err);
    return '⚠️ Ошибка при генерации ответа';
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const body = {
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
    };

    const response = await fetch(process.env.PROXY_IMAGE_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      }),
    });

    const data = await response.json();

    return data.data[0].url;
  } catch (error: any) {
    console.error('generateImage error:', error);
    return `⚠️ Ошибка генерации картинки: ${error.message}`;
  }
}

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  try {
    if (text.toLowerCase().startsWith('/image')) {
      const prompt = text.replace('/image', '').trim();
      const url = await generateImage(prompt);
      await ctx.reply(url);
      console.log(`Картинка отправлена`);
    } else {
      const reply = await generateAIResponse(text);
      await ctx.reply(reply);
      console.log(`Отвечает gpt-4o-mini`);
    }
  } catch (error: any) {
    console.error('Bot error:', error);
    await ctx.reply(`⚠️ Ошибка: ${error.message}`);
  }
});

bot.launch();
console.log('🤖 Бот запущен!');
