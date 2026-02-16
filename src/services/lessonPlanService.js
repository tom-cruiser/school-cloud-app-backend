const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

class LessonPlanService {
  // Get teacher by user ID
  async getTeacherByUserId(userId) {
    try {
      return await prisma.teacher.findUnique({
        where: { userId }
      });
    } catch (error) {
      logger.error('Error getting teacher by user ID:', error);
      throw error;
    }
  }

  // Get all lesson plans with filters
  async getLessonPlans(schoolId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        teacherId,
        classId,
        subjectId,
        dateFrom,
        dateTo,
        search
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {
        schoolId,
        ...(status && { status }),
        ...(teacherId && { teacherId }),
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(dateFrom || dateTo) && {
          date: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) })
          }
        },
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { topic: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [lessonPlans, total] = await Promise.all([
        prisma.lessonPlan.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date: 'desc' },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                section: true
              }
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }),
        prisma.lessonPlan.count({ where })
      ]);

      return {
        items: lessonPlans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting lesson plans:', error);
      throw error;
    }
  }

  // Get lesson plan by ID
  async getLessonPlanById(schoolId, lessonPlanId, teacherId = null) {
    try {
      const where = {
        id: lessonPlanId,
        schoolId,
        ...(teacherId && { teacherId })
      };

      const lessonPlan = await prisma.lessonPlan.findFirst({
        where,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true,
              room: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new Error('Lesson plan not found');
      }

      return lessonPlan;
    } catch (error) {
      logger.error('Error getting lesson plan by ID:', error);
      throw error;
    }
  }

  // Create lesson plan
  async createLessonPlan(schoolId, teacherId, lessonPlanData) {
    try {
      const {
        classId,
        subjectId,
        title,
        topic,
        date,
        duration,
        objectives,
        materials,
        activities,
        assessment,
        homework,
        notes,
        status = 'DRAFT'
      } = lessonPlanData;

      // Validate class belongs to teacher if classId is provided
      if (classId) {
        const classExists = await prisma.class.findFirst({
          where: {
            id: classId,
            schoolId,
            teacherId
          }
        });

        if (!classExists) {
          throw new Error('Class not found or you do not have access to this class');
        }
      }

      // Validate subject exists if subjectId is provided
      if (subjectId) {
        const subjectExists = await prisma.subject.findFirst({
          where: {
            id: subjectId,
            schoolId
          }
        });

        if (!subjectExists) {
          throw new Error('Subject not found');
        }
      }

      const lessonPlan = await prisma.lessonPlan.create({
        data: {
          schoolId,
          teacherId,
          classId: classId || null,
          subjectId: subjectId || null,
          title,
          topic: topic || '',
          date: new Date(date),
          duration,
          objectives,
          materials: materials || [],
          activities,
          assessment: assessment || '',
          homework: homework || '',
          notes: notes || '',
          status
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Lesson plan created: ${title}`, {
        lessonPlanId: lessonPlan.id,
        teacherId,
        schoolId
      });

      return lessonPlan;
    } catch (error) {
      logger.error('Error creating lesson plan:', error);
      throw error;
    }
  }

  // Update lesson plan
  async updateLessonPlan(schoolId, lessonPlanId, updateData, teacherId = null) {
    try {
      // Check if lesson plan exists and belongs to teacher (if teacher role)
      const where = {
        id: lessonPlanId,
        schoolId,
        ...(teacherId && { teacherId })
      };

      const existingPlan = await prisma.lessonPlan.findFirst({ where });
      if (!existingPlan) {
        throw new Error('Lesson plan not found or access denied');
      }

      // Validate class belongs to teacher if classId is being updated
      if (updateData.classId && teacherId) {
        const classExists = await prisma.class.findFirst({
          where: {
            id: updateData.classId,
            schoolId,
            teacherId
          }
        });

        if (!classExists) {
          throw new Error('Class not found or you do not have access to this class');
        }
      }

      // Clean update data
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const lessonPlan = await prisma.lessonPlan.update({
        where: { id: lessonPlanId },
        data: {
          ...cleanUpdateData,
          ...(cleanUpdateData.date && { date: new Date(cleanUpdateData.date) })
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Lesson plan updated: ${lessonPlan.title}`, {
        lessonPlanId: lessonPlan.id,
        teacherId: teacherId || 'admin',
        schoolId
      });

      return lessonPlan;
    } catch (error) {
      logger.error('Error updating lesson plan:', error);
      throw error;
    }
  }

  // Delete lesson plan
  async deleteLessonPlan(schoolId, lessonPlanId, teacherId = null) {
    try {
      const where = {
        id: lessonPlanId,
        schoolId,
        ...(teacherId && { teacherId })
      };

      const existingPlan = await prisma.lessonPlan.findFirst({ where });
      if (!existingPlan) {
        throw new Error('Lesson plan not found or access denied');
      }

      await prisma.lessonPlan.delete({
        where: { id: lessonPlanId }
      });

      logger.info(`Lesson plan deleted: ${existingPlan.title}`, {
        lessonPlanId,
        teacherId: teacherId || 'admin',
        schoolId
      });

      return { message: 'Lesson plan deleted successfully' };
    } catch (error) {
      logger.error('Error deleting lesson plan:', error);
      throw error;
    }
  }

  // Duplicate lesson plan
  async duplicateLessonPlan(schoolId, lessonPlanId, teacherId) {
    try {
      const originalPlan = await prisma.lessonPlan.findFirst({
        where: {
          id: lessonPlanId,
          schoolId,
          teacherId
        }
      });

      if (!originalPlan) {
        throw new Error('Lesson plan not found or access denied');
      }

      const duplicatedPlan = await prisma.lessonPlan.create({
        data: {
          schoolId: originalPlan.schoolId,
          teacherId: originalPlan.teacherId,
          classId: originalPlan.classId,
          subjectId: originalPlan.subjectId,
          title: `${originalPlan.title} (Copy)`,
          topic: originalPlan.topic,
          date: new Date(), // Set to today
          duration: originalPlan.duration,
          objectives: originalPlan.objectives,
          materials: originalPlan.materials,
          activities: originalPlan.activities,
          assessment: originalPlan.assessment,
          homework: originalPlan.homework,
          notes: originalPlan.notes,
          status: 'DRAFT'
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Lesson plan duplicated: ${duplicatedPlan.title}`, {
        originalId: lessonPlanId,
        newId: duplicatedPlan.id,
        teacherId,
        schoolId
      });

      return duplicatedPlan;
    } catch (error) {
      logger.error('Error duplicating lesson plan:', error);
      throw error;
    }
  }

  // Get lesson plan statistics
  async getLessonPlanStats(schoolId, teacherId = null) {
    try {
      const where = {
        schoolId,
        ...(teacherId && { teacherId })
      };

      const [
        total,
        drafts,
        published,
        completed,
        thisWeek,
        thisMonth
      ] = await Promise.all([
        prisma.lessonPlan.count({ where }),
        prisma.lessonPlan.count({ where: { ...where, status: 'DRAFT' } }),
        prisma.lessonPlan.count({ where: { ...where, status: 'PUBLISHED' } }),
        prisma.lessonPlan.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.lessonPlan.count({
          where: {
            ...where,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        }),
        prisma.lessonPlan.count({
          where: {
            ...where,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          }
        })
      ]);

      return {
        total,
        drafts,
        published,
        completed,
        thisWeek,
        thisMonth
      };
    } catch (error) {
      logger.error('Error getting lesson plan stats:', error);
      throw error;
    }
  }

  // Get upcoming lessons
  async getUpcomingLessons(schoolId, teacherId = null, days = 7) {
    try {
      const where = {
        schoolId,
        ...(teacherId && { teacherId }),
        date: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + days))
        },
        status: {
          in: ['PUBLISHED', 'DRAFT']
        }
      };

      const lessons = await prisma.lessonPlan.findMany({
        where,
        orderBy: { date: 'asc' },
        take: 10,
        include: {
          class: {
            select: {
              name: true,
              section: true,
              room: true
            }
          },
          subject: {
            select: {
              name: true,
              code: true
            }
          },
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return lessons;
    } catch (error) {
      logger.error('Error getting upcoming lessons:', error);
      throw error;
    }
  }
}

module.exports = new LessonPlanService();