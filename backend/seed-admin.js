const db = require('./config/db');
const bcrypt = require('bcrypt');

(async () => {
  const name = 'Admin';
  const email = 'admin@eeu.com';
  const password = 'admin123';
  const role = 'admin';

  const hash = await bcrypt.hash(password, 10);
  try {
    const [r] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
    console.log('Admin created! ID:', r.insertId);
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') console.log('Admin already exists.');
    else console.error(e.message);
  }
  process.exit(0);
})();
