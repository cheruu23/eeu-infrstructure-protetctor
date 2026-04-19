const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken, requireRole(['electrician']));

// Get my group info
router.get('/my-group', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `, [req.user.id]);
    res.json({ group: rows[0] || null });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get assigned requests for my group
router.get('/assigned', async (req, res) => {
  try {
    const [groups] = await db.query(
      'SELECT group_id FROM group_members WHERE user_id = ?', [req.user.id]
    );
    if (groups.length === 0) return res.json({ requests: [] });
    const groupId = groups[0].group_id;

    const [requests] = await db.query(`
      SELECT r.*, u.name as citizen_name, u.phone as citizen_phone, u.service_id
      FROM service_requests r
      JOIN users u ON r.citizen_id = u.id
      WHERE r.group_id = ? AND r.status = 'assigned'
      ORDER BY r.created_at ASC
    `, [groupId]);
    res.json({ requests });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Complete a request — verify citizen service_id
router.put('/:id/complete', async (req, res) => {
  const { verified_service_id } = req.body;
  if (!verified_service_id) return res.status(400).json({ message: "Enter the citizen's Service ID to verify" });

  try {
    const [groups] = await db.query('SELECT group_id FROM group_members WHERE user_id = ?', [req.user.id]);
    if (groups.length === 0) return res.status(403).json({ message: 'You are not in any group' });
    const groupId = groups[0].group_id;

    const [requests] = await db.query(`
      SELECT r.*, u.service_id as citizen_service_id
      FROM service_requests r JOIN users u ON r.citizen_id = u.id
      WHERE r.id = ? AND r.group_id = ? AND r.status = 'assigned'
    `, [req.params.id, groupId]);

    if (requests.length === 0) return res.status(404).json({ message: 'Request not found or not assigned to your group' });
    if (requests[0].citizen_service_id !== verified_service_id) {
      return res.status(400).json({ message: 'Service ID verification failed.' });
    }

    await db.query("UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = ?", [req.params.id]);
    res.json({ message: 'Service completed successfully!' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get completed requests with ratings
router.get('/completed', async (req, res) => {
  try {
    const [groups] = await db.query('SELECT group_id FROM group_members WHERE user_id = ?', [req.user.id]);
    if (groups.length === 0) return res.json({ requests: [] });
    const groupId = groups[0].group_id;

    const [requests] = await db.query(`
      SELECT r.*, rt.rating, rt.feedback, rt.created_at as rated_at
      FROM service_requests r
      LEFT JOIN ratings rt ON r.id = rt.request_id
      WHERE r.group_id = ? AND r.status = 'completed'
      ORDER BY r.completed_at DESC
    `, [groupId]);
    res.json({ requests });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
