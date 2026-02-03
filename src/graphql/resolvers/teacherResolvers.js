const prisma = require('../../config/database');
const teacherService = require('../../services/teacherService');
const { AuthenticationError } = require('../../utils/errors');

const teacherResolvers = {
  Query: {
    teacher: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await teacherService.getTeacherById(id);
    },

    teachers: async (_, { schoolId, pagination = {}, search }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const result = await teacherService.getTeachers({ schoolId, page, limit, search });
      
      return {
        edges: result.data,
        pageInfo: result.pagination,
      };
    },
  },

  Mutation: {
    createTeacher: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await teacherService.createTeacher(input);
    },

    updateTeacher: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await teacherService.updateTeacher(id, input);
    },

    deleteTeacher: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      await teacherService.deleteTeacher(id);
      return { success: true, message: 'Teacher deleted successfully' };
    },
  },

  Teacher: {
    school: async (parent) => await prisma.school.findUnique({ where: { id: parent.schoolId } }),
    user: async (parent) => await prisma.user.findUnique({ where: { id: parent.userId } }),
  },
};

module.exports = teacherResolvers;
