const teacherService = require('../services/teacherService');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess, sendPaginatedResponse, getPagination } = require('../utils/helpers');
const Joi = require('joi');

class TeacherController {
  /**
   * Create a new teacher
   * POST /api/v1/teachers
   */
  createTeacher = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const teacher = await teacherService.createTeacher(schoolId, req.body);
    sendSuccess(res, teacher, 'Teacher created successfully', 201);
  });

  /**
   * Get all teachers for the school
   * GET /api/v1/teachers
   */
  getTeachers = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { page, limit, search, departmentId } = req.query;
    const { skip, take } = getPagination(page, limit);

    const { teachers, total } = await teacherService.getTeachers(schoolId, {
      skip,
      take,
      search,
      departmentId,
    });

    sendPaginatedResponse(res, teachers, page || 1, limit || 10, total, 'Teachers retrieved successfully');
  });

  /**
   * Get teacher by ID
   * GET /api/v1/teachers/:id
   */
  getTeacherById = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const teacher = await teacherService.getTeacherById(req.params.id, schoolId);
    sendSuccess(res, teacher, 'Teacher retrieved successfully');
  });

  /**
   * Update teacher
   * PUT /api/v1/teachers/:id
   */
  updateTeacher = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const teacher = await teacherService.updateTeacher(req.params.id, schoolId, req.body);
    sendSuccess(res, teacher, 'Teacher updated successfully');
  });

  /**
   * Delete teacher
   * DELETE /api/v1/teachers/:id
   */
  deleteTeacher = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    await teacherService.deleteTeacher(req.params.id, schoolId);
    sendSuccess(res, null, 'Teacher deleted successfully');
  });

  /**
   * Get dashboard statistics
   * GET /api/v1/teachers/dashboard/stats
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    console.log(`[getDashboardStats] Fetching stats for teacher: ${teacherId}, school: ${schoolId}`);
    const stats = await teacherService.getDashboardStats(teacherId, schoolId);
    console.log(`[getDashboardStats] Success - returning stats with ${stats.totalClasses} classes`);
    sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
  });

  /**
   * Get current teacher's profile
   * GET /api/v1/teachers/me
   */
  getMyProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    console.log(`[getMyProfile] Fetching profile for userId: ${userId}`);
    const profile = await teacherService.getMyProfile(userId);
    console.log(`[getMyProfile] Success - profile retrieved`);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  });

  /**
   * Update current teacher's profile
   * PUT /api/v1/teachers/me
   */
  updateMyProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await teacherService.updateMyProfile(userId, req.body);
    sendSuccess(res, profile, 'Profile updated successfully');
  });

  /**
   * Get teacher's classes
   * GET /api/v1/teachers/classes
   */
  getMyClasses = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const classes = await teacherService.getMyClasses(teacherId, schoolId);
    sendSuccess(res, classes, 'Classes retrieved successfully');
  });

  /**
   * Get students in a class
   * GET /api/v1/teachers/classes/:id/students
   */
  getClassStudents = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const students = await teacherService.getClassStudents(req.params.id, teacherId, schoolId);
    sendSuccess(res, students, 'Students retrieved successfully');
  });

  /**
   * Get attendance for a class
   * GET /api/v1/teachers/attendance?classId=&date=
   */
  getAttendance = asyncHandler(async (req, res) => {
    const { classId, date } = req.query;
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    
    if (!classId || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'classId and date are required',
        },
      });
    }

    const attendance = await teacherService.getAttendance(classId, date, teacherId, schoolId);
    sendSuccess(res, attendance, 'Attendance retrieved successfully');
  });

  /**
   * Mark attendance
   * POST /api/v1/teachers/attendance
   */
  markAttendance = asyncHandler(async (req, res) => {
    const { classId, date, attendance } = req.body;
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;

    if (!classId || !date || !attendance || !Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'classId, date, and attendance array are required',
        },
      });
    }

    const records = await teacherService.markAttendance(classId, date, attendance, teacherId, schoolId);
    
    // Emit WebSocket event if available
    if (global.wsServer) {
      const studentIds = attendance.map(a => a.studentId);
      global.wsServer.sendAttendanceUpdate(studentIds, { classId, date, records });
    }

    sendSuccess(res, records, 'Attendance marked successfully');
  });

  /**
   * Get assignments for the teacher
   * GET /api/v1/teachers/assignments
   */
  getAssignments = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { classId, status } = req.query;

    const assignments = await teacherService.getAssignments(teacherId, schoolId, {
      classId,
      status,
    });

    sendSuccess(res, assignments, 'Assignments retrieved successfully');
  });

  /**
   * Create a new assignment
   * POST /api/v1/teachers/assignments
   */
  createAssignment = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;

    const assignment = await teacherService.createAssignment(
      teacherId,
      schoolId,
      req.body
    );

    // Emit WebSocket event
    if (global.wsServer) {
      global.wsServer.emitToSchool(schoolId, 'assignmentCreated', {
        assignment,
        teacherId,
      });
    }

    sendSuccess(res, assignment, 'Assignment created successfully', 201);
  });

  /**
   * Update an assignment
   * PUT /api/v1/teachers/assignments/:id
   */
  updateAssignment = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { id } = req.params;

    const assignment = await teacherService.updateAssignment(
      id,
      teacherId,
      schoolId,
      req.body
    );

    // Emit WebSocket event
    if (global.wsServer) {
      global.wsServer.emitToSchool(schoolId, 'assignmentUpdated', {
        assignment,
        teacherId,
      });
    }

    sendSuccess(res, assignment, 'Assignment updated successfully');
  });

  /**
   * Delete an assignment
   * DELETE /api/v1/teachers/assignments/:id
   */
  deleteAssignment = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { id } = req.params;

    await teacherService.deleteAssignment(id, teacherId, schoolId);

    // Emit WebSocket event
    if (global.wsServer) {
      global.wsServer.emitToSchool(schoolId, 'assignmentDeleted', {
        assignmentId: id,
        teacherId,
      });
    }

    sendSuccess(res, {}, 'Assignment deleted successfully');
  });

  /**
   * Get submissions for an assignment
   * GET /api/v1/teachers/assignments/:id/submissions
   */
  getSubmissions = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { id } = req.params;

    const data = await teacherService.getSubmissions(id, teacherId, schoolId);

    sendSuccess(res, data, 'Submissions retrieved successfully');
  });

  /**
   * Grade a submission
   * PUT /api/v1/teachers/submissions/:id/grade
   */
  gradeSubmission = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { id } = req.params;
    const { score, feedback } = req.body;

    const submission = await teacherService.gradeSubmission(
      id,
      teacherId,
      schoolId,
      { score, feedback }
    );

    // Emit WebSocket event
    if (global.wsServer) {
      global.wsServer.emitToSchool(schoolId, 'submissionGraded', {
        submission,
        teacherId,
      });
    }

    sendSuccess(res, submission, 'Submission graded successfully');
  });

  /**
   * Get grades
   * GET /api/v1/teachers/grades
   */
  getGrades = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { classId, termId, subjectCode } = req.query;

    const grades = await teacherService.getGrades(teacherId, schoolId, {
      classId,
      termId,
      subjectCode,
    });

    sendSuccess(res, grades, 'Grades retrieved successfully');
  });

  /**
   * Save grades (bulk operation)
   * POST /api/v1/teachers/grades
   */
  saveGrades = asyncHandler(async (req, res) => {
    const teacherId = req.user.teacherId;
    const schoolId = req.user.schoolId;
    const { grades } = req.body;

    const savedGrades = await teacherService.saveGrades(
      teacherId,
      schoolId,
      grades
    );

    // Emit WebSocket event
    if (global.wsServer) {
      global.wsServer.emitToSchool(schoolId, 'gradesUpdated', {
        teacherId,
        count: savedGrades.length,
      });
    }

    sendSuccess(res, savedGrades, 'Grades saved successfully');
  });
}

// Validation schemas
const createTeacherSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    employeeNumber: Joi.string().optional().allow('', null),
    specialization: Joi.string().optional().allow('', null),
    departmentId: Joi.string().uuid().optional().allow('', null),
    hireDate: Joi.date().optional().allow('', null),
  }),
});

const updateTeacherSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    employeeNumber: Joi.string().optional().allow('', null),
    specialization: Joi.string().optional().allow('', null),
    departmentId: Joi.string().uuid().optional().allow('', null),
    hireDate: Joi.date().optional().allow('', null),
  }),
});

module.exports = new TeacherController();
module.exports.createTeacherSchema = createTeacherSchema;
module.exports.updateTeacherSchema = updateTeacherSchema;
