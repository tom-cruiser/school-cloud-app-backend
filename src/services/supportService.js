const prisma = require('../config/database');
const { cleanObject } = require('../utils/helpers');

class SupportService {
  /**
   * Create a new support message
   */
  async createMessage(data) {
    const supportMessage = await prisma.supportMessage.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    return supportMessage;
  }

  /**
   * Get user's support messages
   */
  async getUserMessages(userId, { skip = 0, take = 10 }) {
    const [messages, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          responder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.supportMessage.count({ where: { userId } }),
    ]);

    return { messages, total };
  }

  /**
   * Get all support messages with filters
   */
  async getAllMessages(filters = {}) {
    const { search, status, priority, category, skip = 0, take = 10 } = filters;
    
    const where = cleanObject({
      status,
      priority,
      category,
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
          { 
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      }),
    });

    const [messages, total, unreadCount] = await Promise.all([
      prisma.supportMessage.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          responder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.supportMessage.count({ where }),
      prisma.supportMessage.count({ where: { isRead: false } }),
    ]);

    return { messages, total, unreadCount };
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    const message = await prisma.supportMessage.update({
      where: { id: messageId },
      data: { isRead: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Respond to a support message
   */
  async respondToMessage(messageId, data) {
    const message = await prisma.supportMessage.update({
      where: { id: messageId },
      data: {
        response: data.response,
        status: data.status,
        respondedBy: data.respondedBy,
        respondedAt: new Date(),
        isRead: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Update message status
   */
  async updateStatus(messageId, status) {
    const message = await prisma.supportMessage.update({
      where: { id: messageId },
      data: { status },
    });

    return message;
  }

  /**
   * Get support statistics
   */
  async getStats() {
    const [total, pending, inProgress, resolved, unreadCount] = await Promise.all([
      prisma.supportMessage.count(),
      prisma.supportMessage.count({ where: { status: 'PENDING' } }),
      prisma.supportMessage.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportMessage.count({ where: { status: 'RESOLVED' } }),
      prisma.supportMessage.count({ where: { isRead: false } }),
    ]);

    return {
      total,
      pending,
      inProgress,
      resolved,
      unreadCount,
    };
  }
}

module.exports = new SupportService();