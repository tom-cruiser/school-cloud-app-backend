const departmentService = require('../services/departmentService');
const { sendSuccess } = require('../utils/helpers');

exports.getAllDepartments = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await departmentService.getAllDepartments(
      req.user.schoolId,
      parseInt(page),
      parseInt(limit)
    );
    return sendSuccess(res, result, 'Departments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(
      req.params.id,
      req.user.schoolId
    );
    return sendSuccess(res, department, 'Department retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(
      req.body,
      req.user.schoolId
    );
    return sendSuccess(res, department, 'Department created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.updateDepartment(
      req.params.id,
      req.body,
      req.user.schoolId
    );
    return sendSuccess(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await departmentService.deleteDepartment(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
