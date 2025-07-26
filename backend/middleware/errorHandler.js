const { logError } = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Global Error Handling Middleware
 * Provides consistent error responses and logging
 */

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Validation error class
 */
class ValidationError extends ApiError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Database error class
 */
class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Format error response with standardized structure
 */
function formatErrorResponse(error, req) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      type: error.name || 'Error',
      statusCode: error.statusCode || 500
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.id || 'unknown',
      version: '1.0.0'
    }
  };

  // Add additional details in development
  if (isDevelopment) {
    response.debug = {
      stack: error.stack,
      details: error.details || {},
      headers: req.headers,
      query: req.query,
      params: req.params
    };
  }

  // Add validation details if available
  if (error.details && error.details.details) {
    response.error.validation = error.details.details;
  }

  return response;
}

/**
 * Handle different types of errors
 */
function handleError(error, req, res, next) {
  let statusCode = 500;
  let errorResponse;

  // Handle known error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorResponse = formatErrorResponse(error, req);
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = formatErrorResponse(
      new ValidationError(error.message, error.details),
      req
    );
  } else if (error.name === 'CastError') {
    statusCode = 400;
    errorResponse = formatErrorResponse(
      new ValidationError('Invalid ID format'),
      req
    );
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorResponse = formatErrorResponse(
      new ApiError('Duplicate entry', 409, 'DUPLICATE_ENTRY'),
      req
    );
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = formatErrorResponse(
      new AuthenticationError('Invalid token'),
      req
    );
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = formatErrorResponse(
      new AuthenticationError('Token expired'),
      req
    );
  } else {
    // Unknown error
    errorResponse = formatErrorResponse(
      new ApiError('Internal server error'),
      req
    );
  }

  // Log error
  logError('API Error', error, {
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 errors
 */
function handleNotFound(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}

/**
 * Request ID middleware - adds unique ID to each request
 */
function addRequestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(new ValidationError('Validation failed', { details }));
    }
    next();
  };
}

/**
 * Rate limit error handler
 */
function handleRateLimit(req, res) {
  const error = new ApiError(
    'Too many requests, please try again later',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
  
  logError('Rate Limit Exceeded', error, {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  res.status(429).json(formatErrorResponse(error, req));
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  handleError,
  handleNotFound,
  asyncHandler,
  validateRequest,
  handleRateLimit,
  formatErrorResponse,
  addRequestId
};
