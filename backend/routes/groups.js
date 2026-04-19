const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Admin: CRUD for groups
router.get('/', verifyToken, requireRole(['admin', 'approver']), async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT g.*, COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id ORDER BY g.name
    `);
    res.json({ groups });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id/members', verifyToken, requireRole(['admin', 'approver']), async (req, res) => {
  try {
    const [members] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
    `, [req.params.id]);
    res.json({ members });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Group name is required' });
  try {
    const [r] = await db.query('INSERT INTO groups (name, description) VALUES (?, ?)', [name, description || null]);
    res.status(201).json({ message: 'Group created', id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Group name already exists' });
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  const { name, description } = req.body;
  try {
    await db.query('UPDATE groups SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id]);
    res.json({ message: 'Group updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'Group deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Add electrician to group
router.post('/:id/members', verifyToken, requireRole(['admin']), async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id is required' });
  try {
    // Verify user is an electrician
    const [users] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'electrician'", [user_id]);
    if (users.length === 0) return res.status(400).json({ message: 'User is not an electrician' });
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [req.params.id, user_id]);
    res.status(201).json({ message: 'Electrician added to group' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Already a member of this group' });
    res.status(500).json({ message: e.message });
  }
});

// Remove electrician from group
router.delete('/:id/members/:userId', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
