const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// Admin routes (must come first)
router.get('/admin/guardians', authenticate, authorize(['SCHOOL_ADMIN']), guardianController.getSchoolGuardians);
router.post('/admin/guardians', authenticate, authorize(['SCHOOL_ADMIN']), guardianController.createGuardianAsAdmin);
router.post('/admin/guardians/:guardianId/students', authenticate, authorize(['SCHOOL_ADMIN']), guardianController.linkStudentToGuardian);
router.delete('/admin/guardians/:guardianId/students/:studentId', authenticate, authorize(['SCHOOL_ADMIN']), guardianController.unlinkStudentFromGuardian);
router.delete('/admin/guardians/:guardianId', authenticate, authorize(['SCHOOL_ADMIN']), guardianController.deleteGuardianAsAdmin);

// All guardian routes require authentication as GUARDIAN
router.use(authenticate);
router.use(authorize(['GUARDIAN']));

// Profile routes
router.get('/me', guardianController.getMyProfile);
router.put('/me', guardianController.updateMyProfile);

// Children routes
router.get('/children', guardianController.getMyChildren);
router.get('/children/:studentId', guardianController.getChildDetails);
router.get('/children/:studentId/grades', guardianController.getChildAcademicProgress);
router.get('/children/:studentId/attendance', guardianController.getChildAttendance);
router.get('/children/:studentId/assignments', guardianController.getChildAssignments);

// Dashboard
router.get('/dashboard', guardianController.getDashboardOverview);

// Payments
router.get('/payments', guardianController.getPayments);
router.post('/payments/:paymentId/pay', guardianController.makePayment);

module.exports = router;
