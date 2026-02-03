const prisma = require('../config/database');

const SystemHealthSettingsController = {
  // Get system health settings
  async getSettings(req, res) {
    try {
      // Get settings from database or return defaults
      let settings = await prisma.systemHealthSettings.findFirst({
        orderBy: { updatedAt: 'desc' }
      });

      if (!settings) {
        // Return default settings if none exist
        settings = {
          autoRefresh: {
            enabled: false,
            interval: 30000 // 30 seconds
          },
          alerts: {
            enabled: true,
            sound: true,
            thresholds: {
              cpu: 80,
              memory: 85,
              database: 500, // ms
              storage: 90,
              errorRate: 5
            }
          },
          display: {
            showCharts: true,
            chartPoints: 20,
            timeframe: '24h',
            autoAcknowledgeAlerts: false
          },
          notifications: {
            email: false,
            browser: true,
            webhook: false,
            webhookUrl: ''
          },
          monitoring: {
            retentionDays: 30,
            detailedLogging: false,
            performanceMode: 'balanced' // low, balanced, high
          }
        };
      }

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error fetching system health settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system health settings'
      });
    }
  },

  // Update system health settings
  async updateSettings(req, res) {
    try {
      const {
        autoRefresh,
        alerts,
        display,
        notifications,
        monitoring
      } = req.body;

      // Validate settings
      const validationErrors = [];

      if (autoRefresh?.interval && (autoRefresh.interval < 5000 || autoRefresh.interval > 300000)) {
        validationErrors.push('Auto-refresh interval must be between 5 seconds and 5 minutes');
      }

      if (alerts?.thresholds) {
        const { cpu, memory, database, storage, errorRate } = alerts.thresholds;
        if (cpu && (cpu < 1 || cpu > 100)) validationErrors.push('CPU threshold must be between 1-100%');
        if (memory && (memory < 1 || memory > 100)) validationErrors.push('Memory threshold must be between 1-100%');
        if (database && (database < 1 || database > 10000)) validationErrors.push('Database threshold must be between 1-10000ms');
        if (storage && (storage < 1 || storage > 100)) validationErrors.push('Storage threshold must be between 1-100%');
        if (errorRate && (errorRate < 0 || errorRate > 100)) validationErrors.push('Error rate threshold must be between 0-100%');
      }

      if (monitoring?.retentionDays && (monitoring.retentionDays < 1 || monitoring.retentionDays > 365)) {
        validationErrors.push('Retention days must be between 1-365 days');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: validationErrors
        });
      }

      // Update or create settings
      const settingsData = {
        autoRefresh: autoRefresh || {},
        alerts: alerts || {},
        display: display || {},
        notifications: notifications || {},
        monitoring: monitoring || {},
        updatedAt: new Date()
      };

      const settings = await prisma.systemHealthSettings.upsert({
        where: { id: 1 }, // Single settings record
        update: settingsData,
        create: { id: 1, ...settingsData }
      });

      res.json({
        success: true,
        data: settings,
        message: 'System health settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating system health settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system health settings'
      });
    }
  },

  // Reset settings to defaults
  async resetSettings(req, res) {
    try {
      const defaultSettings = {
        autoRefresh: {
          enabled: false,
          interval: 30000
        },
        alerts: {
          enabled: true,
          sound: true,
          thresholds: {
            cpu: 80,
            memory: 85,
            database: 500,
            storage: 90,
            errorRate: 5
          }
        },
        display: {
          showCharts: true,
          chartPoints: 20,
          timeframe: '24h',
          autoAcknowledgeAlerts: false
        },
        notifications: {
          email: false,
          browser: true,
          webhook: false,
          webhookUrl: ''
        },
        monitoring: {
          retentionDays: 30,
          detailedLogging: false,
          performanceMode: 'balanced'
        },
        updatedAt: new Date()
      };

      const settings = await prisma.systemHealthSettings.upsert({
        where: { id: 1 },
        update: defaultSettings,
        create: { id: 1, ...defaultSettings }
      });

      res.json({
        success: true,
        data: settings,
        message: 'System health settings reset to defaults'
      });
    } catch (error) {
      console.error('Error resetting system health settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset system health settings'
      });
    }
  }
};

module.exports = SystemHealthSettingsController;