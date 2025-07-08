const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();
const db = require('./db');
const transfiService = require('./services/transfiService');
const pushNotificationService = require('./services/pushNotificationService');
const favoritesService = require('./services/favoritesService');
const priceMonitoringService = require('./services/priceMonitoringService');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3003;

const toCamel = (s) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toSnake = (s) => {
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

const isObject = function (obj) {
  return obj === Object(obj) && !Array.isArray(obj) && typeof obj !== 'function';
};

const keysToCamel = function (obj) {
  if (isObject(obj)) {
    const n = {};

    Object.keys(obj)
      .forEach((k) => {
        n[toCamel(k)] = keysToCamel(obj[k]);
      });

    return n;
  } else if (Array.isArray(obj)) {
    return obj.map((i) => {
      return keysToCamel(i);
    });
  }

  return obj;
};

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  'http://localhost:3000',
  'http://localhost:8081', 
  'http://localhost:8082',
  'http://localhost:19006'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all localhost origins, regardless of port
    if (/^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    originalJson.call(this, keysToCamel(body));
  };
  next();
});


const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'audit.log' })
  ]
});

function logError(context, error) {
  console.error(`${context}:`, error.message || 'Unknown error');
}

function logAuditEvent(eventType, userId, details = {}) {
  auditLogger.info({
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
}

function validatePasswordComplexity(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

function isAccountLocked(user) {
  if (!user.lockoutUntil) return false;
  return new Date() < new Date(user.lockoutUntil);
}

async function handleFailedLogin(user) {
  const newFailedLoginAttempts = (user.failed_login_attempts || 0) + 1;
  
  if (newFailedLoginAttempts >= 5) {
    const lockoutTime = new Date();
    lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
    await db.query(
      'UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3',
      [newFailedLoginAttempts, lockoutTime.toISOString(), user.id]
    );
    logAuditEvent('ACCOUNT_LOCKED', user.id, { 
      email: user.email, 
      failedAttempts: newFailedLoginAttempts 
    });
  } else {
    await db.query(
      'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
      [newFailedLoginAttempts, user.id]
    );
    logAuditEvent('LOGIN_FAILED', user.id, { 
      email: user.email, 
      failedAttempts: newFailedLoginAttempts 
    });
  }
}

async function handleSuccessfulLogin(user) {
  await db.query(
    'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1',
    [user.id]
  );
  logAuditEvent('LOGIN_SUCCESS', user.id, { email: user.email });
}


function calculateCollaborativeFilteringScore(userId, vehicleId) {
  const userBookings = bookings.filter(b => b.user_id === userId && b.status === 'completed');
  const userVehicleIds = [...new Set(userBookings.map(b => b.vehicle_id))];
  
  if (userVehicleIds.length === 0) {
    return 0;
  }
  
  const similarUsers = new Set();
  userVehicleIds.forEach(vId => {
    const usersWhoBookedThis = bookings
      .filter(b => b.vehicle_id === vId && b.user_id !== userId && b.status === 'completed')
      .map(b => b.user_id);
    usersWhoBookedThis.forEach(uId => similarUsers.add(uId));
  });
  
  if (similarUsers.size === 0) {
    return 0;
  }
  
  const similarUsersWhoBookedTarget = bookings.filter(b => 
    b.vehicle_id === vehicleId && 
    similarUsers.has(b.user_id) && 
    b.status === 'completed'
  ).length;
  
  return similarUsersWhoBookedTarget / similarUsers.size;
}

function calculateVehiclePopularityScore(vehicleId) {
  const vehicleBookings = bookings.filter(b => 
    b.vehicle_id === vehicleId && b.status === 'completed'
  ).length;
  
  const allVehicleBookingCounts = vehicles.map(v => 
    bookings.filter(b => b.vehicle_id === v.id && b.status === 'completed').length
  );
  const maxBookings = Math.max(...allVehicleBookingCounts, 1);
  
  return vehicleBookings / maxBookings;
}

function calculateVehicleRatingScore(vehicleId) {
  const vehicleReviews = reviews.filter(r => r.vehicle_id === vehicleId);
  
  if (vehicleReviews.length === 0) {
    return 0.6;
  }
  
  const avgRating = vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length;
  
  return (avgRating - 1) / 4;
}

function calculateHostPopularityScore(vehicleId) {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return 0;
  
  const hostVehicles = vehicles.filter(v => v.owner_id === vehicle.owner_id);
  const hostVehicleIds = hostVehicles.map(v => v.id);
  
  const hostReviews = reviews.filter(r => hostVehicleIds.includes(r.vehicle_id));
  
  if (hostReviews.length === 0) {
    return 0.6;
  }
  
  const avgHostRating = hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length;
  
  return (avgHostRating - 1) / 4;
}

function generateRecommendations(userId, island) {
  const islandVehicles = vehicles.filter(v => 
    v.location.toLowerCase() === island.toLowerCase() && v.available
  );
  
  const userBookedVehicleIds = new Set(
    bookings
      .filter(b => b.user_id === userId)
      .map(b => b.vehicle_id)
  );
  
  const candidateVehicles = islandVehicles.filter(v => 
    !userBookedVehicleIds.has(v.id)
  );
  
  const recommendations = candidateVehicles.map(vehicle => {
    const collaborativeScore = calculateCollaborativeFilteringScore(userId, vehicle.id);
    const popularityScore = calculateVehiclePopularityScore(vehicle.id);
    const ratingScore = calculateVehicleRatingScore(vehicle.id);
    const hostScore = calculateHostPopularityScore(vehicle.id);
    
    const weights = {
      collaborative: 0.4,
      popularity: 0.2,
      rating: 0.25,
      host: 0.15
    };
    
    const finalScore = (
      collaborativeScore * weights.collaborative +
      popularityScore * weights.popularity +
      ratingScore * weights.rating +
      hostScore * weights.host
    );
    
    return {
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        location: vehicle.location,
        daily_rate: vehicle.daily_rate,
        drive_side: vehicle.drive_side,
        available: vehicle.available,
        created_at: vehicle.created_at
      },
      recommendationScore: Math.round(finalScore * 100) / 100,
      scoreBreakdown: {
        collaborativeFiltering: Math.round(collaborativeScore * 100) / 100,
        vehiclePopularity: Math.round(popularityScore * 100) / 100,
        vehicleRating: Math.round(ratingScore * 100) / 100,
        hostPopularity: Math.round(hostScore * 100) / 100
      }
    };
  });
  
  return recommendations
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 5);
}

const authenticateToken = (req, res, next) => {
  console.log('🔍 Backend: Auth check for:', req.path);
  
  const authHeader = req.headers['authorization'];
  console.log('🔍 Backend: Auth header exists:', !!authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🔍 Backend: Token extracted:', !!token);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Backend: JWT verify failed:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    console.log('✅ Backend: Token valid for user:', user.id);
    req.user = user;
    next();
  });
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'customer' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sanitizedEmail = validator.escape(email.trim());
    const sanitizedFirstName = validator.escape(firstName.trim());
    const sanitizedLastName = validator.escape(lastName.trim());

    const existingUserResult = await db.query('SELECT * FROM users WHERE email = $1', [sanitizedEmail]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertUserQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role
    `;
    const newUserResult = await db.query(insertUserQuery, [sanitizedEmail, passwordHash, sanitizedFirstName, sanitizedLastName, role]);
    const user = newUserResult.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logAuditEvent('USER_REGISTRATION', user.id, { 
      email: user.email, 
      role: user.role 
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    logError('Registration error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      logAuditEvent('LOGIN_FAILED', null, { 
        email: email, 
        reason: 'User not found' 
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (isAccountLocked(user)) {
      logAuditEvent('LOGIN_BLOCKED', user.id, { 
        email: user.email, 
        reason: 'Account locked' 
      });
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await handleFailedLogin(user);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await handleSuccessfulLogin(user);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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
  } catch (error) {
    logError('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id != $1',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    logError('Get users error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/me/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const userResult = await db.query('SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Get user's bookings with vehicle details
    const bookingsResult = await db.query(`
      SELECT b.id, b.start_date, b.end_date, b.status, b.total_amount, b.created_at,
             v.id as vehicle_id, v.make, v.model, v.year, v.location
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);
    const userBookings = bookingsResult.rows.map(b => ({
      id: b.id,
      vehicle: {
        id: b.vehicle_id,
        make: b.make,
        model: b.model,
        year: b.year,
        location: b.location
      },
      startDate: b.start_date,
      endDate: b.end_date,
      status: b.status,
      totalAmount: b.total_amount,
      createdAt: b.created_at
    }));

    // Calculate user statistics
    const completedBookings = userBookings.filter(b => b.status === 'completed');
    const totalSpent = completedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);

    const profileData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        joinDate: user.created_at
      },
      bookings: userBookings,
      stats: {
        totalBookings: userBookings.length,
        completedTrips: completedBookings.length,
        totalSpent: totalSpent
      }
    };

    res.json(profileData);
  } catch (error) {
    logError('Get profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.participant_1_id, 
        c.participant_2_id, 
        c.created_at,
        p1.first_name as participant_1_name,
        p1.last_name as participant_1_lastname,
        p2.first_name as participant_2_name,
        p2.last_name as participant_2_lastname,
        lm.content as last_message,
        lm.created_at as last_message_time
      FROM conversations c
      JOIN users p1 ON c.participant_1_id = p1.id
      JOIN users p2 ON c.participant_2_id = p2.id
      LEFT JOIN (
        SELECT conversation_id, content, created_at,
               ROW_NUMBER() OVER(PARTITION BY conversation_id ORDER BY created_at DESC) as rn
        FROM messages
      ) lm ON c.id = lm.conversation_id AND lm.rn = 1
      WHERE c.participant_1_id = $1 OR c.participant_2_id = $1
      ORDER BY lm.created_at DESC NULLS LAST;
    `;
    const result = await db.query(query, [req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    logError('Get conversations error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.userId;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    const existingConversationResult = await db.query(
      `SELECT id FROM conversations 
       WHERE (participant_1_id = $1 AND participant_2_id = $2) OR (participant_1_id = $2 AND participant_2_id = $1)`,
      [userId, participantId]
    );

    if (existingConversationResult.rows.length > 0) {
      return res.json({ conversationId: existingConversationResult.rows[0].id });
    }

    const insertConversationQuery = `
      INSERT INTO conversations (participant_1_id, participant_2_id)
      VALUES ($1, $2)
      RETURNING id
    `;
    const newConversationResult = await db.query(insertConversationQuery, [userId, participantId]);
    const conversationId = newConversationResult.rows[0].id;

    res.status(201).json({ conversationId });
  } catch (error) {
    logError('Create conversation error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, req.user.userId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const messagesResult = await db.query(
      `SELECT m.id, m.content, m.message_type, m.created_at, m.sender_id, u.first_name, u.last_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    res.json(messagesResult.rows);
  } catch (error) {
    logError('Get messages error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user.userId;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ error: 'Booking ID, rating, and comment are required' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    if (typeof comment !== 'string' || comment.trim().length < 10 || comment.trim().length > 1000) {
      return res.status(400).json({ error: 'Comment must be between 10 and 1000 characters' });
    }

    const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult.rows[0];

    if (booking.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed bookings' });
    }

    const existingReviewResult = await db.query('SELECT id FROM reviews WHERE booking_id = $1', [bookingId]);
    if (existingReviewResult.rows.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    const insertReviewQuery = `
      INSERT INTO reviews (booking_id, user_id, vehicle_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, booking_id, user_id, vehicle_id, rating, comment, created_at
    `;
    const reviewResult = await db.query(insertReviewQuery, [bookingId, userId, booking.vehicle_id, rating, validator.escape(comment.trim())]);
    const newReview = reviewResult.rows[0];

    const vehicleResult = await db.query('SELECT id, make, model, year FROM vehicles WHERE id = $1', [newReview.vehicle_id]);
    const vehicle = vehicleResult.rows[0];

    const userResult = await db.query('SELECT id, first_name, last_name FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      message: 'Review submitted successfully',
      review: {
        id: newReview.id,
        booking_id: newReview.booking_id,
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        },
        rating: newReview.rating,
        comment: newReview.comment,
        reviewer: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name
        },
        created_at: newReview.created_at
      }
    });

  } catch (error) {
    logError('Submit review error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*,
        v.make,
        v.model,
        v.year
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC;
    `;
    const result = await db.query(query, [req.user.userId]);
    const userBookings = result.rows.map(b => ({
      ...b,
      vehicle: {
        make: b.make,
        model: b.model,
        year: b.year
      }
    }));
    res.json(userBookings);
  } catch (error) {
    logError('Get bookings error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    const userId = req.user.userId;

    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vehicle ID, start date, and end date are required' });
    }

    const vehicleIdNum = parseInt(vehicleId);
    if (isNaN(vehicleIdNum)) {
      return res.status(400).json({ error: 'Vehicle ID must be a valid number' });
    }

    const vehicleResult = await db.query('SELECT * FROM vehicles WHERE id = $1', [vehicleIdNum]);
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const vehicle = vehicleResult.rows[0];

    if (!vehicle.available) {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const conflictingBookingResult = await db.query(
      `SELECT id, start_date, end_date FROM bookings 
       WHERE vehicle_id = $1 AND status != 'cancelled' AND $2 < end_date AND $3 > start_date`,
      [vehicleIdNum, startDate, endDate]
    );

    if (conflictingBookingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Vehicle is not available for the selected dates due to existing booking',
        conflictingBooking: conflictingBookingResult.rows[0]
      });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = days * vehicle.daily_rate;

    const insertBookingQuery = `
      INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, status, total_amount)
      VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING id, user_id, vehicle_id, start_date, end_date, status, total_amount, created_at
    `;
    const newBookingResult = await db.query(insertBookingQuery, [userId, vehicleIdNum, startDate, endDate, totalAmount]);
    const newBooking = newBookingResult.rows[0];

    logAuditEvent('BOOKING_CREATED', userId, {
      bookingId: newBooking.id,
      vehicleId: vehicleIdNum,
      startDate,
      endDate,
      totalAmount
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: newBooking.id,
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          location: vehicle.location,
          daily_rate: vehicle.daily_rate
        },
        start_date: newBooking.start_date,
        end_date: newBooking.end_date,
        status: newBooking.status,
        total_amount: newBooking.total_amount,
        created_at: newBooking.created_at
      }
    });

  } catch (error) {
    logError('Create booking error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vehicles');
    res.json(result.rows);
  } catch (error) {
    console.error('Get vehicles error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/recommendations/:island', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const island = req.params.island;
    
    if (!island) {
      return res.status(400).json({ error: 'Island parameter is required' });
    }
    
    const validIslands = ['Nassau', 'Freeport', 'Exuma'];
    if (!validIslands.includes(island)) {
      return res.status(400).json({ 
        error: 'Invalid island. Valid options are: Nassau, Freeport, Exuma' 
      });
    }
    
    const recommendations = await generateRecommendations(userId, island);
    
    res.json({
      island,
      userId,
      recommendations,
      totalRecommendations: recommendations.length
    });
    
  } catch (error) {
    logError('Recommendations error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/owner/revenue-report', authenticateToken, checkRole(['owner']), async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const query = `
      SELECT 
        v.id,
        v.make,
        v.model,
        COALESCE(SUM(b.total_amount), 0) as total_earnings
      FROM vehicles v
      LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status = 'completed'
      WHERE v.owner_id = $1
      GROUP BY v.id, v.make, v.model
      ORDER BY total_earnings DESC;
    `;
    const result = await db.query(query, [ownerId]);

    const totalRevenue = result.rows.reduce((sum, v) => sum + parseFloat(v.total_earnings), 0);

    res.json({
      totalRevenue,
      revenueByVehicle: result.rows
    });

  } catch (error) {
    logError('Revenue report error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  res.json({
    message: 'Chat request received successfully',
    prompt,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Create payment intent
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const bookingResult = await db.query(
      `SELECT b.*, u.email as user_email, u.first_name as user_first_name, 
              u.last_name as user_last_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, req.user.userId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const paymentIntent = await transfiService.createPaymentIntent(booking);
    
    await db.query(
      'UPDATE bookings SET payment_intent_id = $1, payment_status = $2 WHERE id = $3',
      [paymentIntent.paymentIntentId, 'pending', bookingId]
    );
    
    res.json(paymentIntent);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// TransFi webhook handler
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-transfi-signature'];
    const payload = JSON.parse(req.body);
    
    if (!transfiService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    switch (payload.event_type) {
      case 'payment.completed':
        const { reference_id, payment_intent_id, amount, payment_method } = payload.data;
        const bookingId = reference_id.replace('booking-', '');
        
        await db.query(
          `UPDATE bookings 
           SET status = 'confirmed', 
               payment_status = 'completed',
               payment_method = $1,
               paid_at = NOW()
           WHERE id = $2`,
          [payment_method, bookingId]
        );
        
        console.log(`Payment completed for booking ${bookingId}`);
        break;
        
      case 'payment.failed':
        console.log('Payment failed:', payload.data);
        break;
        
      default:
        console.log('Unhandled webhook event:', payload.event_type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment methods
app.get('/api/payments/methods', authenticateToken, async (req, res) => {
  const methods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'credit-card',
      currencies: ['USD', 'BSD'],
      processingTime: 'Instant'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: 'building-columns',
      currencies: ['USD', 'BSD'],
      processingTime: '1-2 business days'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: 'bitcoin',
      currencies: ['USDC', 'USDT', 'BTC', 'ETH'],
      processingTime: '10-30 minutes'
    }
  ];
  
  res.json({ methods });
});

// Push Notification Endpoints
app.post('/api/notifications/register-token', authenticateToken, async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;
    await pushNotificationService.registerPushToken(req.user.userId, token, platform, deviceId);
    res.json({ success: true });
  } catch (error) {
    console.error('Token registration error:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

app.get('/api/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [req.user.userId]
    );
    
    const preferences = result.rows[0] || {
      pushEnabled: true,
      bookingConfirmations: true,
      bookingReminders: true,
      reviewRequests: true,
      priceAlerts: true,
      newMessages: true,
      promotional: false
    };
    
    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

app.put('/api/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    await db.query(
      `INSERT INTO notification_preferences (user_id, ${Object.keys(updates).join(', ')})
       VALUES ($1, ${Object.keys(updates).map((_, i) => `$${i + 2}`).join(', ')})
       ON CONFLICT (user_id) 
       DO UPDATE SET ${setClause}`,
      [req.user.userId, ...Object.values(updates)]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Favorites Endpoints
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { vehicleId, notes } = req.body;
    const result = await favoritesService.addFavorite(req.user.userId, vehicleId, notes);
    res.json(result);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

app.delete('/api/favorites/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const result = await favoritesService.removeFavorite(req.user.userId, req.params.vehicleId);
    res.json(result);
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const result = await favoritesService.getUserFavorites(req.user.userId, req.query);
    res.json(result);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

app.get('/api/favorites/check/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const isFavorited = await favoritesService.isFavorited(req.user.userId, req.params.vehicleId);
    res.json({ isFavorited });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

// Schedule notification tasks (add before server.listen)
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily notification tasks...');
  
  // Schedule booking reminders
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const bookings = await db.query(
    `SELECT b.*, v.make, v.model
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     WHERE b.start_date >= $1 AND b.start_date < $2
     AND b.status = 'confirmed'`,
    [tomorrow, dayAfter]
  );

  for (const booking of bookings.rows) {
    await pushNotificationService.sendBookingReminder(booking);
  }
});

// Schedule price monitoring - run every hour
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Running hourly price monitoring check...');
  try {
    await priceMonitoringService.checkPriceChanges();
  } catch (error) {
    console.error('❌ Price monitoring cron job failed:', error);
  }
});

// Price monitoring API endpoints
app.get('/api/admin/price-monitoring/status', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const status = priceMonitoringService.getStatus();
    const stats = await priceMonitoringService.getMonitoringStats();
    res.json({ status, stats });
  } catch (error) {
    console.error('Price monitoring status error:', error);
    res.status(500).json({ error: 'Failed to get price monitoring status' });
  }
});

app.post('/api/admin/price-monitoring/start', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { intervalMinutes = 60 } = req.body;
    priceMonitoringService.start(intervalMinutes);
    res.json({ message: 'Price monitoring started', interval: intervalMinutes });
  } catch (error) {
    console.error('Start price monitoring error:', error);
    res.status(500).json({ error: 'Failed to start price monitoring' });
  }
});

