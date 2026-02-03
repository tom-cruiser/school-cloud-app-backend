const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.use(authenticate);

router.get('/', academicYearController.getAllAcademicYears);
router.get('/:id', academicYearController.getAcademicYearById);
router.post('/', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), academicYearController.createAcademicYear);
router.put('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), academicYearController.updateAcademicYear);
router.delete('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), academicYearController.deleteAcademicYear);

module.exports = router;
