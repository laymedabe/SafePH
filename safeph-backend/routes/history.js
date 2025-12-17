// safeph-backend/routes/history.js
const express = require('express');
const prisma = require('../services/db');

const router = express.Router();

// GET /api/history
router.get('/', async (req, res, next) => {
  try {
    const emergencyHistory = await prisma.emergencyHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const guideHistory = await prisma.guideHistory.findMany({
      orderBy: { viewedAt: 'desc' },
    });
    res.json({ emergencyHistory, guideHistory });
  } catch (err) {
    next(err);
  }
});

// POST /api/history/emergency
router.post('/emergency', async (req, res, next) => {
  try {
    const { type, date, location, status, responders, color } = req.body;
    const item = await prisma.emergencyHistory.create({
      data: {
        type,
        date: new Date(date),
        location,
        status,
        responders,
        color,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/history/guide
router.post('/guide', async (req, res, next) => {
  try {
    const { guideId, guideTitle, viewedAt } = req.body;
    const item = await prisma.guideHistory.create({
      data: {
        guideId,
        guideTitle,
        viewedAt: new Date(viewedAt),
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
