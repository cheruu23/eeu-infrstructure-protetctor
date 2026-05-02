const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// SSL config for Aiven (production) — skipped in local dev
const sslConfig = process.env.DB_SSL === 'true' ? {
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
      ? Buffer.from(process.env.DB_SSL_CA, 'base64').toString('utf-8')
      : undefined,
  }
} : {};

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...sslConfig,
});

const promisePool = pool.promise();
module.exports = promisePool;
