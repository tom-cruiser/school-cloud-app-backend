const guardianService = require('../services/guardianService');
const { asyncHandler } = require('../utils/errors');
const prisma = require('../config/database');
const { sendSuccess, sendPaginatedResponse, getPagination } = require('../utils/helpers');
const bcrypt = require('bcrypt');
const config = require('../config');

/**
 * [ADMIN] Get all guardians for school
 * @route GET /api/v1/admin/guardians
 * @access Private (School Admin)
 */
exports.getSchoolGuardians = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { search, page, limit } = req.query;
  const { skip, take } = getPagination(page, limit);

  console.log('Fetching guardians for school:', schoolId, { search, page, limit, skip, take });

  const where = {
    schoolId,
    ...(search && {
      OR: [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    })
  };

  const [guardians, total] = await Promise.all([
    prisma.guardian.findMany({
      where,
      include: {
        user: true,
        students: {
          include: {
            student: {
              include: { gradeLevel: true }
            }
          }
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.guardian.count({ where })
  ]);

  console.log('Guardians fetched:', guardians.length, 'total:', total);

  sendPaginatedResponse(res, guardians, page || 1, limit || 10, total, 'Guardians retrieved successfully');
});

/**
 * [ADMIN] Create a new guardian
 * @route POST /api/v1/admin/guardians
 * @access Private (School Admin)
 */
exports.createGuardianAsAdmin = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { email, password, firstName, lastName, phone, occupation, emergencyContact } = req.body;

  console.log('Creating guardian with data:', { email, firstName, lastName, phone, schoolId });

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, first name, and last name are required'
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

  console.log('Password hashed, creating user...');

  // Create user first
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'GUARDIAN',
      schoolId
    }
  });

  console.log('User created:', user.id);

  // Create guardian
  const guardian = await prisma.guardian.create({
    data: {
      userId: user.id,
      schoolId,
      phone,
      occupation,
      emergencyContact
    },
    include: {
      user: true,
      students: {
        include: {
          student: {
            include: { gradeLevel: true }
          }
        }
      }
    }
  });

  console.log('Guardian created:', guardian.id);

  sendSuccess(res, guardian, 'Guardian created successfully', 201);
});

/**
 * [ADMIN] Link student to guardian
 * @route POST /api/v1/admin/guardians/:guardianId/students
 * @access Private (School Admin)
 */
exports.linkStudentToGuardian = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { guardianId } = req.params;
  const { studentId, relationship, isPrimary, canPickup } = req.body;

  if (!studentId || !relationship) {
    return res.status(400).json({
      success: false,
      message: 'StudentId and relationship are required'
    });
  }

  // Verify guardian exists and belongs to school
  const guardian = await prisma.guardian.findFirst({
    where: { id: guardianId, schoolId }
  });

  if (!guardian) {
    return res.status(404).json({
      success: false,
      message: 'Guardian not found'
    });
  }

  // Verify student exists and belongs to school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId }
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Check if relationship already exists
  const existingLink = await prisma.studentGuardian.findUnique({
    where: { studentId_guardianId: { studentId, guardianId } }
  });

  if (existingLink) {
    return res.status(400).json({
      success: false,
      message: 'This student is already linked to this guardian'
    });
  }

  // If marking as primary, remove primary status from other guardians for this student
  if (isPrimary) {
    await prisma.studentGuardian.updateMany({
      where: { studentId, isPrimary: true },
      data: { isPrimary: false }
    });
  }

  // Create link
  const studentGuardian = await prisma.studentGuardian.create({
    data: {
      studentId,
      guardianId,
      relationship,
      isPrimary: isPrimary || false,
      canPickup: canPickup !== false
    },
    include: {
      student: {
        include: { gradeLevel: true }
      }
    }
  });

  sendSuccess(res, studentGuardian, 'Student linked to guardian successfully', 201);
});

/**
 * [ADMIN] Unlink student from guardian
 * @route DELETE /api/v1/admin/guardians/:guardianId/students/:studentId
 * @access Private (School Admin)
 */
exports.unlinkStudentFromGuardian = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { guardianId, studentId } = req.params;

  // Verify guardian exists and belongs to school
  const guardian = await prisma.guardian.findFirst({
    where: { id: guardianId, schoolId }
  });

  if (!guardian) {
    return res.status(404).json({
      success: false,
      message: 'Guardian not found'
    });
  }

  // Delete the link
  const result = await prisma.studentGuardian.deleteMany({
    where: { studentId, guardianId }
  });

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: 'Student-Guardian link not found'
    });
  }

  sendSuccess(res, null, 'Student unlinked from guardian successfully');
});

/**
 * [ADMIN] Delete guardian
 * @route DELETE /api/v1/admin/guardians/:guardianId
 * @access Private (School Admin)
 */
exports.deleteGuardianAsAdmin = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { guardianId } = req.params;

  // Verify guardian exists and belongs to school
  const guardian = await prisma.guardian.findFirst({
    where: { id: guardianId, schoolId }
  });

  if (!guardian) {
    return res.status(404).json({
      success: false,
      message: 'Guardian not found'
    });
  }

  // Delete all student-guardian links first
  await prisma.studentGuardian.deleteMany({
    where: { guardianId }
  });

  // Delete guardian
  await prisma.guardian.delete({ where: { id: guardianId } });

  // Delete user
  await prisma.user.delete({ where: { id: guardian.userId } });

  sendSuccess(res, null, 'Guardian deleted successfully');
});

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
