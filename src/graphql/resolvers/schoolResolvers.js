const prisma = require('../../config/database');
const schoolService = require('../../services/schoolService');
const { AuthenticationError } = require('../../utils/errors');

const schoolResolvers = {
  Query: {
    school: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await schoolService.getSchoolById(id);
    },

    schools: async (_, { pagination = {}, search }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const result = await schoolService.getSchools({ page, limit, search });
      
      return {
        edges: result.data,
        pageInfo: result.pagination,
      };
    },
  },

  Mutation: {
    createSchool: async (_, { input }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }
      return await schoolService.createSchool(input);
    },

    updateSchool: async (_, { id, input }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }
      return await schoolService.updateSchool(id, input);
    },

    deleteSchool: async (_, { id }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }
      await schoolService.deleteSchool(id);
      return {
        success: true,
        message: 'School deleted successfully',
      };
    },
  },

  School: {
    _count: async (parent) => {
      const [users, students, teachers] = await Promise.all([
        prisma.user.count({ where: { schoolId: parent.id } }),
        prisma.student.count({ where: { schoolId: parent.id } }),
        prisma.teacher.count({ where: { schoolId: parent.id } }),
      ]);

      return { users, students, teachers };
    },

    users: async (parent) => {
      return await prisma.user.findMany({
        where: { schoolId: parent.id },
      });
    },

    students: async (parent) => {
      return await prisma.student.findMany({
        where: { schoolId: parent.id },
      });
    },

    teachers: async (parent) => {
      return await prisma.teacher.findMany({
        where: { schoolId: parent.id },
      });
    },
  },
};

module.exports = schoolResolvers;
