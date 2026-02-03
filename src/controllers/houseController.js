const houseService = require('../services/houseService');
const { sendSuccess } = require('../utils/helpers');

exports.getAllHouses = async (req, res, next) => {
  try {
    const result = await houseService.getAllHouses(req.user.schoolId);
    return sendSuccess(res, result, 'Houses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createHouse = async (req, res, next) => {
  try {
    const house = await houseService.createHouse(req.body, req.user.schoolId);
    return sendSuccess(res, house, 'House created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateHouse = async (req, res, next) => {
  try {
    const house = await houseService.updateHouse(req.params.id, req.body, req.user.schoolId);
    return sendSuccess(res, house, 'House updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteHouse = async (req, res, next) => {
  try {
    await houseService.deleteHouse(req.params.id, req.user.schoolId);
    return sendSuccess(res, null, 'House deleted successfully');
  } catch (error) {
    next(error);
  }
};
