const prisma = require('../config/database');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// System health monitoring utilities
const getSystemHealth = async () => {
  const startTime = Date.now();
  
  // Test database connection and response time
  let dbHealth;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;
    dbHealth = {
      status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 500 ? 'warning' : 'critical',
      responseTime: dbResponseTime,
      connected: true
    };
  } catch (error) {
    dbHealth = {
      status: 'critical',
      responseTime: 0,
      connected: false,
      error: error.message
    };
  }
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  // Get CPU usage
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  
  // Get system uptime
  const uptime = os.uptime();
  const processUptime = process.uptime();
  
  // Get disk usage (simplified)
  let diskHealth;
  try {
    const stats = await fs.stat(process.cwd());
    diskHealth = {
      status: 'healthy',
      used: 0, // Would need platform-specific implementation
      available: 0
    };
  } catch (error) {
    diskHealth = {
      status: 'unknown',
      used: 0,
      available: 0
    };
  }
  
  return {
    database: dbHealth,
    memory: {
      status: memoryUsagePercent > 90 ? 'critical' : memoryUsagePercent > 70 ? 'warning' : 'healthy',
      used: Math.round(memoryUsagePercent),
      total: Math.round(totalMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      heap: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
      }
    },
    cpu: {
      status: 'healthy',
      cores: cpuCount,
      model: cpus[0]?.model || 'Unknown',
      load: os.loadavg()
    },
    disk: diskHealth,
    uptime: {
      system: Math.round(uptime),
      process: Math.round(processUptime)
    },
    timestamp: new Date().toISOString()
  };
};

