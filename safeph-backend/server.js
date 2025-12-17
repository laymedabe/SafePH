const express = require('express');
const cors = require('cors');
const historyRoutes = require('./routes/history');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const guidesRoutes = require('./routes/guides');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./websocket/handler');

console.log('authRoutes type:', typeof authRoutes);
console.log('emergencyRoutes type:', typeof emergencyRoutes);
console.log('guidesRoutes type:', typeof guidesRoutes);
console.log('authMiddleware type:', typeof authMiddleware);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true
  }
});

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts'
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/history', historyRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/emergency', authMiddleware, emergencyRoutes);
app.use('/api/v1/guides', guidesRoutes);

app.listen(process.env.PORT || 4000, () => {
  console.log('Backend running');
});

socketHandler(io);
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SafePH Server running on port ${PORT}`);
});

module.exports = { app, io };
