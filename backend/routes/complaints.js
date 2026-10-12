const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to compute SLA deadline based on priority
const calculateSLADeadline = async (priority) => {
  const slaConfig = await get('SELECT resolution_hours FROM sla_configs WHERE priority = ?', [priority]);
  const hours = slaConfig ? slaConfig.resolution_hours : (priority === 'EMERGENCY' ? 2 : priority === 'HIGH' ? 8 : priority === 'MEDIUM' ? 24 : 48);
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline.toISOString();
};

// GET /api/complaints - List complaints filtered by user role & query params
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, student_id, staff_id } = req.user;
    const { status, category, priority, hostel_block, search } = req.query;

    let sql = `
      SELECT 
        c.*,
        u_stu.name as student_name,
        u_stu.email as student_email,
        u_stu.phone as student_phone,
        s.roll_number as student_roll,
        m.staff_code,
        m.department as staff_department,
        u_stf.name as staff_name,
        (
          SELECT json_group_array(json_object('photo_url', photo_url, 'photo_type', photo_type))
          FROM complaint_photos
          WHERE complaint_id = c.id
        ) as photos,
        (
          SELECT json_object('rating', rating, 'comment', comment)
          FROM feedback
          WHERE complaint_id = c.id
        ) as feedback
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u_stu ON s.user_id = u_stu.id
      LEFT JOIN maintenance_staff m ON c.assigned_staff_id = m.id
      LEFT JOIN users u_stf ON m.user_id = u_stf.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based restrictions
    if (role === 'STUDENT') {
      sql += ' AND c.student_id = ?';
      params.push(student_id);
    } else if (role === 'MAINTENANCE_STAFF') {
      sql += ' AND c.assigned_staff_id = ?';
      params.push(staff_id);
    }

    // Additional optional filters
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND c.category = ?';
      params.push(category);
    }
    if (priority) {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }
    if (hostel_block) {
      sql += ' AND c.hostel_block = ?';
      params.push(hostel_block);
    }
    if (search) {
      sql += ' AND (c.complaint_code LIKE ? OR c.description LIKE ? OR c.room_number LIKE ? OR u_stu.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = await query(sql, params);

    // Format nested json strings from SQLite if present
    const formatted = complaints.map(c => ({
      ...c,
      photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : c.photos || [],
      feedback: typeof c.feedback === 'string' ? JSON.parse(c.feedback) : c.feedback || null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// POST /api/complaints - Raise a new complaint (Student only)
router.post('/', authenticateToken, requireRole('STUDENT'), upload.single('photo'), async (req, res) => {
  try {
    const { category, priority, description, room_number } = req.body;
    const student_id = req.user.student_id;

    if (!category || !description || !room_number) {
      return res.status(400).json({ error: 'Category, room number, and description are required.' });
    }

    const initialPriority = priority || 'MEDIUM';

    // Fetch student's hostel block
    const studentObj = await get('SELECT hostel_block FROM students WHERE id = ?', [student_id]);
    if (!studentObj) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const complaintCode = `CMP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const slaDeadline = await calculateSLADeadline(initialPriority);

    const result = await run(
      `INSERT INTO complaints 
       (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, created_at, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, ?)`,
      [complaintCode, student_id, category, initialPriority, description, room_number, studentObj.hostel_block, slaDeadline]
    );

    const complaintId = result.id;

    // Save photo if uploaded
    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      await run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, 'STUDENT_PROBLEM', ?)`,
        [complaintId, photoUrl, req.user.id]
      );
    } else if (req.body.photo_url) {
      // Support demo photo URL if sent in json body
      await run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, 'STUDENT_PROBLEM', ?)`,
        [complaintId, req.body.photo_url, req.user.id]
      );
    }

    // Record history
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [complaintId, 'SUBMITTED', 'PENDING', req.user.id, 'Complaint submitted by student']
    );

    // Notify Warden/Admin
    const adminUsers = await query(`SELECT id FROM users WHERE role = 'WARDEN_ADMIN'`);
    for (const admin of adminUsers) {
      const isEmerg = initialPriority === 'EMERGENCY';
      await run(
        `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, ?)`,
        [
          admin.id,
          complaintId,
          `${isEmerg ? '🚨 EMERGENCY' : '📌 New'} Complaint ${complaintCode} (${category}) raised for ${studentObj.hostel_block} Room ${room_number}`,
          isEmerg ? 'EMERGENCY' : 'INFO'
        ]
      );
    }

    res.status(201).json({
      message: 'Complaint submitted successfully 🎉',
      complaint: {
        id: complaintId,
        complaint_code: complaintCode,
        category,
        priority: initialPriority,
        status: 'PENDING',
        room_number,
        hostel_block: studentObj.hostel_block,
        sla_deadline: slaDeadline
      }
    });
  } catch (error) {
    console.error('Error raising complaint:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// GET /api/complaints/:id - Detailed complaint view (Photos, Timeline, Assignment, Follow-ups, Feedback)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await get(`
      SELECT 
        c.*,
        u_stu.name as student_name,
        u_stu.email as student_email,
        u_stu.phone as student_phone,
        s.roll_number as student_roll,
        m.staff_code,
        m.department as staff_department,
        m.specialization as staff_specialization,
        u_stf.name as staff_name,
        u_stf.phone as staff_phone,
        u_stf.email as staff_email
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u_stu ON s.user_id = u_stu.id
      LEFT JOIN maintenance_staff m ON c.assigned_staff_id = m.id
      LEFT JOIN users u_stf ON m.user_id = u_stf.id
      WHERE c.id = ?
    `, [id]);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Access control check
    if (req.user.role === 'STUDENT' && complaint.student_id !== req.user.student_id) {
      return res.status(403).json({ error: 'Access denied to this complaint' });
    }
    if (req.user.role === 'MAINTENANCE_STAFF' && complaint.assigned_staff_id !== req.user.staff_id) {
      return res.status(403).json({ error: 'Access denied to this complaint' });
    }

    // Fetch photos
    const photos = await query(`
      SELECT cp.*, u.name as uploader_name, u.role as uploader_role
      FROM complaint_photos cp
      JOIN users u ON cp.uploaded_by = u.id
      WHERE cp.complaint_id = ?
      ORDER BY cp.uploaded_at ASC
    `, [id]);

    // Fetch timeline history
    const history = await query(`
      SELECT ch.*, u.name as changed_by_name, u.role as changed_by_role
      FROM complaint_history ch
      JOIN users u ON ch.changed_by = u.id
      WHERE ch.complaint_id = ?
      ORDER BY ch.timestamp ASC
    `, [id]);

    // Fetch follow-up requests
    const followups = await query(`
      SELECT f.*, u.name as student_name
      FROM followup_requests f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.complaint_id = ?
      ORDER BY f.created_at DESC
    `, [id]);

    // Fetch feedback
    const feedback = await get(`
      SELECT f.*, u.name as student_name
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.complaint_id = ?
    `, [id]);

    res.json({
      ...complaint,
      photos,
      history,
      followups,
      feedback
    });
  } catch (error) {
    console.error('Error fetching complaint detail:', error);
    res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// PATCH /api/complaints/:id/admin-review (Admin modifies category or priority)
router.patch('/:id/admin-review', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, priority, remarks } = req.body;

    const complaint = await get('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    let newCategory = category || complaint.category;
    let newPriority = priority || complaint.priority;
    let newSLA = complaint.sla_deadline;

    if (priority && priority !== complaint.priority) {
      newSLA = await calculateSLADeadline(priority);
    }

    await run(
      `UPDATE complaints SET category = ?, priority = ?, sla_deadline = ? WHERE id = ?`,
      [newCategory, newPriority, newSLA, id]
    );

    // Record history
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [
        id, 
        complaint.status, 
        complaint.status, 
        req.user.id, 
        remarks || `Admin updated review: Category set to ${newCategory}, Priority set to ${newPriority}`
      ]
    );

    res.json({ message: 'Complaint review updated successfully', category: newCategory, priority: newPriority, sla_deadline: newSLA });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint review' });
  }
});

// POST /api/complaints/:id/assign (Admin assigns staff member)
router.post('/:id/assign', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;

    if (!staff_id) return res.status(400).json({ error: 'Staff ID is required' });

    const complaint = await get('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const staffObj = await get(`
      SELECT m.id, m.user_id, u.name, u.email 
      FROM maintenance_staff m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = ?
    `, [staff_id]);
    if (!staffObj) return res.status(404).json({ error: 'Maintenance staff not found' });

    const oldStatus = complaint.status;
    const newStatus = 'ASSIGNED';

    await run(
      `UPDATE complaints SET assigned_staff_id = ?, status = ?, assigned_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [staff_id, newStatus, id]
    );

    // Record assignment
    await run(
      `INSERT INTO complaint_assignments (complaint_id, staff_id, assigned_by) VALUES (?, ?, ?)`,
      [id, staff_id, req.user.id]
    );

    // Update staff active workload
    await run(`UPDATE maintenance_staff SET current_workload = current_workload + 1 WHERE id = ?`, [staff_id]);

    // Record history
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [id, oldStatus, newStatus, req.user.id, `Assigned to ${staffObj.name}`]
    );

    // Notify Staff
    await run(
      `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, ?)`,
      [
        staffObj.user_id,
        id,
        `🛠️ New complaint ${complaint.complaint_code} (${complaint.category}) assigned to you for ${complaint.hostel_block} Room ${complaint.room_number}`,
        complaint.priority === 'EMERGENCY' ? 'EMERGENCY' : 'INFO'
      ]
    );

    // Notify Student
    const studentUser = await get('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?', [complaint.student_id]);
    if (studentUser) {
      await run(
        `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, 'INFO')`,
        [studentUser.id, id, `👨‍🔧 Staff ${staffObj.name} has been assigned to your complaint ${complaint.complaint_code}`]
      );
    }

    res.json({ message: `Assigned complaint to ${staffObj.name} successfully` });
  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({ error: 'Failed to assign maintenance staff' });
  }
});

