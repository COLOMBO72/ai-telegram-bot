import 'dotenv/config';
import './proxy'; // прокси подключаем первым, если нужен
import OpenAI from 'openai';
import { Telegraf } from 'telegraf';
import db from './db';

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

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
}

interface User {
  user_id: number;
  plan?: string;
  text_used: number;
  image_used: number;
  last_reset: string;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

const FREE_TEXT_LIMIT = 5;
const FREE_IMAGE_LIMIT = 3;

const PROXY_URL = process.env.PROXY_URL2!;
const PROXY_IMAGE_URL = process.env.PROXY_IMAGE_URL!;

// BOT START
bot.start((ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const today = new Date().toISOString().slice(0, 10);

  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId) as User | undefined;

  if (!user) {
    db.prepare(
      `
      INSERT INTO users (user_id, last_reset, text_used, image_used, plan)
      VALUES (?, ?, 0, 0, 'free')
    `,
    ).run(userId, today);
  }

  ctx.reply('👋 Привет! Я ИИ бот.\n\n' + 'Генерируй текст или картинки.');
});

//LIMITS

function activatePaidPlan(userId: number) {
  db.prepare(
    `
    UPDATE users
    SET plan = 'paid'
    WHERE user_id = ?
  `,
  ).run(userId);
}

export function checkAndUpdateLimits(userId: number, type: 'text' | 'image'): LimitCheckResult {
  const today = new Date().toISOString().slice(0, 10);
  let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId) as User | undefined;

  if (!user) {
    db.prepare(
      `
      INSERT INTO users (user_id, last_reset, text_used, image_used, plan)
      VALUES (?, ?, 0, 0, 'free')
    `,
    ).run(userId, today);
    return { allowed: true };
  }

  // If subscription PAID
  if (user.plan === 'paid') {
    return { allowed: true };
  }

  // Reset Limits on a new day
  if (user.last_reset !== today) {
    db.prepare(
      `
      UPDATE users
      SET text_used = 0,
          image_used = 0,
          last_reset = ?
      WHERE user_id = ?
    `,
    ).run(today, userId);

    user.text_used = 0;
    user.image_used = 0;
    user.last_reset = today;
  }

  // Check limits if they empty
  if (type === 'text' && user.text_used >= FREE_TEXT_LIMIT) {
    return { allowed: false, reason: 'Бесплатные текстовые запросы закончились' };
  }

  if (type === 'image' && user.image_used >= FREE_IMAGE_LIMIT) {
    return { allowed: false, reason: 'Бесплатные генерации картинок закончились' };
  }

  // увеличиваем счётчик
  if (type === 'text') {
    db.prepare('UPDATE users SET text_used = text_used + 1 WHERE user_id = ?').run(userId);
  } else {
    db.prepare('UPDATE users SET image_used = image_used + 1 WHERE user_id = ?').run(userId);
  }

  return { allowed: true };
}

// AI Responses
export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Отвечай кратко и по делу. Не более 4000 символов.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as OpenAIResponse;
    return data.choices?.[0]?.message?.content || data.choices?.[0]?.text || 'Пустой ответ';
  } catch (err) {
    console.error('❌ Ошибка generateAIResponse:', err);
    return '⚠️ Ошибка при генерации ответа';
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await fetch(PROXY_IMAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      }),
    });

    const data = await response.json();

    // 🔍 ЛОГ ДЛЯ ДИАГНОСТИКИ
    console.log('🖼 Image response:', JSON.stringify(data, null, 2));

    if (data.error) {
      throw new Error(data.error.message || 'Ошибка генерации картинки');
    }

    if (!Array.isArray(data.data) || !data.data[0]?.url) {
      throw new Error('Пустой ответ от Image API');
    }

    return data.data[0].url;
  } catch (error: any) {
    console.error('generateImage error:', error);
    return `Ошибка генерации картинки: ${error.message || ''}`;
  }
}

// BOT Tasks
bot.on('text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const text = ctx.message.text;

  try {
    if (text.toLowerCase().startsWith('/image')) {
      const limit = checkAndUpdateLimits(userId, 'image');
      if (!limit.allowed) {
        return ctx.reply(`${limit.reason}\n\n💳 Подписка — 399₽`, {
          reply_markup: {
            inline_keyboard: [[{ text: 'Купить подписку', callback_data: 'buy_subscription' }]],
          },
        });
      }

      const prompt = text.replace('/image', '').trim();
      const url = await generateImage(prompt);
      await ctx.reply(url || '');
      console.log(`Картинка отправлена`);
    } else {
      const limit = checkAndUpdateLimits(userId, 'text');
      if (!limit.allowed) {
        return ctx.reply(`${limit.reason}\n\n💳 Подписка — 399₽`, {
          reply_markup: {
            inline_keyboard: [[{ text: 'Купить подписку', callback_data: 'buy_subscription' }]],
          },
        });
      }

      const reply = await generateAIResponse(text);
      await ctx.reply(reply || '');
      console.log(`Отвечает gpt-4o-mini`);
    }
  } catch (error: any) {
    console.error('Bot error:', error);
    await ctx.reply(`⚠️ Ошибка: ${error.message || ''}`);
  }
});

//CallBack

bot.on('callback_query', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  if (!('data' in ctx.callbackQuery)) return;

  if (ctx.callbackQuery.data === 'buy_subscription') {
    activatePaidPlan(userId);
    await ctx.answerCbQuery();
    await ctx.reply('Подписка активирована! Спасибо за то что пользуетесь нашим ботом.');
  }
});

bot.launch();
console.log('🤖 Бот запущен!');
