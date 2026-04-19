const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken, requireRole(['team']));

// Get requests assigned to my team
router.get('/assigned', async (req, res) => {
  const teamName = req.user.team_name;
  if (!teamName) return res.status(400).json({ message: 'Team member has no team assigned' });

  try {
    const [teams] = await db.query('SELECT id FROM teams WHERE team_name = ?', [teamName]);
    if (teams.length === 0) return res.status(404).json({ message: 'Team not found' });

    const teamId = teams[0].id;
    const [requests] = await db.query(
      `SELECT r.*, u.name as citizen_name, u.phone as citizen_phone, u.service_id
       FROM service_requests r
       JOIN users u ON r.citizen_id = u.id
       WHERE r.team_id = ? AND r.status = 'assigned'
       ORDER BY r.created_at ASC`,
      [teamId]
    );
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark as completed (verify service_id)
router.put('/:id/complete', async (req, res) => {
  const requestId = req.params.id;
  const { verified_service_id } = req.body;
  const teamName = req.user.team_name;

  if (!verified_service_id) return res.status(400).json({ message: "Please enter the citizen's Service ID to verify" });

  try {
    const [teams] = await db.query('SELECT id FROM teams WHERE team_name = ?', [teamName]);
    const teamId = teams[0].id;

    const [requests] = await db.query(
      `SELECT r.*, u.service_id as citizen_service_id
       FROM service_requests r
       JOIN users u ON r.citizen_id = u.id
       WHERE r.id = ? AND r.team_id = ? AND r.status = 'assigned'`,
      [requestId, teamId]
    );

    if (requests.length === 0) return res.status(404).json({ message: 'Request not found or not assigned to your team' });

    if (requests[0].citizen_service_id !== verified_service_id) {
      return res.status(400).json({ message: 'Service ID verification failed. Please check and try again.' });
    }

    await db.query(
      `UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      [requestId]
    );
    res.json({ message: 'Service completed successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get completed requests with ratings
router.get('/completed', async (req, res) => {
  const teamName = req.user.team_name;

  try {
    const [teams] = await db.query('SELECT id FROM teams WHERE team_name = ?', [teamName]);
    const teamId = teams[0].id;

    const [requests] = await db.query(
      `SELECT r.*, rt.rating, rt.feedback, rt.created_at as rated_at
       FROM service_requests r
       LEFT JOIN ratings rt ON r.id = rt.request_id
       WHERE r.team_id = ? AND r.status = 'completed'
       ORDER BY r.completed_at DESC`,
      [teamId]
    );
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
