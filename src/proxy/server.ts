import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
app.use(express.json());

app.post('/openai', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Прокси ошибка:', err);
    res.status(500).json({ error: 'Проблема на прокси' });
  }
});

app.post('/images', async (req, res) => {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.json(data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Прокси сервер запущен на порту ${port}`));
