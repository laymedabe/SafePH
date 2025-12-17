const jwt = require('jsonwebtoken');
// const redis = require('redis');  // disable for now

// remove Redis client / subscriber / publisher code

const activeConnections = new Map();
const userSockets = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userPhone = decoded.phone;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    activeConnections.set(socket.id, { userId: socket.userId });
    userSockets.set(socket.userId, socket.id);

    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });

    socket.on('emergency:sos', (data) => {
      const emergencyData = {
        emergency_id: data.emergency_id,
        user_id: socket.userId,
        type: 'sos',
        location: data.location,
        emergency_type: data.emergency_type,
        notes: data.notes,
        timestamp: new Date().toISOString()
      };

      io.to('responders:active').emit('emergency:new', emergencyData);

      socket.emit('emergency:sos:confirmed', {
        success: true,
        emergency_id: data.emergency_id,
        message: 'SOS alert sent successfully'
      });
    });

    socket.on('disconnect', () => {
      activeConnections.delete(socket.id);
      userSockets.delete(socket.userId);
    });
  });
};
