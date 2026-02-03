const { AuthorizationError } = require('../utils/errors');

/**
 * Check if user has required role
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }

    // Convert to array if string is passed
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Check if user belongs to the school (tenant check)
 */
const belongsToSchool = (req, res, next) => {
  const { school } = req.params;
  const userRole = req.user.role;

  // Super admin can access any school
  if (userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Check if user's schoolId matches the requested school
  if (req.user.schoolId !== school) {
    return next(
      new AuthorizationError('You do not have access to this school')
    );
  }

  next();
};

/**
 * Check if user owns the resource
 */
const isOwner = (userIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.resource?.[userIdField];

    if (!resourceUserId) {
      return next(new Error('Resource not found or ownership cannot be determined'));
    }

    // Super admin can access anything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check ownership
    if (req.user.id !== resourceUserId) {
      return next(new AuthorizationError('You do not own this resource'));
    }

    next();
  };
};

module.exports = {
  authorize,
  belongsToSchool,
  isOwner,
};
