const attendanceService = require('../services/attendanceService');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess, sendPaginatedResponse, getPagination } = require('../utils/helpers');

class AttendanceController {
  /**
   * Create attendance record(s)
   * POST /api/v1/attendance
   */
  createAttendance = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const attendance = await attendanceService.createAttendance(req.body, schoolId);
    sendSuccess(res, attendance, 'Attendance recorded successfully', 201);
  });

  /**
   * Get attendance by class
   * GET /api/v1/attendance/class/:classId
   */
  getAttendanceByClass = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { classId } = req.params;
    const { page, limit, date, studentId } = req.query;
    const { skip, take } = getPagination(page, limit);

    const result = await attendanceService.getAttendanceByClass(classId, schoolId, {
      date,
      studentId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    sendPaginatedResponse(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      'Attendance records retrieved successfully'
    );
  });

  /**
   * Get attendance by student
   * GET /api/v1/attendance/student/:studentId
   */
  getAttendanceByStudent = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { studentId } = req.params;
    const { page, limit, classId, startDate, endDate } = req.query;

    const result = await attendanceService.getAttendanceByStudent(studentId, schoolId, {
      classId,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    sendPaginatedResponse(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      'Student attendance records retrieved successfully'
    );
  });

  /**
   * Get attendance statistics for a class
   * GET /api/v1/attendance/statistics/:classId
   */
  getAttendanceStatistics = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const statistics = await attendanceService.getAttendanceStatistics(classId, schoolId, {
      startDate,
      endDate,
    });

    sendSuccess(res, statistics, 'Attendance statistics retrieved successfully');
  });

  /**
   * Bulk create attendance records
   * POST /api/v1/attendance/bulk
   */
  bulkCreateAttendance = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const result = await attendanceService.bulkCreateAttendance(req.body, schoolId);
    sendSuccess(res, result, 'Attendance records created successfully', 201);
  });

  /**
   * Update attendance record
   * PUT /api/v1/attendance/:id
   */
  updateAttendance = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const attendance = await attendanceService.updateAttendance(req.params.id, req.body, schoolId);
    sendSuccess(res, attendance, 'Attendance record updated successfully');
  });

  /**
   * Delete attendance record
   * DELETE /api/v1/attendance/:id
   */
  deleteAttendance = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    await attendanceService.deleteAttendance(req.params.id, schoolId);
    sendSuccess(res, null, 'Attendance record deleted successfully');
  });

  /**
   * Get class attendance report
   * GET /api/v1/attendance/report/:classId
   */
  getClassAttendanceReport = asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId;
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const report = await attendanceService.getClassAttendanceReport(classId, schoolId, {
      startDate,
      endDate,
    });

    sendSuccess(res, report, 'Class attendance report retrieved successfully');
  });
}

module.exports = new AttendanceController();
