const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.use(authenticate);

// Create attendance
router.post('/', authorize(['TEACHER', 'SCHOOL_ADMIN']), attendanceController.createAttendance);

// Bulk create attendance
router.post('/bulk', authorize(['TEACHER', 'SCHOOL_ADMIN']), attendanceController.bulkCreateAttendance);

// Get attendance by class
router.get('/class/:classId', attendanceController.getAttendanceByClass);

// Get attendance by student
router.get('/student/:studentId', attendanceController.getAttendanceByStudent);

// Get attendance statistics
router.get('/statistics/:classId', attendanceController.getAttendanceStatistics);

// Get class attendance report
router.get('/report/:classId', attendanceController.getClassAttendanceReport);

// Update attendance
router.put('/:id', authorize(['TEACHER', 'SCHOOL_ADMIN']), attendanceController.updateAttendance);

// Delete attendance
router.delete('/:id', authorize(['TEACHER', 'SCHOOL_ADMIN']), attendanceController.deleteAttendance);

module.exports = router;
