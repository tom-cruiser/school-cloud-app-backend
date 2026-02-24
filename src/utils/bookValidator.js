class BookValidator {
  /**
   * Validate ISBN format (ISBN-10 or ISBN-13)
   * @param {string} isbn - ISBN string to validate
   * @returns {boolean} - True if valid ISBN format
   */
  validateISBN(isbn) {
    if (!isbn) return true; // ISBN is optional
    
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[- ]/g, '');
    
    // ISBN-10 or ISBN-13
    if (cleanISBN.length === 10 || cleanISBN.length === 13) {
      return /^[0-9]{9}[0-9X]$|^[0-9]{13}$/.test(cleanISBN);
    }
    
    return false;
  }

  /**
   * Validate published year
   * @param {number} year - Year to validate
   * @returns {boolean} - True if valid year
   */
  validatePublishedYear(year) {
    if (!year) return true; // Year is optional
    
    const currentYear = new Date().getFullYear();
    return year >= 1000 && year <= currentYear + 1;
  }

  /**
   * Validate total copies
   * @param {number} copies - Number of copies
   * @returns {boolean} - True if valid
   */
  validateTotalCopies(copies) {
    return Number.isInteger(copies) && copies >= 1;
  }

  /**
   * Validate required string field
   * @param {string} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @returns {object} - { valid: boolean, error: string|null }
   */
  validateRequiredField(value, fieldName) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return {
        valid: false,
        error: `${fieldName} is required and cannot be empty`
      };
    }
    return { valid: true, error: null };
  }

  /**
   * Comprehensive book data validation
   * @param {object} bookData - Book data to validate
   * @returns {object} - { valid: boolean, errors: string[] }
   */
  validateBook(bookData) {
    const errors = [];

    // Validate required fields
    const titleValidation = this.validateRequiredField(bookData.title, 'Title');
    if (!titleValidation.valid) {
      errors.push(titleValidation.error);
    }

    const authorValidation = this.validateRequiredField(bookData.author, 'Author');
    if (!authorValidation.valid) {
      errors.push(authorValidation.error);
    }

    // Validate ISBN format if provided
    if (bookData.isbn && !this.validateISBN(bookData.isbn)) {
      errors.push('Invalid ISBN format. Must be ISBN-10 or ISBN-13');
    }

    // Validate published year if provided
    if (bookData.publishedYear) {
      const year = parseInt(bookData.publishedYear);
      if (isNaN(year) || !this.validatePublishedYear(year)) {
        errors.push(`Invalid published year. Must be between 1000 and ${new Date().getFullYear() + 1}`);
      }
    }

    // Validate total copies
    if (bookData.totalCopies !== undefined && bookData.totalCopies !== null) {
      const copies = parseInt(bookData.totalCopies);
      if (isNaN(copies) || !this.validateTotalCopies(copies)) {
        errors.push('Total copies must be a positive integer (minimum 1)');
      }
    }

    // Validate string length limits
    if (bookData.title && bookData.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }

    if (bookData.author && bookData.author.length > 255) {
      errors.push('Author must not exceed 255 characters');
    }

    if (bookData.publisher && bookData.publisher.length > 255) {
      errors.push('Publisher must not exceed 255 characters');
    }

    if (bookData.category && bookData.category.length > 100) {
      errors.push('Category must not exceed 100 characters');
    }

    if (bookData.description && bookData.description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize and normalize book data
   * @param {object} bookData - Raw book data
   * @returns {object} - Sanitized book data
   */
  sanitizeBookData(bookData) {
    return {
      isbn: bookData.isbn ? String(bookData.isbn).trim() : null,
      title: bookData.title ? String(bookData.title).trim() : '',
      author: bookData.author ? String(bookData.author).trim() : '',
      publisher: bookData.publisher ? String(bookData.publisher).trim() : null,
      publishedYear: bookData.publishedYear ? parseInt(bookData.publishedYear) : null,
      category: bookData.category ? String(bookData.category).trim() : null,
      totalCopies: bookData.totalCopies ? parseInt(bookData.totalCopies) : 1,
      description: bookData.description ? String(bookData.description).trim() : null
    };
  }

  /**
   * Check if two books are duplicates based on ISBN or Title+Author
   * @param {object} book1 - First book
   * @param {object} book2 - Second book
   * @returns {object} - { isDuplicate: boolean, reason: string|null }
   */
  checkDuplicate(book1, book2) {
    // Check ISBN duplicate (if both have ISBN)
    if (book1.isbn && book2.isbn && book1.isbn === book2.isbn) {
      return {
        isDuplicate: true,
        reason: `Duplicate ISBN: ${book1.isbn}`
      };
    }

    // Check Title + Author duplicate (case-insensitive)
    const title1 = book1.title?.toLowerCase().trim();
    const title2 = book2.title?.toLowerCase().trim();
    const author1 = book1.author?.toLowerCase().trim();
    const author2 = book2.author?.toLowerCase().trim();

    if (title1 === title2 && author1 === author2) {
      return {
        isDuplicate: true,
        reason: `Duplicate book: "${book1.title}" by ${book1.author}`
      };
    }

    return { isDuplicate: false, reason: null };
  }
}

module.exports = new BookValidator();
