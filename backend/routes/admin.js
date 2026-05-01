const express = require('express');
const db = require('../config/db');
const QRCode = require('qrcode');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken, requireRole(['admin']));

// ── Dashboard stats ──────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const safeCount = async (sql) => {
    try { const [[r]] = await db.query(sql); return r.count || 0; } catch { return 0; }
  };
  const safeQuery = async (sql) => {
    try { const [rows] = await db.query(sql); return rows; } catch { return []; }
  };

  try {
    const [users, requests, reports, infra, pending, openRep, damaged] = await Promise.all([
      safeCount('SELECT COUNT(*) as count FROM users'),
      safeCount('SELECT COUNT(*) as count FROM service_requests'),
      safeCount('SELECT COUNT(*) as count FROM infrastructure_reports'),
      safeCount('SELECT COUNT(*) as count FROM infrastructure'),
      safeCount("SELECT COUNT(*) as count FROM service_requests WHERE status='pending'"),
      safeCount("SELECT COUNT(*) as count FROM infrastructure_reports WHERE status='open'"),
      safeCount("SELECT COUNT(*) as count FROM infrastructure WHERE status='damaged'"),
    ]);

    const [byStatus, byCategory, reportsByType, usersByRole, requestsPerMonth] = await Promise.all([
      safeQuery('SELECT status, COUNT(*) as count FROM service_requests GROUP BY status'),
      safeQuery('SELECT category, COUNT(*) as count FROM service_requests GROUP BY category'),
      safeQuery('SELECT report_type, COUNT(*) as count FROM infrastructure_reports GROUP BY report_type'),
      safeQuery('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      safeQuery(`SELECT DATE_FORMAT(created_at,'%b %Y') as month, DATE_FORMAT(created_at,'%Y-%m') as sort_key, COUNT(*) as count FROM service_requests WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY month, sort_key ORDER BY sort_key ASC`),
    ]);

    res.json({
      users, requests, reports, infrastructure: infra,
      pending_requests: pending, open_reports: openRep, damaged_assets: damaged,
      charts: { byStatus, byCategory, reportsByType, usersByRole, requestsPerMonth }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Users management ─────────────────────────────────────────

// GET all users — supports ?role=citizen&search=john
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    let sql = 'SELECT id, name, email, phone, role, service_id, team_name, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR service_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';

    const [users] = await db.query(sql, params);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single user
router.get('/users/:id', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, service_id, team_name, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create user — admin sets all fields including role
router.post('/users', async (req, res) => {
  const { name, email, password, phone, role, service_id, team_name } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, and role are required' });
  }

  const validRoles = ['citizen', 'approver', 'electrician', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${validRoles.join(', ')}` });
  }

  try {
    // Check duplicate email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email already in use' });

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role, service_id, team_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, role, service_id || null, team_name || null]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: result.insertId, name, email, phone: phone || null, role, service_id: service_id || null, team_name: team_name || null, created_at: new Date() }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update user — partial update, only fields sent are changed
router.put('/users/:id', async (req, res) => {
  const { name, email, phone, role, service_id, team_name, password } = req.body;
  const userId = req.params.id;

  try {
    // Fetch current user
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    // Check email uniqueness if changing email
    if (email && email !== users[0].email) {
      const [dup] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (dup.length > 0) return res.status(409).json({ message: 'Email already in use by another user' });
    }

    // Build dynamic SET clause — only update provided fields
    const fields = [];
    const values = [];

    if (name)       { fields.push('name = ?');       values.push(name); }
    if (email)      { fields.push('email = ?');      values.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
    if (role)       { fields.push('role = ?');       values.push(role); }
    if (service_id !== undefined) { fields.push('service_id = ?'); values.push(service_id || null); }
    if (team_name !== undefined)  { fields.push('team_name = ?');  values.push(team_name || null); }

    if (password) {
      const bcrypt = require('bcrypt');
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    values.push(userId);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    // Return updated user (without password)
    const [updated] = await db.query(
      'SELECT id, name, email, phone, role, service_id, team_name, created_at FROM users WHERE id = ?',
      [userId]
    );
    res.json({ message: 'User updated successfully', user: updated[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE user — prevent self-deletion
router.delete('/users/:id', async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  try {
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    // FK constraint — user has related records
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Cannot delete user with existing requests or reports. Deactivate instead.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Infrastructure management ─────────────────────────────────
router.get('/infrastructure', async (req, res) => {
  try {
    const [assets] = await db.query('SELECT * FROM infrastructure ORDER BY created_at DESC');
    res.json({ assets });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/infrastructure', async (req, res) => {
  const { asset_code, asset_type, description, location, latitude, longitude } = req.body;
  if (!asset_code || !asset_type) return res.status(400).json({ message: 'asset_code and asset_type are required' });

  try {
    const [result] = await db.query(
      'INSERT INTO infrastructure (asset_code, asset_type, description, location, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [asset_code, asset_type, description || null, location || null, latitude || null, longitude || null]
    );
    res.status(201).json({ message: 'Asset created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/infrastructure/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE infrastructure SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Generate QR code for an asset ────────────────────────────
// Returns a base64 PNG of the QR code
// The QR encodes a URL: http://yourapp.com/report?asset=EEU-POLE-001
router.get('/infrastructure/:id/qr', async (req, res) => {
  try {
    const [assets] = await db.query('SELECT * FROM infrastructure WHERE id = ?', [req.params.id]);
    if (assets.length === 0) return res.status(404).json({ message: 'Asset not found' });

    const asset = assets[0];
    // QR content: JSON with asset info so the frontend can parse it
    const qrData = JSON.stringify({
      asset_code: asset.asset_code,
      asset_type: asset.asset_type,
      description: asset.description,
      location: asset.location,
      latitude: asset.latitude,
      longitude: asset.longitude,
    });

    const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    res.json({ qr: qrImage, asset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── All infrastructure reports ────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.*, u.name as citizen_name, u.phone as citizen_phone,
              i.asset_type, i.description as asset_description,
              t.team_name as assigned_team
       FROM infrastructure_reports r
       JOIN users u ON r.citizen_id = u.id
       LEFT JOIN infrastructure i ON r.infrastructure_id = i.id
       LEFT JOIN teams t ON r.assigned_team_id = t.id
       ORDER BY r.created_at DESC`
    );
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/reports/:id/assign', async (req, res) => {
  const { team_id } = req.body;
  try {
    await db.query(
      "UPDATE infrastructure_reports SET assigned_team_id = ?, status = 'assigned' WHERE id = ?",
      [team_id, req.params.id]
    );
    res.json({ message: 'Team assigned to report' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/reports/:id/resolve', async (req, res) => {
  try {
    await db.query(
      "UPDATE infrastructure_reports SET status = 'resolved', resolved_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: 'Report resolved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── All service requests ──────────────────────────────────────
router.get('/service-requests', async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT r.*, u.name as citizen_name, t.team_name
       FROM service_requests r
       JOIN users u ON r.citizen_id = u.id
       LEFT JOIN teams t ON r.team_id = t.id
       ORDER BY r.created_at DESC`
    );
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
