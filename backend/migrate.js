const db = require('./config/db');

const tables = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role ENUM('citizen','approver','electrician','admin') NOT NULL DEFAULT 'citizen',
      service_id VARCHAR(50),
      team_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'groups',
    sql: `CREATE TABLE IF NOT EXISTS \`groups\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'teams',
    sql: `CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'group_members',
    sql: `CREATE TABLE IF NOT EXISTS group_members (
      group_id INT NOT NULL,
      user_id INT NOT NULL,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'service_requests',
    sql: `CREATE TABLE IF NOT EXISTS service_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      citizen_id INT NOT NULL,
      service_id VARCHAR(50),
      title VARCHAR(200) NOT NULL,
      category ENUM('power_outage','billing','meter','connection','maintenance','other') NOT NULL DEFAULT 'other',
      description TEXT NOT NULL,
      location VARCHAR(255),
      photo_url VARCHAR(500),
      status ENUM('pending','approved','rejected','assigned','completed') NOT NULL DEFAULT 'pending',
      approver_id INT,
      rejection_reason TEXT,
      group_id INT,
      team_id INT,
      approved_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE SET NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )`
  },
  {
    name: 'infrastructure_reports',
    sql: `CREATE TABLE IF NOT EXISTS infrastructure_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      citizen_id INT NOT NULL,
      infrastructure_id INT,
      asset_code VARCHAR(100),
      report_type ENUM('damage','outage','vandalism','maintenance','other') NOT NULL DEFAULT 'other',
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      photo_url VARCHAR(500),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      location_address VARCHAR(255),
      status ENUM('open','assigned','resolved') NOT NULL DEFAULT 'open',
      assigned_team_id INT,
      resolved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (infrastructure_id) REFERENCES infrastructure(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL
    )`
  },
  {
    name: 'ratings',
    sql: `CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      citizen_id INT NOT NULL,
      rating TINYINT NOT NULL,
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_rating (request_id, citizen_id),
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  }
];

(async () => {
  for (const t of tables) {
    try {
      await db.query(t.sql);
      console.log('OK:', t.name);
    } catch (e) {
      console.error('FAIL:', t.name, '->', e.message);
    }
  }
  const [rows] = await db.query('SHOW TABLES');
  console.log('\nAll tables:', rows.map(r => Object.values(r)[0]).join(', '));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
