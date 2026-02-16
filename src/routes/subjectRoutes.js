const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication
router.use(authenticate);

/**
 * Public read routes (all authenticated users can view subjects)
 */
router.get('/', subjectController.getAllSubjects);
router.get('/:id', subjectController.getSubjectById);

/**
 * Protected write routes (only admins can create/update/delete)
 */
router.post('/', authorize(['SCHOOL_ADMIN', 'ADMIN']), subjectController.createSubject);
router.put('/:id', authorize(['SCHOOL_ADMIN', 'ADMIN']), subjectController.updateSubject);
router.delete('/:id', authorize(['SCHOOL_ADMIN', 'ADMIN']), subjectController.deleteSubject);

module.exports = router;
