const PerformanceMiddleware = require('./middleware/performanceMiddleware');
const DatabaseMonitoringService = require('./middleware/databaseMonitoring');
const winston = require('winston');

// Configure winston logger for monitoring
const monitoringLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'island-rides-monitoring' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/monitoring-error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/monitoring-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  monitoringLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

class MonitoringIntegration {
  constructor() {
    this.performanceMiddleware = new PerformanceMiddleware();
    this.databaseMonitoring = new DatabaseMonitoringService();
    this.isInitialized = false;
    this.logger = monitoringLogger;
  }

  initialize(app, db) {
    if (this.isInitialized) {
      this.logger.warn('Monitoring integration already initialized');
      return;
    }

    this.logger.info('Initializing monitoring integration...');

    try {
      // Integrate performance middleware
      this.setupPerformanceMiddleware(app);
      
      // Integrate database monitoring
      this.setupDatabaseMonitoring(db);
      
      // Setup monitoring endpoints
      this.setupMonitoringEndpoints(app);
      
      // Setup health checks
      this.setupHealthChecks(app);
      
      // Setup alerts and notifications
      this.setupAlertingSystem();

      this.isInitialized = true;
      this.logger.info('Monitoring integration initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize monitoring integration', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  setupPerformanceMiddleware(app) {
    this.logger.info('Setting up performance middleware...');
    
    // Add performance monitoring middleware early in the chain
    app.use(this.performanceMiddleware.middleware());
    
    this.logger.info('Performance middleware configured');
  }

  setupDatabaseMonitoring(db) {
    this.logger.info('Setting up database monitoring...');
    
    // Wrap database connection with monitoring
    const wrappedDb = this.databaseMonitoring.wrapDatabase(db);
    
    // Replace the original db reference (this requires careful implementation in production)
    // In a real scenario, you'd want to do this at the db creation level
    if (typeof db.prepare === 'function') {
      const originalPrepare = db.prepare.bind(db);
      db.prepare = (sql) => {
        return this.databaseMonitoring.wrapStatement(originalPrepare(sql), sql);
      };
    }
    
    this.logger.info('Database monitoring configured');
  }

  setupMonitoringEndpoints(app) {
    this.logger.info('Setting up monitoring endpoints...');
    
    // Performance metrics endpoint
    app.get('/api/monitoring/metrics', this.performanceMiddleware.getMetricsEndpoint());
    
    // Performance report endpoint
    app.get('/api/monitoring/performance', this.performanceMiddleware.getReportEndpoint());
    
    // Database metrics endpoint
    app.get('/api/monitoring/database', this.databaseMonitoring.getMetricsEndpoint());
    
    // Database report endpoint
    app.get('/api/monitoring/database/report', this.databaseMonitoring.getReportEndpoint());
    
    // Slow queries endpoint
    app.get('/api/monitoring/database/slow-queries', this.databaseMonitoring.getSlowQueriesEndpoint());
    
    // Alerts endpoint
    app.get('/api/monitoring/alerts', this.performanceMiddleware.getAlertsEndpoint());
    
    // System health endpoint
    app.get('/api/monitoring/health', this.getHealthEndpoint());
    
    // Monitoring dashboard data endpoint
    app.get('/api/monitoring/dashboard', this.getDashboardDataEndpoint());

    this.logger.info('Monitoring endpoints configured');
  }

  setupHealthChecks(app) {
    this.logger.info('Setting up health checks...');
    
    // Basic health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });
    
    // Detailed health check
    app.get('/health/detailed', (req, res) => {
      const health = this.getDetailedHealthStatus();
      res.json(health);
    });
    
    this.logger.info('Health checks configured');
  }

  setupAlertingSystem() {
    this.logger.info('Setting up alerting system...');
    
    // Configure webhook for external alerting if URL is provided
    if (process.env.MONITORING_WEBHOOK_URL) {
      this.logger.info('Configuring monitoring webhook...');
      // This would integrate with the performance middleware's alerting system
      // Implementation depends on your specific alerting requirements
    }
    
    // Setup periodic health monitoring
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
    
    this.logger.info('Alerting system configured');
  }

  getHealthEndpoint() {
    return (req, res) => {
      try {
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          system: {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
          },
          monitoring: {
            performanceMiddleware: this.performanceMiddleware ? 'active' : 'inactive',
            databaseMonitoring: this.databaseMonitoring ? 'active' : 'inactive'
          }
        };
        
        res.json(health);
      } catch (error) {
        this.logger.error('Health check failed', { error: error.message });
        res.status(500).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  getDashboardDataEndpoint() {
    return async (req, res) => {
      try {
        const timeRange = req.query.timeRange || '1h';
        
        // Get performance data
        const performanceReport = this.performanceMiddleware.generatePerformanceReport();
        
        // Get database data
        const databaseReport = this.databaseMonitoring.generateDatabaseReport();
        
        // Get system metrics
        const systemMetrics = this.getSystemMetrics();
        
        // Get alerts
        const alerts = Array.from(this.performanceMiddleware.alerts.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20);
        
        const dashboardData = {
          timestamp: Date.now(),
          timeRange,
          performance: performanceReport,
          database: databaseReport,
          system: systemMetrics,
          alerts: {
            recent: alerts,
            summary: this.getAlertsSummary(alerts)
          }
        };
        
        res.json(dashboardData);
      } catch (error) {
        this.logger.error('Dashboard data endpoint failed', { error: error.message });
        res.status(500).json({
          error: 'Failed to generate dashboard data',
          message: error.message,
          timestamp: Date.now()
        });
      }
    };
  }

  getDetailedHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    return {
      status: this.determineOverallHealth(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        memory: {
          ...memoryUsage,
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          usagePercent: Math.round(memoryUsagePercent)
        }
      },
      monitoring: {
        performanceMiddleware: {
          status: this.performanceMiddleware ? 'active' : 'inactive',
          metricsCount: this.performanceMiddleware?.metrics.size || 0
        },
        databaseMonitoring: {
          status: this.databaseMonitoring ? 'active' : 'inactive',
          activeConnections: this.databaseMonitoring?.connectionPool.size || 0,
          slowQueriesCount: this.databaseMonitoring?.slowQueries.length || 0
        }
      },
      alerts: {
        activeCount: this.getActiveAlertsCount(),
        criticalCount: this.getCriticalAlertsCount()
      }
    };
  }

  determineOverallHealth() {
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Check critical conditions
    if (memoryUsagePercent > 90) return 'critical';
    if (this.getCriticalAlertsCount() > 0) return 'critical';
    
    // Check warning conditions
    if (memoryUsagePercent > 75) return 'warning';
    if (this.getActiveAlertsCount() > 5) return 'warning';
    
    return 'healthy';
  }

  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      uptime: process.uptime(),
      memory: {
        ...memoryUsage,
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        usagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }

  getActiveAlertsCount() {
    if (!this.performanceMiddleware.alerts) return 0;
    return Array.from(this.performanceMiddleware.alerts.values()).length;
  }

  getCriticalAlertsCount() {
    if (!this.performanceMiddleware.alerts) return 0;
    return Array.from(this.performanceMiddleware.alerts.values())
      .filter(alert => alert.severity === 'critical').length;
  }

  getAlertsSummary(alerts) {
    const summary = {
      total: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      byType: {}
    };

    alerts.forEach(alert => {
      summary[alert.severity] = (summary[alert.severity] || 0) + 1;
      summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
    });

    return summary;
  }

  performHealthCheck() {
    const health = this.getDetailedHealthStatus();
    
    // Log health status
    if (health.status === 'critical') {
      this.logger.error('System health critical', health);
    } else if (health.status === 'warning') {
      this.logger.warn('System health warning', health);
    } else {
      this.logger.debug('System health check passed', { 
        uptime: health.uptime,
        memoryUsage: health.system.memory.usagePercent,
        alertsCount: health.alerts.activeCount
      });
    }
  }

  // Utility method to enable/disable monitoring
  setEnabled(enabled) {
    if (enabled && !this.isInitialized) {
      throw new Error('Cannot enable monitoring - not initialized');
    }
    
    // Implementation would depend on how you want to toggle monitoring
    this.logger.info(`Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }
}

module.exports = MonitoringIntegration;