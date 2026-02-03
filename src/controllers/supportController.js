const supportService = require('../services/supportService');
const { asyncHandler } = require('../utils/errors');
const { sendPaginatedResponse, getPagination } = require('../utils/helpers');

class SupportController {
  /**
   * Create a new support message
   * POST /support/messages
   */
  createMessage = asyncHandler(async (req, res) => {
    const { subject, message, category, priority } = req.body;
    const userId = req.user.id; // Fixed: should be req.user.id, not req.user.userId
    const schoolId = req.user.schoolId;

    const supportMessage = await supportService.createMessage({
      subject,
      message,
      category: category?.toUpperCase() || 'GENERAL',
      priority: priority?.toUpperCase() || 'MEDIUM',
      userId,
      schoolId,
    });

    res.status(201).json({
      success: true,
      message: 'Support message sent successfully',
      data: supportMessage,
    });
  });

  /**
   * Get user's support messages
   * GET /support/messages/user
   */
  getUserMessages = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const { skip, take } = getPagination(page, limit);
    const userId = req.user.id; // Fixed: should be req.user.id

    const { messages, total } = await supportService.getUserMessages(userId, { skip, take });

    sendPaginatedResponse(res, messages, page || 1, limit || 10, total, 'User messages retrieved successfully');
  });

  /**
   * Get all support messages (super admin only)
   * GET /super-admin/support/messages
   */
  getAllMessages = asyncHandler(async (req, res) => {
    const { page, limit, status, priority, category, search } = req.query;
    const { skip, take } = getPagination(page, limit);

    const { messages, total } = await supportService.getAllMessages({
      skip,
      take,
      status,
      priority,
      category,
      search,
    });

    sendPaginatedResponse(res, messages, page || 1, limit || 10, total, 'Support messages retrieved successfully');
  });

  /**
   * Mark message as read
   * PATCH /super-admin/support/messages/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const message = await supportService.markAsRead(id);

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  });

  /**
   * Respond to a support message
   * POST /super-admin/support/messages/:id/respond
   */
  respondToMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { response, status } = req.body;
    const respondedBy = req.user.id; // Fixed: should be req.user.id

    const message = await supportService.respondToMessage(id, {
      response,
      status: status?.toUpperCase() || 'RESOLVED',
      respondedBy,
    });

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: message,
    });
  });

  /**
   * Update message status
   * PATCH /super-admin/support/messages/:id/status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const message = await supportService.updateStatus(id, status?.toUpperCase());

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: message,
    });
  });

  /**
   * Get support statistics (super admin only)
   * GET /super-admin/support/stats
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await supportService.getStats();

    res.json({
      success: true,
      message: 'Support statistics retrieved successfully',
      data: stats,
    });
  });
}

module.exports = new SupportController();