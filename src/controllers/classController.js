const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { asyncHandler } = require('../utils/errors');

/**
 * Get all classes (admins) or my classes (teachers/students)
 */
const getAllClasses = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // If admin/school admin - get all classes
  if (user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') {
    const { schoolId } = user;
    const { gradeLevelId, departmentId, search } = req.query;

    const where = { schoolId };

    if (gradeLevelId) where.gradeLevelId = gradeLevelId;
    if (departmentId) where.departmentId = departmentId;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { section: { contains: search, mode: 'insensitive' } },
      ];
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        gradeLevel: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ gradeLevel: { name: 'asc' } }, { name: 'asc' }],
    });

    return res.json({
      success: true,
      data: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        academicYear: cls.academicYear,
        semester: cls.semester,
        schedule: cls.schedule,
        room: cls.room,
        maxStudents: cls.maxStudents,
        studentCount: cls._count.students,
        teacher: cls.teacher
          ? {
              id: cls.teacher.id,
              name: `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`,
            }
          : null,
        subject: cls.subject,
        gradeLevel: cls.gradeLevel,
        department: cls.department,
      })),
      message: 'Classes retrieved successfully',
    });
  }

  // For teachers and students - get their classes
  let classes = [];

  if (user.role === 'TEACHER') {
    classes = await prisma.class.findMany({
      where: { teacherId: user.teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        gradeLevel: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  } else if (user.role === 'STUDENT') {
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId: user.studentId },
      include: {
        class: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            gradeLevel: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { students: true } },
          },
        },
      },
    });

    classes = studentClasses.map(cs => cs.class);
  }

  res.json({
    success: true,
    data: classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      section: cls.section,
      academicYear: cls.academicYear,
      semester: cls.semester,
      schedule: cls.schedule,
      room: cls.room,
      maxStudents: cls.maxStudents,
      studentCount: cls._count.students,
      subject: cls.subject,
      gradeLevel: cls.gradeLevel,
      teacher: cls.teacher
        ? {
            id: cls.teacher.id,
            user: {
              firstName: cls.teacher.user.firstName,
              lastName: cls.teacher.user.lastName,
            },
          }
        : null,
    })),
    message: 'Classes retrieved successfully',
  });
});

/**
 * Get classes for current user (teacher or student)
 */
const getMyClasses = asyncHandler(async (req, res) => {
  const user = req.user;

  let classes = [];

  if (user.role === 'TEACHER') {
    classes = await prisma.class.findMany({
      where: { teacherId: user.teacherId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        gradeLevel: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  } else if (user.role === 'STUDENT') {
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId: user.studentId },
      include: {
        class: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            gradeLevel: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { students: true } },
          },
        },
      },
    });

    classes = studentClasses.map(cs => cs.class);
  }

  res.json({
    success: true,
    data: classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      section: cls.section,
      academicYear: cls.academicYear,
      semester: cls.semester,
      schedule: cls.schedule,
      room: cls.room,
      maxStudents: cls.maxStudents,
      studentCount: cls._count.students,
      subject: cls.subject,
      gradeLevel: cls.gradeLevel,
    })),
    message: 'My classes retrieved successfully',
  });
});

/**
 * Get class by ID
 */
const getClassById = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { schoolId } = req.user;

  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      subject: { select: { id: true, name: true, code: true } },
      gradeLevel: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  if (!classData || classData.schoolId !== schoolId) {
    throw new NotFoundError('Class');
  }

  res.json({
    success: true,
    data: classData,
    message: 'Class retrieved successfully',
  });
});

/**
 * Get class students
 */
const getClassStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { schoolId, role } = req.user;

  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: { schoolId: true },
  });

  if (!classData) {
    throw new NotFoundError('Class');
  }

  // For SUPER_ADMIN, allow access to any class; otherwise restrict to school
  if (role !== 'SUPER_ADMIN' && classData.schoolId !== schoolId) {
    throw new NotFoundError('Class');
  }

  const students = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          gradeLevel: { select: { id: true, name: true } },
          house: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  res.json({
    success: true,
    data: students.map(cs => ({
      ...cs.student,
      studentNumber: cs.student.studentNumber,
    })),
    message: 'Class students retrieved successfully',
  });
});

/**
 * Create a new class
 */
