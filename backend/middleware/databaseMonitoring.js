const winston = require('winston');
const sqlite3 = require('sqlite3').verbose();

class DatabaseMonitoringService {
  constructor() {
    this.queryMetrics = new Map();
    this.slowQueries = [];
    this.connectionPool = new Map();
    this.thresholds = {
      slowQuery: 100,      // ms
      verySlowQuery: 500,  // ms
      longRunningQuery: 5000, // ms
      maxConnections: 10,
      memoryUsage: 100     // MB
    };
    
    this.startMonitoring();
  }

  // Wrap database connection to monitor queries
  wrapDatabase(db) {
    const originalPrepare = db.prepare.bind(db);
    const originalRun = db.run.bind(db);
    const originalGet = db.get.bind(db);
    const originalAll = db.all.bind(db);
    const originalEach = db.each.bind(db);

    // Wrap prepare method
    db.prepare = (sql) => {
      const stmt = originalPrepare(sql);
      return this.wrapStatement(stmt, sql);
    };

    // Wrap direct query methods
    db.run = (...args) => this.monitorQuery('run', sql, args, () => originalRun(...args));
    db.get = (...args) => this.monitorQuery('get', sql, args, () => originalGet(...args));
    db.all = (...args) => this.monitorQuery('all', sql, args, () => originalAll(...args));
    db.each = (...args) => this.monitorQuery('each', sql, args, () => originalEach(...args));

    return db;
  }

  wrapStatement(stmt, sql) {
    const originalRun = stmt.run.bind(stmt);
    const originalGet = stmt.get.bind(stmt);
    const originalAll = stmt.all.bind(stmt);
    const originalEach = stmt.each.bind(stmt);

    stmt.run = (...args) => this.monitorQuery('run', sql, args, () => originalRun(...args));
    stmt.get = (...args) => this.monitorQuery('get', sql, args, () => originalGet(...args));
    stmt.all = (...args) => this.monitorQuery('all', sql, args, () => originalAll(...args));
    stmt.each = (...args) => this.monitorQuery('each', sql, args, () => originalEach(...args));

    return stmt;
  }

  monitorQuery(method, sql, args, executor) {
    const queryId = this.generateQueryId();
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    
    // Extract callback from args if present
    let callback;
    let params = args;
    
    if (args.length > 0 && typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      params = args.slice(0, -1);
    }

    const queryMetric = {
      id: queryId,
      method,
      sql: this.sanitizeSql(sql),
      params: this.sanitizeParams(params),
      startTime: Date.now(),
      startMemory
    };

    // Store active query for long-running query detection
    this.connectionPool.set(queryId, queryMetric);

    const wrappedCallback = (err, result) => {
      this.captureQueryCompletion(queryId, startTime, startMemory, err, result);
      if (callback) callback(err, result);
    };

    try {
      if (callback) {
        // For async queries
        const newArgs = [...params, wrappedCallback];
        return executor.apply(null, newArgs);
      } else {
        // For sync queries
        const result = executor.apply(null, params);
        this.captureQueryCompletion(queryId, startTime, startMemory, null, result);
        return result;
      }
    } catch (error) {
      this.captureQueryCompletion(queryId, startTime, startMemory, error, null);
      throw error;
    }
  }

  captureQueryCompletion(queryId, startTime, startMemory, error, result) {
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const endMemory = process.memoryUsage();
    
    const activeQuery = this.connectionPool.get(queryId);
    if (!activeQuery) return;

    const queryMetric = {
      ...activeQuery,
      endTime: Date.now(),
      executionTime,
      memoryUsage: {
        before: startMemory,
        after: endMemory,
        delta: endMemory.heapUsed - startMemory.heapUsed
      },
      success: !error,
      error: error ? {
        message: error.message,
        code: error.code,
        errno: error.errno
      } : null,
      resultCount: this.getResultCount(result),
      resultSize: this.getResultSize(result)
    };

    // Remove from active connections
    this.connectionPool.delete(queryId);

    // Store metric
    this.storeQueryMetric(queryMetric);

    // Check for performance issues
    this.analyzeQueryPerformance(queryMetric);

    // Log significant queries
    this.logQuery(queryMetric);
  }

