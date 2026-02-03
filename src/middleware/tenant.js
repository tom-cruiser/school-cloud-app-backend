const prisma = require('../config/database');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

/**
 * Resolve tenant context from URL parameter
 */
const resolveTenant = async (req, res, next) => {
  try {
    const { school } = req.params;

    if (!school) {
      return next();
    }

    // Verify school exists
    const schoolData = await prisma.school.findUnique({
      where: { id: school },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
      },
    });

    if (!schoolData) {
      throw new NotFoundError('School');
    }

    if (!schoolData.isActive) {
      throw new AuthorizationError('School account is inactive');
    }

    // Attach school context to request
    req.tenant = schoolData;
    req.schoolId = schoolData.id;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to scope queries to current tenant
 */
const scopeToTenant = (req, res, next) => {
  if (!req.schoolId && req.user?.role !== 'SUPER_ADMIN') {
    return next(new AuthorizationError('Tenant context required'));
  }

  // Add tenant scope to request for use in services
  req.tenantScope = {
    schoolId: req.schoolId,
  };

  next();
};

module.exports = {
  resolveTenant,
  scopeToTenant,
};
