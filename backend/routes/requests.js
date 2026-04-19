const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Citizen: Submit new service request
router.post('/', verifyToken, requireRole(['citizen']), async (req, res) => {
  const { title, category, description, location, photo_url, service_id } = req.body;
  const citizenId = req.user.id;

  if (!title || !description || !service_id) {
    return res.status(400).json({ message: 'Title, description, and service_id are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO service_requests (citizen_id, service_id, title, category, description, location, photo_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [citizenId, service_id, title, category || 'other', description, location || null, photo_url || null]
    );

    res.status(201).json({ message: 'Service request submitted successfully', request_id: result.insertId, status: 'pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Citizen: Get my requests
router.get('/my', verifyToken, requireRole(['citizen']), async (req, res) => {
  const citizenId = req.user.id;

  try {
    const [requests] = await db.query(
      `SELECT r.*, t.team_name, rt.rating, rt.feedback as rating_feedback
       FROM service_requests r
       LEFT JOIN teams t ON r.team_id = t.id
       LEFT JOIN ratings rt ON r.id = rt.request_id
       WHERE r.citizen_id = ?
       ORDER BY r.created_at DESC`,
      [citizenId]
    );

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
