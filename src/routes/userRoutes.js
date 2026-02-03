const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/', userController.getAllUsers);

module.exports = router;
