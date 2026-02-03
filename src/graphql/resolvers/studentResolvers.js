const prisma = require('../../config/database');
const studentService = require('../../services/studentService');
const { AuthenticationError } = require('../../utils/errors');

const studentResolvers = {
  Query: {
    student: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await studentService.getStudentById(id);
    },

    students: async (_, { schoolId, pagination = {}, search }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const result = await studentService.getStudents({ schoolId, page, limit, search });
      
      return {
        edges: result.data,
        pageInfo: result.pagination,
      };
    },
  },

  Mutation: {
    createStudent: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await studentService.createStudent(input);
    },

    updateStudent: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await studentService.updateStudent(id, input);
    },

    deleteStudent: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      await studentService.deleteStudent(id);
      return { success: true, message: 'Student deleted successfully' };
    },
  },

  Student: {
    school: async (parent) => await prisma.school.findUnique({ where: { id: parent.schoolId } }),
    user: async (parent) => parent.userId ? await prisma.user.findUnique({ where: { id: parent.userId } }) : null,
    gradeLevel: async (parent) => parent.gradeLevelId ? await prisma.gradeLevel.findUnique({ where: { id: parent.gradeLevelId } }) : null,
    house: async (parent) => parent.houseId ? await prisma.house.findUnique({ where: { id: parent.houseId } }) : null,
  },
};

module.exports = studentResolvers;
