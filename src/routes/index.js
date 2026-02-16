const express = require('express');
const authRoutes = require('./authRoutes');
const schoolRoutes = require('./schoolRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const teacherRoutes = require('./teacherRoutes');
const guardianRoutes = require('./guardianRoutes');
const departmentRoutes = require('./departmentRoutes');
const academicYearRoutes = require('./academicYearRoutes');
const termRoutes = require('./termRoutes');
const gradeLevelRoutes = require('./gradeLevelRoutes');
const houseRoutes = require('./houseRoutes');
const transportRouteRoutes = require('./transportRouteRoutes');
const libraryRoutes = require('./libraryRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const systemRoutes = require('./systemRoutes');
const supportRoutes = require('./supportRoutes');
const superAdminSupportRoutes = require('./superAdminSupportRoutes');
const notificationRoutes = require('./notificationRoutes');
const messageRoutes = require('./messageRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const systemHealthSettingsRoutes = require('./systemHealthSettingsRoutes');
const subjectRoutes = require('./subjectRoutes');
const classRoutes = require('./classRoutes');
const gradeRoutes = require('./gradeRoutes');
const userAnalyticsRoutes = require('./userAnalyticsRoutes');
const announcementRoutes = require('./announcementRoutes');
const groupRoutes = require('./groupRoutes');
const eventRoutes = require('./eventRoutes');
const discussionRoutes = require('./discussionRoutes');
const lessonPlanRoutes = require('./lessonPlanRoutes');
const schoolSettingsRoutes = require('./schoolSettingsRoutes');
const config = require('../config');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/super-admin/schools', schoolRoutes);
router.use('/super-admin/users', userRoutes);
router.use('/super-admin/support', superAdminSupportRoutes);
router.use('/super-admin/analytics', analyticsRoutes);
router.use('/super-admin/system-health/settings', systemHealthSettingsRoutes);
router.use('/support', supportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/guardians', guardianRoutes);
router.use('/departments', departmentRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/terms', termRoutes);
router.use('/grade-levels', gradeLevelRoutes);
router.use('/houses', houseRoutes);
router.use('/transport-routes', transportRouteRoutes);
router.use('/subjects', subjectRoutes);
router.use('/classes', classRoutes);
router.use('/grades', gradeRoutes);
router.use('/analytics', userAnalyticsRoutes);
router.use('/announcements', announcementRoutes);
router.use('/library', libraryRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/lesson-plans', lessonPlanRoutes);
router.use('/schools', schoolSettingsRoutes);
router.use('/system', systemRoutes);
router.use('/', groupRoutes);
router.use('/', eventRoutes);
router.use('/', discussionRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

module.exports = router;