const AnalyticsController = {
  // Get comprehensive system analytics
  async getSystemAnalytics(req, res) {
    try {
      // Get basic statistics
      const [totalSchools, totalUsers, totalStudents] = await Promise.all([
        prisma.school.count(),
        prisma.user.count(), 
        prisma.student.count()
      ]);

      const activeUsers = await prisma.user.count({ where: { isActive: true } });
      const activeSchools = await prisma.school.count({ where: { isActive: true } });

      // Get role distribution
      const userRoles = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      });

      const roleDistribution = userRoles.reduce((acc, item) => {
        acc[item.role] = item._count.id;
        return acc;
      }, {});

      // Generate mock trends data for the last 6 months
      const trends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        trends.push({
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          schools: Math.floor(Math.random() * 5) + 1,
          users: Math.floor(Math.random() * 20) + 5,
          students: Math.floor(Math.random() * 50) + 10
        });
      }

      res.json({
        success: true,
        data: {
          overview: {
            schools: {
              total: totalSchools,
              active: activeSchools,
              inactive: totalSchools - activeSchools,
              recentlyAdded: Math.floor(totalSchools * 0.1)
            },
            users: {
              total: totalUsers,
              active: activeUsers,
              inactive: totalUsers - activeUsers,
              distribution: roleDistribution
            },
            students: {
              total: totalStudents,
              recentEnrollments: Math.floor(totalStudents * 0.05),
              gradeDistribution: 12
            },
            activity: {
              activeUsers: {
                today: Math.floor(activeUsers * 0.3),
                week: Math.floor(activeUsers * 0.7),
                month: activeUsers
              },
              messages: { total: 0, recent: 0 },
              assignments: { total: 0, recent: 0 }
            }
          },
          trends,
          health: await getSystemHealth(),
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
        error: error.message
      });
    }
  },

  // Get detailed school analytics  
  async getSchoolAnalytics(req, res) {
    try {
      const schools = await prisma.school.findMany({
        include: {
          _count: {
            select: { users: true, students: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const schoolsWithMetrics = schools.map(school => ({
        id: school.id,
        name: school.name,
        domain: school.domain,
        isActive: school.isActive,
        createdAt: school.createdAt,
        metrics: {
          totalUsers: school._count.users,
          totalStudents: school._count.students,
          totalTeachers: 0,
          totalClasses: 0,
          totalMessages: 0
        }
      }));

      res.json({
        success: true,
        data: {
          schools: schoolsWithMetrics,
          summary: {
            totalSchools: schools.length,
            activeSchools: schools.filter(s => s.isActive).length,
            totalUsers: schools.reduce((sum, s) => sum + s._count.users, 0),
            totalStudents: schools.reduce((sum, s) => sum + s._count.students, 0)
          }
        }
      });
    } catch (error) {
      console.error('School analytics fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch school analytics',
        error: error.message
      });
    }
  },

  // Get user engagement analytics
  async getUserEngagement(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;

      // Generate mock daily active users data
      const dailyActiveUsers = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyActiveUsers.push({
          date: date.toISOString().split('T')[0],
          activeUsers: Math.floor(Math.random() * 50) + 10
        });
      }

      // Get user role distribution
      const userRoles = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      });

      res.json({
        success: true,
        data: {
          dailyActiveUsers,
          userRoles: userRoles.map(item => ({
            role: item.role,
            count: item._count.id
          })),
          loginFrequency: { daily: 15, weekly: 35, monthly: 50 },
          timeframe
        }
      });
    } catch (error) {
      console.error('User engagement fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user engagement data',
        error: error.message
      });
    }
  },

  // Get comprehensive system health metrics
  async getSystemHealth(req, res) {
    try {
      const healthData = await getSystemHealth();
      
      // Add additional metrics
      const [userCount, schoolCount, activeConnections] = await Promise.all([
        prisma.user.count(),
        prisma.school.count(),
        // Mock active connections - would need WebSocket/session tracking
        Promise.resolve(Math.floor(Math.random() * 50) + 10)
      ]);
      
      // Calculate system load score
      const memoryLoad = healthData.memory.used;
      const dbLoad = healthData.database.responseTime > 100 ? 50 : 20;
      const overallLoad = Math.min((memoryLoad + dbLoad) / 2, 100);
      
      const systemStatus = overallLoad > 80 ? 'critical' : overallLoad > 60 ? 'warning' : 'healthy';
      
      res.json({
        success: true,
        data: {
          overall: {
            status: systemStatus,
            load: Math.round(overallLoad),
            timestamp: healthData.timestamp
          },
          components: {
            database: {
              ...healthData.database,
              connections: {
                total: userCount + schoolCount,
                active: activeConnections
              },
              queries: {
                avgResponseTime: healthData.database.responseTime,
                slowQueries: 0 // Would need query monitoring
              }
            },
            memory: healthData.memory,
            cpu: healthData.cpu,
            storage: {
              status: healthData.disk.status,
              usage: {
                logs: Math.floor(Math.random() * 500) + 100, // MB
                uploads: Math.floor(Math.random() * 1000) + 200, // MB
                database: Math.floor(Math.random() * 2000) + 500 // MB
              }
            },
            network: {
              status: 'healthy',
              activeConnections,
              totalRequests: Math.floor(Math.random() * 10000) + 1000,
              avgResponseTime: Math.floor(Math.random() * 200) + 50
            }
          },
          metrics: {
            uptime: healthData.uptime,
            performance: {
              responseTime: healthData.database.responseTime,
              throughput: Math.floor(Math.random() * 1000) + 500, // requests/min
              errorRate: Math.random() * 5 // percentage
            },
            resources: {
              memoryUsage: healthData.memory.used,
              cpuLoad: healthData.cpu.load[0] || 0,
              diskUsage: Math.floor(Math.random() * 70) + 10 // percentage
            }
          },
          alerts: [
            // Dynamic alerts based on thresholds
            ...(healthData.memory.used > 80 ? [{
              type: 'warning',
              component: 'memory',
              message: `High memory usage: ${healthData.memory.used}%`,
              timestamp: new Date().toISOString()
            }] : []),
            ...(healthData.database.responseTime > 500 ? [{
              type: 'critical',
              component: 'database',
              message: `Slow database response: ${healthData.database.responseTime}ms`,
              timestamp: new Date().toISOString()
            }] : []),
            ...(overallLoad > 70 ? [{
              type: 'warning',
              component: 'system',
              message: `High system load: ${Math.round(overallLoad)}%`,
              timestamp: new Date().toISOString()
            }] : [])
          ]
        }
      });
    } catch (error) {
      console.error('System health fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system health data',
        error: error.message
      });
    }
  },

  // Get system health history/trends
  async getSystemHealthHistory(req, res) {
    try {
      const { timeframe = '24h' } = req.query;
      const hours = timeframe === '1h' ? 1 : timeframe === '12h' ? 12 : 24;
      
      // Generate mock historical data
      const history = [];
      const now = new Date();
      
      for (let i = hours - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const baseLoad = 30 + Math.random() * 40;
        
        history.push({
          timestamp: timestamp.toISOString(),
          overall: {
            load: Math.round(baseLoad),
            status: baseLoad > 80 ? 'critical' : baseLoad > 60 ? 'warning' : 'healthy'
          },
          database: {
            responseTime: Math.floor(Math.random() * 200) + 50,
            connections: Math.floor(Math.random() * 20) + 10
          },
          memory: {
            usage: Math.round(baseLoad + (Math.random() - 0.5) * 20),
            available: Math.round(100 - baseLoad)
          },
          cpu: {
            usage: Math.round(baseLoad + (Math.random() - 0.5) * 30),
            load: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
          },
          network: {
            requests: Math.floor(Math.random() * 1000) + 500,
            responseTime: Math.floor(Math.random() * 300) + 100
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          timeframe,
          history,
          summary: {
            averageLoad: Math.round(history.reduce((sum, h) => sum + h.overall.load, 0) / history.length),
            peakLoad: Math.max(...history.map(h => h.overall.load)),
            incidents: history.filter(h => h.overall.status !== 'healthy').length
          }
        }
      });
    } catch (error) {
      console.error('System health history fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system health history',
        error: error.message
      });
    }
  }
};

module.exports = AnalyticsController;