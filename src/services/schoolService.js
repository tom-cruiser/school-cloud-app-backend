const prisma = require('../config/database');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const { cleanObject } = require('../utils/helpers');
const logger = require('../config/logger');

class SchoolService {
  /**
   * Create a new school (tenant)
   */
  async createSchool(schoolData) {
    const { email, domain } = schoolData;

    // Check if domain is already taken
    const existingSchool = await prisma.school.findUnique({
      where: { domain },
    });

    if (existingSchool) {
      throw new ConflictError('School with this domain already exists');
    }

    const school = await prisma.school.create({
      data: cleanObject(schoolData),
    });

    logger.info(`School created: ${school.name} (${school.domain})`);

    return school;
  }

  /**
   * Get all schools
   */
  async getAllSchools(filters = {}) {
    const { isActive, search, skip = 0, take = 10 } = filters;

    const where = cleanObject({
      isActive,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { domain: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    });

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              teachers: true,
            },
          },
        },
      }),
      prisma.school.count({ where }),
    ]);

    return { schools, total };
  }

  /**
   * Get school by ID
   */
  async getSchoolById(schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            classes: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundError('School');
    }

    return school;
  }

  /**
   * Update school
   */
  async updateSchool(schoolId, updateData) {
    const school = await this.getSchoolById(schoolId);

    // Check domain uniqueness if changing
    if (updateData.domain && updateData.domain !== school.domain) {
      const existingSchool = await prisma.school.findUnique({
        where: { domain: updateData.domain },
      });

      if (existingSchool) {
        throw new ConflictError('School with this domain already exists');
      }
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: cleanObject(updateData),
    });

    logger.info(`School updated: ${updatedSchool.name}`);

    return updatedSchool;
  }

  /**
   * Toggle school active status
   */
  async toggleSchoolStatus(schoolId) {
    const school = await this.getSchoolById(schoolId);

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: { isActive: !school.isActive },
    });

    logger.info(`School ${updatedSchool.isActive ? 'activated' : 'deactivated'}: ${updatedSchool.name}`);

    return updatedSchool;
  }

  /**
   * Delete school (soft delete by deactivating)
   */
  async deleteSchool(schoolId) {
    await this.getSchoolById(schoolId);

    await prisma.school.update({
      where: { id: schoolId },
      data: { isActive: false },
    });

    logger.info(`School deactivated: ${schoolId}`);
  }

  /**
   * Get school statistics
   */
  async getSchoolStats(schoolId) {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      recentEnrollments,
    ] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.teacher.count({ where: { schoolId } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.student.count({
        where: {
          schoolId,
          user: { isActive: true },
        },
      }),
      prisma.student.count({
        where: {
          schoolId,
          enrollmentDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      recentEnrollments,
    };
  }

  /**
   * Create school admin user
   */
  async createSchoolAdmin(schoolId, adminData) {
    const bcrypt = require('bcrypt');
    const config = require('../config');
    
    // Verify school exists
    await this.getSchoolById(schoolId);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, config.bcryptRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'SCHOOL_ADMIN',
        schoolId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info(`School admin created for school ${schoolId}: ${admin.email}`);

    return admin;
  }
}

module.exports = new SchoolService();
