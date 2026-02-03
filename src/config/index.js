require('dotenv').config();

module.exports = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Changed from 1h to 24h for better UX
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // WebSocket
  wsPort: process.env.WS_PORT || 5001,

  // Email
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },

  // Application
  maxTeachersPerSchool: parseInt(process.env.MAX_TEACHERS_PER_SCHOOL) || 20,
  fileUploadMaxSize: parseInt(process.env.FILE_UPLOAD_MAX_SIZE) || 5242880, // 5MB
  logLevel: process.env.LOG_LEVEL || 'info',
};
