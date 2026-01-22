import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { generateAIResponse } from './services/ai.service';

const bot = new Telegraf(process.env.BOT_TOKEN!);

const userLimits = new Map<number, number>();
const FREE_LIMIT = 5;

bot.start((ctx) => ctx.reply('Привет! Задавай свой вопрос.'));

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const used = userLimits.get(userId) || 0;

  if (used >= FREE_LIMIT) {
    return ctx.reply('Рад был помочь, но чтобы мог тебе помогать качественнее - нужна подписка.');
  }

  userLimits.set(userId, used + 1);
  await ctx.reply('Думаю...');

  try {
    const aiResponse = await generateAIResponse(ctx.message.text);
    await ctx.reply(aiResponse);
  } catch (err) {
    console.error(err);
    await ctx.reply('Ошибка при генерации ответа');
  }
});

bot.launch();
console.log('Бот запущен');
