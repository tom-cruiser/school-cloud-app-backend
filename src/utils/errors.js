const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class ApiError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    error = new ConflictError('A record with this value already exists');
  }
  if (err.code === 'P2025') {
    error = new NotFoundError('Record');
  }
  if (err.code === 'P2022') {
    error = new AppError('Database schema is out of sync. Please run Prisma migrations.', 500);
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new ValidationError('Uploaded file is too large. Maximum size is 10MB.');
    } else {
      error = new ValidationError(err.message || 'Invalid file upload request');
    }
  }

  // Generic bad request errors coming from middleware
  if (err.statusCode === 400 && !(err instanceof AppError)) {
    error = new ValidationError(err.message || 'Invalid request');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Send response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ApiError,
  errorHandler,
  asyncHandler,
};
