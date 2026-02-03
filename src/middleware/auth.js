const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError } = require('../utils/errors');
const prisma = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      }
      throw new AuthenticationError('Token verification failed');
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
        teacher: {
          select: {
            id: true,
          },
        },
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // Add name field
    user.name = `${user.firstName} ${user.lastName}`;

    // Add teacherId or studentId if applicable
    if (user.teacher) {
      user.teacherId = user.teacher.id;
    }
    if (user.student) {
      user.studentId = user.student.id;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          schoolId: true,
          createdAt: true,
        },
      });
      if (user && user.isActive) {
        user.name = `${user.firstName} ${user.lastName}`;
        req.user = user;
      }
    }
  } catch (error) {
    // Silent fail for optional auth
  }
  next();
};

/**
 * Authorize specific roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (roles.length && !roles.includes(req.user.role)) {
      throw new AuthenticationError('Insufficient permissions');
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
};
