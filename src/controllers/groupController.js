const { asyncHandler } = require('../utils/errors');
const prisma = require('../config/database');

// Get all groups for a school
exports.getSchoolGroups = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { type, privacy } = req.query;
  const userId = req.user?.id;
  const userRole = req.user?.role;
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN';

  if (!isAdmin && req.user?.schoolId !== schoolId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this school',
    });
  }

  const where = { schoolId };
  if (type) where.type = type;
  if (privacy) where.privacy = privacy;

  if (!isAdmin) {
    where.AND = [
      {
        OR: [
          { privacy: 'PUBLIC' },
          { members: { some: { userId, isActive: true } } },
        ],
      },
    ];
  }

  const groups = await prisma.group.findMany({
    where,
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: { members: true, messages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: groups,
  });
});

// Get group details with messages
exports.getGroupDetail = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN';

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          group: { select: { id: true } },
        },
      },
      discussions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      events: {
        where: { startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 5,
      },
    },
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  if (!isAdmin && group.schoolId !== req.user?.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this school',
    });
  }

  const isMember = group.members?.some(
    (member) => member.userId === userId && member.isActive
  );

  if (!isAdmin && group.privacy !== 'PUBLIC' && !isMember) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this group',
    });
  }

  res.status(200).json({
    success: true,
    data: group,
  });
});

// Create group
exports.createGroup = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { name, description, type, privacy, members } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Group name is required',
    });
  }

  // Create group
  const group = await prisma.group.create({
    data: {
      schoolId,
      name,
      description,
      type: type || 'CUSTOM',
      privacy: privacy || 'PRIVATE',
      createdBy: userId,
    },
  });

  // Add creator as admin member
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: 'admin',
    },
  });

  // Add other members if provided
  if (members && Array.isArray(members)) {
    const uniqueMemberIds = Array.from(
      new Set(members.filter((memberId) => memberId && memberId !== userId))
    );

    if (uniqueMemberIds.length > 0) {
      const validMembers = await prisma.user.findMany({
        where: {
          id: { in: uniqueMemberIds },
          schoolId,
        },
        select: { id: true },
      });

      if (validMembers.length > 0) {
        await prisma.groupMember.createMany({
          data: validMembers.map((member) => ({
            groupId: group.id,
            userId: member.id,
            role: 'member',
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  // Fetch the created group with members
  const createdGroup = await prisma.group.findUnique({
    where: { id: group.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: createdGroup,
  });
});

// Update group
exports.updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { name, description, privacy } = req.body;

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      name,
      description,
      privacy,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: group,
  });
});

// Add member to group
exports.addGroupMember = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const requesterId = req.user?.id;
  const requesterRole = req.user?.role;
  const isAdmin = requesterRole === 'SUPER_ADMIN' || requesterRole === 'SCHOOL_ADMIN';

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, schoolId: true, privacy: true },
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  if (!isAdmin) {
    const isSelfJoin = requesterId === userId;

    if (!(isSelfJoin && group.privacy === 'PUBLIC')) {
      const requesterMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: requesterId,
          },
        },
      });

      if (!requesterMembership || !['admin', 'moderator'].includes(requesterMembership.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only group admins can add members',
        });
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, schoolId: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.schoolId !== group.schoolId) {
    return res.status(400).json({
      success: false,
      message: 'User does not belong to this school',
    });
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this group',
    });
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId,
      role: 'member',
    },
  });

  res.status(201).json({
    success: true,
    data: member,
  });
});

// Remove member from group
exports.removeGroupMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const requesterId = req.user?.id;
  const requesterRole = req.user?.role;
  const isAdmin = requesterRole === 'SUPER_ADMIN' || requesterRole === 'SCHOOL_ADMIN';

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, schoolId: true },
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  if (!isAdmin && req.user?.schoolId !== group.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this school',
    });
  }

  if (!isAdmin && requesterId !== userId) {
    const requesterMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requesterId,
        },
      },
    });

    if (!requesterMembership || !['admin', 'moderator'].includes(requesterMembership.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can remove members',
      });
    }
  }

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      message: 'Member not found in this group',
    });
  }

  await prisma.groupMember.deleteMany({
    where: {
      groupId,
      userId,
    },
  });

  res.status(200).json({
    success: true,
    message: requesterId === userId ? 'You left the group' : 'Member removed from group',
  });
});

// Send group message
exports.sendGroupMessage = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { content, fileUrl } = req.body;
  const userId = req.user.id;

  if (!content && !fileUrl) {
    return res.status(400).json({
      success: false,
      message: 'Message content or file is required',
    });
  }

  // Verify user is a group member
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of this group',
    });
  }

  // Get group info for notification
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { select: { userId: true } }
    },
  });

  // Get sender name
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const message = await prisma.groupMessage.create({
    data: {
      groupId,
      senderId: userId,
      content,
      fileUrl,
    },
  });

  const messageWithSender = {
    ...message,
    sender: {
      id: userId,
      firstName: sender.firstName,
      lastName: sender.lastName,
    },
  };

  // Create notifications for all group members except sender
  if (group && group.members) {
    const notificationPromises = group.members
      .filter((member) => member.userId !== userId)
      .map((member) =>
        prisma.notification.create({
          data: {
            userId: member.userId,
            title: `New message in ${group.name}`,
            message: content || 'Sent a file',
            type: 'info',
            category: 'message',
            actionUrl: `/groups/${groupId}`,
            metadata: {
              groupId,
              messageId: message.id,
              senderName: `${sender.firstName} ${sender.lastName}`,
            },
          },
        }).catch((error) => {
          console.error('Failed to create notification for user:', member.userId, error);
        })
      );

    try {
      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} notifications for message: ${message.id}`);
    } catch (error) {
      console.error('Error creating notifications:', error);
      // Continue anyway - message was sent successfully
    }

    // Emit realtime updates to all group members
    if (global.wsServer) {
      group.members.forEach((member) => {
        global.wsServer.emitToUser(member.userId, 'group:message', {
          groupId,
          message: messageWithSender,
        });
      });
    }
  }

  res.status(201).json({
    success: true,
    data: messageWithSender,
  });
});

// Get group messages
exports.getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    take: parseInt(limit),
    skip: parseInt(skip),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.groupMessage.count({
    where: { groupId },
  });

  res.status(200).json({
    success: true,
    data: messages,
    total,
  });
});

// Delete group
exports.deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  await prisma.group.delete({
    where: { id: groupId },
  });

  res.status(200).json({
    success: true,
    message: 'Group deleted successfully',
  });
});
