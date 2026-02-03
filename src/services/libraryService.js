const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class LibraryService {
  // ==================== BOOKS ====================

  async getBooks(schoolId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      const where = {
        schoolId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(category && { category })
      };

      const [books, total] = await Promise.all([
        prisma.book.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            _count: {
              select: { loans: true }
            }
          }
        }),
        prisma.book.count({ where })
      ]);

      return {
        items: books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting books:', error);
      throw error;
    }
  }

  async getBookById(schoolId, bookId) {
    try {
      const book = await prisma.book.findFirst({
        where: {
          id: bookId,
          schoolId
        },
        include: {
          loans: {
            take: 10,
            orderBy: { loanDate: 'desc' },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { loans: true }
          }
        }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      return book;
    } catch (error) {
      logger.error('Error getting book by ID:', error);
      throw error;
    }
  }

  async createBook(schoolId, bookData) {
    try {
      const book = await prisma.book.create({
        data: {
          ...bookData,
          schoolId,
          availableCopies: bookData.totalCopies || 1
        }
      });

      logger.info(`Book created: ${book.title}`, { bookId: book.id });
      return book;
    } catch (error) {
      logger.error('Error creating book:', error);
      throw error;
    }
  }

  async updateBook(schoolId, bookId, bookData) {
    try {
      const book = await prisma.book.findFirst({
        where: { id: bookId, schoolId }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: bookData
      });

      logger.info(`Book updated: ${updatedBook.title}`, { bookId });
      return updatedBook;
    } catch (error) {
      logger.error('Error updating book:', error);
      throw error;
    }
  }

  async deleteBook(schoolId, bookId) {
    try {
      const book = await prisma.book.findFirst({
        where: { id: bookId, schoolId },
        include: {
          loans: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      if (book.loans.length > 0) {
        throw new Error('Cannot delete book with active loans');
      }

      await prisma.book.delete({
        where: { id: bookId }
      });

      logger.info(`Book deleted: ${book.title}`, { bookId });
      return { message: 'Book deleted successfully' };
    } catch (error) {
      logger.error('Error deleting book:', error);
      throw error;
    }
  }

  // ==================== LOANS ====================

  async getLoans(schoolId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = '',
        studentId = '',
        bookId = ''
      } = filters;

      const skip = (page - 1) * limit;

      const where = {
        schoolId,
        ...(status && { status }),
        ...(studentId && { studentId }),
        ...(bookId && { bookId })
      };

      const [loans, total] = await Promise.all([
        prisma.loan.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { loanDate: 'desc' },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                coverImage: true
              }
            },
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }),
        prisma.loan.count({ where })
      ]);

      return {
        items: loans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting loans:', error);
      throw error;
    }
  }

  async createLoan(schoolId, loanData) {
    try {
      const { bookId, studentId, dueDate, remarks } = loanData;

      // Verify book exists and has available copies
      const book = await prisma.book.findFirst({
        where: { id: bookId, schoolId }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      if (book.availableCopies <= 0) {
        throw new Error('No available copies of this book');
      }

      // Verify student exists
      const student = await prisma.student.findFirst({
        where: { id: studentId, schoolId }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student already has an active loan for this book
      const existingLoan = await prisma.loan.findFirst({
        where: {
          bookId,
          studentId,
          status: 'ACTIVE'
        }
      });

      if (existingLoan) {
        throw new Error('Student already has an active loan for this book');
      }

      // Create loan and update book availability in a transaction
      const loan = await prisma.$transaction(async (tx) => {
        const newLoan = await tx.loan.create({
          data: {
            schoolId,
            bookId,
            studentId,
            dueDate: new Date(dueDate),
            remarks,
            status: 'ACTIVE'
          },
          include: {
            book: true,
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        await tx.book.update({
          where: { id: bookId },
          data: {
            availableCopies: {
              decrement: 1
            }
          }
        });

        return newLoan;
      });

      logger.info(`Loan created for book: ${book.title}`, {
        loanId: loan.id,
        studentId
      });

      return loan;
    } catch (error) {
      logger.error('Error creating loan:', error);
      throw error;
    }
  }

  async returnLoan(schoolId, loanId, fine = 0) {
    try {
      const loan = await prisma.loan.findFirst({
        where: { id: loanId, schoolId },
        include: { book: true }
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status === 'RETURNED') {
        throw new Error('Loan already returned');
      }

      // Update loan and book availability in a transaction
      const updatedLoan = await prisma.$transaction(async (tx) => {
        const returned = await tx.loan.update({
          where: { id: loanId },
          data: {
            status: 'RETURNED',
            returnDate: new Date(),
            fine: parseFloat(fine) || 0
          },
          include: {
            book: true,
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        await tx.book.update({
          where: { id: loan.bookId },
          data: {
            availableCopies: {
              increment: 1
            }
          }
        });

        return returned;
      });

      logger.info(`Book returned: ${loan.book.title}`, { loanId });
      return updatedLoan;
    } catch (error) {
      logger.error('Error returning loan:', error);
      throw error;
    }
  }

  async renewLoan(schoolId, loanId, newDueDate) {
    try {
      const loan = await prisma.loan.findFirst({
        where: { id: loanId, schoolId }
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status !== 'ACTIVE') {
        throw new Error('Only active loans can be renewed');
      }

      const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
          dueDate: new Date(newDueDate)
        },
        include: {
          book: true,
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      logger.info(`Loan renewed`, { loanId });
      return updatedLoan;
    } catch (error) {
      logger.error('Error renewing loan:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  async getStatistics(schoolId) {
    try {
      const [
        totalBooks,
        totalCopies,
        availableCopies,
        activeLoans,
        overdueLoans,
        totalLoans
      ] = await Promise.all([
        prisma.book.count({ where: { schoolId } }),
        prisma.book.aggregate({
          where: { schoolId },
          _sum: { totalCopies: true }
        }),
        prisma.book.aggregate({
          where: { schoolId },
          _sum: { availableCopies: true }
        }),
        prisma.loan.count({
          where: { schoolId, status: 'ACTIVE' }
        }),
        prisma.loan.count({
          where: {
            schoolId,
            status: 'ACTIVE',
            dueDate: { lt: new Date() }
          }
        }),
        prisma.loan.count({ where: { schoolId } })
      ]);

      const categories = await prisma.book.groupBy({
        by: ['category'],
        where: { schoolId, category: { not: null } },
        _count: true
      });

      return {
        totalBooks,
        totalCopies: totalCopies._sum.totalCopies || 0,
        availableCopies: availableCopies._sum.availableCopies || 0,
        activeLoans,
        overdueLoans,
        totalLoans,
        categories: categories.map(c => ({
          category: c.category,
          count: c._count
        }))
      };
    } catch (error) {
      logger.error('Error getting library statistics:', error);
      throw error;
    }
  }

  // ==================== BULK IMPORT ====================

  async bulkImportBooks(schoolId, books) {
    try {
      const results = {
        success: [],
        errors: []
      };

      for (const bookData of books) {
        try {
          const book = await this.createBook(schoolId, {
            ...bookData,
            availableCopies: bookData.totalCopies || 1
          });
          results.success.push({ ...bookData, id: book.id });
        } catch (error) {
          results.errors.push({
            ...bookData,
            error: error.message
          });
        }
      }

      logger.info(`Bulk import completed: ${results.success.length} success, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      logger.error('Error in bulk import:', error);
      throw error;
    }
  }
}

module.exports = new LibraryService();
