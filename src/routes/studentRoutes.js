const express = require('express');
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createStudentSchema } = require('../controllers/studentController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student's own data routes (must come before /:id routes)
router.get('/dashboard/stats', authorize(['STUDENT']), studentController.getDashboardStats);
router.get('/me', authorize(['STUDENT']), studentController.getMyProfile);
router.put('/me', authorize(['STUDENT']), studentController.updateMyProfile);
router.get('/classes', authorize(['STUDENT']), studentController.getMyClasses);
router.get('/assignments', authorize(['STUDENT']), studentController.getMyAssignments);
router.post('/assignments/:id/submit', authorize(['STUDENT']), studentController.submitAssignment);
router.get('/grades', authorize(['STUDENT']), studentController.getMyGrades);
router.get('/attendance', authorize(['STUDENT']), studentController.getMyAttendance);
router.get('/my/report-card', authorize(['STUDENT']), studentController.getMyReportCard);
router.get('/my/report-card/download', authorize(['STUDENT']), studentController.downloadMyReportCard);
router.get('/my/id-card', authorize(['STUDENT']), studentController.getMyIdCard);
router.get('/my/id-card/download', authorize(['STUDENT']), studentController.downloadMyIdCard);

// School admin routes
router.post('/', authorize(['SCHOOL_ADMIN']), validate(createStudentSchema), studentController.createStudent);
router.get('/', authorize(['SCHOOL_ADMIN', 'TEACHER']), studentController.getStudents);
router.get('/:id', authorize(['SCHOOL_ADMIN', 'TEACHER']), studentController.getStudentById);
router.put('/:id', authorize(['SCHOOL_ADMIN']), studentController.updateStudent);
router.delete('/:id', authorize(['SCHOOL_ADMIN']), studentController.deleteStudent);

// Report card and ID card routes for specific students
router.get('/:id/report-card', authorize(['SCHOOL_ADMIN', 'TEACHER']), studentController.getStudentReportCard);
router.get('/:id/report-card/download', authorize(['SCHOOL_ADMIN', 'TEACHER']), studentController.downloadStudentReportCard);
router.get('/:id/id-card', authorize(['SCHOOL_ADMIN', 'TEACHER']), studentController.getStudentIdCard);
router.get('/:id/id-card/download', authorize(['SCHOOL_ADMIN', 'TEACHER']), studentController.downloadStudentIdCard);

module.exports = router;
