const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { phone_number, email, name, password, location } = req.body;

    if (!phone_number || !name || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Phone number, name, and password are required' }
      });
    }

    const existingUser = await db.query(
      'SELECT id FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User already exists' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await db.query(
      `INSERT INTO users (id, phone_number, email, name, password_hash, location, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, phone_number, email, name, created_at`,
      [userId, phone_number, email, name, hashedPassword, JSON.stringify(location || null)]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, phone: user.phone_number },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone_number: user.phone_number,
          email: user.email,
          name: user.name,
          verified: false,
          created_at: user.created_at
        },
        token,
        refresh_token: refreshToken
      },
      message: 'Registration successful. Please verify your phone number.'
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { phone_number, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone number or password' }
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone number or password' }
      });
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone_number },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone_number: user.phone_number,
          name: user.name
        },
        token,
        refresh_token: refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
});

// Verify phone
router.post('/verify-phone', async (req, res, next) => {
  try {
    const { phone_number } = req.body;
    await db.query('UPDATE users SET verified = true WHERE phone_number = $1', [phone_number]);
    res.json({ success: true, message: 'Phone number verified successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
