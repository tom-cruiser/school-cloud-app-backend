const { asyncHandler } = require('../utils/errors');
const prisma = require('../config/database');

// Get discussions for a group
exports.getDiscussions = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { limit = 20, skip = 0 } = req.query;

  const discussions = await prisma.discussion.findMany({
    where: { groupId },
    take: parseInt(limit),
    skip: parseInt(skip),
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });

  const total = await prisma.discussion.count({ where: { groupId } });

  res.status(200).json({
    success: true,
    data: discussions,
    total,
  });
});

// Get discussion detail with replies
exports.getDiscussionDetail = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          childReplies: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!discussion) {
    return res.status(404).json({
      success: false,
      message: 'Discussion not found',
    });
  }

  res.status(200).json({
    success: true,
    data: discussion,
  });
});

// Create discussion
exports.createDiscussion = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required',
    });
  }

  const discussion = await prisma.discussion.create({
    data: {
      groupId,
      title,
      content,
      createdBy: userId,
    },
  });

  res.status(201).json({
    success: true,
    data: discussion,
  });
});

// Update discussion
exports.updateDiscussion = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;
  const { title, content, isPinned, isClosed } = req.body;

  const discussion = await prisma.discussion.update({
    where: { id: discussionId },
    data: {
      title,
      content,
      isPinned,
      isClosed,
    },
  });

  res.status(200).json({
    success: true,
    data: discussion,
  });
});

// Add reply to discussion
exports.addReply = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;
  const { content, parentReplyId } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Reply content is required',
    });
  }

  // Get discussion info
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      group: { select: { name: true } },
      replies: { select: { createdBy: true } },
    },
  });

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const reply = await prisma.reply.create({
    data: {
      discussionId,
      createdBy: userId,
      content,
      parentReplyId: parentReplyId || null,
    },
  });

  // Create notifications for discussion creator and unique participants
  if (discussion && discussion.group) {
    const recipientSet = new Set();

    // Add discussion creator
    recipientSet.add(discussion.createdBy);

    // Add all other participants who replied
    discussion.replies.forEach((r) => {
      if (r.createdBy !== userId) {
        recipientSet.add(r.createdBy);
      }
    });

    // Remove the current user from recipients
    recipientSet.delete(userId);

    // Create notifications for all recipients
    const notificationPromises = Array.from(recipientSet).map((recipientId) =>
      prisma.notification.create({
        data: {
          userId: recipientId,
          title: `New reply in ${discussion.group.name}`,
          message: content.substring(0, 100),
          type: 'info',
          category: 'message',
          actionUrl: `/discussions/${discussionId}`,
          metadata: {
            discussionId,
            replyId: reply.id,
            senderName: `${user.firstName} ${user.lastName}`,
          },
        },
      }).catch((error) => {
        console.error('Failed to create notification for user:', recipientId, error);
      })
    );

    try {
      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} notifications for reply: ${reply.id}`);
    } catch (error) {
      console.error('Error creating reply notifications:', error);
    }
  }

  res.status(201).json({
    success: true,
    data: reply,
  });
});

// Update reply
exports.updateReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const { content } = req.body;

  const reply = await prisma.reply.update({
    where: { id: replyId },
    data: { content },
  });

  res.status(200).json({
    success: true,
    data: reply,
  });
});

// Delete reply
exports.deleteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;

  await prisma.reply.delete({
    where: { id: replyId },
  });

  res.status(200).json({
    success: true,
    message: 'Reply deleted successfully',
  });
});

// Delete discussion
exports.deleteDiscussion = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;

  await prisma.discussion.delete({
    where: { id: discussionId },
  });

  res.status(200).json({
    success: true,
    message: 'Discussion deleted successfully',
  });
});