app.post('/api/admin/price-monitoring/stop', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    priceMonitoringService.stop();
    res.json({ message: 'Price monitoring stopped' });
  } catch (error) {
    console.error('Stop price monitoring error:', error);
    res.status(500).json({ error: 'Failed to stop price monitoring' });
  }
});

app.post('/api/admin/price-monitoring/force-check', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    await priceMonitoringService.forceCheck();
    res.json({ message: 'Price check completed' });
  } catch (error) {
    console.error('Force price check error:', error);
    res.status(500).json({ error: 'Failed to force price check' });
  }
});

// User price notification preferences
app.put('/api/favorites/:vehicleId/price-notifications', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await priceMonitoringService.updateUserPriceNotifications(
      req.user.userId, 
      req.params.vehicleId, 
      enabled
    );
    res.json(result);
  } catch (error) {
    console.error('Update price notifications error:', error);
    res.status(500).json({ error: 'Failed to update price notifications' });
  }
});

// Vehicle price history
app.get('/api/vehicles/:vehicleId/price-history', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const history = await priceMonitoringService.getVehiclePriceHistory(req.params.vehicleId, limit);
    const stats = await priceMonitoringService.getVehiclePriceStats(req.params.vehicleId);
    res.json({ history, stats });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Failed to get price history' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready on ws://localhost:${PORT}`);
    
    // Start price monitoring service
    const monitoringInterval = process.env.PRICE_MONITORING_INTERVAL_MINUTES || 60;
    priceMonitoringService.start(parseInt(monitoringInterval));
    console.log(`💰 Price monitoring started (interval: ${monitoringInterval} minutes)`);
  });
}

