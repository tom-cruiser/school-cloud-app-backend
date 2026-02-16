const express = require('express');
const userAnalyticsController = require('../controllers/userAnalyticsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get analytics data based on user role and date range
// Accessible to all authenticated users (they see data relevant to their role)
router.get('/', userAnalyticsController.getAnalytics);

module.exports = router;
