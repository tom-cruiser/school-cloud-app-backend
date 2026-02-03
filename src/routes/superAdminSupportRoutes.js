const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/messages', supportController.getAllMessages);
router.patch('/messages/:id/read', supportController.markAsRead);
router.post('/messages/:id/respond', supportController.respondToMessage);
router.patch('/messages/:id/status', supportController.updateStatus);
router.get('/stats', supportController.getStats);

module.exports = router;