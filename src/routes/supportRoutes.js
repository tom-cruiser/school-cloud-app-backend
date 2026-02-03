const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication
router.use(authenticate);

// User routes (school admins, teachers can create support messages)
router.post('/messages', authorize('SCHOOL_ADMIN', 'TEACHER'), supportController.createMessage);
router.get('/messages/user', authorize('SCHOOL_ADMIN', 'TEACHER'), supportController.getUserMessages);

module.exports = router;