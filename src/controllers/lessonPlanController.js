const Joi = require('joi');
const lessonPlanService = require('../services/lessonPlanService');
const { asyncHandler } = require('../utils/errors');

// Validation schemas
const createLessonPlanSchema = Joi.object({
  classId: Joi.string().uuid().allow(null, ''),
  subjectId: Joi.string().uuid().allow(null, ''),
  title: Joi.string().required().max(255),
  topic: Joi.string().allow('').max(255),
  date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(1).max(480).required(),
  objectives: Joi.array().items(Joi.string().max(500)).required(),
  materials: Joi.array().items(Joi.string().max(255)).allow(null),
  activities: Joi.array().items(Joi.object({
    time: Joi.string().required(),
    description: Joi.string().required().max(1000),
    type: Joi.string().valid('WARMUP', 'INSTRUCTION', 'PRACTICE', 'ASSESSMENT', 'CLOSURE', 'DISCUSSION', 'LABORATORY', 'FIELDWORK', 'PRESENTATION').required()
  })).required(),
  assessment: Joi.string().allow('').max(1000),
  homework: Joi.string().allow('').max(1000),
  notes: Joi.string().allow('').max(2000),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'COMPLETED', 'ARCHIVED').default('DRAFT')
});

const updateLessonPlanSchema = Joi.object({
  classId: Joi.string().uuid().allow(null, ''),
  subjectId: Joi.string().uuid().allow(null, ''),
  title: Joi.string().max(255),
  topic: Joi.string().allow('').max(255),
  date: Joi.date().iso(),
  duration: Joi.number().integer().min(1).max(480),
  objectives: Joi.array().items(Joi.string().max(500)),
  materials: Joi.array().items(Joi.string().max(255)).allow(null),
  activities: Joi.array().items(Joi.object({
    time: Joi.string().required(),
    description: Joi.string().required().max(1000),
    type: Joi.string().valid('WARMUP', 'INSTRUCTION', 'PRACTICE', 'ASSESSMENT', 'CLOSURE', 'DISCUSSION', 'LABORATORY', 'FIELDWORK', 'PRESENTATION').required()
  })),
  assessment: Joi.string().allow('').max(1000),
  homework: Joi.string().allow('').max(1000),
  notes: Joi.string().allow('').max(2000),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'COMPLETED', 'ARCHIVED')
});

class LessonPlanController {
  // Get all lesson plans for a teacher or school admin
  getLessonPlans = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      teacherId,
      classId,
      subjectId,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      classId,
      subjectId,
      dateFrom,
      dateTo,
      search
    };

    // If user is a teacher, only show their lesson plans
    if (role === 'TEACHER') {
      const teacher = await lessonPlanService.getTeacherByUserId(userId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      filters.teacherId = teacher.id;
    } else if (role === 'SCHOOL_ADMIN' && teacherId) {
      // School admin can filter by specific teacher
      filters.teacherId = teacherId;
    }

    const result = await lessonPlanService.getLessonPlans(schoolId, filters);

    res.status(200).json({
      success: true,
      message: 'Lesson plans retrieved successfully',
      data: result
    });
  });

  // Get lesson plan by ID
  getLessonPlanById = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    const { id } = req.params;

    let teacherId = null;
    if (role === 'TEACHER') {
      const teacher = await lessonPlanService.getTeacherByUserId(userId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      teacherId = teacher.id;
    }

    const lessonPlan = await lessonPlanService.getLessonPlanById(schoolId, id, teacherId);

    res.status(200).json({
      success: true,
      message: 'Lesson plan retrieved successfully',
      data: lessonPlan
    });
  });

  // Create new lesson plan
  createLessonPlan = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    
    if (role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create lesson plans'
      });
    }

    const { error, value } = createLessonPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const teacher = await lessonPlanService.getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    const lessonPlan = await lessonPlanService.createLessonPlan(schoolId, teacher.id, value);

    res.status(201).json({
      success: true,
      message: 'Lesson plan created successfully',
      data: lessonPlan
    });
  });

  // Update lesson plan
  updateLessonPlan = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    const { id } = req.params;

    const { error, value } = updateLessonPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    let teacherId = null;
    if (role === 'TEACHER') {
      const teacher = await lessonPlanService.getTeacherByUserId(userId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      teacherId = teacher.id;
    }

    const lessonPlan = await lessonPlanService.updateLessonPlan(schoolId, id, value, teacherId);

    res.status(200).json({
      success: true,
      message: 'Lesson plan updated successfully',
      data: lessonPlan
    });
  });

  // Delete lesson plan
  deleteLessonPlan = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    const { id } = req.params;

    let teacherId = null;
    if (role === 'TEACHER') {
      const teacher = await lessonPlanService.getTeacherByUserId(userId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      teacherId = teacher.id;
    }

    await lessonPlanService.deleteLessonPlan(schoolId, id, teacherId);

    res.status(200).json({
      success: true,
      message: 'Lesson plan deleted successfully'
    });
  });

  // Duplicate lesson plan
  duplicateLessonPlan = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    const { id } = req.params;
    
    if (role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can duplicate lesson plans'
      });
    }

    const teacher = await lessonPlanService.getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    const lessonPlan = await lessonPlanService.duplicateLessonPlan(schoolId, id, teacher.id);

    res.status(201).json({
      success: true,
      message: 'Lesson plan duplicated successfully',
      data: lessonPlan
    });
  });

  // Get lesson plan statistics
  getLessonPlanStats = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;

    let teacherId = null;
    if (role === 'TEACHER') {
      const teacher = await lessonPlanService.getTeacherByUserId(userId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      teacherId = teacher.id;
    }

    const stats = await lessonPlanService.getLessonPlanStats(schoolId, teacherId);

    res.status(200).json({
      success: true,
      message: 'Lesson plan statistics retrieved successfully',
      data: stats
    });
  });

  // Get upcoming lessons for dashboard
  getUpcomingLessons = asyncHandler(async (req, res) => {
    const { schoolId, role, id: userId } = req.user;
    const { days = 7 } = req.query;

    let teacherId = null;
    if (role === 'TEACHER') {
      const teacher = await lessonPlanService.getTeacherByUserId(userId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      teacherId = teacher.id;
    }

    const lessons = await lessonPlanService.getUpcomingLessons(schoolId, teacherId, parseInt(days));

    res.status(200).json({
      success: true,
      message: 'Upcoming lessons retrieved successfully',
      data: lessons
    });
  });
}

module.exports = new LessonPlanController();