const createClass = asyncHandler(async (req, res) => {
  const {
    name,
    section,
    subjectId,
    teacherId,
    academicYearId,
    termId,
    gradeLevelId,
    departmentId,
    room,
    schedule,
    maxStudents
  } = req.body;

  // Fetch the academic year to get the year string
  let academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`; // Default
  if (academicYearId) {
    const academicYearRecord = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { year: true },
    });
    if (academicYearRecord) {
      academicYear = academicYearRecord.year;
    }
  }

  const newClass = await prisma.class.create({
    data: {
      schoolId: req.user.schoolId,
      name,
      section,
      subjectId,
      teacherId,
      academicYearId,
      academicYear,
      termId: termId || null,
      gradeLevelId: gradeLevelId || null,
      departmentId: departmentId || null,
      room,
      schedule,
      maxStudents: maxStudents ? parseInt(maxStudents) : null,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      academicYearRef: { select: { id: true, year: true } },
      term: { select: { id: true, name: true } },
      gradeLevel: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  res.status(201).json({
    success: true,
    data: newClass,
    message: 'Class created successfully',
  });
});

/**
 * Update an existing class
 */
const updateClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const {
    name,
    section,
    subjectId,
    teacherId,
    academicYearId,
    termId,
    gradeLevelId,
    departmentId,
    room,
    schedule,
    maxStudents
  } = req.body;

  // Check if class exists and belongs to the school
  const existingClass = await prisma.class.findFirst({
    where: { id: classId, schoolId: req.user.schoolId },
  });

  if (!existingClass) {
    throw new NotFoundError('Class not found');
  }

  // Fetch the academic year to get the year string
  let academicYear = existingClass.academicYear; // Keep existing value as default
  if (academicYearId && academicYearId !== existingClass.academicYearId) {
    const academicYearRecord = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { year: true },
    });
    if (academicYearRecord) {
      academicYear = academicYearRecord.year;
    }
  }

  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data: {
      name,
      section,
      subjectId,
      teacherId,
      academicYearId,
      academicYear,
      termId: termId || null,
      gradeLevelId: gradeLevelId || null,
      departmentId: departmentId || null,
      room,
      schedule,
      maxStudents: maxStudents ? parseInt(maxStudents) : null,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      academicYearRef: { select: { id: true, year: true } },
      term: { select: { id: true, name: true } },
      gradeLevel: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  res.json({
    success: true,
    data: updatedClass,
    message: 'Class updated successfully',
  });
});

/**
 * Delete a class
 */
const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  // Check if class exists and belongs to the school
  const existingClass = await prisma.class.findFirst({
    where: { id: classId, schoolId: req.user.schoolId },
    include: { _count: { select: { students: true } } },
  });

  if (!existingClass) {
    throw new NotFoundError('Class not found');
  }

  // Prevent deletion if class has enrolled students
  if (existingClass._count.students > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete class with enrolled students',
    });
  }

  await prisma.class.delete({
    where: { id: classId },
  });

  res.json({
    success: true,
    message: 'Class deleted successfully',
  });
});

/**
 * Enroll students in a class
 */
const enrollStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { studentIds } = req.body;
  const { schoolId, role } = req.user;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student IDs are required',
    });
  }

  // For SUPER_ADMIN, allow access to any class; otherwise restrict to school
  const classWhere = role === 'SUPER_ADMIN' ? { id: classId } : { id: classId, schoolId };

  // Verify class exists and belongs to the school
  const classData = await prisma.class.findFirst({
    where: classWhere,
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  // For SUPER_ADMIN, allow access to any student; otherwise restrict to school
  const studentWhere = role === 'SUPER_ADMIN' ? { id: { in: studentIds } } : { id: { in: studentIds }, schoolId };

  // Verify all students exist and belong to the school
  const students = await prisma.student.findMany({
    where: studentWhere,
  });

  if (students.length !== studentIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Some students not found or do not belong to this school',
    });
  }

  // Enroll students (skip if already enrolled)
  const enrolledStudents = [];
  for (const studentId of studentIds) {
    const existing = await prisma.classStudent.findFirst({
      where: { classId, studentId },
    });

    if (!existing) {
      const enrollment = await prisma.classStudent.create({
        data: {
          classId,
          studentId,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      enrolledStudents.push(enrollment.student);
    }
  }

  res.status(201).json({
    success: true,
    data: enrolledStudents,
    message: `${enrolledStudents.length} student(s) enrolled successfully`,
  });
});

/**
 * Remove students from a class
 */
const removeStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { studentIds } = req.body;
  const { schoolId, role } = req.user;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student IDs are required',
    });
  }

  // For SUPER_ADMIN, allow access to any class; otherwise restrict to school
  const classWhere = role === 'SUPER_ADMIN' ? { id: classId } : { id: classId, schoolId };

  // Verify class exists and belongs to the school
  const classData = await prisma.class.findFirst({
    where: classWhere,
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  // Remove students from class
  await prisma.classStudent.deleteMany({
    where: {
      classId,
      studentId: { in: studentIds },
    },
  });

  res.json({
    success: true,
    message: `${studentIds.length} student(s) removed from class successfully`,
  });
});

module.exports = {
  getAllClasses,
  getMyClasses,
  getClassById,
  getClassStudents,
  enrollStudents,
  removeStudents,
  createClass,
  updateClass,
  deleteClass,
};
