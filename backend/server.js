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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
