const bcrypt = require("bcrypt");
const config = require("../config");
const prisma = require("../config/database");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require("../utils/errors");
const logger = require("../config/logger");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class StudentService {
  isPdfBackgroundSupported(templatePath) {
    if (!templatePath) return false;
    const ext = path.extname(templatePath).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
  }

  resolveTemplatePath(templateUrl) {
    if (!templateUrl || typeof templateUrl !== "string") {
      return null;
    }

    const normalizedPath = templateUrl.replace(/^\/+/, "");
    const absolutePath = path.join(__dirname, "../../", normalizedPath);

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    return absolutePath;
  }

  /**
   * Create a new student
   */
  async createStudent(schoolId, studentData) {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      grade,
      gender,
      studentNumber,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
      enrollmentDate,
      gradeLevelId,
      houseId,
      transportRouteId,
    } = studentData;

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    // Create student user with student profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "STUDENT",
          schoolId,
          isActive: true,
        },
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId,
          studentNumber: studentNumber || `STU${Date.now()}`,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
          gender: gender || "Not specified",
          guardianName,
          guardianPhone,
          guardianEmail,
          address,
          enrollmentDate: enrollmentDate
            ? new Date(enrollmentDate)
            : new Date(),
          gradeLevelId: gradeLevelId || null,
          houseId: houseId || null,
          transportRouteId: transportRouteId || null,
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
          gradeLevel: true,
          house: true,
          transportRoute: true,
        },
      });

      return student;
    });

    logger.info(`Student created for school ${schoolId}: ${result.user.email}`);

    return result;
  }

  /**
   * Get all students for a school
   */
  async getStudents(
    schoolId,
    { skip = 0, take = 10, search, grade, excludeGuardian },
  ) {
    const where = {
      schoolId,
      ...(search && {
        OR: [
          { user: { firstName: { contains: search, mode: "insensitive" } } },
          { user: { lastName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { studentNumber: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // If excludeGuardian is provided, filter out students already linked to that guardian
    if (excludeGuardian) {
      const linkedStudentIds = await prisma.studentGuardian.findMany({
        where: { guardianId: excludeGuardian },
        select: { studentId: true },
      });

      const linkedIds = linkedStudentIds.map((sg) => sg.studentId);

      if (linkedIds.length > 0) {
        where.id = { notIn: linkedIds };
      }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
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
          gradeLevel: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          house: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          transportRoute: {
            select: {
              id: true,
              routeName: true,
              routeNumber: true,
            },
          },
          guardians: {
            select: {
              relationship: true,
              isPrimary: true,
              canPickup: true,
              guardian: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total };
  }

  /**
   * Get student by ID
   */
  async getStudentById(studentId, schoolId) {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
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
        gradeLevel: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        transportRoute: {
          select: {
            id: true,
            routeName: true,
            routeNumber: true,
          },
        },
        guardians: {
          select: {
            relationship: true,
            isPrimary: true,
            canPickup: true,
            guardian: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    return student;
  }

  /**
   * Update student
   */
  async updateStudent(studentId, schoolId, updateData) {
    // Verify student exists and belongs to school
    await this.getStudentById(studentId, schoolId);
    const {
      email,
      firstName,
      lastName,
      isActive,
      password,
      gradeLevelId,
      houseId,
      transportRouteId,
      dateOfBirth,
      enrollmentDate,
      ...studentFields
    } = updateData;

    const result = await prisma.$transaction(async (tx) => {
      // Build student update data
      const studentData = {
        ...studentFields,
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(enrollmentDate && { enrollmentDate: new Date(enrollmentDate) }),
        ...(gradeLevelId !== undefined && {
          gradeLevel: gradeLevelId
            ? { connect: { id: gradeLevelId } }
            : { disconnect: true },
        }),
        ...(houseId !== undefined && {
          house: houseId ? { connect: { id: houseId } } : { disconnect: true },
        }),
        ...(transportRouteId !== undefined && {
          transportRoute: transportRouteId
            ? { connect: { id: transportRouteId } }
            : { disconnect: true },
        }),
      };

      // Update student profile
      const student = await tx.student.update({
        where: { id: studentId },
        data: studentData,
        include: {
          user: true,
        },
      });

      // Update user fields if provided
      if (
        email ||
        firstName ||
        lastName ||
        isActive !== undefined ||
        password
      ) {
        const userData = {
          ...(email && { email }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(isActive !== undefined && { isActive }),
        };

        if (password && password.trim()) {
          userData.password = await bcrypt.hash(password, config.bcryptRounds);
        }

        await tx.user.update({
          where: { id: student.userId },
          data: userData,
        });
      }

      // Fetch updated student with user data
      const updatedStudent = await tx.student.findUnique({
        where: { id: studentId },
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
          gradeLevel: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
      });

      return updatedStudent;
    });

    logger.info(`Student updated: ${studentId}`);

    return result;
  }

  /**
   * Delete student
   */
  async deleteStudent(studentId, schoolId) {
    // Verify student exists and belongs to school
    const student = await this.getStudentById(studentId, schoolId);

    // Delete student (user will be deleted via cascade)
    await prisma.student.delete({
      where: { id: studentId },
    });

    logger.info(`Student deleted: ${studentId}`);
  }

  /**
   * Get student by user ID
   */
  async getStudentByUserId(userId, schoolId) {
    const student = await prisma.student.findFirst({
      where: {
        userId,
        schoolId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        gradeLevel: true,
        house: true,
        transportRoute: true,
      },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    return student;
  }

  /**
   * Get student report card with grades
   */
  async getStudentReportCard(studentId, schoolId, termId = null) {
    // Verify student exists and belongs to school
    const student = await this.getStudentById(studentId, schoolId);

    // Get the school information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    // Build where clause for grades
    const gradesWhere = {
      studentId,
      schoolId,
      ...(termId && { termId }),
    };

    // Get grades for the student
    const grades = await prisma.grade.findMany({
      where: gradesWhere,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        termRef: {
          select: {
            name: true,
            academicYearId: true,
            academicYear: {
              select: {
                year: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalGrades = grades.length;
    const averageScore =
      totalGrades > 0
        ? grades.reduce((sum, grade) => sum + grade.score, 0) / totalGrades
        : 0;

    const maxScore =
      totalGrades > 0 ? Math.max(...grades.map((g) => g.score)) : 0;
    const minScore =
      totalGrades > 0 ? Math.min(...grades.map((g) => g.score)) : 0;

    // Get attendance statistics
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        schoolId,
      },
    });

    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "PRESENT").length,
      absent: attendance.filter((a) => a.status === "ABSENT").length,
      late: attendance.filter((a) => a.status === "LATE").length,
      excused: attendance.filter((a) => a.status === "EXCUSED").length,
      attendanceRate:
        attendance.length > 0
          ? (
              (attendance.filter((a) => a.status === "PRESENT").length /
                attendance.length) *
              100
            ).toFixed(2)
          : 0,
    };

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        gradeLevel: student.gradeLevel?.name || "N/A",
        house: student.house?.name || "N/A",
      },
      school: {
        name: school.name,
        logo: school.logo,
        address: school.address,
        reportTemplateModel: school.reportTemplateModel || null,
        reportTemplateFileUrl: school.reportTemplateFileUrl || null,
      },
      grades,
      statistics: {
        totalSubjects: totalGrades,
        averageScore: averageScore.toFixed(2),
        maxScore,
        minScore,
        gpa: (averageScore / 25).toFixed(2), // Assuming 4.0 GPA scale
      },
      attendance: attendanceStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate report card PDF
   */
  async generateReportCardPDF(studentId, schoolId, termId = null) {
    const reportCard = await this.getStudentReportCard(
      studentId,
      schoolId,
      termId,
    );

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const reportTemplatePath = this.resolveTemplatePath(
          reportCard.school?.reportTemplateFileUrl,
        );
        const applyReportTemplateBackground = () => {
          if (!reportTemplatePath) return;

          if (!this.isPdfBackgroundSupported(reportTemplatePath)) {
            logger.info(
              "Report template file format is not supported as PDF background, skipping image render",
              {
                studentId,
                schoolId,
                templateFileUrl: reportCard.school?.reportTemplateFileUrl,
              },
            );
            return;
          }

          try {
            doc.image(reportTemplatePath, 0, 0, {
              fit: [doc.page.width, doc.page.height],
            });
          } catch (error) {
            logger.warn("Failed to render report template background", {
              studentId,
              schoolId,
              error: error.message,
            });
          }
        };

        applyReportTemplateBackground();
        doc.on("pageAdded", applyReportTemplateBackground);

        // Header
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(reportCard.school.name, { align: "center" });
        doc
          .fontSize(14)
          .font("Helvetica")
          .text("Academic Report Card", { align: "center" });
        doc.moveDown();

        // Student Information
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Student Information", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Name: ${reportCard.student.name}`);
        doc.text(`Student Number: ${reportCard.student.studentNumber}`);
        doc.text(`Grade Level: ${reportCard.student.gradeLevel}`);
        doc.text(`House: ${reportCard.student.house}`);
        doc.moveDown();

        // Academic Performance
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Academic Performance", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Total Subjects: ${reportCard.statistics.totalSubjects}`);
        doc.text(`Average Score: ${reportCard.statistics.averageScore}%`);
        doc.text(`GPA: ${reportCard.statistics.gpa}/4.0`);
        doc.text(`Highest Score: ${reportCard.statistics.maxScore}%`);
        doc.text(`Lowest Score: ${reportCard.statistics.minScore}%`);
        doc.moveDown();

        // Grades Table
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Subject Grades", { underline: true });
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 300;
        const col4X = 400;

        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Subject", col1X, tableTop);
        doc.text("Score", col2X, tableTop);
        doc.text("Grade", col3X, tableTop);
        doc.text("Teacher", col4X, tableTop);

        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Table rows
        let currentY = tableTop + 20;
        doc.fontSize(10).font("Helvetica");

        reportCard.grades.forEach((grade) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          doc.text(grade.subjectCode, col1X, currentY);
          doc.text(`${grade.score}%`, col2X, currentY);
          doc.text(grade.letterGrade || "N/A", col3X, currentY);
          doc.text(
            `${grade.teacher.user.firstName} ${grade.teacher.user.lastName}`,
            col4X,
            currentY,
          );
          currentY += 20;
        });

        // Attendance
        doc.moveDown(2);
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Attendance Record", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Total Days: ${reportCard.attendance.total}`);
        doc.text(`Present: ${reportCard.attendance.present}`);
        doc.text(`Absent: ${reportCard.attendance.absent}`);
        doc.text(`Late: ${reportCard.attendance.late}`);
        doc.text(`Attendance Rate: ${reportCard.attendance.attendanceRate}%`);

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).font("Helvetica-Oblique");
        doc.text(
          `Generated on: ${new Date(reportCard.generatedAt).toLocaleDateString()}`,
          { align: "center" },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get student ID card information
   */
  async getStudentIdCard(studentId, schoolId) {
    const student = await this.getStudentById(studentId, schoolId);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        avatar: student.user.avatar,
        dateOfBirth: student.dateOfBirth,
        gradeLevel: student.gradeLevel?.name || "N/A",
        house: student.house?.name || "N/A",
        enrollmentDate: student.enrollmentDate,
      },
      school: {
        name: school.name,
        logo: school.logo,
        address: school.address,
        phone: school.phone,
        email: school.email,
        idCardTemplateModel: school.idCardTemplateModel || null,
        idCardTemplateFileUrl: school.idCardTemplateFileUrl || null,
      },
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate student ID card PDF
   */
  async generateIdCardPDF(studentId, schoolId) {
    const idCard = await this.getStudentIdCard(studentId, schoolId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [252, 400], // ID card size (approx 3.5" x 5.5")
          margin: 20,
        });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const idCardTemplatePath = this.resolveTemplatePath(
          idCard.school?.idCardTemplateFileUrl,
        );
        if (idCardTemplatePath) {
          if (!this.isPdfBackgroundSupported(idCardTemplatePath)) {
            logger.info(
              "ID card template file format is not supported as PDF background, skipping image render",
              {
                studentId,
                schoolId,
                templateFileUrl: idCard.school?.idCardTemplateFileUrl,
              },
            );
          } else {
            try {
              doc.image(idCardTemplatePath, 0, 0, {
                fit: [252, 400],
              });
            } catch (error) {
              logger.warn("Failed to render ID card template background", {
                studentId,
                schoolId,
                error: error.message,
              });
            }
          }
        }

        // Background color
        doc.rect(0, 0, 252, 100).fill("#3B82F6");

        // School name
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor("#FFFFFF")
          .text(idCard.school.name, 20, 30, { align: "center", width: 212 });

        // Student ID Card title
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#FFFFFF")
          .text("STUDENT ID CARD", 20, 60, { align: "center", width: 212 });

        // Reset color for content
        doc.fillColor("#000000");

        // Photo placeholder
        doc.rect(76, 120, 100, 120).stroke();
        doc
          .fontSize(10)
          .text("PHOTO", 76, 175, { width: 100, align: "center" });

        // Student Information
        const infoStartY = 260;
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(idCard.student.name, 20, infoStartY, {
            align: "center",
            width: 212,
          });

        doc.fontSize(10).font("Helvetica");
        doc.text(`ID: ${idCard.student.studentNumber}`, 20, infoStartY + 25, {
          align: "center",
          width: 212,
        });
        doc.text(`Grade: ${idCard.student.gradeLevel}`, 20, infoStartY + 45, {
          align: "center",
          width: 212,
        });
        doc.text(`House: ${idCard.student.house}`, 20, infoStartY + 65, {
          align: "center",
          width: 212,
        });

        // School contact info at bottom
        doc.fontSize(8).font("Helvetica-Oblique");
        doc.text(idCard.school.address || "", 20, 340, {
          align: "center",
          width: 212,
        });
        doc.text(idCard.school.phone || "", 20, 355, {
          align: "center",
          width: 212,
        });
        doc.text(idCard.school.email || "", 20, 370, {
          align: "center",
          width: 212,
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get dashboard statistics for a student
   */
  async getDashboardStats(studentId, schoolId) {
    try {
      const student = await this.getStudentById(studentId, schoolId);

      // Get student's classes
      const classes = await prisma.class.findMany({
        where: {
          schoolId,
          students: {
            some: {
              id: studentId,
            },
          },
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          subject: true,
          gradeLevel: true,
        },
      });

      // Get assignments for student's classes
      const classIds = classes.map((c) => c.id);
      const assignments = await prisma.assignment.findMany({
        where: {
          classId: { in: classIds },
          dueDate: {
            gte: new Date(),
          },
        },
        include: {
          class: {
            include: {
              subject: true,
            },
          },
          submissions: {
            where: {
              studentId,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 10,
      });

      // Count pending assignments (not submitted)
      const pendingAssignments = assignments.filter(
        (a) => a.submissions.length === 0,
      ).length;

      // Get recent grades
      const recentGrades = await prisma.grade.findMany({
        where: {
          studentId,
          schoolId,
        },
        include: {
          termRef: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Calculate average grade
      const avgScore =
        recentGrades.length > 0
          ? recentGrades.reduce((sum, g) => sum + g.score, 0) /
            recentGrades.length
          : 0;

      // Get attendance statistics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          studentId,
          schoolId,
          date: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const attendanceStats = {
        total: attendanceRecords.length,
        present: attendanceRecords.filter((a) => a.status === "PRESENT").length,
        absent: attendanceRecords.filter((a) => a.status === "ABSENT").length,
        late: attendanceRecords.filter((a) => a.status === "LATE").length,
        excused: attendanceRecords.filter((a) => a.status === "EXCUSED").length,
      };

      const attendanceRate =
        attendanceStats.total > 0
          ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
          : 0;

      // Get today's schedule
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

      const todayClasses = classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        subject: cls.subject?.name || "N/A",
        teacher: `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`,
        room: cls.room || "TBA",
        // Note: Would need schedule table for actual times
        startTime: "09:00",
        endTime: "10:00",
      }));

      // Recent activities
      const recentActivities = [];

      // Add recent grade activities
      recentGrades.slice(0, 5).forEach((grade) => {
        recentActivities.push({
          type: "grade",
          title: "New Grade Posted",
          description: `Score: ${grade.score}% in ${grade.subjectCode}`,
          timestamp: grade.createdAt,
        });
      });

      // Add recent assignment activities
      assignments.slice(0, 5).forEach((assignment) => {
        recentActivities.push({
          type: "assignment",
          title: "Assignment Due",
          description: `${assignment.title} - Due: ${assignment.dueDate.toLocaleDateString()}`,
          timestamp: assignment.createdAt,
        });
      });

      // Sort by most recent
      recentActivities.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

      return {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          studentNumber: student.studentNumber,
          gradeLevel: student.gradeLevel?.name || "N/A",
        },
        stats: {
          totalClasses: classes.length,
          pendingAssignments,
          averageGrade: Math.round(avgScore),
          attendanceRate,
        },
        upcomingAssignments: assignments.slice(0, 5).map((a) => ({
          id: a.id,
          title: a.title,
          subject: a.class.subject?.name || "N/A",
          dueDate: a.dueDate,
          maxPoints: a.maxPoints,
          isSubmitted: a.submissions.length > 0,
        })),
        recentGrades: recentGrades.slice(0, 5).map((g) => ({
          id: g.id,
          subjectCode: g.subjectCode,
          score: g.score,
          letterGrade: g.letterGrade,
          term: g.termRef?.name || g.term,
          createdAt: g.createdAt,
        })),
        todaySchedule: todayClasses,
        recentActivities: recentActivities.slice(0, 10),
        attendanceStats,
      };
    } catch (error) {
      logger.error("Error in getDashboardStats:", error);
      throw error;
    }
  }

  /**
   * Get my profile (for logged-in student)
   */
  async getMyProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
                lastLogin: true,
              },
            },
            gradeLevel: true,
            house: true,
            transportRoute: true,
          },
        },
      },
    });

    if (!user || !user.student) {
      throw new NotFoundError("Student profile not found");
    }

    return user.student;
  }

  /**
   * Update my profile (for logged-in student)
   */
  async updateMyProfile(userId, updateData) {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
    } = updateData;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user || !user.student) {
      throw new NotFoundError("Student profile not found");
    }

    const updatedStudent = await prisma.$transaction(async (tx) => {
      if (firstName || lastName) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
        });
      }

      return tx.student.update({
        where: { id: user.student.id },
        data: {
          ...(guardianName !== undefined ? { guardianName } : {}),
          ...(guardianPhone !== undefined ? { guardianPhone } : {}),
          ...(guardianEmail !== undefined ? { guardianEmail } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
          ...(gender !== undefined ? { gender } : {}),
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          gradeLevel: true,
          house: true,
          transportRoute: true,
        },
      });
    });

    logger.info(`Student profile updated: ${user.student.id}`);

    return updatedStudent;
  }

  /**
   * Get my classes (for logged-in student)
   */
  async getMyClasses(studentId, schoolId) {
    const classes = await prisma.class.findMany({
      where: {
        schoolId,
        students: {
          some: {
            studentId,
          },
        },
      },
      include: {
        teacher: {
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
        subject: true,
        gradeLevel: true,
        students: {
          select: {
            id: true,
          },
        },
      },
    });

    return classes.map((cls) => ({
      ...cls,
      teacherName: `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`,
      studentCount: cls.students.length,
    }));
  }

  /**
   * Get assignments for student
   */
  async getMyAssignments(studentId, schoolId, filters = {}) {
    logger.info(
      `Getting assignments for student ${studentId} in school ${schoolId}`,
    );

    // Get student's classes
    const studentClasses = await prisma.class.findMany({
      where: {
        schoolId,
        students: {
          some: {
            studentId,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    logger.info(
      `Found ${studentClasses.length} classes for student ${studentId}:`,
      studentClasses,
    );

    if (studentClasses.length === 0) {
      logger.warn(`Student ${studentId} is not enrolled in any classes`);
      return [];
    }

    const classIds = studentClasses.map((c) => c.id);

    const where = {
      classId: { in: classIds },
    };

    // Apply filters
    if (filters.classId) {
      where.classId = filters.classId;
    }

    if (filters.status) {
      if (filters.status === "upcoming") {
        where.dueDate = { gte: new Date() };
      } else if (filters.status === "overdue") {
        where.dueDate = { lt: new Date() };
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        class: {
          include: {
            subject: true,
            teacher: {
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
        submissions: {
          where: {
            studentId,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    logger.info(
      `Found ${assignments.length} assignments for student ${studentId}`,
    );

    return assignments.map((assignment) => ({
      ...assignment,
      isSubmitted: assignment.submissions.length > 0,
      submission: assignment.submissions[0] || null,
    }));
  }

  /**
   * Submit assignment
   */
  async submitAssignment(studentId, schoolId, assignmentId, submissionData) {
    const { content, attachments } = submissionData;

    // Verify assignment exists and student has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            students: {
              where: {
                studentId,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Assignment not found");
    }

    if (assignment.class.students.length === 0) {
      throw new ForbiddenError("You are not enrolled in this class");
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existingSubmission) {
      // Update existing submission
      const updated = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          attachments,
          submittedAt: new Date(),
          status: "SUBMITTED",
        },
      });

      logger.info(
        `Assignment resubmitted: ${assignmentId} by student ${studentId}`,
      );

      return updated;
    } else {
      // Create new submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId,
          content,
          attachments,
          status: "SUBMITTED",
        },
      });

      logger.info(
        `Assignment submitted: ${assignmentId} by student ${studentId}`,
      );

      return submission;
    }
  }

  /**
   * Get my grades
   */
  async getMyGrades(studentId, schoolId, filters = {}) {
    const where = {
      studentId,
      schoolId,
    };

    if (filters.termId) {
      where.termId = filters.termId;
    }

    if (filters.subjectCode) {
      where.subjectCode = filters.subjectCode;
    }

    const grades = await prisma.grade.findMany({
      where,
      include: {
        termRef: true,
        teacher: {
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
      orderBy: [{ termRef: { startDate: "desc" } }, { subjectCode: "asc" }],
    });

    // Group by subject and calculate averages
    const gradesBySubject = {};

    grades.forEach((grade) => {
      if (!gradesBySubject[grade.subjectCode]) {
        gradesBySubject[grade.subjectCode] = {
          subjectCode: grade.subjectCode,
          grades: [],
          average: 0,
        };
      }
      gradesBySubject[grade.subjectCode].grades.push(grade);
    });

    // Calculate averages
    Object.keys(gradesBySubject).forEach((subjectCode) => {
      const subjectGrades = gradesBySubject[subjectCode].grades;
      const avg =
        subjectGrades.reduce((sum, g) => sum + g.score, 0) /
        subjectGrades.length;
      gradesBySubject[subjectCode].average = Math.round(avg);
    });

    return {
      grades,
      bySubject: Object.values(gradesBySubject),
    };
  }

  /**
   * Get my attendance records
   */
  async getMyAttendance(studentId, schoolId, filters = {}) {
    const where = {
      studentId,
      schoolId,
    };

    if (filters.classId) {
      where.classId = filters.classId;
    }

    if (filters.startDate && filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: new Date(filters.startDate),
        lte: endDate,
      };
    } else if (filters.month) {
      // Get records for specific month
      const [year, month] = filters.month.split("-").map(Number);
      if (
        !Number.isNaN(year) &&
        !Number.isNaN(month) &&
        month >= 1 &&
        month <= 12
      ) {
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        where.date = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        class: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate statistics
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((a) => a.status === "PRESENT").length,
      absent: attendanceRecords.filter((a) => a.status === "ABSENT").length,
      late: attendanceRecords.filter((a) => a.status === "LATE").length,
      excused: attendanceRecords.filter((a) => a.status === "EXCUSED").length,
    };

    stats.attendanceRate =
      stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return {
      records: attendanceRecords,
      stats,
    };
  }
}

module.exports = new StudentService();
