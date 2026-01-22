import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { generateAIResponse } from './services/ai.service';

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start((ctx) => {
  ctx.reply('Привет, работаем? Если да -- пиши запрос.');
});

bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  try {
    await ctx.reply('Думаю, еще секунду');
    const aiResponse = await generateAIResponse(userText);
    await ctx.reply(aiResponse);
  } catch (error) {
    console.error(error);
    await ctx.reply('Произошла ошибка. Попробуй позже');
  }
});

bot.launch();

console.log('Bot Started');
