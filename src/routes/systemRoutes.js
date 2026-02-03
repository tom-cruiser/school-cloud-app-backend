const express = require('express');
const router = express.Router();
const systemHealthController = require('../controllers/systemHealthController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// Get system health metrics
router.get('/health', systemHealthController.getSystemHealth);

// Get recent activity
router.get('/activity', systemHealthController.getRecentActivity);

// Get system alerts
router.get('/alerts', systemHealthController.getSystemAlerts);

module.exports = router;
