/**
 * Standard API response format
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

/**
 * Paginated response format
 */
const sendPaginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
};

/**
 * Calculate pagination skip value
 */
const getPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

/**
 * Generate random string
 */
const generateRandomString = (length = 8) => {
  return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Clean object (remove undefined/null values)
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  );
};

/**
 * Calculate letter grade from score
 */
const calculateLetterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

/**
 * Check if date is overdue
 */
const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date();
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Generate student/employee number
 */
const generateNumber = (prefix, year, sequence) => {
  const yearStr = year.toString().slice(-2);
  const seqStr = sequence.toString().padStart(4, '0');
  return `${prefix}${yearStr}${seqStr}`;
};

module.exports = {
  sendSuccess,
  sendPaginatedResponse,
  getPagination,
  generateRandomString,
  cleanObject,
  calculateLetterGrade,
  isOverdue,
  formatDate,
  generateNumber,
};
