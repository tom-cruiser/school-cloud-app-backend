const prisma = require('../../config/database');
const libraryService = require('../../services/libraryService');
const { AuthenticationError } = require('../../utils/errors');

const libraryResolvers = {
  Query: {
    libraryBook: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await libraryService.getBookById(id);
    },

    libraryBooks: async (_, { schoolId, pagination = {}, search }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const result = await libraryService.getBooks({ schoolId, page, limit, search });
      
      return {
        edges: result.data,
        pageInfo: result.pagination,
      };
    },

    libraryLoan: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await libraryService.getLoanById(id);
    },

    libraryLoans: async (_, { schoolId, pagination = {}, status }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      
      const result = await libraryService.getLoans({ schoolId, page, limit, status });
      
      return {
        edges: result.data,
        pageInfo: result.pagination,
      };
    },
  },

  Mutation: {
    createLibraryBook: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await libraryService.createBook(input);
    },

    updateLibraryBook: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await libraryService.updateBook(id, input);
    },

    deleteLibraryBook: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      await libraryService.deleteBook(id);
      return { success: true, message: 'Book deleted successfully' };
    },

    createLibraryLoan: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await libraryService.loanBook(input);
    },

    returnLibraryLoan: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await libraryService.returnBook(id);
    },
  },

  LibraryBook: {
    school: async (parent) => await prisma.school.findUnique({ where: { id: parent.schoolId } }),
  },

  LibraryLoan: {
    book: async (parent) => await prisma.libraryBook.findUnique({ where: { id: parent.bookId } }),
    student: async (parent) => await prisma.student.findUnique({ where: { id: parent.studentId } }),
  },
};

module.exports = libraryResolvers;
