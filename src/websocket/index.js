const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');

class SocketIOServer {
  constructor() {
    this.io = null;
    this.clients = new Map(); // Map<userId, socket>
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use((socket, next) => {
      // Auth via handshake
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        socket.userId = decoded.userId;
        return next();
      } catch (err) {
        return next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO server initialized');
  }

  /**
   * Handle new Socket.IO connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    this.clients.set(userId, socket);
    logger.info(`Socket.IO client connected: ${userId}`);

    // Handle custom events
    socket.on('message:send', (data) => {
      this.handleMessage(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.clients.delete(userId);
      logger.info(`Socket.IO client disconnected: ${userId} (${reason})`);
    });
  }

  /**
   * Handle incoming messages
   */
  handleMessage(socket, data) {
    // Implement your message handling logic here
    logger.info(`Received message from ${socket.userId}: ${JSON.stringify(data)}`);
    // Example: echo message back
    socket.emit('message', { echo: data });
  }

  /**
   * Emit event to all users in a school
   */
  emitToSchool(schoolId, eventName, data) {
    try {
      if (!this.io) {
        logger.warn('Socket.IO server not initialized, cannot emit event');
        return;
      }

      // For now, emit to all connected clients since we don't have school-based rooms
      // TODO: Implement proper room-based broadcasting by school
      this.io.emit(eventName, { schoolId, ...data });
      
      logger.info(`Emitted event '${eventName}' to school ${schoolId} with data:`, data);
    } catch (error) {
      logger.error(`Failed to emit event '${eventName}' to school ${schoolId}:`, error);
    }
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId, eventName, data) {
    try {
      const socket = this.clients.get(userId);
      if (socket) {
        socket.emit(eventName, data);
        logger.info(`Emitted event '${eventName}' to user ${userId}`);
      } else {
        logger.warn(`User ${userId} not connected, cannot emit event '${eventName}'`);
      }
    } catch (error) {
      logger.error(`Failed to emit event '${eventName}' to user ${userId}:`, error);
    }
  }
}

module.exports = new SocketIOServer();
