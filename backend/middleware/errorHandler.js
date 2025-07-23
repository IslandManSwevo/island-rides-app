const { logError } = require('../config/logger');

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
 * Format error response
 */
function formatErrorResponse(error, req) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add additional details in development
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error.details || {};
  }

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
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
  formatErrorResponse
};
