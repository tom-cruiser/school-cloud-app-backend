const subjectService = require('../services/subjectService');
const { sendSuccess } = require('../utils/helpers');

/**
 * Get all subjects for a school
 * @route GET /api/v1/subjects
 * @access Private (Admin)
 */
exports.getAllSubjects = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const result = await subjectService.getAllSubjects(req.user.schoolId, departmentId);
    return sendSuccess(res, result, 'Subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subject by ID
 * @route GET /api/v1/subjects/:id
 * @access Private (Admin)
 */
exports.getSubjectById = async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id, req.user.schoolId);
    return sendSuccess(res, subject, 'Subject retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new subject
 * @route POST /api/v1/subjects
 * @access Private (Admin, SCHOOL_ADMIN)
 */
exports.createSubject = async (req, res, next) => {
  try {
    const subject = await subjectService.createSubject(req.body, req.user.schoolId);
    return sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update subject
 * @route PUT /api/v1/subjects/:id
 * @access Private (Admin, SCHOOL_ADMIN)
 */
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await subjectService.updateSubject(req.params.id, req.body, req.user.schoolId);
    return sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subject
 * @route DELETE /api/v1/subjects/:id
 * @access Private (Admin, SCHOOL_ADMIN)
 */
exports.deleteSubject = async (req, res, next) => {
  try {
    await subjectService.deleteSubject(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};
