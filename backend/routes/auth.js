const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();
// router is like a mini Express app — it holds routes
// we export it and mount it in server.js under a prefix like /api/auth

// -----------------------------------------------
// REGISTER API  →  POST /api/auth/register
// -----------------------------------------------
router.post('/register', async (req, res) => {
  // Guard: if body is missing or not parsed, return clear error
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ message: 'Request body is missing. Set Content-Type to application/json.' });
  }

  const { name, email, password, phone, role, service_id, team_name } = req.body;

  // Basic validation — never trust the client
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
    // 400 = Bad Request (client sent wrong/missing data)
  }

  try {
    // 1. Check if email already exists
    // db.query returns [rows, fields] — we destructure just rows
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email] // ? is a placeholder — mysql2 escapes it to prevent SQL injection
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 2. Hash the password
    // bcrypt.hash(plainText, saltRounds)
    // saltRounds=10 means bcrypt runs the hashing algorithm 2^10 = 1024 times
    // This makes brute-force attacks very slow
    // We NEVER store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert the new user into the database
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role, service_id, team_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, role || 'citizen', service_id || null, team_name || null]
      // || null means: if the value wasn't sent, store NULL in the database
    );

    // result.insertId = the auto-generated id of the new row
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: result.insertId, name, email, role: role || 'citizen' }
      // 201 = Created (something new was made)
      // Never send the password back, even hashed
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
    // 500 = Internal Server Error (something broke on our side)
  }
});

// -----------------------------------------------
// LOGIN API  →  POST /api/auth/login
// -----------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // bcrypt.compare hashes the input and compares with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sign a JWT token with user info — expires in 7 days
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, service_id: user.service_id, team_name: user.team_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, service_id: user.service_id, team_name: user.team_name }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
