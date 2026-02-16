const prisma = require('../config/database');
const { asyncHandler } = require('../utils/errors');
const { ValidationError, NotFoundError, AuthorizationError } = require('../utils/errors');

/**
 * Create an announcement (Admin only)
 * @route POST /api/v1/announcements
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const user = req.user;
  const { title, content, targetRole, expiresAt } = req.body;

  // Validate input
  if (!title || !content) {
    throw new ValidationError('Title and content are required');
  }

  // Only SCHOOL_ADMIN or ADMIN can create announcements
  if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'ADMIN') {
    throw new AuthorizationError('Only school admins can create announcements');
  }

  // Get the school ID
  const schoolId = user.role === 'ADMIN' ? (req.body.schoolId || user.schoolId) : user.schoolId;

  if (!schoolId) {
    throw new ValidationError('School ID is required');
  }

  // Verify the admin belongs to this school (if SCHOOL_ADMIN)
  if (user.role === 'SCHOOL_ADMIN') {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundError('School');
    }
  }

  // Create announcement
  const announcement = await prisma.announcement.create({
    data: {
      schoolId,
      title,
      content,
      targetRole: targetRole || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      publishedAt: new Date(),
    },
    include: {
      school: {
        select: { id: true, name: true },
      },
    },
  });

  // Create notifications for all users of the school (or specific role if targetRole is set)
  const where = { schoolId };
  if (targetRole) {
    where.role = targetRole;
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  // Create notifications for all users
  if (users.length > 0) {
    const notificationPromises = users.map((u) =>
      prisma.notification.create({
        data: {
          userId: u.id,
          title: `New announcement: ${title}`,
          message: content.substring(0, 100),
          type: 'info',
          category: 'announcement',
          actionUrl: `/announcements/${announcement.id}`,
          metadata: {
            announcementId: announcement.id,
            schoolId,
          },
        },
      }).catch((error) => {
        console.error('Failed to create announcement notification for user:', u.id, error);
      })
    );

    try {
      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} announcement notifications`);
    } catch (error) {
      console.error('Error creating announcement notifications:', error);
    }
  }

  res.status(201).json({
    success: true,
    data: announcement,
    message: 'Announcement created successfully',
  });
});

/**
 * Get announcements for school
 * @route GET /api/v1/announcements
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const user = req.user;
  const { targetRole, limit = 20, offset = 0 } = req.query;

  if (!user.schoolId && user.role !== 'ADMIN') {
    throw new ValidationError('School ID is required');
  }

  const schoolId = user.role === 'ADMIN' ? (req.query.schoolId || user.schoolId) : user.schoolId;

  // Build where clause
  let whereClause = {
    schoolId,
    isActive: true,
    publishedAt: {
      lte: new Date(),
    },
  };

  // Filter by expiration date
  whereClause = {
    ...whereClause,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  };

  // Filter by target role if specified
  if (targetRole) {
    whereClause = {
      ...whereClause,
      targetRole: {
        in: targetRole.split(',').map(r => r.trim()),
      },
    };
  }

  const announcements = await prisma.announcement.findMany({
    where: whereClause,
    include: {
      school: {
        select: { id: true, name: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  });

  const total = await prisma.announcement.count({
    where: whereClause,
  });

  res.json({
    success: true,
    data: announcements,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit)),
    },
    message: 'Announcements retrieved successfully',
  });
});

/**
 * Get announcement by ID
 * @route GET /api/v1/announcements/:id
 */
const getAnnouncementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      school: {
        select: { id: true, name: true },
      },
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  res.json({
    success: true,
    data: announcement,
    message: 'Announcement retrieved successfully',
  });
});

/**
 * Update an announcement (Admin only)
 * @route PUT /api/v1/announcements/:id
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { title, content, targetRole, isActive, expiresAt } = req.body;

  // Only SCHOOL_ADMIN or ADMIN can update announcements
  if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'ADMIN') {
    throw new AuthorizationError('Only school admins can update announcements');
  }

  // Get the announcement
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // Verify authorization
  if (user.role === 'SCHOOL_ADMIN' && announcement.schoolId !== user.schoolId) {
    throw new AuthorizationError('You can only update announcements in your school');
  }

  // Update announcement
  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(targetRole !== undefined && { targetRole: targetRole || null }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    },
    include: {
      school: {
        select: { id: true, name: true },
      },
    },
  });

  res.json({
    success: true,
    data: updated,
    message: 'Announcement updated successfully',
  });
});

/**
 * Delete an announcement (Admin only)
 * @route DELETE /api/v1/announcements/:id
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  // Only SCHOOL_ADMIN or ADMIN can delete announcements
  if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'ADMIN') {
    throw new AuthorizationError('Only school admins can delete announcements');
  }

  // Get the announcement
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // Verify authorization
  if (user.role === 'SCHOOL_ADMIN' && announcement.schoolId !== user.schoolId) {
    throw new AuthorizationError('You can only delete announcements in your school');
  }

  // Delete announcement
  await prisma.announcement.delete({
    where: { id },
  });

  res.json({
    success: true,
    data: null,
    message: 'Announcement deleted successfully',
  });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
