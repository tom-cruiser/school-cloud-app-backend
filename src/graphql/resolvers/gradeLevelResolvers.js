const prisma = require('../../config/database');
const { AuthenticationError } = require('../../utils/errors');

const gradeLevelResolvers = {
  Query: {
    gradeLevel: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.gradeLevel.findUnique({ where: { id } });
    },

    gradeLevels: async (_, { schoolId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.gradeLevel.findMany({
        where: { schoolId },
        orderBy: { order: 'asc' },
      });
    },
  },

  Mutation: {
    createGradeLevel: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.gradeLevel.create({ data: input });
    },

    updateGradeLevel: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.gradeLevel.update({ where: { id }, data: input });
    },

    deleteGradeLevel: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      await prisma.gradeLevel.delete({ where: { id } });
      return { success: true, message: 'Grade level deleted successfully' };
    },
  },

  GradeLevel: {
    school: async (parent) => await prisma.school.findUnique({ where: { id: parent.schoolId } }),
  },
};

module.exports = gradeLevelResolvers;
