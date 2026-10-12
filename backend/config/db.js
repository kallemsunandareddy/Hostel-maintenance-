const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'hostelcare.db');

// Ensure data folder exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisified helper methods for clean async/await code
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Initialize schema
const initSchema = async () => {
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE_STAFF')) NOT NULL,
      phone TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      hostel_block TEXT NOT NULL,
      room_number TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      staff_code TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      specialization TEXT NOT NULL,
      availability_status TEXT DEFAULT 'AVAILABLE',
      current_workload INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_code TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')) NOT NULL,
      description TEXT NOT NULL,
      room_number TEXT NOT NULL,
      hostel_block TEXT NOT NULL,
      status TEXT CHECK(status IN (
        'SUBMITTED', 'PENDING', 'ASSIGNED', 'ACCEPTED', 
        'IN_PROGRESS', 'RESOLVED', 'STUDENT_VERIFICATION', 
        'CLOSED', 'FOLLOW_UP_REQUESTED', 'ESCALATED'
      )) DEFAULT 'SUBMITTED',
      assigned_staff_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      started_at DATETIME,
      resolved_at DATETIME,
      closed_at DATETIME,
      sla_deadline DATETIME,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (assigned_staff_id) REFERENCES maintenance_staff(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      photo_type TEXT CHECK(photo_type IN ('STUDENT_PROBLEM', 'BEFORE_REPAIR', 'AFTER_REPAIR', 'FOLLOW_UP')) NOT NULL,
      uploaded_by INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES maintenance_staff(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      remarks TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS followup_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'REQUESTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      staff_remarks TEXT,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      complaint_id INTEGER,
      message TEXT NOT NULL,
      notification_type TEXT DEFAULT 'INFO',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS direct_help_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      staff_id INTEGER,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      room_number TEXT NOT NULL,
      status TEXT CHECK(status IN ('PENDING', 'ANSWERED', 'RESOLVED', 'CLOSED')) DEFAULT 'PENDING',
      staff_reply TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replied_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (staff_id) REFERENCES maintenance_staff(id)
    );

    CREATE TABLE IF NOT EXISTS sla_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      priority TEXT UNIQUE NOT NULL,
      resolution_hours INTEGER NOT NULL
    );
  `;

  // Run initial statement batch
  db.exec(schemaSQL, (err) => {
    if (err) {
      console.error('Error initializing schema:', err);
    } else {
      console.log('Database tables initialized successfully.');
    }
  });
};

module.exports = {
  db,
  query,
  get,
  run,
  initSchema
};
