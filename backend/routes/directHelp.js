const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/direct-help - List direct help requests based on role
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, student_id, staff_id } = req.user;

    let sql = `
      SELECT 
        d.*,
        u_stu.name as student_name,
        u_stu.email as student_email,
        u_stu.phone as student_phone,
        s.roll_number as student_roll,
        s.hostel_block,
        u_stf.name as staff_name,
        m.department as staff_department,
        m.specialization as staff_specialization
      FROM direct_help_requests d
      JOIN students s ON d.student_id = s.id
      JOIN users u_stu ON s.user_id = u_stu.id
      LEFT JOIN maintenance_staff m ON d.staff_id = m.id
      LEFT JOIN users u_stf ON m.user_id = u_stf.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'STUDENT') {
      sql += ' AND d.student_id = ?';
      params.push(student_id);
    } else if (role === 'MAINTENANCE_STAFF') {
      // Get staff department and clean emoji prefixes
      const staffObj = await get('SELECT department FROM maintenance_staff WHERE id = ?', [staff_id]);
      let dept = staffObj ? staffObj.department : '';
      // Strip emojis
      const cleanDept = dept.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, '').trim();
      
      sql += ' AND (d.staff_id = ? OR d.staff_id IS NULL OR d.department LIKE ? OR d.department LIKE ?)';
      params.push(staff_id, `%${dept}%`, `%${cleanDept}%`);
    }

    sql += ' ORDER BY d.created_at DESC';

    const requests = await query(sql, params);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching direct help requests:', error);
    res.status(500).json({ error: 'Failed to fetch direct help requests' });
  }
});

// POST /api/direct-help - Student submits direct assistance request
router.post('/', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const { department, staff_id, subject, message, room_number } = req.body;
    const student_id = req.user.student_id;

    if (!department || !subject || !message || !room_number) {
      return res.status(400).json({ error: 'Department, subject, room number and message are required' });
    }

    const studentObj = await get(`
      SELECT s.hostel_block, u.name 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `, [student_id]);

    const result = await run(
      `INSERT INTO direct_help_requests (student_id, department, staff_id, subject, message, room_number, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [student_id, department, staff_id || null, subject, message, room_number]
    );

    const helpId = result.id;

    // Notify matching staff
    let staffUsers = [];
    if (staff_id) {
      const st = await get('SELECT user_id FROM maintenance_staff WHERE id = ?', [staff_id]);
      if (st) staffUsers.push(st);
    } else {
      staffUsers = await query(`
        SELECT m.user_id 
        FROM maintenance_staff m 
        WHERE m.department LIKE ?
      `, [`%${department}%`]);
    }

    for (const su of staffUsers) {
      await run(
        `INSERT INTO notifications (user_id, message, notification_type) VALUES (?, ?, 'INFO')`,
        [
          su.user_id,
          `💬 Direct Assistance Request from ${studentObj?.name} (${studentObj?.hostel_block} Room ${room_number}): "${subject}"`
        ]
      );
    }

    res.status(201).json({
      message: 'Direct help request sent to maintenance staff. They will contact or reply directly!',
      id: helpId
    });
  } catch (error) {
    console.error('Error creating direct help request:', error);
    res.status(500).json({ error: 'Failed to submit direct help request' });
  }
});

// PATCH /api/direct-help/:id/reply - Staff replies or resolves direct assistance request
router.patch('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_reply, status } = req.body;

    const helpReq = await get('SELECT * FROM direct_help_requests WHERE id = ?', [id]);
    if (!helpReq) return res.status(404).json({ error: 'Help request not found' });

    const newStatus = status || 'ANSWERED';

    await run(
      `UPDATE direct_help_requests 
       SET staff_reply = ?, status = ?, staff_id = COALESCE(staff_id, ?), replied_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [staff_reply, newStatus, req.user.staff_id || null, id]
    );

    // Notify student
    const studentUser = await get('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?', [helpReq.student_id]);
    if (studentUser) {
      await run(
        `INSERT INTO notifications (user_id, message, notification_type) VALUES (?, ?, 'SUCCESS')`,
        [studentUser.id, `💬 Maintenance Staff replied to your help request "${helpReq.subject}": "${staff_reply}"`]
      );
    }

    res.json({ message: 'Reply submitted successfully' });
  } catch (error) {
    console.error('Error replying to direct help request:', error);
    res.status(500).json({ error: 'Failed to reply to help request' });
  }
});

module.exports = router;
