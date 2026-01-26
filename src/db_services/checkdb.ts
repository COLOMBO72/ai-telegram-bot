import db from '../db';

const users = db.prepare('SELECT * FROM users').all();
console.log(users);
