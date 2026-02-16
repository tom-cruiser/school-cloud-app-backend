const { asyncHandler } = require('../utils/errors');
const prisma = require("../config/database");

const attachUsersToRsvps = async (rsvps) => {
  if (!Array.isArray(rsvps) || rsvps.length === 0) return [];

  const userIds = [...new Set(rsvps.map((item) => item.userId).filter(Boolean))];
  if (userIds.length === 0) return rsvps;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  const userById = new Map(users.map((user) => [user.id, user]));
  return rsvps.map((item) => ({
    ...item,
    user: userById.get(item.userId) || null,
  }));
};

// Get events for a group or school
exports.getEvents = asyncHandler(async (req, res) => {
  const { schoolId, groupId } = req.query;
  const { limit = 20, skip = 0 } = req.query;

  const where = {};
  if (schoolId) where.schoolId = schoolId;
  if (groupId) where.groupId = groupId;

  const events = await prisma.event.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(skip),
    orderBy: { startDate: "asc" },
    include: {
      rsvps: true,
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });

  const total = await prisma.event.count({ where });

  res.status(200).json({
    success: true,
    data: events,
    total,
  });
});

// Get event details
exports.getEventDetail = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rsvps: true,
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  const enrichedRsvps = await attachUsersToRsvps(event.rsvps);

  res.status(200).json({
    success: true,
    data: {
      ...event,
      rsvps: enrichedRsvps,
    },
  });
});

// Create event
exports.createEvent = asyncHandler(async (req, res) => {
  const { groupId, schoolId } = req.params;
  const {
    title,
    description,
    startDate,
    endDate,
    location,
    eventType,
    isAllDay,
  } = req.body;
  const userId = req.user.id;

  if (!title || !startDate) {
    return res.status(400).json({
      success: false,
      message: "Title and start date are required",
    });
  }

  const event = await prisma.event.create({
    data: {
      groupId,
      schoolId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      location,
      eventType: eventType || "event",
      isAllDay: isAllDay || false,
      createdBy: userId,
    },
  });

  res.status(201).json({
    success: true,
    data: event,
  });
});

// Update event
exports.updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const {
    title,
    description,
    startDate,
    endDate,
    location,
    eventType,
    isAllDay,
  } = req.body;

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location,
      eventType,
      isAllDay,
    },
  });

  res.status(200).json({
    success: true,
    data: event,
  });
});

// RSVP to event
exports.rsvpEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { response } = req.body;
  const userId = req.user.id;

  if (!["accepted", "declined", "tentative", "pending"].includes(response)) {
    return res.status(400).json({
      success: false,
      message: "Invalid RSVP response",
    });
  }

  // Get event and user info
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, createdBy: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const rsvp = await prisma.eventRSVP.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    update: {
      response,
      respondedAt: new Date(),
    },
    create: {
      eventId,
      userId,
      response,
      respondedAt: new Date(),
    },
  });

  // Create notification for event creator
  if (event && event.createdBy && event.createdBy !== userId) {
    await prisma.notification.create({
      data: {
        userId: event.createdBy,
        title: `${user.firstName} ${user.lastName} ${response} the event`,
        message: `${user.firstName} ${user.lastName} has ${response} your event "${event.title}"`,
        type: 'info',
        category: 'message',
        actionUrl: `/events/${eventId}`,
        metadata: {
          eventId,
          rsvpId: rsvp.id,
          userId,
          response,
        },
      },
    });
  }

  res.status(200).json({
    success: true,
    data: rsvp,
  });
});

// Get event RSVPs
exports.getEventRSVPs = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { response } = req.query;

  const where = { eventId };
  if (response) where.response = response;

  const rsvps = await prisma.eventRSVP.findMany({
    where,
  });

  const enrichedRsvps = await attachUsersToRsvps(rsvps);

  res.status(200).json({
    success: true,
    data: enrichedRsvps,
  });
});

// Delete event
exports.deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  await prisma.event.delete({
    where: { id: eventId },
  });

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});
