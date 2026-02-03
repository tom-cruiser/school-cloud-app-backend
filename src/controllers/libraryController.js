const libraryService = require('../services/libraryService');
const exportService = require('../utils/exportService');
const logger = require('../config/logger');
const Joi = require('joi');
const fs = require('fs').promises;

// Validation schemas
const createBookSchema = Joi.object({
  isbn: Joi.string().allow('', null).optional(),
  title: Joi.string().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required'
  }),
  author: Joi.string().required().messages({
    'string.empty': 'Author is required',
    'any.required': 'Author is required'
  }),
  publisher: Joi.string().allow('', null).optional(),
  publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).allow(null).optional(),
  category: Joi.string().allow('', null).optional(),
  totalCopies: Joi.number().integer().min(1).default(1),
  description: Joi.string().allow('', null).optional(),
  coverImage: Joi.string().uri().allow('', null).optional()
});

const createLoanSchema = Joi.object({
  bookId: Joi.string().uuid().required(),
  studentId: Joi.string().uuid().required(),
  dueDate: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null).optional()
});

class LibraryController {
  // ==================== BOOKS ====================

  async getBooks(req, res, next) {
    try {
      const { schoolId } = req.user;
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        category: req.query.category,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await libraryService.getBooks(schoolId, filters);

      res.status(200).json({
        success: true,
        message: 'Books retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookById(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { id } = req.params;

      const book = await libraryService.getBookById(schoolId, id);

      res.status(200).json({
        success: true,
        message: 'Book retrieved successfully',
        data: book
      });
    } catch (error) {
      next(error);
    }
  }

  async createBook(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { error, value } = createBookSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const book = await libraryService.createBook(schoolId, value);

      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: book
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBook(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { id } = req.params;
      const { error, value } = createBookSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const book = await libraryService.updateBook(schoolId, id, value);

      res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        data: book
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBook(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { id } = req.params;

      const result = await libraryService.deleteBook(schoolId, id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LOANS ====================

  async getLoans(req, res, next) {
    try {
      const { schoolId } = req.user;
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        studentId: req.query.studentId,
        bookId: req.query.bookId
      };

      const result = await libraryService.getLoans(schoolId, filters);

      res.status(200).json({
        success: true,
        message: 'Loans retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async createLoan(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { error, value } = createLoanSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const loan = await libraryService.createLoan(schoolId, value);

      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  async returnLoan(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { id } = req.params;
      const { fine } = req.body;

      const loan = await libraryService.returnLoan(schoolId, id, fine);

      res.status(200).json({
        success: true,
        message: 'Book returned successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  async renewLoan(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { id } = req.params;
      const { dueDate } = req.body;

      if (!dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Due date is required'
        });
      }

      const loan = await libraryService.renewLoan(schoolId, id, dueDate);

      res.status(200).json({
        success: true,
        message: 'Loan renewed successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATISTICS ====================

  async getStatistics(req, res, next) {
    try {
      const { schoolId } = req.user;

      const stats = await libraryService.getStatistics(schoolId);

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== EXPORT ====================

  async exportBooks(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { format = 'excel' } = req.query;

      // Get all books without pagination for export
      const result = await libraryService.getBooks(schoolId, { limit: 10000 });
      const books = result.items || [];

      // Log for debugging
      logger.info(`Export request - schoolId: ${schoolId}, format: ${format}, books count: ${books.length}`);
      if (books.length > 0) {
        logger.info(`First book sample:`, { 
          isbn: books[0].isbn,
          title: books[0].title,
          author: books[0].author 
        });
      }

      // Check if there are books to export
      if (books.length === 0) {
        logger.warn(`No books found for export`, { schoolId });
        return res.status(404).json({
          success: false,
          message: 'No books found to export. Please add books to your library first.'
        });
      }

      logger.info(`Exporting ${books.length} books as ${format}`, { schoolId });

      let buffer;
      let filename;
      let contentType;

      switch (format.toLowerCase()) {
        case 'excel':
          const workbook = await exportService.exportBooksToExcel(books);
          buffer = await workbook.xlsx.writeBuffer();
          filename = `library-books-${Date.now()}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'pdf':
          buffer = await exportService.exportBooksToPDF(books);
          filename = `library-books-${Date.now()}.pdf`;
          contentType = 'application/pdf';
          break;

        case 'csv':
          buffer = Buffer.from(exportService.exportBooksToCSV(books));
          filename = `library-books-${Date.now()}.csv`;
          contentType = 'text/csv';
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid format. Use excel, pdf, or csv'
          });
      }

      if (!buffer || buffer.length === 0) {
        logger.error(`Failed to generate export buffer`, { format, schoolId });
        return res.status(500).json({
          success: false,
          message: 'Failed to generate export file'
        });
      }

      logger.info(`Export buffer created successfully`, { 
        format, 
        schoolId, 
        bufferSize: buffer.length,
        filename 
      });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.status(200).end(buffer, 'binary');

      logger.info(`Books exported as ${format}`, { schoolId, count: books.length });
    } catch (error) {
      logger.error('Error exporting books:', error);
      next(error);
    }
  }

  async exportLoans(req, res, next) {
    try {
      const { schoolId } = req.user;
      const { format = 'excel' } = req.query;

      // Get all loans without pagination for export
      const result = await libraryService.getLoans(schoolId, { limit: 10000 });
      const loans = result.items;

      let buffer;
      let filename;
      let contentType;

      switch (format.toLowerCase()) {
        case 'excel':
          const workbook = await exportService.exportLoansToExcel(loans);
          buffer = await workbook.xlsx.writeBuffer();
          filename = `library-loans-${Date.now()}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'pdf':
          buffer = await exportService.exportLoansToPDF(loans);
          filename = `library-loans-${Date.now()}.pdf`;
          contentType = 'application/pdf';
          break;

        case 'csv':
          buffer = Buffer.from(exportService.exportLoansToCSV(loans));
          filename = `library-loans-${Date.now()}.csv`;
          contentType = 'text/csv';
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid format. Use excel, pdf, or csv'
          });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.status(200).end(buffer, 'binary');

      logger.info(`Loans exported as ${format}`, { schoolId, count: loans.length });
    } catch (error) {
      next(error);
    }
  }

  // ==================== IMPORT ====================

  async importBooks(req, res, next) {
    try {
      const { schoolId } = req.user;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = req.file.path;
      let books = [];

      try {
        // Read file content
        const fileContent = await fs.readFile(filePath, 'utf-8');

        // Parse CSV
        if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
          books = exportService.parseCSVForBooks(fileContent);
        } else {
          // For Excel files, we need to parse differently
          const ExcelJS = require('exceljs');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(filePath);
          const worksheet = workbook.getWorksheet(1);
          
          const headers = [];
          worksheet.getRow(1).eachCell((cell) => {
            headers.push(cell.value);
          });

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const book = {};
              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  book[header.toLowerCase().replace(/ /g, '')] = cell.value;
                }
              });

              books.push({
                isbn: book.isbn || '',
                title: book.title,
                author: book.author,
                publisher: book.publisher || null,
                publishedYear: book.publishedyear ? parseInt(book.publishedyear) : null,
                category: book.category || null,
                totalCopies: parseInt(book.totalcopies || 1),
                description: book.description || null
              });
            }
          });
        }

        // Import books
        const result = await libraryService.bulkImportBooks(schoolId, books);

        // Delete uploaded file
        await fs.unlink(filePath);

        res.status(200).json({
          success: true,
          message: 'Import completed',
          data: {
            successCount: result.success.length,
            errorCount: result.errors.length,
            errors: result.errors
          }
        });

        logger.info(`Books imported: ${result.success.length} success, ${result.errors.length} errors`, { schoolId });
      } catch (error) {
        // Clean up file on error
        await fs.unlink(filePath).catch(() => {});
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // ==================== TEMPLATE ====================

  async downloadTemplate(req, res, next) {
    try {
      const { format = 'excel' } = req.query;

      const sampleData = [
        {
          isbn: '978-3-16-148410-0',
          title: 'Sample Book Title',
          author: 'John Doe',
          publisher: 'Sample Publisher',
          publishedYear: 2023,
          category: 'Fiction',
          totalCopies: 5,
          availableCopies: 5,
          description: 'This is a sample book description'
        }
      ];

      let buffer;
      let filename;
      let contentType;

      if (format.toLowerCase() === 'excel') {
        const workbook = await exportService.exportBooksToExcel(sampleData);
        buffer = await workbook.xlsx.writeBuffer();
        filename = 'library-import-template.xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format.toLowerCase() === 'csv') {
        buffer = Buffer.from(exportService.exportBooksToCSV(sampleData));
        filename = 'library-import-template.csv';
        contentType = 'text/csv';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Use excel or csv'
        });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LibraryController();
