const prisma = require('../../config/database');
const { AuthenticationError } = require('../../utils/errors');

const userResolvers = {
  Query: {
    user: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          schoolId: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },

    users: async (_, { pagination = {}, search, role, schoolId }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (role) where.role = role;
      if (schoolId) where.schoolId = schoolId;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            schoolId: true,
            avatar: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        edges: users,
        pageInfo: {
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          currentPage: page,
          pageSize: limit,
        },
      };
    },
  },

  Mutation: {},

  User: {
    name: (parent) => `${parent.firstName} ${parent.lastName}`,
    school: async (parent) => {
      if (!parent.schoolId) return null;
      return await prisma.school.findUnique({
        where: { id: parent.schoolId },
      });
    },
  },
};

module.exports = userResolvers;
