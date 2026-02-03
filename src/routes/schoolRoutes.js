const express = require('express');
const { schoolController, createSchoolSchema, updateSchoolSchema, createAdminSchema } = require('../controllers/schoolController');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

const router = express.Router();

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.post('/', validate(createSchoolSchema), schoolController.createSchool);
router.get('/', schoolController.getAllSchools);
router.get('/:id', schoolController.getSchoolById);
router.put('/:id', validate(updateSchoolSchema), schoolController.updateSchool);
router.patch('/:id', validate(updateSchoolSchema), schoolController.updateSchool);
router.patch('/:id/toggle-status', schoolController.toggleSchoolStatus);
router.delete('/:id', schoolController.deleteSchool);
router.get('/:id/stats', schoolController.getSchoolStats);
router.post('/:id/admin', validate(createAdminSchema), schoolController.createSchoolAdmin);

module.exports = router;
