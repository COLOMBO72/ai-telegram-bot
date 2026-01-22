import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateAIResponse(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // быстрая и дешевая модель для бота
    messages: [
      {
        role: 'user',
        content: prompt, //промпт - текст пользователя
      },
    ],
    temperature: 0.7, // температура - креативность
  })

  return response.choices[0].message.content || 'Пустой ответ';
  // функция возвращает ГОТОВЫЙ ТЕКСТ
}
