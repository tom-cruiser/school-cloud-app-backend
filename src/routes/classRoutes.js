const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication
router.use(authenticate);

// Get all classes
router.get('/', authorize(['SCHOOL_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']), classController.getAllClasses);

// Get my classes (for teachers and students)
router.get('/my-classes', classController.getMyClasses);

// Get class by ID
router.get('/:classId', classController.getClassById);

// Get class students
router.get('/:classId/students', classController.getClassStudents);

// Enroll students in a class (admin only)
router.post('/:classId/enroll', authorize(['SCHOOL_ADMIN', 'ADMIN']), classController.enrollStudents);

// Remove students from a class (admin only)
router.post('/:classId/remove-students', authorize(['SCHOOL_ADMIN', 'ADMIN']), classController.removeStudents);

// Create class (admin only)
router.post('/', authorize(['SCHOOL_ADMIN', 'ADMIN']), classController.createClass);

// Update class (admin only)
router.put('/:classId', authorize(['SCHOOL_ADMIN', 'ADMIN']), classController.updateClass);

// Delete class (admin only)
router.delete('/:classId', authorize(['SCHOOL_ADMIN', 'ADMIN']), classController.deleteClass);

module.exports = router;module.exports = router;
