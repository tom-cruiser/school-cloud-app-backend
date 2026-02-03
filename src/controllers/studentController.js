const studentService = require('../services/studentService');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess, sendPaginatedResponse, getPagination } = require('../utils/helpers');
const Joi = require('joi');

class StudentController {
  /**
   * Create a new student
   * POST /api/v1/students
   */
  createStudent = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId; // Get from authenticated user
    const student = await studentService.createStudent(schoolId, req.body);
    sendSuccess(res, student, 'Student created successfully', 201);
  });

  /**
   * Get all students for the school
   * GET /api/v1/students
   */
  getStudents = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { page, limit, search, grade } = req.query;
    const { skip, take } = getPagination(page, limit);

    const { students, total } = await studentService.getStudents(schoolId, {
      skip,
      take,
      search,
      grade,
    });

    sendPaginatedResponse(res, students, page || 1, limit || 10, total, 'Students retrieved successfully');
  });

  /**
   * Get student by ID
   * GET /api/v1/students/:id
   */
  getStudentById = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const student = await studentService.getStudentById(req.params.id, schoolId);
    sendSuccess(res, student, 'Student retrieved successfully');
  });

  /**
   * Update student
   * PUT /api/v1/students/:id
   */
  updateStudent = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const student = await studentService.updateStudent(req.params.id, schoolId, req.body);
    sendSuccess(res, student, 'Student updated successfully');
  });

  /**
   * Delete student
   * DELETE /api/v1/students/:id
   */
  deleteStudent = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    await studentService.deleteStudent(req.params.id, schoolId);
    sendSuccess(res, null, 'Student deleted successfully');
  });

  /**
   * Get student report card
   * GET /api/v1/students/:id/report-card
   */
  getStudentReportCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { termId } = req.query;
    const reportCard = await studentService.getStudentReportCard(req.params.id, schoolId, termId);
    sendSuccess(res, reportCard, 'Student report card retrieved successfully');
  });

  /**
   * Download student report card as PDF
   * GET /api/v1/students/:id/report-card/download
   */
  downloadStudentReportCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { termId } = req.query;
    const pdfBuffer = await studentService.generateReportCardPDF(req.params.id, schoolId, termId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-card-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  });

  /**
   * Get student ID card
   * GET /api/v1/students/:id/id-card
   */
  getStudentIdCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const idCard = await studentService.getStudentIdCard(req.params.id, schoolId);
    sendSuccess(res, idCard, 'Student ID card retrieved successfully');
  });

  /**
   * Download student ID card as PDF
   * GET /api/v1/students/:id/id-card/download
   */
  downloadStudentIdCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const pdfBuffer = await studentService.generateIdCardPDF(req.params.id, schoolId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-id-card-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  });

  /**
   * Get current student's own report card (for students)
   * GET /api/v1/students/my/report-card
   */
  getMyReportCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const userId = req.user.id;
    const { termId } = req.query;
    
    // Get student by userId
    const student = await studentService.getStudentByUserId(userId, schoolId);
    const reportCard = await studentService.getStudentReportCard(student.id, schoolId, termId);
    sendSuccess(res, reportCard, 'Report card retrieved successfully');
  });

  /**
   * Download current student's own report card as PDF
   * GET /api/v1/students/my/report-card/download
   */
  downloadMyReportCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const userId = req.user.id;
    const { termId } = req.query;
    
    // Get student by userId
    const student = await studentService.getStudentByUserId(userId, schoolId);
    const pdfBuffer = await studentService.generateReportCardPDF(student.id, schoolId, termId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=my-report-card.pdf`);
    res.send(pdfBuffer);
  });

  /**
   * Get current student's own ID card
   * GET /api/v1/students/my/id-card
   */
  getMyIdCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const userId = req.user.id;
    
    // Get student by userId
    const student = await studentService.getStudentByUserId(userId, schoolId);
    const idCard = await studentService.getStudentIdCard(student.id, schoolId);
    sendSuccess(res, idCard, 'ID card retrieved successfully');
  });

  /**
   * Download current student's own ID card as PDF
   * GET /api/v1/students/my/id-card/download
   */
  downloadMyIdCard = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const userId = req.user.id;
    
    // Get student by userId
    const student = await studentService.getStudentByUserId(userId, schoolId);
    const pdfBuffer = await studentService.generateIdCardPDF(student.id, schoolId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=my-student-id.pdf`);
    res.send(pdfBuffer);
  });

  /**
   * Get dashboard statistics for logged-in student
   * GET /api/v1/students/dashboard/stats
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const schoolId = req.user.schoolId;

    console.log('getDashboardStats called:', { 
      userId: req.user.id,
      userRole: req.user.role,
      studentId, 
      schoolId,
      hasStudent: !!studentId 
    });

    if (!studentId) {
      console.log('User is not a student - rejecting request');
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_STUDENT',
          message: 'User is not a student. This account does not have a student record.',
        },
      });
    }

    try {
      const stats = await studentService.getDashboardStats(studentId, schoolId);
      console.log('Dashboard stats retrieved successfully');
      sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting dashboard stats:', error.message);
      throw error;
    }
  });

  /**
   * Get my profile (logged-in student)
   * GET /api/v1/students/me
   */
  getMyProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await studentService.getMyProfile(userId);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  });

  /**
   * Update my profile (logged-in student)
   * PUT /api/v1/students/me
   */
  updateMyProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await studentService.updateMyProfile(userId, req.body);
    sendSuccess(res, profile, 'Profile updated successfully');
  });

  /**
   * Get my classes (logged-in student)
   * GET /api/v1/students/classes
   */
  getMyClasses = asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const schoolId = req.user.schoolId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_STUDENT',
          message: 'User is not a student',
        },
      });
    }

    const classes = await studentService.getMyClasses(studentId, schoolId);
    sendSuccess(res, classes, 'Classes retrieved successfully');
  });

  /**
   * Get my assignments (logged-in student)
   * GET /api/v1/students/assignments
   */
  getMyAssignments = asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const schoolId = req.user.schoolId;
    const { classId, status } = req.query;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_STUDENT',
          message: 'User is not a student',
        },
      });
    }

    const assignments = await studentService.getMyAssignments(studentId, schoolId, {
      classId,
      status,
    });

    sendSuccess(res, assignments, 'Assignments retrieved successfully');
  });

  /**
   * Submit assignment (logged-in student)
   * POST /api/v1/students/assignments/:id/submit
   */
  submitAssignment = asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const schoolId = req.user.schoolId;
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_STUDENT',
          message: 'User is not a student',
        },
      });
    }

    const submission = await studentService.submitAssignment(
      studentId,
      schoolId,
      id,
      { content, attachments }
    );

    // Emit WebSocket event
    if (global.wsServer) {
      global.wsServer.emitToSchool(schoolId, 'assignmentSubmitted', {
        assignmentId: id,
        studentId,
        submission,
      });
    }

    sendSuccess(res, submission, 'Assignment submitted successfully', 201);
  });

  /**
   * Get my grades (logged-in student)
   * GET /api/v1/students/grades
   */
  getMyGrades = asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const schoolId = req.user.schoolId;
    const { termId, subjectCode } = req.query;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_STUDENT',
          message: 'User is not a student',
        },
      });
    }

    const gradesData = await studentService.getMyGrades(studentId, schoolId, {
      termId,
      subjectCode,
    });

    sendSuccess(res, gradesData, 'Grades retrieved successfully');
  });

  /**
   * Get my attendance (logged-in student)
   * GET /api/v1/students/attendance
   */
  getMyAttendance = asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const schoolId = req.user.schoolId;
    const { classId, startDate, endDate, month } = req.query;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_STUDENT',
          message: 'User is not a student',
        },
      });
    }

    const attendanceData = await studentService.getMyAttendance(studentId, schoolId, {
      classId,
      startDate,
      endDate,
      month,
    });

    sendSuccess(res, attendanceData, 'Attendance retrieved successfully');
  });
}

// Validation schemas
const createStudentSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.date().optional().allow('', null),
    gender: Joi.string().optional().allow('', null),
    studentNumber: Joi.string().optional().allow('', null),
    guardianName: Joi.string().optional().allow('', null),
    guardianPhone: Joi.string().optional().allow('', null),
    guardianEmail: Joi.string().email().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
    enrollmentDate: Joi.date().optional().allow('', null),
    gradeLevelId: Joi.string().uuid().optional().allow('', null),
    houseId: Joi.string().uuid().optional().allow('', null),
    transportRouteId: Joi.string().uuid().optional().allow('', null),
  }),
});

module.exports = new StudentController();
module.exports.createStudentSchema = createStudentSchema;
