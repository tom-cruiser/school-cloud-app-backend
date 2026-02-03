const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication first, then SUPER_ADMIN authorization to all analytics routes
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// System-wide analytics
router.get('/overview', analyticsController.getSystemAnalytics);

// School-specific analytics
router.get('/schools', analyticsController.getSchoolAnalytics);

// User engagement analytics
router.get('/users', analyticsController.getUserEngagement);

// System health endpoints
router.get('/health', analyticsController.getSystemHealth);
router.get('/health/history', analyticsController.getSystemHealthHistory);

module.exports = router;