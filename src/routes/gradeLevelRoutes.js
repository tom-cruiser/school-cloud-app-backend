const express = require('express');
const router = express.Router();
const gradeLevelController = require('../controllers/gradeLevelController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', gradeLevelController.getAllGradeLevels);
router.post('/', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), gradeLevelController.createGradeLevel);
router.put('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), gradeLevelController.updateGradeLevel);
router.delete('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), gradeLevelController.deleteGradeLevel);

module.exports = router;
