const prisma = require('../config/database');
const { NotFoundError, BadRequestError, ApiError } = require('../utils/errors');

class GuardianService {
  /**
   * Get guardian profile by user ID
   */
  async getGuardianByUserId(userId) {
    const guardian = await prisma.guardian.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        schoolId: true,
        phone: true,
        occupation: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
          }
        },
        students: {
          select: {
            studentId: true,
            relationship: true,
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                },
                gradeLevel: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!guardian) {
      throw new NotFoundError('Guardian not found');
    }

    return guardian;
  }

  /**
   * Get my profile (for logged-in guardian)
   */
  async getMyProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        guardian: {
          select: {
            id: true,
            phone: true,
            occupation: true,
            workAddress: true,
            emergencyContact: true,
            preferredContactMethod: true,
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
            students: {
              select: {
                id: true,
                relationship: true,
                isPrimary: true,
                student: {
                  select: {
                    id: true,
                    studentNumber: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      }
                    },
                    gradeLevel: {
                      select: {
                        name: true,
                      }
                    }
                  }
                }
              }
            }
          },
        },
      },
    });

    if (!user || !user.guardian) {
      throw new NotFoundError('Guardian profile not found');
    }

    return user.guardian;
  }

  /**
   * Update my profile
   */
  async updateMyProfile(userId, updateData) {
    const guardian = await prisma.guardian.findUnique({
      where: { userId }
    });

    if (!guardian) {
      throw new NotFoundError('Guardian not found');
    }

    const { firstName, lastName, email, ...guardianData } = updateData;

    // Update user data if provided
    if (firstName || lastName || email) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
        }
      });
    }

    // Update guardian-specific data
    const updatedGuardian = await prisma.guardian.update({
      where: { id: guardian.id },
      data: guardianData,
      include: {
        user: true,
        students: {
          include: {
            student: {
              include: {
                user: true,
                gradeLevel: true,
              }
            }
          }
        }
      }
    });

    return updatedGuardian;
  }

  /**
   * Get all my children (students)
   */
  async getMyChildren(userId) {
    const guardian = await prisma.guardian.findUnique({
      where: { userId },
      select: {
        students: {
          select: {
            relationship: true,
            isPrimary: true,
            canPickup: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                dateOfBirth: true,
                gender: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                },
                gradeLevel: {
                  select: {
                    name: true,
                    level: true,
                  }
                },
                house: {
                  select: {
                    name: true,
                    color: true,
                  }
                },
                transportRoute: {
                  select: {
                    routeName: true,
                    routeNumber: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!guardian) {
      throw new NotFoundError('Guardian not found');
    }

    return guardian.students.map(sg => ({
      ...sg.student,
      relationship: sg.relationship,
      isPrimary: sg.isPrimary,
      canPickup: sg.canPickup,
    }));
  }

  /**
   * Get specific child details
   */
  async getChildDetails(userId, studentId) {
    const guardian = await this.getGuardianByUserId(userId);
    
    const studentGuardian = guardian.students.find(
      sg => sg.studentId === studentId
    );

    if (!studentGuardian) {
      throw new NotFoundError('Student not found or not associated with this guardian');
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentNumber: true,
        dateOfBirth: true,
        gender: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        gradeLevel: {
          select: {
            name: true,
            level: true,
          }
        },
        house: {
          select: {
            name: true,
            color: true,
          }
        },
        transportRoute: {
          select: {
            routeName: true,
            routeNumber: true,
          }
        },
        classes: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                subject: {
                  select: {
                    name: true,
                  }
                },
                teacher: {
                  select: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return student;
  }

  /**
   * Get child's academic progress
   */
  async getChildAcademicProgress(userId, studentId) {
    const guardian = await this.getGuardianByUserId(userId);
    
    const studentGuardian = guardian.students.find(
      sg => sg.studentId === studentId
    );

    if (!studentGuardian) {
      throw new NotFoundError('Student not found or not associated with this guardian');
    }

    const grades = await prisma.grade.findMany({
      where: { studentId },
      select: {
        id: true,
        score: true,
        grade: true,
        maxScore: true,
        weightage: true,
        createdAt: true,
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        term: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
          }
        },
        assignment: {
          select: {
            title: true,
            dueDate: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return grades;
  }

  /**
   * Get child's attendance records
   */
  async getChildAttendance(userId, studentId, filters = {}) {
    const guardian = await this.getGuardianByUserId(userId);
    
    const studentGuardian = guardian.students.find(
      sg => sg.studentId === studentId
    );

    if (!studentGuardian) {
      throw new NotFoundError('Student not found or not associated with this guardian');
    }

    const { startDate, endDate, status } = filters;

    const where = {
      studentId,
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(status && { status }),
    };

    const attendance = await prisma.attendance.findMany({
      where,
      select: {
        id: true,
        date: true,
        status: true,
        remarks: true,
        class: {
          select: {
            name: true,
            subject: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return attendance;
  }

  /**
   * Get child's assignments
   */
  async getChildAssignments(userId, studentId, filters = {}) {
    const guardian = await this.getGuardianByUserId(userId);
    
    const studentGuardian = guardian.students.find(
      sg => sg.studentId === studentId
    );

    if (!studentGuardian) {
      throw new NotFoundError('Student not found or not associated with this guardian');
    }

    const { status } = filters;

    // Get student's classes
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId },
      select: { classId: true }
    });

    const classIds = studentClasses.map(sc => sc.classId);

    const where = {
      classId: { in: classIds },
      ...(status && { status }),
    };

    const assignments = await prisma.assignment.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        maxScore: true,
        subject: {
          select: {
            name: true,
          }
        },
        class: {
          select: {
            name: true,
          }
        },
        submissions: {
          where: { studentId },
          select: {
            id: true,
            submittedAt: true,
            status: true,
            grade: {
              select: {
                score: true,
                grade: true,
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    return assignments.map(assignment => ({
      ...assignment,
      submission: assignment.submissions[0] || null,
      submissions: undefined,
    }));
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(userId) {
    // Simplified query - get guardian with minimal data first
    const guardian = await prisma.guardian.findUnique({
      where: { userId },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        students: {
          select: {
            studentId: true,
            relationship: true,
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                },
                gradeLevel: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!guardian) {
      throw new NotFoundError('Guardian not found');
    }

    const children = guardian.students.map(sg => ({
      id: sg.student.id,
      firstName: sg.student.user.firstName,
      lastName: sg.student.user.lastName,
      gradeLevel: sg.student.gradeLevel?.name,
      relationship: sg.relationship,
    }));

    const studentIds = children.map(child => child.id);

    // Parallel queries with limits to improve performance
    const [recentGrades, upcomingAssignments, recentAttendance] = await Promise.all([
      // Recent grades - limited and simplified
      prisma.grade.findMany({
        where: { studentId: { in: studentIds } },
        select: {
          id: true,
          score: true,
          letterGrade: true,
          createdAt: true,
          student: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          subjectCode: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Reduced from 10
      }),

      // Upcoming assignments - simplified query
      studentIds.length > 0 ? prisma.assignment.findMany({
        where: {
          dueDate: { gte: new Date() },
          class: {
            students: {
              some: {
                studentId: { in: studentIds }
              }
            }
          }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          class: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: 5, // Reduced from 10
      }) : [],

      // Recent attendance issues - simplified
      prisma.attendance.findMany({
        where: {
          studentId: { in: studentIds },
          status: { in: ['ABSENT', 'LATE'] }
        },
        select: {
          id: true,
          date: true,
          status: true,
          student: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          class: {
            select: {
              subject: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' },
        take: 5, // Reduced from 10
      }),
    ]);

    return {
      children,
      recentGrades,
      upcomingAssignments,
      recentAttendance,
      summary: {
        totalChildren: children.length,
        upcomingAssignmentsCount: upcomingAssignments.length,
        attendanceIssuesCount: recentAttendance.length,
      }
    };
  }

  /**
   * Get payments for all children
   */
  async getPayments(userId, filters = {}) {
    const children = await this.getMyChildren(userId);
    const studentIds = children.map(child => child.id);

    const { status, startDate, endDate } = filters;

    const where = {
      studentId: { in: studentIds },
      ...(status && { status }),
      ...(startDate && { dueDate: { gte: new Date(startDate) } }),
      ...(endDate && { dueDate: { lte: new Date(endDate) } }),
    };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    return payments;
  }

  /**
   * Make a payment
   */
  async makePayment(userId, paymentId) {
    const children = await this.getMyChildren(userId);
    const studentIds = children.map(child => child.id);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !studentIds.includes(payment.studentId)) {
      throw new NotFoundError('Payment not found or not authorized');
    }

    if (payment.status === 'PAID') {
      throw new BadRequestError('Payment already completed');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
      include: {
        student: {
          include: {
            user: true,
          }
        }
      }
    });

    return updatedPayment;
  }
}

module.exports = new GuardianService();
