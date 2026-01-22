import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { generateAIResponse } from './services/ai.service';

const bot = new Telegraf(process.env.BOT_TOKEN!)

bot.start((ctx) => ctx.reply('Привет! Пиши свой запрос:'))

bot.on('text', async (ctx) => {
  await ctx.reply('Думаю над ответом...')

  try {
    const { text, imageUrl } = await generateAIResponse(ctx.message.text)

    // Отправляем текст
    await ctx.reply(text)

    // Если есть картинка, отправляем её
    if (imageUrl) {
      await ctx.replyWithPhoto(imageUrl)
    }
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка при генерации ответа')
  }
})

bot.launch()
console.log('Бот запущен')