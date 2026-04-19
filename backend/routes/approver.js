const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken, requireRole(['approver']));

const CATEGORIES = ['power_outage', 'billing', 'meter', 'connection', 'maintenance', 'other'];

// Get pending — supports ?category= filter
router.get('/pending', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = `SELECT r.*, u.name as citizen_name, u.phone as citizen_phone, u.service_id
               FROM service_requests r JOIN users u ON r.citizen_id = u.id
               WHERE r.status = 'pending'`;
    const params = [];
    if (category) { sql += ' AND r.category = ?'; params.push(category); }
    sql += ' ORDER BY r.created_at ASC';
    const [requests] = await db.query(sql, params);
    res.json({ requests });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get all requests — supports ?category= and ?status= filters
router.get('/all', async (req, res) => {
  try {
    const { category, status } = req.query;
    let sql = `SELECT r.*, u.name as citizen_name, u.phone as citizen_phone, u.service_id,
                      g.name as group_name
               FROM service_requests r
               JOIN users u ON r.citizen_id = u.id
               LEFT JOIN groups g ON r.group_id = g.id
               WHERE 1=1`;
    const params = [];
    if (category) { sql += ' AND r.category = ?'; params.push(category); }
    if (status)   { sql += ' AND r.status = ?';   params.push(status); }
    sql += ' ORDER BY r.created_at DESC';
    const [requests] = await db.query(sql, params);
    res.json({ requests });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Stats by category (for approver overview)
router.get('/stats', async (req, res) => {
  try {
    const [byCategory] = await db.query(`
      SELECT category, COUNT(*) as count FROM service_requests GROUP BY category
    `);
    const [byStatus] = await db.query(`
      SELECT status, COUNT(*) as count FROM service_requests GROUP BY status
    `);
    res.json({ byCategory, byStatus });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Approve
router.put('/:id/approve', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ? AND status = "pending"', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found or already processed' });
    await db.query("UPDATE service_requests SET status = 'approved', approver_id = ?, approved_at = NOW() WHERE id = ?", [req.user.id, req.params.id]);
    res.json({ message: 'Approved' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Reject
router.put('/:id/reject', async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });
  try {
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ? AND status = "pending"', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found or already processed' });
    await db.query("UPDATE service_requests SET status = 'rejected', approver_id = ?, rejection_reason = ? WHERE id = ?", [req.user.id, reason, req.params.id]);
    res.json({ message: 'Rejected' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Assign to electrician group
router.put('/:id/assign-group', async (req, res) => {
  const { group_id } = req.body;
  if (!group_id) return res.status(400).json({ message: 'group_id is required' });
  try {
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ? AND status = "approved"', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found or not approved yet' });
    await db.query("UPDATE service_requests SET status = 'assigned', group_id = ? WHERE id = ?", [group_id, req.params.id]);
    res.json({ message: 'Group assigned' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get all groups (for dropdown)
router.get('/groups', async (req, res) => {
  try {
    const [groups] = await db.query('SELECT * FROM groups ORDER BY name');
    res.json({ groups });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Keep /teams for backward compat (returns groups)
router.get('/teams', async (req, res) => {
  try {
    const [groups] = await db.query('SELECT id, name as team_name FROM groups ORDER BY name');
    res.json({ teams: groups });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
