const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/reports/summary - Detailed summary report for export
router.get('/summary', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, category, block, status } = req.query;

    let sql = `
      SELECT 
        c.complaint_code,
        c.category,
        c.priority,
        c.status,
        c.hostel_block,
        c.room_number,
        u_stu.name as student_name,
        u_stu.email as student_email,
        s.roll_number,
        u_stf.name as staff_name,
        m.department as staff_department,
        c.created_at,
        c.resolved_at,
        c.closed_at,
        fb.rating as student_rating,
        fb.comment as student_feedback
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u_stu ON s.user_id = u_stu.id
      LEFT JOIN maintenance_staff m ON c.assigned_staff_id = m.id
      LEFT JOIN users u_stf ON m.user_id = u_stf.id
      LEFT JOIN feedback fb ON fb.complaint_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ' AND c.category = ?';
      params.push(category);
    }
    if (block) {
      sql += ' AND c.hostel_block = ?';
      params.push(block);
    }
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.created_at DESC';

    const records = await query(sql, params);

    res.json({
      generated_at: new Date().toISOString(),
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/export-csv - Generate CSV content download
router.get('/export-csv', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const records = await query(`
      SELECT 
        c.complaint_code,
        c.category,
        c.priority,
        c.status,
        c.hostel_block,
        c.room_number,
        u_stu.name as student_name,
        s.roll_number,
        u_stf.name as staff_name,
        c.created_at,
        c.resolved_at
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u_stu ON s.user_id = u_stu.id
      LEFT JOIN maintenance_staff m ON c.assigned_staff_id = m.id
      LEFT JOIN users u_stf ON m.user_id = u_stf.id
      ORDER BY c.created_at DESC
    `);

    let csv = 'Complaint ID,Category,Priority,Status,Block,Room,Student Name,Roll No,Assigned Staff,Created At,Resolved At\n';
    records.forEach(r => {
      csv += `"${r.complaint_code}","${r.category}","${r.priority}","${r.status}","${r.hostel_block}","${r.room_number}","${r.student_name}","${r.roll_number}","${r.staff_name || 'Unassigned'}","${r.created_at}","${r.resolved_at || 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=hostelcare-report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router;
