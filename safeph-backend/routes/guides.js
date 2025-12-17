const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /guides
router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE is_published = TRUE';
    const params = [];
    let idx = 1;

    if (category) {
      where += ` AND category = $${idx++}`;
      params.push(category);
    }

    if (search) {
      where += ` AND (title ILIKE $${idx} OR description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const result = await db.query(
      `SELECT id, title, category, description, thumbnail_url, updated_at, views 
       FROM guides ${where} 
       ORDER BY updated_at DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        guides: result.rows,
        pagination: {
          current_page: Number(page),
          total_pages: 1,
          total_items: result.rows.length
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
