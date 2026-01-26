import db from '../db';

function migrate() {
  // Получаем список колонок таблицы users
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();
  const columns = tableInfo.map((c: any) => c.name);

  // Добавляем недостающие колонки
  if (!columns.includes('plan')) {
    db.prepare(`ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'`).run();
    console.log('✅ Добавлено поле plan');
  }

  if (!columns.includes('text_used')) {
    db.prepare(`ALTER TABLE users ADD COLUMN text_used INTEGER DEFAULT 0`).run();
    console.log('✅ Добавлено поле text_used');
  }

  if (!columns.includes('image_used')) {
    db.prepare(`ALTER TABLE users ADD COLUMN image_used INTEGER DEFAULT 0`).run();
    console.log('✅ Добавлено поле image_used');
  }

  if (!columns.includes('last_reset')) {
    db.prepare(`ALTER TABLE users ADD COLUMN last_reset TEXT`).run();
    console.log('✅ Добавлено поле last_reset');
  }

  console.log('🎉 Миграция завершена!');
}

migrate();
