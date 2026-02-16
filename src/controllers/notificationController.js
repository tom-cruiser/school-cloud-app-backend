const { asyncHandler } = require('../utils/errors');
const prisma = require('../config/database');

class NotificationController {
  /**
   * Get notifications for the current user
   * GET /notifications
   */
  getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, isRead } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'false' ? false : true;
    }

    // Get notifications
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({ where }),
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  });

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  });

  /**
   * Mark all notifications as read
   * POST /notifications/mark-all-read
   */
  markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  });

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { id, userId },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  });

  /**
   * Create a notification (internal use)
   */
  createNotification = async (userId, { title, message, type = 'info', category = 'system', actionUrl, metadata }) => {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          category,
          actionUrl,
          metadata,
        },
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };
}

module.exports = new NotificationController();
