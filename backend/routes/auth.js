const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fetch extra role details
    let studentInfo = null;
    let staffInfo = null;

    if (user.role === 'STUDENT') {
      studentInfo = await get('SELECT * FROM students WHERE user_id = ?', [user.id]);
    } else if (user.role === 'MAINTENANCE_STAFF') {
      staffInfo = await get('SELECT * FROM maintenance_staff WHERE user_id = ?', [user.id]);
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student_id: studentInfo ? studentInfo.id : null,
      staff_id: staffInfo ? staffInfo.id : null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        student: studentInfo,
        staff: staffInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let studentInfo = null;
    let staffInfo = null;

    if (user.role === 'STUDENT') {
      studentInfo = await get('SELECT * FROM students WHERE user_id = ?', [user.id]);
    } else if (user.role === 'MAINTENANCE_STAFF') {
      staffInfo = await get('SELECT * FROM maintenance_staff WHERE user_id = ?', [user.id]);
    }

    res.json({
      user: {
        ...user,
        student: studentInfo,
        staff: staffInfo
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
