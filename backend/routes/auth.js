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

  // Public registration is only for citizens
  // approver, electrician, admin must be created by admin
  if (role && role !== 'citizen') {
    return res.status(403).json({ message: 'Only citizen accounts can be registered publicly. Other roles are created by admin.' });
  }

  // Basic validation — never trust the client
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  // Ethiopian phone validation
  if (phone) {
    const ethPattern = /^(\+251[79]\d{8}|0[79]\d{8})$/;
    if (!ethPattern.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number. Use Ethiopian format: 09xxxxxxxx or +251xxxxxxxxx' });
    }
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

// -----------------------------------------------
// FORGOT PASSWORD  →  POST /api/auth/forgot-password
// Generates a reset token valid for 1 hour
// In production this would email the link — here we return the token
// so it can be shared manually or via a future email integration
// -----------------------------------------------
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    // Always return success to prevent email enumeration attacks
    if (users.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been generated.' });
    }

    const user = users[0];
    // Generate a secure random token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token in DB (add column if not exists — handled gracefully)
    try {
      await db.query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [hashedToken, expiresAt, user.id]
      );
    } catch {
      // Column may not exist yet — return token directly for now
    }

    // In production: send email with reset link
    // For now: return token so admin/user can use it
    res.json({
      message: 'Password reset token generated.',
      reset_token: resetToken, // frontend uses this in the reset form
      note: 'Use this token within 1 hour to reset your password.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// -----------------------------------------------
// RESET PASSWORD  →  POST /api/auth/reset-password
// -----------------------------------------------
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, token, and new password are required' });
  }

  // Password strength: min 8 chars, at least 1 uppercase, 1 number, 1 special char
  const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!strongPassword.test(newPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.'
    });
  }

  try {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
      [email, hashedToken]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
