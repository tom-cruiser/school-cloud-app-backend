const express = require('express');
const router = express.Router();
const systemHealthSettingsController = require('../controllers/systemHealthSettingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication and super admin authorization to all routes
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// System Health Settings routes
router.get('/', systemHealthSettingsController.getSettings);
router.put('/', systemHealthSettingsController.updateSettings);
router.post('/reset', systemHealthSettingsController.resetSettings);

module.exports = router;