const prisma = require('../../config/database');
const supportService = require('../../services/supportService');
const { AuthenticationError } = require('../../utils/errors');

const supportResolvers = {
  Query: {
    supportMessage: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await supportService.getMessageById(id);
    },

    supportMessages: async (_, { pagination = {}, status }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }
      
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const result = await supportService.getMessages({ page, limit, status });
      
      return {
        edges: result.data,
        pageInfo: result.pagination,
        unreadCount: result.unreadCount || 0,
      };
    },

    mySupportMessages: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await supportService.getUserMessages(user.id);
    },
  },

  Mutation: {
    createSupportMessage: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await supportService.createMessage({
        ...input,
        userId: user.id,
        schoolId: user.schoolId,
      });
    },

    updateSupportMessage: async (_, { id, input }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }
      return await supportService.respondToMessage(id, input);
    },

    markSupportMessageAsRead: async (_, { id }, { user }) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new AuthenticationError('Insufficient permissions');
      }
      await supportService.markAsRead(id);
      return { success: true, message: 'Message marked as read' };
    },
  },

  SupportMessage: {
    school: async (parent) => parent.schoolId ? await prisma.school.findUnique({ where: { id: parent.schoolId } }) : null,
    user: async (parent) => await prisma.user.findUnique({ where: { id: parent.userId } }),
  },
};

module.exports = supportResolvers;
