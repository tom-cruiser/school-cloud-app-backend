const userService = require('../services/userService');
const { asyncHandler } = require('../utils/errors');
const { sendPaginatedResponse, getPagination } = require('../utils/helpers');

class UserController {
  /**
   * Get all users (superadmin only)
   * GET /super-admin/users
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, search, role, isActive } = req.query;
    const { skip, take } = getPagination(page, limit);
    const { users, total } = await userService.getAllUsers({ skip, take, search, role, isActive });
    sendPaginatedResponse(res, users, page || 1, limit || 10, total, 'Users retrieved successfully');
  });
}

module.exports = new UserController();