async function handleSendMessage(socket, user, message) {
  try {
    const { conversationId, content, messageType = 'text' } = message;

    if (!conversationId || !content) {
      socket.emit('error', { message: 'Conversation ID and content are required' });
      return;
    }

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, user.userId]
    );

    if (conversationResult.rows.length === 0) {
      socket.emit('error', { message: 'Access denied to this conversation' });
      return;
    }
    const conversation = conversationResult.rows[0];

    const insertMessageQuery = `
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, conversation_id, sender_id, content, message_type, created_at
    `;
    const savedMessageResult = await db.query(insertMessageQuery, [conversationId, user.userId, validator.escape(content.trim()), messageType]);
    const savedMessage = savedMessageResult.rows[0];

    const senderResult = await db.query('SELECT first_name, last_name FROM users WHERE id = $1', [user.userId]);
    const sender = senderResult.rows[0];

    const broadcastMessage = {
      _id: savedMessage.id,
      text: savedMessage.content,
      createdAt: savedMessage.created_at,
      user: {
        _id: user.userId,
        name: `${sender?.first_name || 'Unknown'} ${sender?.last_name || 'User'}`,
      },
    };

    const otherParticipantId = conversation.participant_1_id === user.userId
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    const otherConnection = activeConnections.get(otherParticipantId);
    if (otherConnection) {
      otherConnection.emit('new_message', keysToCamel(broadcastMessage));
    }

    console.log(`Message sent in conversation ${conversationId} from user ${user.userId}`);

  } catch (error) {
    logError('Error handling send message', error);
    socket.emit('error', { message: 'Message could not be delivered. Please verify the conversation and try again.' });
  }
}

async function handleJoinConversation(socket, user, message) {
  try {
    const { conversationId } = message;

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, user.userId]
    );

    if (conversationResult.rows.length === 0) {
      socket.emit('error', { message: 'Access denied to this conversation' });
      return;
    }

    socket.emit('conversation_joined', {
      conversationId: parseInt(conversationId),
      message: 'Successfully joined conversation'
    });

  } catch (error) {
    logError('Error handling join conversation', error);
    socket.emit('error', { message: 'Unable to join conversation. Please check the conversation ID and your permissions.' });
  }
}

async function handleTyping(socket, user, message) {
  try {
    const { conversationId, isTyping } = message;

    if (!conversationId) {
      return;
    }

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, user.userId]
    );

    if (conversationResult.rows.length === 0) {
      return;
    }
    const conversation = conversationResult.rows[0];

    const otherParticipantId = conversation.participant_1_id === user.userId 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const otherConnection = activeConnections.get(otherParticipantId);
    if (otherConnection) {
      otherConnection.emit('typing_indicator', {
        conversationId: parseInt(conversationId),
        userId: user.userId,
        isTyping
      });
    }

  } catch (error) {
    logError('Error handling typing indicator', error);
  }
}


module.exports = { app, server, io };
