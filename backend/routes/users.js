const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, get, run } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/users/students (Admin only)
router.get('/students', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const students = await query(`
      SELECT s.id as student_id, u.id as user_id, u.name, u.email, u.phone, u.status, s.roll_number, s.hostel_block, s.room_number, s.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/users/students (Admin creates student account)
router.post('/students', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { name, email, password, phone, roll_number, hostel_block, room_number } = req.body;

    if (!name || !email || !password || !roll_number || !hostel_block || !room_number) {
      return res.status(400).json({ error: 'Missing required student details' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingRoll = await get('SELECT id FROM students WHERE roll_number = ?', [roll_number]);
    if (existingRoll) {
      return res.status(400).json({ error: 'Student with this Roll Number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);

    const userRes = await run(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, passHash, 'STUDENT', phone || null]
    );

    const studentRes = await run(
      'INSERT INTO students (user_id, roll_number, hostel_block, room_number) VALUES (?, ?, ?, ?)',
      [userRes.id, roll_number, hostel_block, room_number]
    );

    res.status(201).json({
      message: 'Student account created successfully',
      student: {
        student_id: studentRes.id,
        user_id: userRes.id,
        name,
        email,
        roll_number,
        hostel_block,
        room_number
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student account' });
  }
});

// GET /api/users/staff (Admin or authenticated users to view maintenance staff)
router.get('/staff', authenticateToken, async (req, res) => {
  try {
    const staffMembers = await query(`
      SELECT 
        m.id as staff_id, 
        u.id as user_id, 
        u.name, 
        u.email, 
        u.phone, 
        m.staff_code, 
        m.department, 
        m.specialization, 
        m.availability_status,
        (
          SELECT COUNT(*) 
          FROM complaints c 
          WHERE c.assigned_staff_id = m.id 
          AND c.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'FOLLOW_UP_REQUESTED')
        ) as current_workload
      FROM maintenance_staff m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.department ASC, u.name ASC
    `);
    res.json(staffMembers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

// POST /api/users/staff (Admin creates maintenance staff account)
router.post('/staff', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { name, email, password, phone, department, specialization } = req.body;

    if (!name || !email || !password || !department || !specialization) {
      return res.status(400).json({ error: 'Missing required maintenance staff details' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const staffCode = `STF-${department.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);

    const userRes = await run(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, passHash, 'MAINTENANCE_STAFF', phone || null]
    );

    const staffRes = await run(
      'INSERT INTO maintenance_staff (user_id, staff_code, department, specialization, current_workload) VALUES (?, ?, ?, ?, ?)',
      [userRes.id, staffCode, department, specialization, 0]
    );

    res.status(201).json({
      message: 'Maintenance staff account created successfully',
      staff: {
        staff_id: staffRes.id,
        user_id: userRes.id,
        name,
        email,
        staff_code: staffCode,
        department,
        specialization
      }
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create maintenance staff account' });
  }
});

module.exports = router;
