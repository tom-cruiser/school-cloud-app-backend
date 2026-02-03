const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asyncHandler } = require('../utils/errors');

/**
 * Send a message
 * POST /messages
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, subject, content } = req.body;
  const senderId = req.user.id;
  const schoolId = req.user.schoolId;

  if (!receiverId || !content) {
    return res.status(400).json({
      success: false,
      message: 'receiverId and content are required'
    });
  }

  // Verify receiver exists and is in the same school
  const receiver = await prisma.user.findFirst({
    where: {
      id: receiverId,
      schoolId: schoolId,
      isActive: true
    }
  });

  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: 'Receiver not found or not in the same school'
    });
  }

  const message = await prisma.message.create({
    data: {
      schoolId,
      senderId,
      receiverId,
      subject: subject || 'No Subject',
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      receiver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message
  });
});

/**
 * Get inbox messages (received messages)
 * GET /messages/inbox
 */
const getInbox = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    receiverId: userId,
    ...(unreadOnly === 'true' && { isRead: false })
  };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.message.count({ where })
  ]);

  res.json({
    success: true,
    data: messages,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get sent messages
 * GET /messages/sent
 */
const getSentMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        senderId: userId
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.message.count({ where: { senderId: userId } })
  ]);

  res.json({
    success: true,
    data: messages,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get a single message
 * GET /messages/:id
 */
const getMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await prisma.message.findFirst({
    where: {
      id,
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      receiver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Mark as read if user is the receiver and message is unread
  if (message.receiverId === userId && !message.isRead) {
    await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
    message.isRead = true;
    message.readAt = new Date();
  }

  res.json({
    success: true,
    data: message
  });
});

/**
 * Mark message as read
 * PATCH /messages/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await prisma.message.findFirst({
    where: {
      id,
      receiverId: userId
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  const updatedMessage = await prisma.message.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Message marked as read',
    data: updatedMessage
  });
});

/**
 * Mark multiple messages as read
 * PATCH /messages/read-multiple
 */
const markMultipleAsRead = asyncHandler(async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'messageIds array is required'
    });
  }

  await prisma.message.updateMany({
    where: {
      id: { in: messageIds },
      receiverId: userId
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
});

/**
 * Delete a message
 * DELETE /messages/:id
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await prisma.message.findFirst({
    where: {
      id,
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  await prisma.message.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

/**
 * Get unread message count
 * GET /messages/unread/count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false
    }
  });

  res.json({
    success: true,
    data: { count }
  });
});

/**
 * Get conversation between two users
 * GET /messages/conversation/:userId
 */
const getConversation = asyncHandler(async (req, res) => {
  const { userId: otherUserId } = req.params;
  const userId = req.user.id;
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId }
    ]
  };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.message.count({ where })
  ]);

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json({
    success: true,
    data: messages.reverse(), // Reverse to show oldest first
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get all conversations for the current user
 * GET /messages/conversations
 */
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Get latest message from each conversation using window functions
  const conversations = await prisma.$queryRaw`
    WITH conversation_messages AS (
      SELECT 
        m.*,
        CASE 
          WHEN m."senderId" = ${userId} THEN m."receiverId" 
          ELSE m."senderId" 
        END as other_user_id,
        ROW_NUMBER() OVER (
          PARTITION BY CASE 
            WHEN m."senderId" = ${userId} THEN m."receiverId" 
            ELSE m."senderId" 
          END 
          ORDER BY m."createdAt" DESC
        ) as row_num
      FROM messages m
      WHERE m."senderId" = ${userId} OR m."receiverId" = ${userId}
    )
    SELECT 
      cm.id,
      cm."senderId",
      cm."receiverId", 
      cm.subject,
      cm.content,
      cm."isRead",
      cm."createdAt",
      cm.other_user_id,
      u."firstName",
      u."lastName", 
      u.email,
      u.role,
      COALESCE(unread.unread_count, 0) as unread_count
    FROM conversation_messages cm
    JOIN users u ON u.id = cm.other_user_id
    LEFT JOIN (
      SELECT 
        m."senderId" as other_user_id,
        COUNT(*) as unread_count
      FROM messages m 
      WHERE m."receiverId" = ${userId} AND m."isRead" = false
      GROUP BY m."senderId"
    ) unread ON unread.other_user_id = cm.other_user_id
    WHERE cm.row_num = 1
    ORDER BY cm."createdAt" DESC
    LIMIT ${parseInt(limit)}
    OFFSET ${parseInt(skip)}
  `;

  // Get total count of conversations
  const totalResult = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT 
      CASE 
        WHEN "senderId" = ${userId} THEN "receiverId" 
        ELSE "senderId" 
      END
    ) as total
    FROM messages 
    WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
  `;

  const total = Number(totalResult[0]?.total || 0);

  res.json({
    success: true,
    data: conversations.map(conv => ({
      id: conv.id,
      otherUser: {
        id: conv.other_user_id,
        firstName: conv.firstName,
        lastName: conv.lastName,
        email: conv.email,
        role: conv.role
      },
      lastMessage: {
        id: conv.id,
        senderId: conv.senderId,
        receiverId: conv.receiverId,
        subject: conv.subject,
        content: conv.content,
        isRead: conv.isRead,
        createdAt: conv.createdAt
      },
      unreadCount: Number(conv.unread_count)
    })),
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get list of users to message (teachers and students in same school/class)
 * GET /messages/users
 */
const getMessageableUsers = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.schoolId;
  const userRole = req.user.role;
  const { search = '', role = '' } = req.query;

  // If user is a student, get their class/grade level
  let userGradeLevelId = null;
  if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { gradeLevelId: true }
    });
    userGradeLevelId = student?.gradeLevelId;
  }

  // Build base where clause
  const where = {
    schoolId,
    id: { not: userId },
    isActive: true,
    ...(role && { role }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  let users;

  // If user is a student, filter by same class/grade level for other students
  if (userRole === 'STUDENT') {
    // Get teachers (all teachers in the school)
    const teachers = await prisma.user.findMany({
      where: {
        ...where,
        role: 'TEACHER'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    // Get students from the same grade level
    let classmates = [];
    if (userGradeLevelId) {
      const sameGradeStudents = await prisma.student.findMany({
        where: {
          gradeLevelId: userGradeLevelId,
          userId: { not: userId },
          user: {
            schoolId,
            isActive: true,
            ...(search && {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            })
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          gradeLevel: {
            select: {
              name: true
            }
          }
        }
      });

      classmates = sameGradeStudents.map(s => ({
        ...s.user,
        gradeLevel: s.gradeLevel?.name
      }));
    }

    // Combine teachers and classmates
    users = [...teachers, ...classmates];
  } else {
    // For teachers and admins, show all users in the school
    users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
  }

  // Sort by firstName, lastName
  users.sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  res.json({
    success: true,
    data: users
  });
});

module.exports = {
  sendMessage,
  getInbox,
  getSentMessages,
  getMessage,
  markAsRead,
  markMultipleAsRead,
  deleteMessage,
  getUnreadCount,
  getConversation,
  getConversations,
  getMessageableUsers
};
