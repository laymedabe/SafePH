const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const emergencyService = require('../services/emergency');

// Trigger SOS
router.post('/sos', async (req, res, next) => {
  try {
    const { location, emergency_type, notes, media } = req.body;
    const userId = req.user.userId;

    const emergencyId = uuidv4();

    await db.query(
      `INSERT INTO emergency_events 
       (id, user_id, type, status, emergency_type, location, notes, media_urls, created_at)
       VALUES ($1, $2, 'sos', 'active', $3, $4, $5, $6, NOW())`,
      [emergencyId, userId, emergency_type, JSON.stringify(location), notes, media || null]
    );

    const alerts = await emergencyService.sendSOSAlerts(userId, emergencyId, location);
    const responders = await emergencyService.findNearestResponders(location);

    res.status(201).json({
      success: true,
      data: {
        emergency_id: emergencyId,
        status: 'active',
        created_at: new Date().toISOString(),
        alerts_sent: alerts,
        nearest_responders: responders
      },
      message: 'SOS alert activated. Help is on the way.'
    });
  } catch (err) {
    next(err);
  }
});

// History
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const type = req.query.type;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let baseQuery = 'FROM emergency_events WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      baseQuery += ` AND type = $${paramCount}`;
      params.push(type);
    }
    if (status) {
      paramCount++;
      baseQuery += ` AND status = $${paramCount}`;
      params.push(status);
    }

    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(dataQuery, params);
    const countResult = await db.query(
      `SELECT COUNT(*) ${baseQuery}`,
      params.slice(0, paramCount)
    );

    const totalItems = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      data: {
        emergencies: result.rows.map((e) => ({
          ...e,
          location: e.location ? e.location : null
        })),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: limit
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
