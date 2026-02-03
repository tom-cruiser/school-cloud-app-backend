const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const prisma = require('./config/database');
const http = require('http');
const wsServer = require('./websocket');

const PORT = config.port;

// Store server instance
let httpServer = null;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close HTTP server
    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
      logger.info('HTTP server stopped');
    }

    // Close Apollo Server
    if (app.locals.apolloServer) {
      await app.locals.apolloServer.stop();
      logger.info('Apollo Server stopped');
    }

    // Close database connection
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Start server with GraphQL and WebSocket
const startServer = async () => {
  try {
    // Create HTTP server
    httpServer = http.createServer(app);

    // Initialize WebSocket server
    wsServer.initialize(httpServer);
    global.wsServer = wsServer; // Make it globally available
    
    // Start Apollo Server
    const apolloServer = app.locals.apolloServer;
    await apolloServer.start();
    
    // Apply Apollo middleware to Express
    apolloServer.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false, // Already handled by Express CORS
    });

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
      logger.info(`🔌 WebSocket server initialized`);
      logger.info(`🎯 GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
      logger.info(`📚 REST API: http://localhost:${PORT}/api/${config.apiVersion}`);
      logger.info(`🎮 GraphQL Playground: http://localhost:${PORT}${apolloServer.graphqlPath}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled Rejection:', error);
      httpServer.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      httpServer.close(() => {
        process.exit(1);
      });
    });

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return httpServer;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, startServer };
