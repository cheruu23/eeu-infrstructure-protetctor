const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// createPool keeps multiple connections ready instead of opening/closing one each time
// This is better for performance under multiple requests
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// .promise() lets us use async/await instead of callbacks
const promisePool = pool.promise();

module.exports = promisePool;
