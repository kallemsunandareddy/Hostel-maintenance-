const express = require('express');
const router = express.Router();
const { query, run } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/sla/config
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const configs = await query('SELECT * FROM sla_configs ORDER BY resolution_hours ASC');
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SLA configuration' });
  }
});

// PUT /api/sla/config - Update SLA hours (Admin only)
router.put('/config', authenticateToken, requireRole('WARDEN_ADMIN'), async (req, res) => {
  try {
    const { configs } = req.body; // Array of { priority, resolution_hours }
    if (!Array.isArray(configs)) {
      return res.status(400).json({ error: 'Configs array required' });
    }

    for (const item of configs) {
      await run(
        'UPDATE sla_configs SET resolution_hours = ? WHERE priority = ?',
        [item.resolution_hours, item.priority]
      );
    }

    res.json({ message: 'SLA configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SLA configuration' });
  }
});

module.exports = router;
