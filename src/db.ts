import Database from 'better-sqlite3';

const db = new Database('database.db');

// создаём таблицу пользователей
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    plan TEXT DEFAULT 'free',
    text_used INTEGER DEFAULT 0,
    image_used INTEGER DEFAULT 0,
    last_reset TEXT
  )
`,
).run();

export function addPayment(userId: number, plan: string, amount: number) {
  const today = new Date().toISOString();
  db.prepare(`INSERT INTO payments (user_id, plan, amount, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    plan,
    amount,
    today,
  );

  // Обновляем план пользователя
  db.prepare(`UPDATE users SET plan = ? WHERE user_id = ?`).run(plan, userId);
}

export default db;
