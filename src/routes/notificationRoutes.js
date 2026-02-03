const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
