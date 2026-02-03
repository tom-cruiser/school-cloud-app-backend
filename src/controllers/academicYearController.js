const academicYearService = require('../services/academicYearService');
const { sendSuccess } = require('../utils/helpers');

exports.getAllAcademicYears = async (req, res, next) => {
  try {
    const result = await academicYearService.getAllAcademicYears(req.user.schoolId);
    return sendSuccess(res, result, 'Academic years retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAcademicYearById = async (req, res, next) => {
  try {
    const academicYear = await academicYearService.getAcademicYearById(req.params.id, req.user.schoolId);
    return sendSuccess(res, academicYear, 'Academic year retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createAcademicYear = async (req, res, next) => {
  try {
    const academicYear = await academicYearService.createAcademicYear(req.body, req.user.schoolId);
    return sendSuccess(res, academicYear, 'Academic year created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateAcademicYear = async (req, res, next) => {
  try {
    const academicYear = await academicYearService.updateAcademicYear(req.params.id, req.body, req.user.schoolId);
    return sendSuccess(res, academicYear, 'Academic year updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteAcademicYear = async (req, res, next) => {
  try {
    await academicYearService.deleteAcademicYear(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'Academic year deleted successfully');
  } catch (error) {
    next(error);
  }
};
