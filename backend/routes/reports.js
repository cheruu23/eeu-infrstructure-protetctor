const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Lookup infrastructure by asset_code (called after QR scan)
router.get('/infrastructure/lookup/:asset_code', verifyToken, async (req, res) => {
  try {
    const [assets] = await db.query(
      'SELECT * FROM infrastructure WHERE asset_code = ?', [req.params.asset_code]
    );
    if (assets.length === 0) return res.status(404).json({ message: 'Asset not found' });
    res.json({ asset: assets[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List all active infrastructure assets (for dropdowns / map)
router.get('/infrastructure', verifyToken, async (req, res) => {
  try {
    const [assets] = await db.query(
      "SELECT id, asset_code, asset_type, description, location, latitude, longitude, status FROM infrastructure ORDER BY asset_code ASC"
    );
    res.json({ assets });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Citizen: Submit infrastructure damage report
// Works with QR scan (infrastructure_id filled) OR manual (no infrastructure_id)
router.post('/', verifyToken, requireRole(['citizen']), async (req, res) => {
  const {
    infrastructure_id, asset_code,
    report_type, title, description,
    photo_url, latitude, longitude, location_address
  } = req.body;

  const citizenId = req.user.id;

  if (!report_type || !title || !description) {
    return res.status(400).json({ message: 'report_type, title, and description are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO infrastructure_reports
       (citizen_id, infrastructure_id, asset_code, report_type, title, description,
        photo_url, latitude, longitude, location_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [citizenId, infrastructure_id || null, asset_code || null,
       report_type, title, description,
       photo_url || null, latitude || null, longitude || null, location_address || null]
    );

    // If linked to infrastructure, mark it as damaged
    if (infrastructure_id) {
      await db.query("UPDATE infrastructure SET status = 'damaged' WHERE id = ?", [infrastructure_id]);
    }

    res.status(201).json({ message: 'Report submitted successfully', report_id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Citizen: Get my reports
router.get('/my', verifyToken, requireRole(['citizen']), async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.*, i.asset_type, i.description as asset_description, t.team_name as assigned_team
       FROM infrastructure_reports r
       LEFT JOIN infrastructure i ON r.infrastructure_id = i.id
       LEFT JOIN teams t ON r.assigned_team_id = t.id
       WHERE r.citizen_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
