import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { generateAIResponse } from './services/ai.service';

const bot = new Telegraf(process.env.BOT_TOKEN!);

const userLimits = new Map<number, number>();
const FREE_LIMIT = 5;

bot.start((ctx) => ctx.reply('Здравствуй, помогу тебе со всем. Пиши свой запрос'));

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const used = userLimits.get(userId) || 0;

  if (used >= FREE_LIMIT) {
    return ctx.reply(
      'Я рад был тебе помочь, но чтобы я тебе помогал качественнее - купи подписку для нашего продолжения.',
    );
  }

  userLimits.set(userId, used + 1);
  await ctx.reply('Пару секунд, готовлю ответ...');

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
