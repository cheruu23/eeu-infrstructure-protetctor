const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Citizen: Rate completed request
router.post('/', verifyToken, requireRole(['citizen']), async (req, res) => {
  const { request_id, rating, feedback } = req.body;
  const citizenId = req.user.id;

  if (!request_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Request ID and rating (1-5) are required' });
  }

  try {
    const [requests] = await db.query(
      `SELECT * FROM service_requests WHERE id = ? AND citizen_id = ? AND status = 'completed'`,
      [request_id, citizenId]
    );
    if (requests.length === 0) return res.status(404).json({ message: 'Request not found, not completed, or does not belong to you' });

    const [existing] = await db.query(
      'SELECT * FROM ratings WHERE request_id = ? AND citizen_id = ?', [request_id, citizenId]
    );
    if (existing.length > 0) return res.status(400).json({ message: 'You have already rated this request' });

    await db.query(
      'INSERT INTO ratings (request_id, citizen_id, rating, feedback) VALUES (?, ?, ?, ?)',
      [request_id, citizenId, rating, feedback || null]
    );

    res.json({ message: 'Thank you for your feedback!', rating, feedback: feedback || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get rating for a specific request
router.get('/request/:request_id', async (req, res) => {
  try {
    const [ratings] = await db.query(
      `SELECT rt.*, u.name as citizen_name FROM ratings rt
       JOIN users u ON rt.citizen_id = u.id
       WHERE rt.request_id = ?`,
      [req.params.request_id]
    );
    if (ratings.length === 0) return res.json({ message: 'No rating yet', rating: null });
    res.json({ rating: ratings[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
