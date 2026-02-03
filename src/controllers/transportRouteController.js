const transportRouteService = require('../services/transportRouteService');
const { sendSuccess } = require('../utils/helpers');

exports.getAllTransportRoutes = async (req, res, next) => {
  try {
    const result = await transportRouteService.getAllTransportRoutes(req.user.schoolId);
    return sendSuccess(res, result, 'Transport routes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createTransportRoute = async (req, res, next) => {
  try {
    const route = await transportRouteService.createTransportRoute(req.body, req.user.schoolId);
    return sendSuccess(res, route, 'Transport route created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateTransportRoute = async (req, res, next) => {
  try {
    const route = await transportRouteService.updateTransportRoute(req.params.id, req.body, req.user.schoolId);
    return sendSuccess(res, route, 'Transport route updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteTransportRoute = async (req, res, next) => {
  try {
    await transportRouteService.deleteTransportRoute(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'Transport route deleted successfully');
  } catch (error) {
    next(error);
  }
};
