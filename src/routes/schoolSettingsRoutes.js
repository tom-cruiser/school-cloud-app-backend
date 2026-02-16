const express = require('express');
const { schoolSettingsController } = require('../controllers/schoolSettingsController');
const { authenticate, authorize } = require('../middleware/auth');
const templateUpload = require('../config/templateUpload');

const router = express.Router();

router.get(
	'/template-settings',
	authenticate,
	authorize(['SCHOOL_ADMIN']),
	schoolSettingsController.getTemplateSettings
);
router.put(
	'/template-settings',
	authenticate,
	authorize(['SCHOOL_ADMIN']),
	templateUpload.fields([
		{ name: 'reportTemplateFile', maxCount: 1 },
		{ name: 'idCardTemplateFile', maxCount: 1 },
	]),
	schoolSettingsController.updateTemplateSettings
);

module.exports = router;
