const bcrypt = require("bcrypt");
const config = require("../config");
const prisma = require("../config/database");
const { NotFoundError, ConflictError } = require("../utils/errors");
const logger = require("../config/logger");

class TeacherService {
  /**
   * Create a new teacher
   */
  async createTeacher(schoolId, teacherData) {
    const {
      email,
      password,
      firstName,
      lastName,
      employeeNumber,
      specialization,
      departmentId,
      hireDate,
    } = teacherData;

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    // Create teacher user with teacher profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "TEACHER",
          schoolId,
          isActive: true,
        },
      });

      // Create teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          schoolId,
          employeeNumber: employeeNumber || `TCH${Date.now()}`,
          specialization: specialization || null,
          departmentId: departmentId || null,
          hireDate: hireDate ? new Date(hireDate) : new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return teacher;
    });

    logger.info(`Teacher created for school ${schoolId}: ${result.user.email}`);

    return result;
  }

  /**
   * Get all teachers for a school
   */
  async getTeachers(schoolId, { skip = 0, take = 10, search, departmentId }) {
    const where = {
      schoolId,
      ...(search && {
        OR: [
          { user: { firstName: { contains: search, mode: "insensitive" } } },
          { user: { lastName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { employeeNumber: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(departmentId && { departmentId }),
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              lastLogin: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    return { teachers, total };
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(teacherId, schoolId) {
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        schoolId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            lastLogin: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundError("Teacher not found");
    }

    return teacher;
  }

  /**
   * Update teacher
   */
  async updateTeacher(teacherId, schoolId, updateData) {
    // Verify teacher exists and belongs to school
    await this.getTeacherById(teacherId, schoolId);

    const { email, firstName, lastName, ...teacherFields } = updateData;

    const result = await prisma.$transaction(async (tx) => {
      // Get teacher's user ID
      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        select: { userId: true },
      });

      // Update user info if provided
      if (email || firstName || lastName) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: {
            ...(email && { email }),
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
        });
      }

      // Update teacher profile
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          ...teacherFields,
          departmentId: teacherFields.departmentId || null,
          specialization: teacherFields.specialization || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return updatedTeacher;
    });

    logger.info(`Teacher updated: ${teacherId}`);

    return result;
  }

  /**
   * Delete teacher
   */
  async deleteTeacher(teacherId, schoolId) {
    const teacher = await this.getTeacherById(teacherId, schoolId);

    await prisma.$transaction(async (tx) => {
      // Delete teacher (will cascade delete user due to onDelete: Cascade)
      await tx.teacher.delete({
        where: { id: teacherId },
      });

      // Delete associated user
      await tx.user.delete({
        where: { id: teacher.user.id },
      });
    });

    logger.info(`Teacher deleted: ${teacherId}`);

    return true;
  }

  /**
   * Get dashboard statistics for a teacher
   */
  async getDashboardStats(teacherId, schoolId) {
    const teacher = await this.getTeacherById(teacherId, schoolId);

    // Get all classes taught by this teacher
    const classes = await prisma.class.findMany({
      where: {
        teacherId,
        schoolId,
      },
      include: {
        students: true,
        assignments: {
          where: {
            dueDate: {
              gte: new Date(),
            },
          },
        },
        gradeLevel: true,
      },
    });

    // Count total students across all classes
    const totalStudents = await prisma.student.count({
      where: {
        classes: {
          some: {
            class: {
              teacherId,
            },
          },
        },
      },
    });

    // Count pending grades (ungraded submissions)
    const pendingGrades = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          class: {
            teacherId,
          },
        },
        score: null,
      },
    });

    // Calculate average attendance
    const attendanceStats = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        class: {
          teacherId,
        },
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
      },
      _count: true,
    });

    const totalAttendance = attendanceStats.reduce(
      (sum, stat) => sum + stat._count,
      0,
    );
    const presentCount =
      attendanceStats.find((s) => s.status === "PRESENT")?._count || 0;
    const avgAttendance =
      totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

    // Get today's schedule
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Note: classSchedule table doesn't exist, using empty array
    let todaySchedule = [];
    try {
      // Uncomment when classSchedule table is created:
      // todaySchedule = await prisma.classSchedule.findMany({
      //   where: {
      //     class: {
      //       teacherId,
      //     },
      //     dayOfWeek,
      //   },
      //   include: {
      //     class: {
      //       include: {
      //         students: true,
      //       },
      //     },
      //   },
      //   orderBy: {
      //     startTime: 'asc',
      //   },
      // });
    } catch (error) {
      console.warn("Failed to fetch today's schedule:", error.message);
      todaySchedule = [];
    }

    // Get pending grading items
    const pendingGrading = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          class: {
            teacherId,
          },
        },
        score: null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        assignment: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        submittedAt: "asc",
      },
      take: 10,
    });

    // Get upcoming assignments
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        class: {
          teacherId,
        },
        dueDate: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 7)),
        },
      },
      include: {
        class: true,
        submissions: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Get recent activities (last 20)
    const recentActivities = [];

    // Recent submissions
    const recentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          class: {
            teacherId,
          },
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        assignment: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 10,
    });

    recentSubmissions.forEach((sub) => {
      recentActivities.push({
        id: `sub-${sub.id}`,
        type: "submission",
        description: `New submission from ${sub.student.user.firstName} ${sub.student.user.lastName}`,
        timestamp: this.getRelativeTime(sub.submittedAt),
      });
    });

    // Format response
    return {
      totalClasses: classes.length,
      totalStudents,
      pendingGrades,
      avgAttendance,
      todaySchedule: todaySchedule.map((schedule) => ({
        id: schedule.id,
        className: schedule.class.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room || "TBA",
        studentCount: schedule.class.students.length,
        status: this.getClassStatus(schedule.startTime, schedule.endTime),
      })),
      pendingGrading: pendingGrading.map((item) => ({
        id: item.id,
        studentName: `${item.student.user.firstName} ${item.student.user.lastName}`,
        assignmentTitle: item.assignment.title,
        className: item.assignment.class.name,
        submittedAt: item.submittedAt.toISOString(),
        daysOverdue: Math.floor(
          (new Date() - new Date(item.submittedAt)) / (1000 * 60 * 60 * 24),
        ),
      })),
      upcomingAssignments: upcomingAssignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        className: assignment.class.name,
        dueDate: assignment.dueDate.toISOString().split("T")[0],
        submittedCount: assignment._count.submissions,
        totalStudents:
          classes.find((c) => c.id === assignment.classId)?.students.length ||
          0,
      })),
      recentActivities: recentActivities.slice(0, 20),
      classes: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        studentCount: cls.students.length,
        schedule: cls.gradeLevel ? `${cls.gradeLevel.name}` : "N/A",
        avgGrade: 0, // Calculate if needed
        attendanceRate: 95, // Calculate if needed
      })),
    };
  }

  /**
   * Get teacher's profile (current logged-in teacher)
   */
  async getMyProfile(userId) {
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundError("Teacher profile not found");
    }

    return {
      id: teacher.id,
      userId: teacher.userId,
      employeeNumber: teacher.employeeNumber,
      specialization: teacher.specialization,
      hireDate: teacher.hireDate,
      departmentId: teacher.departmentId,
      user: {
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
      },
      department: teacher.department,
    };
  }

  /**
   * Update teacher's own profile
   */
  async updateMyProfile(userId, updateData) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundError("Teacher profile not found");
    }

    const { firstName, lastName, phone, bio, profileImage, ...teacherFields } =
      updateData;

    const result = await prisma.$transaction(async (tx) => {
      // Update user info
      if (firstName || lastName || phone || profileImage) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
            ...(profileImage && { profileImage }),
          },
        });
      }

      // Update teacher profile
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacher.id },
        data: teacherFields,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              profileImage: true,
            },
          },
          department: true,
        },
      });

      return updatedTeacher;
    });

    return result;
  }

  /**
   * Get teacher's classes
   */
  async getMyClasses(teacherId, schoolId) {
    const classes = await prisma.class.findMany({
      where: {
        teacherId,
        schoolId,
      },
      include: {
        gradeLevel: true,
        students: true,
        subject: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      gradeLevel: cls.gradeLevel?.name || "N/A",
      section: cls.section,
      studentCount: cls.students.length,
      subject: cls.subject?.name || "N/A",
      schedule: "Mon, Wed, Fri", // Need to calculate from schedules
      room: "Room 101", // Need to get from schedules
    }));
  }

  /**
   * Get students in a class
   */
  async getClassStudents(classId, teacherId, schoolId) {
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
        schoolId,
      },
    });

    if (!classData) {
      throw new NotFoundError("Class not found or unauthorized");
    }

    const classStudents = await prisma.classStudent.findMany({
      where: {
        classId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "asc",
      },
    });

    return classStudents.map((classStudent) => ({
      id: classStudent.studentId,
      firstName: classStudent.student?.user?.firstName || "",
      lastName: classStudent.student?.user?.lastName || "",
      rollNumber: classStudent.student?.studentNumber || "-",
      email: classStudent.student?.user?.email || null,
      profileImage: classStudent.student?.user?.avatar || null,
    }));
  }

  /**
   * Get attendance for a class on a specific date
   */
  async getAttendance(classId, date, teacherId, schoolId) {
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
        schoolId,
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundError("Class not found or unauthorized");
    }

    const attendanceDate = new Date(date);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          lt: new Date(attendanceDate.setHours(23, 59, 59, 999)),
        },
      },
    });

    return classData.students.map((classStudent) => {
      const record = attendanceRecords.find(
        (r) => r.studentId === classStudent.studentId,
      );
      return {
        id: record?.id || null,
        studentId: classStudent.studentId,
        studentName: `${classStudent.student.user.firstName} ${classStudent.student.user.lastName}`,
        rollNumber: classStudent.student.studentNumber,
        status: record?.status?.toLowerCase() || null,
        notes: record?.remarks || "",
      };
    });
  }

  /**
   * Mark attendance for multiple students
   */
  async markAttendance(classId, date, attendanceData, teacherId, schoolId) {
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
        schoolId,
      },
    });

    if (!classData) {
      throw new NotFoundError("Class not found or unauthorized");
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const records = await Promise.all(
      attendanceData.map(async (record) => {
        return prisma.attendance.upsert({
          where: {
            classId_studentId_date: {
              classId,
              studentId: record.studentId,
              date: attendanceDate,
            },
          },
          create: {
            schoolId,
            studentId: record.studentId,
            classId,
            date: attendanceDate,
            status: record.status.toUpperCase(),
            remarks: record.notes || null,
          },
          update: {
            status: record.status.toUpperCase(),
            remarks: record.notes || null,
          },
        });
      }),
    );

    logger.info(`Attendance marked for class ${classId} on ${date}`);

    return records;
  }

  /**
   * Get assignments for a teacher
   */
  async getAssignments(teacherId, schoolId, filters = {}) {
    const where = {
      teacherId,
      schoolId,
    };

    // Apply filters
    if (filters.classId) {
      where.classId = filters.classId;
    }

    if (filters.status) {
      const now = new Date();
      if (filters.status === "upcoming") {
        where.dueDate = { gte: now };
      } else if (filters.status === "overdue") {
        where.dueDate = { lt: now };
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        class: {
          include: {
            gradeLevel: true,
            subject: true,
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Format response with submission stats
    return assignments.map((assignment) => {
      const totalStudents = assignment.class.students?.length || 0;
      const submittedCount = assignment.submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "GRADED",
      ).length;
      const gradedCount = assignment.submissions.filter(
        (s) => s.status === "GRADED",
      ).length;

      return {
        ...assignment,
        stats: {
          totalStudents,
          submitted: submittedCount,
          graded: gradedCount,
          pending: totalStudents - submittedCount,
          submissionRate:
            totalStudents > 0
              ? Math.round((submittedCount / totalStudents) * 100)
              : 0,
        },
      };
    });
  }

  /**
   * Create a new assignment
   */
  async createAssignment(teacherId, schoolId, assignmentData) {
    const { classId, title, description, dueDate, maxPoints, attachments } =
      assignmentData;

    // Verify teacher owns this class
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
        schoolId,
      },
    });

    if (!classExists) {
      throw new NotFoundError("Class not found or you do not have access");
    }

    const assignment = await prisma.assignment.create({
      data: {
        schoolId,
        classId,
        teacherId,
        title,
        description,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100,
        attachments,
      },
      include: {
        class: {
          include: {
            gradeLevel: true,
            subject: true,
          },
        },
      },
    });

    logger.info(
      `Assignment created: ${assignment.id} for class ${classId} by teacher ${teacherId}`,
    );

    return assignment;
  }

  /**
   * Update an assignment
   */
  async updateAssignment(assignmentId, teacherId, schoolId, updateData) {
    try {
      console.log("TeacherService.updateAssignment called with:", {
        assignmentId,
        teacherId,
        schoolId,
        updateData,
      });

      // Verify assignment exists
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
        },
      });

      console.log("Assignment exists check:", existingAssignment);

      if (!existingAssignment) {
        console.log("Assignment not found with ID:", assignmentId);
        throw new NotFoundError("Assignment not found");
      }

      // Verify teacher owns this assignment
      const teacherAssignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId,
          schoolId,
        },
      });

      console.log("Teacher ownership check:", teacherAssignment);

      if (!teacherAssignment) {
        console.log("Teacher does not have access to assignment:", {
          assignmentId,
          teacherId,
          schoolId,
        });
        throw new NotFoundError(
          "Assignment not found or you do not have access",
        );
      }

      // Prepare update data, excluding undefined values
      const updateFields = {};
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.description !== undefined)
        updateFields.description = updateData.description;
      if (updateData.classId !== undefined)
        updateFields.classId = updateData.classId;
      if (updateData.maxPoints !== undefined)
        updateFields.maxPoints = parseInt(updateData.maxPoints);
      if (updateData.attachments !== undefined)
        updateFields.attachments = updateData.attachments || null;
      if (updateData.dueDate !== undefined)
        updateFields.dueDate = new Date(updateData.dueDate);

      console.log("Update fields:", updateFields);

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: updateFields,
        include: {
          class: {
            include: {
              gradeLevel: true,
              subject: true,
            },
          },
        },
      });

      console.log("Assignment updated successfully:", updated.id);

      logger.info(
        `Assignment updated: ${assignmentId} by teacher ${teacherId}`,
      );

      return updated;
    } catch (error) {
      console.error("TeacherService.updateAssignment error:", error);
      throw error;
    }
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(assignmentId, teacherId, schoolId) {
    try {
      console.log("TeacherService.deleteAssignment called with:", {
        assignmentId,
        teacherId,
        schoolId,
      });

      // Verify teacher owns this assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId,
          schoolId,
        },
      });

      console.log("Found assignment for deletion:", assignment);

      if (!assignment) {
        throw new NotFoundError(
          "Assignment not found or you do not have access",
        );
      }

      // Delete related submissions first to avoid foreign key constraints
      const deletedSubmissions = await prisma.assignmentSubmission.deleteMany({
        where: { assignmentId },
      });

      console.log(
        `Deleted ${deletedSubmissions.count} submissions for assignment ${assignmentId}`,
      );

      const deletedAssignment = await prisma.assignment.delete({
        where: { id: assignmentId },
      });

      console.log("Assignment deleted successfully:", deletedAssignment);

      logger.info(
        `Assignment deleted: ${assignmentId} by teacher ${teacherId}`,
      );

      return { message: "Assignment deleted successfully" };
    } catch (error) {
      console.error("TeacherService.deleteAssignment error:", error);
      throw error;
    }
  }

  /**
   * Get submissions for an assignment
   */
  async getSubmissions(assignmentId, teacherId, schoolId) {
    try {
      console.log("TeacherService.getSubmissions called with:", {
        assignmentId,
        teacherId,
        schoolId,
      });

      // Verify teacher owns this assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          teacherId,
          schoolId,
        },
        include: {
          class: {
            include: {
              students: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(
        "Found assignment for submissions:",
        assignment ? assignment.id : "null",
      );

      if (!assignment) {
        throw new NotFoundError(
          "Assignment not found or you do not have access",
        );
      }

      // Get all submissions
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          assignmentId,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      });

      // Create a map of submissions by studentId
      const submissionMap = new Map(submissions.map((s) => [s.studentId, s]));

      // Generate full list including students who haven't submitted
      const allSubmissions = assignment.class.students.map((student) => {
        const submission = submissionMap.get(student.id);
        if (submission) {
          return submission;
        }

        // No submission yet - return placeholder
        return {
          id: null,
          assignmentId,
          studentId: student.id,
          student,
          status: "PENDING",
          submittedAt: null,
          content: null,
          attachments: null,
          score: null,
          feedback: null,
          gradedAt: null,
        };
      });

      return {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          maxPoints: assignment.maxPoints,
        },
        submissions: allSubmissions,
        stats: {
          total: allSubmissions.length,
          submitted: submissions.length,
          pending: allSubmissions.length - submissions.length,
          graded: submissions.filter((s) => s.status === "GRADED").length,
        },
      };
    } catch (error) {
      console.error("TeacherService.getSubmissions error:", error);
      throw error;
    }
  }

  /**
   * Grade a submission
   */
  async gradeSubmission(
    submissionId,
    teacherId,
    schoolId,
    { score, feedback },
  ) {
    // Get submission with assignment to verify teacher access
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    // Verify teacher owns the assignment
    if (
      submission.assignment.teacherId !== teacherId ||
      submission.assignment.schoolId !== schoolId
    ) {
      throw new NotFoundError(
        "You do not have permission to grade this submission",
      );
    }

    // Validate score
    if (score < 0 || score > submission.assignment.maxPoints) {
      throw new BadRequestError(
        `Score must be between 0 and ${submission.assignment.maxPoints}`,
      );
    }

    // Update submission
    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        status: "GRADED",
        gradedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        assignment: true,
      },
    });

    logger.info(
      `Submission graded: ${submissionId} with score ${score} by teacher ${teacherId}`,
    );

    return updated;
  }

  /**
   * Get grades for a class
   */
  async getGrades(teacherId, schoolId, filters = {}) {
    const where = {
      teacherId,
      schoolId,
    };

    // Apply filters
    if (filters.classId) {
      // Get students in this class
      const classData = await prisma.class.findFirst({
        where: {
          id: filters.classId,
          teacherId,
          schoolId,
        },
        include: {
          students: true,
        },
      });

      if (!classData) {
        throw new NotFoundError("Class not found or you do not have access");
      }

      where.studentId = {
        in: classData.students.map((s) => s.studentId),
      };
    }

    if (filters.termId) {
      where.termId = filters.termId;
    }

    if (filters.subjectCode) {
      where.subjectCode = filters.subjectCode;
    }

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            gradeLevel: true,
          },
        },
        termRef: true,
      },
      orderBy: [
        { student: { user: { lastName: "asc" } } },
        { createdAt: "desc" },
      ],
    });

    return grades;
  }

  /**
   * Save grades (bulk operation)
   */
  async saveGrades(teacherId, schoolId, gradesData) {
    // Validate all grades first
    const validatedGrades = [];

    for (const gradeData of gradesData) {
      const { studentId, subjectCode, termId, score, letterGrade, comments } =
        gradeData;

      // Verify student exists in teacher's classes
      const studentInClass = await prisma.class.findFirst({
        where: {
          teacherId,
          schoolId,
          students: {
            some: {
              studentId,
            },
          },
        },
      });

      if (!studentInClass) {
        throw new BadRequestError(
          `Student ${studentId} is not in your classes`,
        );
      }

      validatedGrades.push({
        schoolId,
        studentId,
        teacherId,
        termId,
        subjectCode,
        term: termId || "Term 1", // Backward compatibility
        score,
        letterGrade,
        comments,
      });
    }

    // Use transaction to save all grades
    const results = await prisma.$transaction(async (tx) => {
      const savedGrades = [];

      for (const gradeData of validatedGrades) {
        // Check if grade already exists
        const existingGrade = await tx.grade.findFirst({
          where: {
            schoolId: gradeData.schoolId,
            studentId: gradeData.studentId,
            termId: gradeData.termId,
            subjectCode: gradeData.subjectCode,
          },
        });

        let grade;
        if (existingGrade) {
          // Update existing grade
          grade = await tx.grade.update({
            where: { id: existingGrade.id },
            data: {
              score: gradeData.score,
              letterGrade: gradeData.letterGrade,
              comments: gradeData.comments,
            },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          });
        } else {
          // Create new grade
          grade = await tx.grade.create({
            data: gradeData,
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          });
        }

        savedGrades.push(grade);
      }

      return savedGrades;
    });

    logger.info(
      `${results.length} grades saved by teacher ${teacherId} in school ${schoolId}`,
    );

    return results;
  }

  // Helper methods
  getRelativeTime(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  getClassStatus(startTime, endTime) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    if (currentTime < start) return "upcoming";
    if (currentTime >= start && currentTime <= end) return "in-progress";
    return "completed";
  }
}

module.exports = new TeacherService();
