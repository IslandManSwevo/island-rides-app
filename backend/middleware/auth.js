const jwt = require('jsonwebtoken');
const { logError, logAuditEvent } = require('../config/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logAuditEvent('AUTH_FAILED', null, {
      reason: 'No token provided',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(401).json({
      error: 'Access token required',
      code: 'TOKEN_MISSING',
      message: 'Authorization header with Bearer token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      let errorResponse = {
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        message: 'The provided token is invalid or has expired'
      };

      if (err.name === 'TokenExpiredError') {
        errorResponse.code = 'TOKEN_EXPIRED';
        errorResponse.message = 'Token has expired';
      }

      logAuditEvent('AUTH_FAILED', null, {
        reason: errorResponse.code,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        tokenError: err.message
      });

      return res.status(403).json(errorResponse);
    }

    req.user = user;
    logAuditEvent('AUTH_SUCCESS', user.userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    next();
  });
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      logAuditEvent('AUTHORIZATION_FAILED', req.user.userId, {
        requiredRoles: allowedRoles,
        userRole,
        endpoint: req.path,
        method: req.method
      });
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Required role: ${allowedRoles.join(' or ')}, current role: ${userRole}`
      });
    }

    logAuditEvent('AUTHORIZATION_SUCCESS', req.user.userId, {
      userRole,
      endpoint: req.path,
      method: req.method
    });
    next();
  };
};

// Additional utility functions
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'keylo-api',
    audience: 'keylo-app'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    ...defaultOptions,
    ...options
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getUserId = (req) => req.user?.userId || null;
const getUserRole = (req) => req.user?.role || null;
const isAdmin = (req) => req.user?.role === 'admin';
const isOwner = (req) => req.user?.role === 'owner' || req.user?.role === 'admin';
const isHost = (req) => ['host', 'owner', 'admin'].includes(req.user?.role);

module.exports = {
  authenticateToken,
  checkRole,
  generateToken,
  verifyToken,
  getUserId,
  getUserRole,
  isAdmin,
  isOwner,
  isHost
};