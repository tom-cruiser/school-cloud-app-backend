const guardianService = require('../services/guardianService');
const { asyncHandler } = require('../utils/errors');

/**
 * Get my profile
 * @route GET /api/v1/guardians/me
 * @access Private (Guardian)
 */
exports.getMyProfile = asyncHandler(async (req, res) => {
  const guardian = await guardianService.getMyProfile(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: guardian,
  });
});

/**
 * Update my profile
 * @route PUT /api/v1/guardians/me
 * @access Private (Guardian)
 */
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const guardian = await guardianService.updateMyProfile(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: guardian,
  });
});

/**
 * Get all my children
 * @route GET /api/v1/guardians/children
 * @access Private (Guardian)
 */
exports.getMyChildren = asyncHandler(async (req, res) => {
  const children = await guardianService.getMyChildren(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Children retrieved successfully',
    data: children,
  });
});

/**
 * Get specific child details
 * @route GET /api/v1/guardians/children/:studentId
 * @access Private (Guardian)
 */
exports.getChildDetails = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await guardianService.getChildDetails(req.user.id, studentId);

  res.status(200).json({
    success: true,
    message: 'Student details retrieved successfully',
    data: student,
  });
});

/**
 * Get child's academic progress
 * @route GET /api/v1/guardians/children/:studentId/grades
 * @access Private (Guardian)
 */
exports.getChildAcademicProgress = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const grades = await guardianService.getChildAcademicProgress(req.user.id, studentId);

  res.status(200).json({
    success: true,
    message: 'Academic progress retrieved successfully',
    data: grades,
  });
});

/**
 * Get child's attendance
 * @route GET /api/v1/guardians/children/:studentId/attendance
 * @access Private (Guardian)
 */
exports.getChildAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate, status } = req.query;
  
  const attendance = await guardianService.getChildAttendance(
    req.user.id,
    studentId,
    { startDate, endDate, status }
  );

  res.status(200).json({
    success: true,
    message: 'Attendance records retrieved successfully',
    data: attendance,
  });
});

/**
 * Get child's assignments
 * @route GET /api/v1/guardians/children/:studentId/assignments
 * @access Private (Guardian)
 */
exports.getChildAssignments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { status } = req.query;
  
  const assignments = await guardianService.getChildAssignments(
    req.user.id,
    studentId,
    { status }
  );

  res.status(200).json({
    success: true,
    message: 'Assignments retrieved successfully',
    data: assignments,
  });
});

/**
 * Get dashboard overview
 * @route GET /api/v1/guardians/dashboard
 * @access Private (Guardian)
 */
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const overview = await guardianService.getDashboardOverview(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Dashboard overview retrieved successfully',
    data: overview,
  });
});

/**
 * Get payments
 * @route GET /api/v1/guardians/payments
 * @access Private (Guardian)
 */
exports.getPayments = asyncHandler(async (req, res) => {
  const { status, startDate, endDate } = req.query;
  
  const payments = await guardianService.getPayments(
    req.user.id,
    { status, startDate, endDate }
  );

  res.status(200).json({
    success: true,
    message: 'Payments retrieved successfully',
    data: payments,
  });
});

/**
 * Make a payment
 * @route POST /api/v1/guardians/payments/:paymentId/pay
 * @access Private (Guardian)
 */
exports.makePayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const payment = await guardianService.makePayment(req.user.id, paymentId);

  res.status(200).json({
    success: true,
    message: 'Payment processed successfully',
    data: payment,
  });
});
