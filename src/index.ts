import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { generateAIResponse } from './services/ai.service';

const bot = new Telegraf(process.env.BOT_TOKEN!)

const userLimits = new Map<number, number>()
const FREE_LIMIT = 5

bot.start((ctx) => ctx.reply('Привет! Я помогу тебе с идеями для Reels. Попробуй написать что-нибудь!'))

bot.on('text', async (ctx) => {
  const userId = ctx.from.id
  const used = userLimits.get(userId) || 0

  if (used >= FREE_LIMIT) {
    return ctx.reply('Вы использовали все бесплатные запросы. Купите подписку для продолжения.')
  }

  userLimits.set(userId, used + 1)
  await ctx.reply('Думаю над идеями...')

  try {
    const aiResponse = await generateAIResponse(ctx.message.text)
    await ctx.reply(aiResponse)
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка при генерации ответа')
  }
})

bot.launch()
console.log('Бот запущен')