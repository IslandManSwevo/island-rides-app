const winston = require('winston');
const os = require('os');

class PerformanceMiddleware {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      responseTime: {
        warning: 500,   // ms
        critical: 2000  // ms
      },
      memoryUsage: {
        warning: 80,    // percentage
        critical: 90    // percentage
      },
      cpuUsage: {
        warning: 70,    // percentage
        critical: 85    // percentage
      },
      errorRate: {
        warning: 5,     // percentage per hour
        critical: 10    // percentage per hour
      }
    };
    
    // Initialize metrics collection
    this.startMetricsCollection();
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      // Store request metadata
      req.performanceContext = {
        startTime,
        startMemory,
        endpoint: `${req.method} ${req.path}`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      };

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        this.captureResponseMetrics(req, res);
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  captureResponseMetrics(req, res) {
    if (!req.performanceContext) return;

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - req.performanceContext.startTime) / 1000000; // Convert to milliseconds
    const endMemory = process.memoryUsage();
    
    const metric = {
      timestamp: Date.now(),
      endpoint: req.performanceContext.endpoint,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: {
        before: req.performanceContext.startMemory,
        after: endMemory,
        delta: {
          rss: endMemory.rss - req.performanceContext.startMemory.rss,
          heapUsed: endMemory.heapUsed - req.performanceContext.startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - req.performanceContext.startMemory.heapTotal,
          external: endMemory.external - req.performanceContext.startMemory.external
        }
      },
      userAgent: req.performanceContext.userAgent,
      ip: req.performanceContext.ip,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      body: req.method !== 'GET' && req.body ? this.sanitizeBody(req.body) : undefined
    };

    this.storeMetric(metric);
    this.checkAlerts(metric);
    this.logMetric(metric);
  }

  storeMetric(metric) {
    const key = metric.endpoint;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const endpointMetrics = this.metrics.get(key);
    endpointMetrics.push(metric);
    
    // Keep only last 100 metrics per endpoint
    if (endpointMetrics.length > 100) {
      endpointMetrics.shift();
    }
  }

  checkAlerts(metric) {
    // Response time alerts
    if (metric.responseTime > this.thresholds.responseTime.critical) {
      this.triggerAlert('critical', 'response_time', metric, 
        `Critical response time: ${Math.round(metric.responseTime)}ms for ${metric.endpoint}`);
    } else if (metric.responseTime > this.thresholds.responseTime.warning) {
      this.triggerAlert('warning', 'response_time', metric,
        `Slow response time: ${Math.round(metric.responseTime)}ms for ${metric.endpoint}`);
    }

    // Error rate alerts
    if (metric.statusCode >= 500) {
      this.triggerAlert('critical', 'server_error', metric,
        `Server error ${metric.statusCode} for ${metric.endpoint}`);
    } else if (metric.statusCode >= 400) {
      this.triggerAlert('warning', 'client_error', metric,
        `Client error ${metric.statusCode} for ${metric.endpoint}`);
    }

    // Memory usage alerts
    const memoryUsagePercent = (metric.memoryUsage.after.heapUsed / metric.memoryUsage.after.heapTotal) * 100;
    if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
      this.triggerAlert('critical', 'memory_usage', metric,
        `Critical memory usage: ${Math.round(memoryUsagePercent)}% for ${metric.endpoint}`);
    }
  }

  triggerAlert(severity, type, metric, message) {
    const alertKey = `${type}_${metric.endpoint}`;
    const now = Date.now();
    
    // Implement cooldown to prevent spam
    const lastAlert = this.alerts.get(alertKey);
    const cooldown = severity === 'critical' ? 60000 : 300000; // 1min for critical, 5min for warning
    
    if (lastAlert && now - lastAlert.timestamp < cooldown) {
      return;
    }

    const alert = {
      severity,
      type,
      message,
      metric,
      timestamp: now
    };

    this.alerts.set(alertKey, alert);

    // Log alert
    if (severity === 'critical') {
      winston.error('Performance Alert', alert);
    } else {
      winston.warn('Performance Alert', alert);
    }

    // Could integrate with external alerting systems here
    this.sendExternalAlert(alert);
  }

  sendExternalAlert(alert) {
    // Integration point for external alerting systems (Slack, email, etc.)
    // This could be enhanced to send to webhook endpoints, email services, etc.
    
    if (process.env.WEBHOOK_URL) {
      // Example webhook integration
      fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
          timestamp: alert.timestamp,
          details: {
            endpoint: alert.metric.endpoint,
            responseTime: alert.metric.responseTime,
            statusCode: alert.metric.statusCode,
            memoryUsage: alert.metric.memoryUsage.after
          }
        })
      }).catch(err => winston.error('Failed to send webhook alert:', err));
    }
  }

  logMetric(metric) {
    // Log slow requests and errors
    if (metric.responseTime > this.thresholds.responseTime.warning || metric.statusCode >= 400) {
      winston.info('API Performance Metric', {
        endpoint: metric.endpoint,
        responseTime: Math.round(metric.responseTime),
        statusCode: metric.statusCode,
        memoryDelta: Math.round(metric.memoryUsage.delta.heapUsed / 1024 / 1024), // MB
        timestamp: metric.timestamp
      });
    }
  }

  sanitizeBody(body) {
    // Remove sensitive fields from logging
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Generate performance reports every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);
  }

  collectSystemMetrics() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    const systemMetric = {
      timestamp: Date.now(),
      type: 'system',
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg()
      },
      memory: {
        usage: memoryUsage,
        system: {
          total: totalMemory,
          free: freeMemory,
          used: totalMemory - freeMemory,
          percentage: memoryUsagePercent
        }
      },
      uptime: process.uptime()
    };

    // Check system alerts
    if (cpuUsage > this.thresholds.cpuUsage.critical) {
      this.triggerAlert('critical', 'cpu_usage', systemMetric,
        `Critical CPU usage: ${Math.round(cpuUsage)}%`);
    } else if (cpuUsage > this.thresholds.cpuUsage.warning) {
      this.triggerAlert('warning', 'cpu_usage', systemMetric,
        `High CPU usage: ${Math.round(cpuUsage)}%`);
    }

    if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
      this.triggerAlert('critical', 'system_memory', systemMetric,
        `Critical system memory usage: ${Math.round(memoryUsagePercent)}%`);
    } else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
      this.triggerAlert('warning', 'system_memory', systemMetric,
        `High system memory usage: ${Math.round(memoryUsagePercent)}%`);
    }

    winston.debug('System metrics collected', systemMetric);
  }

  generatePerformanceReport() {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour in ms
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let slowRequests = 0;
    const endpointStats = new Map();

    // Analyze metrics from the last hour
    this.metrics.forEach((metrics, endpoint) => {
      const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo);
      if (recentMetrics.length === 0) return;

      const endpointErrors = recentMetrics.filter(m => m.statusCode >= 400).length;
      const endpointSlowRequests = recentMetrics.filter(m => m.responseTime > this.thresholds.responseTime.warning).length;
      const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;

      endpointStats.set(endpoint, {
        requests: recentMetrics.length,
        errors: endpointErrors,
        errorRate: (endpointErrors / recentMetrics.length) * 100,
        averageResponseTime: avgResponseTime,
        slowRequests: endpointSlowRequests,
        slowRequestRate: (endpointSlowRequests / recentMetrics.length) * 100
      });

      totalRequests += recentMetrics.length;
      totalErrors += endpointErrors;
      totalResponseTime += recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
      slowRequests += endpointSlowRequests;
    });

    const report = {
      timestamp: now,
      timeRange: { start: oneHourAgo, end: now },
      summary: {
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        slowRequests,
        slowRequestRate: totalRequests > 0 ? (slowRequests / totalRequests) * 100 : 0
      },
      endpoints: Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
        endpoint,
        ...stats
      })).sort((a, b) => b.requests - a.requests) // Sort by request count
    };

    // Log report if there are issues
    if (report.summary.errorRate > this.thresholds.errorRate.warning || 
        report.summary.slowRequestRate > 20) {
      winston.warn('Performance Report', report);
    } else {
      winston.info('Performance Report', {
        summary: report.summary,
        topEndpoints: report.endpoints.slice(0, 5)
      });
    }

    return report;
  }

  // API endpoints for retrieving metrics
  getMetricsEndpoint() {
    return (req, res) => {
      const timeRange = req.query.timeRange || '1h';
      const endpoint = req.query.endpoint;
      
      let startTime;
      switch (timeRange) {
        case '1h':
          startTime = Date.now() - 3600000;
          break;
        case '24h':
          startTime = Date.now() - 86400000;
          break;
        case '7d':
          startTime = Date.now() - 604800000;
          break;
        default:
          startTime = Date.now() - 3600000;
      }

      const filteredMetrics = new Map();
      
      this.metrics.forEach((metrics, key) => {
        if (endpoint && !key.includes(endpoint)) return;
        
        const filtered = metrics.filter(m => m.timestamp > startTime);
        if (filtered.length > 0) {
          filteredMetrics.set(key, filtered);
        }
      });

      res.json({
        timeRange,
        startTime,
        endTime: Date.now(),
        metrics: Object.fromEntries(filteredMetrics)
      });
    };
  }

  getReportEndpoint() {
    return (req, res) => {
      const report = this.generatePerformanceReport();
      res.json(report);
    };
  }

  getAlertsEndpoint() {
    return (req, res) => {
      const alerts = Array.from(this.alerts.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50); // Return last 50 alerts

      res.json(alerts);
    };
  }
}

module.exports = PerformanceMiddleware;