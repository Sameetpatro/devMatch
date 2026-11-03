const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const chatService = require('../services/chat.service');
const presenceService = require('../services/presence.service');
const env = require('../config/env');

let io = null;

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin === '*' ? '*' : env.clientOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // Authentication Handshake Middleware
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = verifyToken(token);
      socket.user = {
        id: decoded.sub,
        email: decoded.email,
        userType: decoded.userType || 'DEVELOPER',
      };
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: #${userId} (${socket.user.email}) - Socket ID: ${socket.id}`);

    // Update presence in Redis
    await presenceService.heartbeat(userId);
    io.emit('presence_change', { userId, isOnline: true });

    // Join personal user notification channel
    socket.join(`user_${userId}`);

    // 1. Join a Match Chat Room
    socket.on('join_match', async ({ matchId }, callback) => {
      try {
        const roomName = `match_${matchId}`;
        socket.join(roomName);
        console.log(`[Socket] User #${userId} joined room: ${roomName}`);
        if (typeof callback === 'function') {
          callback({ status: 'ok', matchId });
        }
      } catch (err) {
        if (typeof callback === 'function') callback({ status: 'error', error: err.message });
      }
    });

    // 2. Leave Match Room
    socket.on('leave_match', ({ matchId }) => {
      const roomName = `match_${matchId}`;
      socket.leave(roomName);
      console.log(`[Socket] User #${userId} left room: ${roomName}`);
    });

    // 3. Send Real-Time Chat Message
    socket.on('send_message', async ({ matchId, content }, callback) => {
      try {
        const result = await chatService.sendMessage({
          matchId,
          senderId: userId,
          content,
        });

        const roomName = `match_${matchId}`;
        // Broadcast to all participants in this match room
        io.to(roomName).emit('receive_message', result.message);

        // Notify recipient's personal channel if not in room
        io.to(`user_${result.recipientId}`).emit('new_message_notification', {
          matchId,
          message: result.message,
        });

        if (typeof callback === 'function') {
          callback({ status: 'ok', data: result.message });
        }
      } catch (err) {
        console.error(`[Socket] send_message error: ${err.message}`);
        if (typeof callback === 'function') {
          callback({ status: 'error', error: err.message });
        }
      }
    });

    // 4. Typing Indicator
    socket.on('typing_start', ({ matchId }) => {
      socket.to(`match_${matchId}`).emit('user_typing', { matchId, userId });
    });

    socket.on('typing_stop', ({ matchId }) => {
      socket.to(`match_${matchId}`).emit('user_stop_typing', { matchId, userId });
    });

    // 5. Mark Read
    socket.on('mark_read', async ({ matchId }) => {
      try {
        await chatService.markAsRead(matchId, userId);
        socket.to(`match_${matchId}`).emit('messages_read', { matchId, readerId: userId });
      } catch (err) {
        console.warn(`[Socket] mark_read error: ${err.message}`);
      }
    });

    // 6. Disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: #${userId}`);
      // Check if user still has other active sockets
      const matchingSockets = await io.in(`user_${userId}`).fetchSockets();
      if (matchingSockets.length === 0) {
        await presenceService.setOffline(userId);
        io.emit('presence_change', { userId, isOnline: false });
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  initSocketServer,
  getIO,
};

