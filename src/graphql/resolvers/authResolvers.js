const authService = require('../../services/authService');
const { AuthenticationError } = require('../../utils/errors');

const authResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return user;
    },
  },

  Mutation: {
    login: async (_, { input }) => {
      const result = await authService.login(input);
      return result;
    },

    register: async (_, { input }) => {
      const user = await authService.register(input);
      return user;
    },

    refreshToken: async (_, { refreshToken }) => {
      const result = await authService.refreshAccessToken(refreshToken);
      return result;
    },

    logout: async (_, { refreshToken }) => {
      await authService.logout(refreshToken);
      return {
        success: true,
        message: 'Logged out successfully',
      };
    },

    updateProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      const updatedUser = await authService.updateProfile(user.id, input);
      return updatedUser;
    },

    changePassword: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      await authService.changePassword(user.id, input.currentPassword, input.newPassword);
      return {
        success: true,
        message: 'Password changed successfully',
      };
    },
  },
};

module.exports = authResolvers;
