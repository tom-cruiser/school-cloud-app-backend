const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Placeholder: replace with real superadmin auth middleware
const requireSuperAdmin = (req, res, next) => {
	// Example: req.user && req.user.role === 'SUPER_ADMIN'
	// For now, allow all for demo
	next();
};

// GET /api/subscription-plans
router.get('/plans', subscriptionController.getSubscriptionPlans);

// PUT /api/subscription-plans (superadmin only)
router.put('/plans', requireSuperAdmin, subscriptionController.updateSubscriptionPlans);

module.exports = router;
