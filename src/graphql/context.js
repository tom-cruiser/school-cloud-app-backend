const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Get authentication context for GraphQL
 */
const getAuthContext = async ({ req }) => {
  const context = {
    req,
    user: null,
  };

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return context;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        logger.warn('Expired token in GraphQL request');
      } else if (jwtError.name === 'JsonWebTokenError') {
        logger.warn('Invalid token in GraphQL request');
      }
      return context;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return context;
    }

    // Add name field
    user.name = `${user.firstName} ${user.lastName}`;

    // Attach user to context
    context.user = user;
  } catch (error) {
    logger.error('Error in GraphQL context:', error);
  }

  return context;
};

module.exports = { getAuthContext };
