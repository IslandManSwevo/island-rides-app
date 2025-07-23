const winston = require('winston');
const path = require('path');

/**
 * Centralized logging configuration
 * Provides structured logging for the application
 */

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

/**
 * Main application logger
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'keylo-api' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Audit logger for security events
 */
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'keylo-audit' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  ]
});

/**
 * Performance logger for monitoring
 */
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'keylo-performance' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

/**
 * Log error with context
 */
function logError(context, error, additionalData = {}) {
  const errorData = {
    context,
    message: error.message || 'Unknown error',
    stack: error.stack,
    ...additionalData
  };
  
  logger.error('Application Error', errorData);
  console.error(`${context}:`, error.message || 'Unknown error');
}

/**
 * Log audit event
 */
function logAuditEvent(eventType, userId, details = {}) {
  const auditData = {
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  auditLogger.info('Audit Event', auditData);
}

/**
 * Log performance metrics
 */
function logPerformance(operation, duration, additionalData = {}) {
  const performanceData = {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  performanceLogger.info('Performance Metric', performanceData);
}

/**
 * Express middleware for request logging
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.userId || null
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
}

module.exports = {
  logger,
  auditLogger,
  performanceLogger,
  logError,
  logAuditEvent,
  logPerformance,
  requestLogger
};
