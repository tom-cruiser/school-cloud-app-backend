const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./utils/errors');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const { createApolloServer } = require('./graphql');

const app = express();

// Security middleware - Modified for GraphQL
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Disable HTTP caching for API responses to prevent 304 errors
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// HTTP request logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting (skip for GraphQL endpoint to use GraphQL's own rate limiting)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/graphql')) {
    return next();
  }
  apiLimiter(req, res, next);
});

// Initialize Apollo Server
const apolloServer = createApolloServer();

// Apollo server will be started in server.js with async/await
app.locals.apolloServer = apolloServer;

// Swagger API Documentation (must be before main routes)
app.use(
  `/api/${config.apiVersion}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'School Cloud API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
  })
);

// Swagger JSON spec endpoint
app.get(`/api/${config.apiVersion}/docs.json`, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// REST API routes (kept for backward compatibility)
app.use(`/api/${config.apiVersion}`, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'School Cloud API',
    version: config.apiVersion,
    graphql: `/graphql`,
    rest: `/api/${config.apiVersion}`,
    documentation: `/api/${config.apiVersion}/docs`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
