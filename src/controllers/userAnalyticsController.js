const prisma = require('../config/database');
const { asyncHandler } = require('../utils/errors');
const { NotFoundError } = require('../utils/errors');

/**
 * Get analytics data based on user role and date range
 * Supported ranges: current-year, current-month, last-30-days, last-week, today
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const user = req.user;
  const { range = 'current-month', schoolId } = req.query;

  // Determine date range
  let startDate;
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const rangeStart = new Date();
  switch (range) {
    case 'today':
      rangeStart.setHours(0, 0, 0, 0);
      startDate = rangeStart;
      break;
    case 'last-week':
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeStart.setHours(0, 0, 0, 0);
      startDate = rangeStart;
      break;
    case 'last-30-days':
      rangeStart.setDate(rangeStart.getDate() - 30);
      rangeStart.setHours(0, 0, 0, 0);
      startDate = rangeStart;
      break;
    case 'current-month':
      rangeStart.setDate(1);
      rangeStart.setHours(0, 0, 0, 0);
      startDate = rangeStart;
      break;
    case 'current-year':
      rangeStart.setMonth(0);
      rangeStart.setDate(1);
      rangeStart.setHours(0, 0, 0, 0);
      startDate = rangeStart;
      break;
    default:
      // Default to current month
      rangeStart.setDate(1);
      rangeStart.setHours(0, 0, 0, 0);
      startDate = rangeStart;
  }

  try {
    // Determine which school to query based on user role
    const userSchoolId = user.role === 'ADMIN' ? (schoolId || null) : user.schoolId;

    if (!userSchoolId && user.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'School ID is required',
      });
    }

    // Build base where clauses for queries
    const schoolFilter = userSchoolId ? { schoolId: userSchoolId } : {};
    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get student-related analytics
    const totalStudents = await prisma.student.count({
      where: schoolFilter,
    });

    const newStudents = await prisma.student.count({
      where: {
        ...schoolFilter,
        ...dateFilter,
      },
    });

    // Get class analytics
    const totalClasses = await prisma.class.count({
      where: schoolFilter,
    });

    const classesWithData = await prisma.class.findMany({
      where: schoolFilter,
      include: {
        _count: {
          select: { students: true, assignments: true, attendance: true },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Get assignment analytics
    const totalAssignments = await prisma.assignment.count({
      where: schoolFilter,
    });

    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: schoolFilter ? { assignment: schoolFilter } : {},
      select: { status: true },
    });

    const submittedAssignments = assignmentSubmissions.filter(
      a => a.status === 'SUBMITTED' || a.status === 'GRADED'
    ).length;

    const gradedAssignments = assignmentSubmissions.filter(
      a => a.status === 'GRADED'
    ).length;

    // Get attendance analytics
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        ...schoolFilter,
        ...dateFilter,
      },
      select: { status: true },
    });

    const attendanceStats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'PRESENT').length,
      absent: attendanceRecords.filter(a => a.status === 'ABSENT').length,
      late: attendanceRecords.filter(a => a.status === 'LATE').length,
      excused: attendanceRecords.filter(a => a.status === 'EXCUSED').length,
      presentRate: attendanceRecords.length > 0
        ? Math.round((attendanceRecords.filter(a => a.status === 'PRESENT').length / attendanceRecords.length) * 100)
        : 0,
    };

    // Get grade analytics
    const grades = await prisma.grade.findMany({
      where: schoolFilter,
      select: { score: true, letterGrade: true },
    });

    const gradeStats = {
      total: grades.length,
      average: grades.length > 0
        ? Math.round((grades.reduce((sum, g) => sum + g.score, 0) / grades.length) * 100) / 100
        : 0,
      highest: grades.length > 0 ? Math.max(...grades.map(g => g.score)) : 0,
      lowest: grades.length > 0 ? Math.min(...grades.map(g => g.score)) : 0,
      distribution: {
        A: grades.filter(g => g.letterGrade === 'A').length,
        B: grades.filter(g => g.letterGrade === 'B').length,
        C: grades.filter(g => g.letterGrade === 'C').length,
        D: grades.filter(g => g.letterGrade === 'D').length,
        F: grades.filter(g => g.letterGrade === 'F').length,
      },
    };

    // Get user analytics
    const totalUsers = await prisma.user.count({
      where: schoolFilter,
    });

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: schoolFilter,
      _count: { id: true },
    });

    const roleDistribution = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {});

    // For teachers, include their specific class/student data
    let teacherAnalytics = null;
    if (user.role === 'TEACHER') {
      const teacherClasses = await prisma.class.count({
        where: { teacherId: user.teacherId },
      });

      const teacherStudents = await prisma.classStudent.count({
        where: {
          class: { teacherId: user.teacherId },
        },
      });

      const teacherAssignments = await prisma.assignment.count({
        where: {
          class: { teacherId: user.teacherId },
        },
      });

      teacherAnalytics = {
        classes: teacherClasses,
        students: teacherStudents,
        assignments: teacherAssignments,
      };
    }

    // For students, include their specific performance data
    let studentAnalytics = null;
    if (user.role === 'STUDENT') {
      const studentGrades = await prisma.grade.findMany({
        where: { studentId: user.studentId },
        select: { score: true, letterGrade: true },
      });

      const studentAttendance = await prisma.attendance.count({
        where: {
          classStudent: { studentId: user.studentId },
          ...dateFilter,
        },
      });

      studentAnalytics = {
        grades: {
          average: studentGrades.length > 0
            ? Math.round((studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length) * 100) / 100
            : 0,
          total: studentGrades.length,
        },
        attendance: studentAttendance,
      };
    }

    // For admins/school-admins, include department and grade level stats
    let departmentStats = [];
    let gradeLevelStats = [];
    let subjectPerformance = [];
    let monthlyTrends = [];

    if (user.role === 'SCHOOL_ADMIN' || user.role === 'ADMIN') {
      // Department statistics
      const departments = await prisma.department.findMany({
        where: schoolFilter,
        include: {
          _count: {
            select: { 
              teachers: true,
              classes: true,
              subjects: true,
            },
          },
        },
      });

      departmentStats = await Promise.all(
        departments.map(async (dept) => {
          // Get average grade for department
          const deptGrades = await prisma.grade.findMany({
            where: {
              ...schoolFilter,
              // Grades from teachers in this department
              teacher: {
                department: { id: dept.id },
              },
            },
            select: { score: true },
          });

          const avgGrade = deptGrades.length > 0
            ? Math.round((deptGrades.reduce((sum, g) => sum + g.score, 0) / deptGrades.length) * 100) / 100
            : 0;

          // Count students and teachers in department
          const deptTeachers = await prisma.user.count({
            where: {
              ...schoolFilter,
              role: 'TEACHER',
              teacher: { department: { id: dept.id } },
            },
          });

          const deptStudents = await prisma.student.count({
            where: { ...schoolFilter },
            // Simplified - would need class relationships
          });

          return {
            name: dept.name,
            studentCount: deptStudents,
            teacherCount: deptTeachers,
            avgGrade,
          };
        })
      );

      // Grade level statistics
      const gradeLevels = await prisma.gradeLevel.findMany({
        where: schoolFilter ? { classes: { some: { schoolId: schoolFilter.schoolId } } } : {},
      });

      gradeLevelStats = await Promise.all(
        gradeLevels.map(async (level) => {
          const levelStudents = await prisma.classStudent.findMany({
            where: {
              class: { gradeLevelId: level.id, ...schoolFilter },
            },
            select: { studentId: true },
          });

          const studentIds = [...new Set(levelStudents.map(cs => cs.studentId))];

          const levelGrades = await prisma.grade.findMany({
            where: {
              studentId: { in: studentIds },
            },
            select: { score: true },
          });

          const avgGrade = levelGrades.length > 0
            ? Math.round((levelGrades.reduce((sum, g) => sum + g.score, 0) / levelGrades.length) * 100) / 100
            : 0;

          return {
            name: level.name,
            studentCount: studentIds.length,
            avgGrade,
          };
        })
      );

      // Subject performance
      const subjects = await prisma.subject.findMany({
        where: schoolFilter,
        take: 10,
      });

      subjectPerformance = await Promise.all(
        subjects.map(async (subject) => {
          const subjectGrades = await prisma.grade.findMany({
            where: {
              ...schoolFilter,
              subjectCode: subject.code,
            },
            select: { score: true },
          });

          return {
            subject: subject.name,
            avgScore: subjectGrades.length > 0
              ? Math.round((subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length) * 100) / 100
              : 0,
            highestScore: subjectGrades.length > 0 ? Math.max(...subjectGrades.map(g => g.score)) : 0,
            lowestScore: subjectGrades.length > 0 ? Math.min(...subjectGrades.map(g => g.score)) : 0,
          };
        })
      );

      // Monthly trends (generate mock data for visualization)
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        // Get enrollment, attendance, and grades for this month
        const monthStart = new Date(monthDate);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthEnrollments = await prisma.student.count({
          where: {
            ...schoolFilter,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        });

        const monthAttendance = await prisma.attendance.findMany({
          where: {
            ...schoolFilter,
            createdAt: { gte: monthStart, lte: monthEnd },
            status: 'PRESENT',
          },
          select: { id: true },
        });

        const allMonthAttendance = await prisma.attendance.count({
          where: {
            ...schoolFilter,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        });

        const monthGrades = await prisma.grade.findMany({
          where: {
            ...schoolFilter,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          select: { score: true },
        });

        const monthAvgGrade = monthGrades.length > 0
          ? Math.round((monthGrades.reduce((sum, g) => sum + g.score, 0) / monthGrades.length) * 100) / 100
          : 0;

        months.push({
          month: monthName,
          enrollment: monthEnrollments,
          attendance: allMonthAttendance > 0
            ? Math.round((monthAttendance.length / allMonthAttendance) * 100)
            : 0,
          avgGrade: monthAvgGrade,
        });
      }

      monthlyTrends = months;
    }

    // Calculate derived metrics
    const passingGrades = grades.filter(g => g.score >= 60).length;
    const excellentGrades = grades.filter(g => g.score >= 90).length;
    const passingRate = grades.length > 0 ? Math.round((passingGrades / grades.length) * 100) : 0;
    const excellenceRate = grades.length > 0 ? Math.round((excellentGrades / grades.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        range,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        // Legacy fields for admin analytics page
        totalStudents: totalStudents,
        totalTeachers: await prisma.user.count({ where: { ...schoolFilter, role: 'TEACHER' } }),
        totalClasses: totalClasses,
        totalSubjects: await prisma.subject.count({ where: schoolFilter }),
        averageAttendance: attendanceStats.presentRate,
        averageGrade: gradeStats.average,
        passingRate: passingRate,
        excellenceRate: excellenceRate,
        departmentStats: departmentStats,
        gradeLevelStats: gradeLevelStats,
        subjectPerformance: subjectPerformance,
        monthlyTrends: monthlyTrends,
        // New fields from updated endpoint
        students: {
          total: totalStudents,
          new: newStudents,
        },
        classes: {
          total: totalClasses,
          topClasses: classesWithData.map(c => ({
            id: c.id,
            name: c.name,
            students: c._count.students,
            assignments: c._count.assignments,
            attendanceRecords: c._count.attendance,
          })),
        },
        assignments: {
          total: totalAssignments,
          submitted: submittedAssignments,
          graded: gradedAssignments,
          pending: totalAssignments - submittedAssignments - gradedAssignments,
        },
        attendance: attendanceStats,
        grades: gradeStats,
        users: {
          total: totalUsers,
          distribution: roleDistribution,
        },
        teacherAnalytics,
        studentAnalytics,
        lastUpdated: new Date().toISOString(),
      },
      message: 'Analytics data retrieved successfully',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message,
    });
  }
});

module.exports = {
  getAnalytics,
};
