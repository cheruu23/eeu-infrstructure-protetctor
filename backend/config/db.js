const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// createPool keeps multiple connections ready instead of opening/closing one each time
// This is better for performance under multiple requests
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // 'localhost'
  user: process.env.DB_USER,         // 'root'
  password: process.env.DB_PASSWORD, // your mysql password
  database: process.env.DB_NAME,     // 'eeu_service_db'
  waitForConnections: true,          // queue requests if all connections are busy
  connectionLimit: 10,               // max 10 simultaneous connections
  queueLimit: 0                      // unlimited queue size
});

// .promise() lets us use async/await instead of callbacks
const promisePool = pool.promise();

module.exports = promisePool;
