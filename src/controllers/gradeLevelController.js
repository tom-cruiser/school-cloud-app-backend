const gradeLevelService = require('../services/gradeLevelService');
const { sendSuccess } = require('../utils/helpers');

exports.getAllGradeLevels = async (req, res, next) => {
  try {
    const result = await gradeLevelService.getAllGradeLevels(req.user.schoolId);
    return sendSuccess(res, result, 'Grade levels retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createGradeLevel = async (req, res, next) => {
  try {
    const gradeLevel = await gradeLevelService.createGradeLevel(req.body, req.user.schoolId);
    return sendSuccess(res, gradeLevel, 'Grade level created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateGradeLevel = async (req, res, next) => {
  try {
    const gradeLevel = await gradeLevelService.updateGradeLevel(req.params.id, req.body, req.user.schoolId);
    return sendSuccess(res, gradeLevel, 'Grade level updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteGradeLevel = async (req, res, next) => {
  try {
    await gradeLevelService.deleteGradeLevel(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'Grade level deleted successfully');
  } catch (error) {
    next(error);
  }
};
