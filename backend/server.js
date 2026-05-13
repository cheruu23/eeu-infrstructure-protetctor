const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const db = require('./config/db');
const authRoutes      = require('./routes/auth');
const requestRoutes   = require('./routes/requests');
const approverRoutes  = require('./routes/approver');
const electricianRoutes = require('./routes/electrician');
const ratingRoutes    = require('./routes/ratings');
const adminRoutes     = require('./routes/admin');
const reportRoutes    = require('./routes/reports');
const groupRoutes     = require('./routes/groups');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',        authRoutes);
app.use('/api/requests',   requestRoutes);
app.use('/api/approver',   approverRoutes);
app.use('/api/electrician', electricianRoutes);
app.use('/api/ratings',    ratingRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/groups',     groupRoutes);

app.get('/', (req, res) => res.json({ message: 'EEU Service System API is running!' }));

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ success: true, message: 'Database connected!', result: rows[0].result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Run safe migrations on startup — adds missing columns without dropping data
async function runMigrations() {
  const migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL",
    "ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS category ENUM('power_outage','billing','meter','connection','maintenance','other') DEFAULT 'other'",
    "ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS group_id INT NULL",
    "ALTER TABLE infrastructure_reports ADD COLUMN IF NOT EXISTS group_id INT NULL",
  ];
  for (const sql of migrations) {
    try { await db.query(sql); }
    catch (e) { /* column may already exist — safe to ignore */ }
  }
  console.log('Migrations checked.');
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await runMigrations();
});
