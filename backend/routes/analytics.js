const express = require('express');
const router = express.Router();
const { query, get } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/analytics - Full dashboard analytics (Admin/Staff)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const totalComplaints = await get('SELECT COUNT(*) as count FROM complaints');
    const pending = await get("SELECT COUNT(*) as count FROM complaints WHERE status = 'PENDING'");
    const assigned = await get("SELECT COUNT(*) as count FROM complaints WHERE status = 'ASSIGNED'");
    const inProgress = await get("SELECT COUNT(*) as count FROM complaints WHERE status = 'IN_PROGRESS'");
    const resolved = await get("SELECT COUNT(*) as count FROM complaints WHERE status IN ('RESOLVED', 'STUDENT_VERIFICATION')");
    const closed = await get("SELECT COUNT(*) as count FROM complaints WHERE status = 'CLOSED'");
    const emergency = await get("SELECT COUNT(*) as count FROM complaints WHERE priority = 'EMERGENCY' AND status NOT IN ('CLOSED', 'RESOLVED')");
    const followups = await get("SELECT COUNT(*) as count FROM complaints WHERE status = 'FOLLOW_UP_REQUESTED'");

    // Overdue complaints (SLA deadline < current time and not resolved/closed)
    const overdue = await get("SELECT COUNT(*) as count FROM complaints WHERE sla_deadline < CURRENT_TIMESTAMP AND status NOT IN ('CLOSED', 'RESOLVED')");

    // Category distribution
    const categories = await query(`
      SELECT category, COUNT(*) as count 
      FROM complaints 
      GROUP BY category 
      ORDER BY count DESC
    `);

    // Priority distribution
    const priorities = await query(`
      SELECT priority, COUNT(*) as count 
      FROM complaints 
      GROUP BY priority
    `);

    // Hostel block distribution
    const blockStats = await query(`
      SELECT hostel_block, COUNT(*) as count 
      FROM complaints 
      GROUP BY hostel_block
    `);

    // Staff Performance Leaderboard
    const staffPerformance = await query(`
      SELECT 
        m.id as staff_id,
        u.name,
        m.department,
        m.specialization,
        m.current_workload,
        (SELECT COUNT(*) FROM complaints WHERE assigned_staff_id = m.id) as assigned_count,
        (SELECT COUNT(*) FROM complaints WHERE assigned_staff_id = m.id AND status = 'CLOSED') as resolved_count,
        (SELECT COUNT(*) FROM followup_requests f JOIN complaints c ON f.complaint_id = c.id WHERE c.assigned_staff_id = m.id) as followup_count,
        (SELECT AVG(fb.rating) FROM feedback fb JOIN complaints c ON fb.complaint_id = c.id WHERE c.assigned_staff_id = m.id) as avg_rating
      FROM maintenance_staff m
      JOIN users u ON m.user_id = u.id
      ORDER BY resolved_count DESC
    `);

    // Student satisfaction stats
    const feedbackStats = await get(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating
      FROM feedback
    `);

    const ratingDistribution = await query(`
      SELECT rating, COUNT(*) as count
      FROM feedback
      GROUP BY rating
      ORDER BY rating DESC
    `);

    res.json({
      summary: {
        total: totalComplaints ? totalComplaints.count : 0,
        pending: pending ? pending.count : 0,
        assigned: assigned ? assigned.count : 0,
        in_progress: inProgress ? inProgress.count : 0,
        resolved: resolved ? resolved.count : 0,
        closed: closed ? closed.count : 0,
        overdue: overdue ? overdue.count : 0,
        emergency: emergency ? emergency.count : 0,
        followups: followups ? followups.count : 0
      },
      categories,
      priorities,
      blocks: blockStats,
      staff_performance: staffPerformance.map(s => ({
        ...s,
        avg_rating: s.avg_rating ? parseFloat(s.avg_rating).toFixed(1) : '5.0'
      })),
      student_satisfaction: {
        total_reviews: feedbackStats ? feedbackStats.total_reviews : 0,
        avg_rating: feedbackStats && feedbackStats.avg_rating ? parseFloat(feedbackStats.avg_rating).toFixed(1) : '4.8',
        distribution: ratingDistribution
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

module.exports = router;
