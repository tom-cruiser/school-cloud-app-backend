const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { asyncHandler } = require('../utils/errors');

/**
 * Get grades for current user
 */
const getGrades = asyncHandler(async (req, res) => {
  const user = req.user;
  const { studentId, subjectCode, termId } = req.query;

  if (user.role === 'STUDENT') {
    // Students can only view their own grades
    const where = { studentId: user.studentId };
    if (subjectCode) where.subjectCode = subjectCode;
    if (termId) where.termId = termId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } }, studentNumber: true } },
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
        termRef: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: grades,
      message: 'Student grades retrieved successfully',
    });
  }

  if (user.role === 'TEACHER') {
    // Teachers can view grades they assigned
    const where = { teacherId: user.teacherId };
    if (studentId) where.studentId = studentId;
    if (subjectCode) where.subjectCode = subjectCode;
    if (termId) where.termId = termId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } }, studentNumber: true } },
        termRef: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: grades,
      message: 'Teacher grades retrieved successfully',
    });
  }

  if (user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') {
    // Admins can view all grades in their school
    const where = { schoolId: user.schoolId };
    if (studentId) where.studentId = studentId;
    if (subjectCode) where.subjectCode = subjectCode;
    if (termId) where.termId = termId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } }, studentNumber: true } },
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
        termRef: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: grades,
      message: 'Grades retrieved successfully',
    });
  }

  res.status(403).json({
    success: false,
    message: 'Not authorized to access grades',
  });
});

/**
 * Get grade by ID
 */
const getGradeById = asyncHandler(async (req, res) => {
  const { gradeId } = req.params;
  const user = req.user;

  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      student: { select: { id: true, user: true, studentNumber: true } },
      teacher: { select: { id: true, user: true } },
      termRef: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } },
    },
  });

  if (!grade) {
    throw new NotFoundError('Grade');
  }

  // Authorization checks
  if (user.role === 'STUDENT' && grade.studentId !== user.studentId) {
    throw new NotFoundError('Grade');
  }

  if (user.role === 'TEACHER' && grade.teacherId !== user.teacherId) {
    throw new NotFoundError('Grade');
  }

  if ((user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') && grade.schoolId !== user.schoolId) {
    throw new NotFoundError('Grade');
  }

  res.json({
    success: true,
    data: grade,
    message: 'Grade retrieved successfully',
  });
});

/**
 * Get grade statistics
 */
const getGradeStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const { studentId, subjectCode, termId } = req.query;

  let where = {};

  if (user.role === 'STUDENT') {
    where = { studentId: user.studentId };
  } else if (user.role === 'TEACHER') {
    where = { teacherId: user.teacherId };
  } else if (user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') {
    where = { schoolId: user.schoolId };
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access grade statistics',
    });
  }

  if (studentId) where.studentId = studentId;
  if (subjectCode) where.subjectCode = subjectCode;
  if (termId) where.termId = termId;

  const grades = await prisma.grade.findMany({ where });

  if (grades.length === 0) {
    return res.json({
      success: true,
      data: {
        total: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        distribution: {},
      },
      message: 'No grades available',
    });
  }

  const scores = grades.map(g => g.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  // Grade distribution by letter
  const distribution = {};
  grades.forEach(g => {
    const letter = g.letterGrade || 'Unknown';
    distribution[letter] = (distribution[letter] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      total: grades.length,
      average: Math.round(average * 100) / 100,
      highest,
      lowest,
      distribution,
    },
    message: 'Grade statistics retrieved successfully',
  });
});

/**
 * Create a new grade
 */
