const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { getDatabase } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { logError, logAuditEvent } = require('../config/logger');
const { 
  ApiError, 
  ValidationError, 
  AuthenticationError,
  asyncHandler 
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password complexity validation
 */
function validatePasswordComplexity(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Sanitize user input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = 'user' } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    throw new ValidationError('All fields are required');
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Sanitize inputs
  const sanitizedEmail = validator.normalizeEmail(email);
  const sanitizedFirstName = sanitizeInput(firstName);
  const sanitizedLastName = sanitizeInput(lastName);

  // Validate password complexity
  const passwordValidation = validatePasswordComplexity(password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.message);
  }

  const db = getDatabase();

  // Check if user already exists
  const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [sanitizedEmail]);
  if (existingUserResult.rows.length > 0) {
    logAuditEvent('REGISTRATION_FAILED', null, { 
      email: sanitizedEmail, 
      reason: 'Email already exists' 
    });
    throw new ValidationError('Email already registered');
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Insert new user
  const insertUserQuery = `
    INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, email, first_name, last_name, role, created_at
  `;
  
  const newUserResult = await db.query(insertUserQuery, [
    sanitizedEmail, 
    passwordHash, 
    sanitizedFirstName, 
    sanitizedLastName, 
    role
  ]);
  
  const user = newUserResult.rows[0];

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  logAuditEvent('USER_REGISTERED', user.id, {
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at
    },
    token
  });
}));

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const sanitizedEmail = validator.normalizeEmail(email);
  const db = getDatabase();

  // Find user by email
  const userResult = await db.query('SELECT * FROM users WHERE email = $1', [sanitizedEmail]);
  
  if (userResult.rows.length === 0) {
    logAuditEvent('LOGIN_FAILED', null, { 
      email: sanitizedEmail, 
      reason: 'User not found' 
    });
    throw new AuthenticationError('Invalid credentials');
  }

  const user = userResult.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    logAuditEvent('LOGIN_FAILED', user.id, { 
      email: sanitizedEmail, 
      reason: 'Invalid password' 
    });
    throw new AuthenticationError('Invalid credentials');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  // Update last login
  await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  logAuditEvent('LOGIN_SUCCESS', user.id, {
    email: user.email
  });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    },
    token
  });
}));

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  logAuditEvent('USER_LOGOUT', req.user.userId, {
    email: req.user.email
  });

  res.json({
    message: 'Logout successful'
  });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const userResult = await db.query(
    'SELECT id, email, first_name, last_name, role, created_at, last_login FROM users WHERE id = $1',
    [req.user.userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User');
  }

  const user = userResult.rows[0];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const newToken = generateToken({
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role
  });

  logAuditEvent('TOKEN_REFRESHED', req.user.userId, {
    email: req.user.email
  });

  res.json({
    message: 'Token refreshed successfully',
    token: newToken
  });
}));

module.exports = router;
