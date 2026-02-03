const prisma = require('../config/database');
const { sendSuccess } = require('../utils/helpers');
const os = require('os');

/**
 * Get system health metrics
 */
exports.getSystemHealth = async (req, res, next) => {
  try {
    const startTime = Date.now();

    // Database health check
    let dbHealth = 'healthy';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      if (dbLatency > 1000) dbHealth = 'degraded';
      if (dbLatency > 5000) dbHealth = 'unhealthy';
    } catch (error) {
      dbHealth = 'unhealthy';
    }

    // Get database statistics
    const [schoolCount, userCount, studentCount, teacherCount] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.student.count(),
      prisma.teacher.count(),
    ]);

    // Get active schools (logged in within last 24 hours)
    const activeSchools = await prisma.school.count({
      where: {
        users: {
          some: {
            lastLogin: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    // System metrics
    const cpuUsage = os.loadavg()[0];
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    const systemHealth = {
      status: dbHealth === 'healthy' && memoryUsage < 90 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      database: {
        status: dbHealth,
        latency: dbLatency,
        connections: 'N/A', // Would need pg_stat_activity for real connection count
      },

      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        cpuUsage: cpuUsage.toFixed(2),
        memoryUsage: memoryUsage.toFixed(2),
        freeMemory: (freeMemory / 1024 / 1024 / 1024).toFixed(2), // GB
        totalMemory: (totalMemory / 1024 / 1024 / 1024).toFixed(2), // GB
      },

      statistics: {
        totalSchools: schoolCount,
        activeSchools: activeSchools,
        totalUsers: userCount,
        totalStudents: studentCount,
        totalTeachers: teacherCount,
      },

      performance: {
        responseTime: Date.now() - startTime,
        healthy: dbLatency < 1000 && memoryUsage < 90,
      },
    };

    return sendSuccess(res, systemHealth, 'System health retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity logs
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent user logins
    const recentLogins = await prisma.user.findMany({
      where: {
        lastLogin: {
          not: null,
        },
      },
      orderBy: {
        lastLogin: 'desc',
      },
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLogin: true,
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get recently created schools
    const recentSchools = await prisma.school.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
          },
        },
      },
    });

    const activities = {
      recentLogins: recentLogins.map((user) => ({
        type: 'login',
        user: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        school: user.school?.name || 'N/A',
        timestamp: user.lastLogin,
      })),
      recentSchools: recentSchools.map((school) => ({
        type: 'school_created',
        name: school.name,
        domain: school.domain,
        isActive: school.isActive,
        users: school._count.users,
        students: school._count.students,
        teachers: school._count.teachers,
        timestamp: school.createdAt,
      })),
    };

    return sendSuccess(res, activities, 'Recent activities retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get system alerts and warnings
 */
exports.getSystemAlerts = async (req, res, next) => {
  try {
    const alerts = [];

    // Check for inactive schools
    const inactiveSchools = await prisma.school.count({
      where: { isActive: false },
    });

    if (inactiveSchools > 0) {
      alerts.push({
        type: 'warning',
        category: 'schools',
        message: `${inactiveSchools} inactive school(s) detected`,
        severity: 'medium',
        timestamp: new Date(),
      });
    }

    // Check for schools exceeding teacher limit
    const schoolsOverLimit = await prisma.school.findMany({
      where: {
        _count: {
          teachers: {
            gt: prisma.$queryRaw`max_teachers`,
          },
        },
      },
      select: {
        id: true,
        name: true,
        maxTeachers: true,
        _count: {
          select: {
            teachers: true,
          },
        },
      },
    });

    for (const school of schoolsOverLimit) {
      if (school._count.teachers > school.maxTeachers) {
        alerts.push({
          type: 'warning',
          category: 'limits',
          message: `${school.name} has exceeded teacher limit (${school._count.teachers}/${school.maxTeachers})`,
          severity: 'high',
          timestamp: new Date(),
        });
      }
    }

    // Check memory usage
    const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    if (memoryUsage > 85) {
      alerts.push({
        type: 'error',
        category: 'system',
        message: `High memory usage: ${memoryUsage.toFixed(2)}%`,
        severity: 'critical',
        timestamp: new Date(),
      });
    } else if (memoryUsage > 75) {
      alerts.push({
        type: 'warning',
        category: 'system',
        message: `Memory usage warning: ${memoryUsage.toFixed(2)}%`,
        severity: 'medium',
        timestamp: new Date(),
      });
    }

    return sendSuccess(res, { alerts, count: alerts.length }, 'System alerts retrieved successfully');
  } catch (error) {
    next(error);
  }
};
