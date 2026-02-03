const prisma = require('../config/database');
const { cleanObject } = require('../utils/helpers');

class UserService {
  /**
   * Get all users (with optional filters)
   */
  async getAllUsers(filters = {}) {
    const { search, role, isActive, skip = 0, take = 10 } = filters;
    const where = cleanObject({
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    });
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          schoolId: true,
          createdAt: true,
          school: {
            select: {
              id: true,
              name: true,
              domain: true,
            }
          }
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total };
  }
}

module.exports = new UserService();