// PATCH /api/complaints/:id/status (Staff or Admin updates status: ACCEPTED, IN_PROGRESS, RESOLVED, etc.)
router.patch('/:id/status', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, remarks, photo_type } = req.body;

    const complaint = await get('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const oldStatus = complaint.status;
    let started_at = complaint.started_at;
    let resolved_at = complaint.resolved_at;

    if (new_status === 'IN_PROGRESS' && !started_at) {
      started_at = new Date().toISOString();
    }
    if (new_status === 'RESOLVED') {
      resolved_at = new Date().toISOString();
      // Decrease staff workload
      if (complaint.assigned_staff_id) {
        await run(`UPDATE maintenance_staff SET current_workload = MAX(0, current_workload - 1) WHERE id = ?`, [complaint.assigned_staff_id]);
      }
    }

    await run(
      `UPDATE complaints SET status = ?, started_at = ?, resolved_at = ? WHERE id = ?`,
      [new_status, started_at, resolved_at, id]
    );

    // Handle photo upload if present
    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      const type = photo_type || (new_status === 'RESOLVED' ? 'AFTER_REPAIR' : 'BEFORE_REPAIR');
      await run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, ?, ?)`,
        [id, photoUrl, type, req.user.id]
      );
    } else if (req.body.photo_url) {
      const type = photo_type || (new_status === 'RESOLVED' ? 'AFTER_REPAIR' : 'BEFORE_REPAIR');
      await run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, ?, ?)`,
        [id, req.body.photo_url, type, req.user.id]
      );
    }

    // Record history
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [id, oldStatus, new_status, req.user.id, remarks || `Status updated to ${new_status}`]
    );

    // Notify Student on RESOLVED
    if (new_status === 'RESOLVED') {
      const studentUser = await get('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?', [complaint.student_id]);
      if (studentUser) {
        await run(
          `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, 'SUCCESS')`,
          [studentUser.id, id, `✅ Your complaint ${complaint.complaint_code} has been marked as RESOLVED. Please verify!` ]
        );
      }
    }

    res.json({ message: `Complaint status updated to ${new_status}` });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// POST /api/complaints/:id/verify - Student verifies resolution (Confirm -> CLOSED OR Need Help -> FOLLOW_UP_REQUESTED)
