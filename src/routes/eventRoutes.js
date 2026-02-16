const express = require('express');
const router = express.Router({ mergeParams: true });
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

// Get events
router.get('/events', authenticate, eventController.getEvents);

// Get event details
router.get('/events/:eventId', authenticate, eventController.getEventDetail);

// Create event
router.post('/schools/:schoolId/groups/:groupId/events', authenticate, eventController.createEvent);

// Update event
router.put('/events/:eventId', authenticate, eventController.updateEvent);

// RSVP to event
router.post('/events/:eventId/rsvp', authenticate, eventController.rsvpEvent);

// Get event RSVPs
router.get('/events/:eventId/rsvps', authenticate, eventController.getEventRSVPs);

// Delete event
router.delete('/events/:eventId', authenticate, eventController.deleteEvent);

module.exports = router;
