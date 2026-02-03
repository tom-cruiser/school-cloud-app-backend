const termService = require('../services/termService');
const { sendSuccess } = require('../utils/helpers');

exports.getAllTerms = async (req, res, next) => {
  try {
    const result = await termService.getAllTerms(req.user.schoolId);
    return sendSuccess(res, result, 'Terms retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createTerm = async (req, res, next) => {
  try {
    const term = await termService.createTerm(req.body, req.user.schoolId);
    return sendSuccess(res, term, 'Term created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateTerm = async (req, res, next) => {
  try {
    const term = await termService.updateTerm(req.params.id, req.body, req.user.schoolId);
    return sendSuccess(res, term, 'Term updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteTerm = async (req, res, next) => {
  try {
    await termService.deleteTerm(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'Term deleted successfully');
  } catch (error) {
    next(error);
  }
};