router.post('/:id/verify', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rating, comment, follow_up_reason } = req.body; // action: 'CONFIRM' or 'NEED_HELP'

    const complaint = await get('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (complaint.student_id !== req.user.student_id) {
      return res.status(403).json({ error: 'Unauthorized to verify this complaint' });
    }

    if (action === 'CONFIRM') {
      // Mark CLOSED
      await run(`UPDATE complaints SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);

      // Record feedback
      if (rating) {
        await run(
          `INSERT INTO feedback (complaint_id, student_id, rating, comment) VALUES (?, ?, ?, ?)`,
          [id, req.user.student_id, rating, comment || '']
        );
      }

      await run(
        `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, 'CLOSED', ?, ?)`,
        [id, complaint.status, req.user.id, `Student verified and confirmed resolution (${rating ? rating + ' stars' : 'No rating'})`]
      );

      res.json({ message: 'Resolution confirmed and complaint closed. Thank you for your feedback!' });
    } else if (action === 'NEED_HELP') {
      if (!follow_up_reason) {
        return res.status(400).json({ error: 'Follow-up reason is required.' });
      }

      // Mark FOLLOW_UP_REQUESTED
      await run(`UPDATE complaints SET status = 'FOLLOW_UP_REQUESTED' WHERE id = ?`, [id]);

      // Insert follow-up request
      await run(
        `INSERT INTO followup_requests (complaint_id, student_id, reason, status) VALUES (?, ?, ?, 'REQUESTED')`,
        [id, req.user.student_id, follow_up_reason]
      );

      await run(
        `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, 'FOLLOW_UP_REQUESTED', ?, ?)`,
        [id, complaint.status, req.user.id, `Student requested follow-up: "${follow_up_reason}"`]
      );

      // Notify Staff & Admin
      if (complaint.assigned_staff_id) {
        const staffObj = await get('SELECT user_id FROM maintenance_staff WHERE id = ?', [complaint.assigned_staff_id]);
        if (staffObj) {
          await run(
            `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, 'WARNING')`,
            [staffObj.user_id, id, `⚠️ Student requested follow-up on ${complaint.complaint_code}: "${follow_up_reason}"`]
          );
        }
      }

      const admins = await query(`SELECT id FROM users WHERE role = 'WARDEN_ADMIN'`);
      for (const admin of admins) {
        await run(
          `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, 'WARNING')`,
          [admin.id, id, `⚠️ Follow-up request submitted for ${complaint.complaint_code}`]
        );
      }

      res.json({ message: 'Follow-up request submitted successfully. Maintenance staff will re-inspect.' });
    } else {
      res.status(400).json({ error: 'Invalid verification action' });
    }
  } catch (error) {
    console.error('Error verifying complaint:', error);
    res.status(500).json({ error: 'Failed to process student verification' });
  }
});

// POST /api/complaints/:id/resolve-dispute (Admin resolves dispute)
router.post('/:id/resolve-dispute', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, remarks, reassign_staff_id } = req.body; // decision: 'FORCE_CLOSE' or 'REASSIGN'

    const complaint = await get('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (decision === 'FORCE_CLOSE') {
      await run(`UPDATE complaints SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
      await run(
        `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, 'CLOSED', ?, ?)`,
        [id, complaint.status, req.user.id, `Admin dispute resolution: Closed by Warden. Remarks: ${remarks || 'None'}`]
      );
      res.json({ message: 'Dispute resolved: Complaint closed by Warden' });
    } else if (decision === 'REASSIGN' && reassign_staff_id) {
      await run(`UPDATE complaints SET assigned_staff_id = ?, status = 'ASSIGNED' WHERE id = ?`, [reassign_staff_id, id]);
      await run(
        `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, 'ASSIGNED', ?, ?)`,
        [id, complaint.status, req.user.id, `Admin dispute resolution: Reassigned to staff ID ${reassign_staff_id}. Remarks: ${remarks || 'None'}`]
      );
      res.json({ message: 'Dispute resolved: Complaint reassigned to new staff' });
    } else {
      res.status(400).json({ error: 'Invalid dispute resolution parameters' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

module.exports = router;
