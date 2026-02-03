const prisma = require('../../config/database');
const { AuthenticationError } = require('../../utils/errors');

const houseResolvers = {
  Query: {
    house: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.house.findUnique({ where: { id } });
    },

    houses: async (_, { schoolId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.house.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' },
      });
    },
  },

  Mutation: {
    createHouse: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.house.create({ data: { ...input, points: 0 } });
    },

    updateHouse: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await prisma.house.update({ where: { id }, data: input });
    },

    deleteHouse: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      await prisma.house.delete({ where: { id } });
      return { success: true, message: 'House deleted successfully' };
    },
  },

  House: {
    school: async (parent) => await prisma.school.findUnique({ where: { id: parent.schoolId } }),
  },
};

module.exports = houseResolvers;