const createGrade = asyncHandler(async (req, res) => {
  const user = req.user;
  let { studentId, teacherId, termId, subjectCode, score, letterGrade, comments } = req.body;

  // Validate required fields
  if (!studentId || !subjectCode || score === undefined || score === null) {
    return res.status(400).json({
      success: false,
      message: 'Student ID, subject code, and score are required',
    });
  }

  // Handle teacherId based on user role
  if (user.role === 'TEACHER') {
    // For teachers, always use their own ID
    teacherId = user.teacherId;
  } else if (user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') {
    // For admins, teacherId is required
    if (!teacherId || teacherId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required',
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create grades',
    });
  }

  // Validate that the student belongs to the school
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true }
  });

  if (!student || student.schoolId !== user.schoolId) {
    return res.status(400).json({
      success: false,
      message: 'Student not found in your school',
    });
  }

  // Validate teacher exists in the school
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId }
  });
  
  if (!teacher || teacher.schoolId !== user.schoolId) {
    return res.status(400).json({
      success: false,
      message: 'Teacher not found in your school',
    });
  }

  // Validate term if provided
  if (termId && termId.trim() !== '') {
    const term = await prisma.term.findUnique({
      where: { id: termId }
    });
    
    if (!term || term.schoolId !== user.schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Term not found in your school',
      });
    }
  }

  // Prepare create data
  const createData = {
    schoolId: user.schoolId,
    studentId,
    teacherId, // Always required based on schema
    subjectCode,
    score: parseFloat(score),
    term: '', // Deprecated field, but required
  };

  // Only add termId if provided and not empty
  if (termId && termId.trim() !== '') {
    createData.termId = termId;
  }

  // Only add optional fields if provided
  if (letterGrade) createData.letterGrade = letterGrade;
  if (comments) createData.comments = comments;

  const grade = await prisma.grade.create({
    data: createData,
    include: {
      student: { select: { id: true, user: { select: { firstName: true, lastName: true } }, studentNumber: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      termRef: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({
    success: true,
    data: grade,
    message: 'Grade created successfully',
  });
});

/**
 * Update a grade
 */
const updateGrade = asyncHandler(async (req, res) => {
  const { gradeId } = req.params;
  const user = req.user;
  const { studentId, teacherId, termId, subjectCode, score, letterGrade, comments } = req.body;

  // Check if grade exists and user has permission
  const existingGrade = await prisma.grade.findUnique({
    where: { id: gradeId },
  });

  if (!existingGrade) {
    throw new NotFoundError('Grade');
  }

  // Authorization checks
  if (user.role === 'TEACHER' && existingGrade.teacherId !== user.teacherId) {
    return res.status(403).json({
      success: false,
      message: 'Teachers can only update their own grades',
    });
  }

  if ((user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') && existingGrade.schoolId !== user.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this grade',
    });
  }

  // Prepare update data
  const updateData = {};
  if (studentId !== undefined) updateData.studentId = studentId;
  if (teacherId !== undefined) updateData.teacherId = teacherId;
  if (termId !== undefined) updateData.termId = termId;
  if (subjectCode !== undefined) updateData.subjectCode = subjectCode;
  if (score !== undefined) updateData.score = parseFloat(score);
  if (letterGrade !== undefined) updateData.letterGrade = letterGrade;
  if (comments !== undefined) updateData.comments = comments;

  const grade = await prisma.grade.update({
    where: { id: gradeId },
    data: updateData,
    include: {
      student: { select: { id: true, user: { select: { firstName: true, lastName: true } }, studentNumber: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      termRef: { select: { id: true, name: true } },
    },
  });

  res.json({
    success: true,
    data: grade,
    message: 'Grade updated successfully',
  });
});

/**
 * Delete a grade
 */
const deleteGrade = asyncHandler(async (req, res) => {
  const { gradeId } = req.params;
  const user = req.user;

  // Check if grade exists and user has permission
  const existingGrade = await prisma.grade.findUnique({
    where: { id: gradeId },
  });

  if (!existingGrade) {
    throw new NotFoundError('Grade');
  }

  // Authorization checks
  if (user.role === 'TEACHER' && existingGrade.teacherId !== user.teacherId) {
    return res.status(403).json({
      success: false,
      message: 'Teachers can only delete their own grades',
    });
  }

  if ((user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') && existingGrade.schoolId !== user.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this grade',
    });
  }

  await prisma.grade.delete({
    where: { id: gradeId },
  });

  res.json({
    success: true,
    message: 'Grade deleted successfully',
  });
});

module.exports = {
  getGrades,
  getGradeById,
  getGradeStats,
  createGrade,
  updateGrade,
  deleteGrade,
};