  storeQueryMetric(metric) {
    const sqlHash = this.hashQuery(metric.sql);
    if (!this.queryMetrics.has(sqlHash)) {
      this.queryMetrics.set(sqlHash, []);
    }

    const queryMetrics = this.queryMetrics.get(sqlHash);
    queryMetrics.push(metric);

    // Keep only last 50 executions per query pattern
    if (queryMetrics.length > 50) {
      queryMetrics.shift();
    }

    // Store slow queries separately
    if (metric.executionTime > this.thresholds.slowQuery) {
      this.slowQueries.push(metric);
      
      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }
    }
  }

  analyzeQueryPerformance(metric) {
    // Very slow query alert
    if (metric.executionTime > this.thresholds.verySlowQuery) {
      winston.error('Very slow database query detected', {
        executionTime: Math.round(metric.executionTime),
        sql: metric.sql,
        params: metric.params,
        method: metric.method,
        memoryDelta: Math.round(metric.memoryUsage.delta / 1024 / 1024), // MB
        resultCount: metric.resultCount
      });
    } else if (metric.executionTime > this.thresholds.slowQuery) {
      winston.warn('Slow database query detected', {
        executionTime: Math.round(metric.executionTime),
        sql: metric.sql,
        method: metric.method
      });
    }

    // Error analysis
    if (metric.error) {
      winston.error('Database query error', {
        sql: metric.sql,
        error: metric.error,
        params: metric.params,
        executionTime: Math.round(metric.executionTime)
      });
    }

    // High memory usage
    if (metric.memoryUsage.delta > this.thresholds.memoryUsage * 1024 * 1024) {
      winston.warn('High memory usage query', {
        sql: metric.sql,
        memoryDelta: Math.round(metric.memoryUsage.delta / 1024 / 1024), // MB
        resultCount: metric.resultCount,
        executionTime: Math.round(metric.executionTime)
      });
    }
  }

  logQuery(metric) {
    // Log all slow queries and errors
    if (metric.executionTime > this.thresholds.slowQuery || metric.error) {
      const logLevel = metric.error ? 'error' : 'warn';
      winston[logLevel]('Database Query Metric', {
        id: metric.id,
        method: metric.method,
        sql: metric.sql,
        executionTime: Math.round(metric.executionTime),
        success: metric.success,
        error: metric.error,
        resultCount: metric.resultCount,
        memoryDelta: Math.round(metric.memoryUsage.delta / 1024), // KB
        timestamp: metric.endTime
      });
    }
  }

  startMonitoring() {
    // Check for long-running queries every 10 seconds
    setInterval(() => {
      this.checkLongRunningQueries();
    }, 10000);

    // Generate database performance report every 5 minutes
    setInterval(() => {
      this.generateDatabaseReport();
    }, 300000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 3600000);
  }

  checkLongRunningQueries() {
    const now = Date.now();
    const longRunningQueries = [];

    this.connectionPool.forEach((query, queryId) => {
      const runningTime = now - query.startTime;
      if (runningTime > this.thresholds.longRunningQuery) {
        longRunningQueries.push({
          ...query,
          runningTime
        });
      }
    });

    if (longRunningQueries.length > 0) {
      winston.warn('Long-running queries detected', {
        count: longRunningQueries.length,
        queries: longRunningQueries.map(q => ({
          id: q.id,
          sql: q.sql,
          runningTime: Math.round(q.runningTime),
          method: q.method
        }))
      });
    }
  }

  generateDatabaseReport() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    let totalQueries = 0;
    let totalErrors = 0;
    let totalExecutionTime = 0;
    let slowQueryCount = 0;
    const queryTypeStats = new Map();
    const slowestQueries = [];

    // Analyze metrics from the last hour
    this.queryMetrics.forEach((metrics) => {
      const recentMetrics = metrics.filter(m => m.endTime > oneHourAgo);
      
      recentMetrics.forEach(metric => {
        totalQueries++;
        totalExecutionTime += metric.executionTime;
        
        if (metric.error) totalErrors++;
        if (metric.executionTime > this.thresholds.slowQuery) slowQueryCount++;

        // Track by query type
        const method = metric.method;
        if (!queryTypeStats.has(method)) {
          queryTypeStats.set(method, { count: 0, totalTime: 0, errors: 0 });
        }
        const stats = queryTypeStats.get(method);
        stats.count++;
        stats.totalTime += metric.executionTime;
        if (metric.error) stats.errors++;

        // Track slowest queries
        if (metric.executionTime > 50) {
          slowestQueries.push({
            sql: metric.sql,
            executionTime: metric.executionTime,
            method: metric.method,
            timestamp: metric.endTime,
            error: metric.error
          });
        }
      });
    });

    // Sort slowest queries
    slowestQueries.sort((a, b) => b.executionTime - a.executionTime);

    const report = {
      timestamp: now,
      timeRange: { start: oneHourAgo, end: now },
      summary: {
        totalQueries,
        totalErrors,
        errorRate: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0,
        averageExecutionTime: totalQueries > 0 ? totalExecutionTime / totalQueries : 0,
        slowQueryCount,
        slowQueryRate: totalQueries > 0 ? (slowQueryCount / totalQueries) * 100 : 0,
        activeConnections: this.connectionPool.size
      },
      queryTypes: Array.from(queryTypeStats.entries()).map(([method, stats]) => ({
        method,
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
        errors: stats.errors,
        errorRate: (stats.errors / stats.count) * 100
      })),
      slowestQueries: slowestQueries.slice(0, 10) // Top 10 slowest queries
    };

    // Log report if there are performance issues
    if (report.summary.errorRate > 5 || 
        report.summary.slowQueryRate > 10 ||
        report.summary.averageExecutionTime > 50) {
      winston.warn('Database Performance Report', report);
    } else {
      winston.info('Database Performance Summary', {
        summary: report.summary,
        topSlowQueries: report.slowestQueries.slice(0, 3)
      });
    }

    return report;
  }

  cleanupMetrics() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Clean up old query metrics
    this.queryMetrics.forEach((metrics, sqlHash) => {
      const recentMetrics = metrics.filter(m => m.endTime > oneWeekAgo);
      if (recentMetrics.length > 0) {
        this.queryMetrics.set(sqlHash, recentMetrics);
      } else {
        this.queryMetrics.delete(sqlHash);
      }
    });

    // Clean up old slow queries
    this.slowQueries = this.slowQueries.filter(q => q.endTime > oneWeekAgo);

    winston.debug('Database monitoring metrics cleaned up');
  }

  // Utility methods
  sanitizeSql(sql) {
    // Remove potential sensitive data from SQL for logging
    return sql.replace(/('.*?'|".*?"|\d+)/g, '?').trim();
  }

  sanitizeParams(params) {
    if (!params || params.length === 0) return [];
    return params.map((param, index) => {
      if (typeof param === 'string' && param.length > 100) {
        return `[String(${param.length})]`;
      }
      return typeof param;
    });
  }

  hashQuery(sql) {
    // Simple hash function for grouping similar queries
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  generateQueryId() {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getResultCount(result) {
    if (Array.isArray(result)) return result.length;
    if (result && typeof result === 'object') return 1;
    return 0;
  }

  getResultSize(result) {
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }

  // API endpoints for monitoring data
  getMetricsEndpoint() {
    return (req, res) => {
      const sqlPattern = req.query.sql;
      const timeRange = req.query.timeRange || '1h';
      
      let startTime;
      switch (timeRange) {
        case '1h':
          startTime = Date.now() - 3600000;
          break;
        case '24h':
          startTime = Date.now() - 86400000;
          break;
        default:
          startTime = Date.now() - 3600000;
      }

      const filteredMetrics = new Map();
      
      this.queryMetrics.forEach((metrics, sqlHash) => {
        const filtered = metrics.filter(m => m.endTime > startTime);
        if (filtered.length > 0) {
          if (!sqlPattern || filtered[0].sql.includes(sqlPattern)) {
            filteredMetrics.set(sqlHash, filtered);
          }
        }
      });

      res.json({
        timeRange,
        startTime,
        endTime: Date.now(),
        metrics: Object.fromEntries(filteredMetrics),
        slowQueries: this.slowQueries.filter(q => q.endTime > startTime)
      });
    };
  }

  getReportEndpoint() {
    return (req, res) => {
      const report = this.generateDatabaseReport();
      res.json(report);
    };
  }

  getSlowQueriesEndpoint() {
    return (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const slowQueries = this.slowQueries
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, limit);

      res.json({
        slowQueries,
        totalCount: this.slowQueries.length,
        threshold: this.thresholds.slowQuery
      });
    };
  }
}

module.exports = DatabaseMonitoringService;