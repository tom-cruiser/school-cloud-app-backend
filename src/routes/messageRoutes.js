const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/', messageController.sendMessage);

// Get inbox (received messages)
router.get('/inbox', messageController.getInbox);

// Get sent messages
router.get('/sent', messageController.getSentMessages);

// Get unread message count
router.get('/unread/count', messageController.getUnreadCount);

// Get list of users to message
router.get('/users', messageController.getMessageableUsers);

// Get all conversations
router.get('/conversations', messageController.getConversations);

// Get conversation with a specific user
router.get('/conversation/:userId', messageController.getConversation);

// Get a single message
router.get('/:id', messageController.getMessage);

// Mark message as read
router.patch('/:id/read', messageController.markAsRead);

// Mark multiple messages as read
router.patch('/read-multiple', messageController.markMultipleAsRead);

// Delete a message
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
