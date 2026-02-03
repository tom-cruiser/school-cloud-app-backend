const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

router.use(authenticate);

// Teacher-specific routes (must come before /:id routes to avoid conflicts)
router.get('/dashboard/stats', authorize(['TEACHER']), teacherController.getDashboardStats);
router.get('/me', authorize(['TEACHER']), teacherController.getMyProfile);
router.put('/me', authorize(['TEACHER']), teacherController.updateMyProfile);
router.get('/classes', authorize(['TEACHER']), teacherController.getMyClasses);
router.get('/classes/:id/students', authorize(['TEACHER']), teacherController.getClassStudents);
router.get('/attendance', authorize(['TEACHER']), teacherController.getAttendance);
router.post('/attendance', authorize(['TEACHER']), teacherController.markAttendance);

// Assignment routes
router.get('/assignments', authorize(['TEACHER']), teacherController.getAssignments);
router.post('/assignments', authorize(['TEACHER']), teacherController.createAssignment);
router.put('/assignments/:id', authorize(['TEACHER']), teacherController.updateAssignment);
router.delete('/assignments/:id', authorize(['TEACHER']), teacherController.deleteAssignment);
router.get('/assignments/:id/submissions', authorize(['TEACHER']), teacherController.getSubmissions);
router.put('/submissions/:id/grade', authorize(['TEACHER']), teacherController.gradeSubmission);

// Grades routes
router.get('/grades', authorize(['TEACHER']), teacherController.getGrades);
router.post('/grades', authorize(['TEACHER']), teacherController.saveGrades);

// Admin routes for managing teachers
router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacherById);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  validate(teacherController.createTeacherSchema),
  teacherController.createTeacher
);
router.put(
  '/:id',
  authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  validate(teacherController.updateTeacherSchema),
  teacherController.updateTeacher
);
router.delete('/:id', authorize(['SUPER_ADMIN', 'SCHOOL_ADMIN']), teacherController.deleteTeacher);

module.exports = router;
