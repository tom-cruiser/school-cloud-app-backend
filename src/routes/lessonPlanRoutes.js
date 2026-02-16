const express = require('express');
const router = express.Router();
const lessonPlanController = require('../controllers/lessonPlanController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All routes require authentication
router.use(authenticate);

// ==================== LESSON PLANS ====================

// Get all lesson plans (teachers see their own, admins see all)
router.get('/', 
  authorize(['TEACHER', 'SCHOOL_ADMIN']),
  lessonPlanController.getLessonPlans
);

// Get lesson plan statistics
router.get('/stats',
  authorize(['TEACHER', 'SCHOOL_ADMIN']),
  lessonPlanController.getLessonPlanStats
);

// Get upcoming lessons for dashboard
router.get('/upcoming',
  authorize(['TEACHER', 'SCHOOL_ADMIN']),
  lessonPlanController.getUpcomingLessons
);

// Get lesson plan by ID
router.get('/:id',
  authorize(['TEACHER', 'SCHOOL_ADMIN']),
  lessonPlanController.getLessonPlanById
);

// Create new lesson plan (teachers only)
router.post('/',
  authorize(['TEACHER']),
  lessonPlanController.createLessonPlan
);

// Duplicate lesson plan (teachers only)
router.post('/:id/duplicate',
  authorize(['TEACHER']),
  lessonPlanController.duplicateLessonPlan
);

// Update lesson plan
router.put('/:id',
  authorize(['TEACHER', 'SCHOOL_ADMIN']),
  lessonPlanController.updateLessonPlan
);

// Delete lesson plan
router.delete('/:id',
  authorize(['TEACHER', 'SCHOOL_ADMIN']),
  lessonPlanController.deleteLessonPlan
);

module.exports = router;