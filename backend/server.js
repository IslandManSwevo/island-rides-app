const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
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

let users = [
  {
    id: 1,
    email: 'john@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'John',
    last_name: 'Doe',
    role: 'customer',
    failedLoginAttempts: 0,
    lockoutUntil: null
  },
  {
    id: 2,
    email: 'jane@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'owner',
    failedLoginAttempts: 0,
    lockoutUntil: null
  },
  {
    id: 3,
    email: 'mike@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'Mike',
    last_name: 'Johnson',
    role: 'customer',
    failedLoginAttempts: 0,
    lockoutUntil: null
  },
  {
    id: 4,
    email: 'sarah@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'Sarah',
    last_name: 'Wilson',
    role: 'owner',
    failedLoginAttempts: 0,
    lockoutUntil: null
  },
  {
    id: 5,
    email: 'alex@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'Alex',
    last_name: 'Brown',
    role: 'owner',
    failedLoginAttempts: 0,
    lockoutUntil: null
  }
];

let conversations = [];
let messages = [];
let vehicles = [
  {
    id: 1,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    owner_id: 2,
    location: 'Nassau',
    daily_rate: 75,
    available: true,
    drive_side: 'LHD',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    owner_id: 2,
    location: 'Freeport',
    daily_rate: 65,
    available: true,
    drive_side: 'RHD',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    make: 'BMW',
    model: 'X3',
    year: 2023,
    owner_id: 4,
    location: 'Nassau',
    daily_rate: 120,
    available: true,
    drive_side: 'LHD',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    make: 'Nissan',
    model: 'Altima',
    year: 2022,
    owner_id: 4,
    location: 'Nassau',
    daily_rate: 70,
    available: true,
    drive_side: 'RHD',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    make: 'Ford',
    model: 'Mustang',
    year: 2023,
    owner_id: 5,
    location: 'Freeport',
    daily_rate: 95,
    available: true,
    drive_side: 'LHD',
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    make: 'Jeep',
    model: 'Wrangler',
    year: 2022,
    owner_id: 5,
    location: 'Exuma',
    daily_rate: 85,
    available: true,
    drive_side: 'RHD',
    created_at: new Date().toISOString()
  }
];

let bookings = [
  {
    id: 1,
    user_id: 1,
    vehicle_id: 1,
    start_date: '2024-06-15',
    end_date: '2024-06-18',
    status: 'completed',
    total_amount: 225,
    created_at: '2024-06-10T10:00:00Z',
    updated_at: '2024-06-19T15:30:00Z'
  },
  {
    id: 2,
    user_id: 1,
    vehicle_id: 2,
    start_date: '2024-06-20',
    end_date: '2024-06-22',
    status: 'pending',
    total_amount: 130,
    created_at: '2024-06-18T14:00:00Z',
    updated_at: '2024-06-18T14:00:00Z'
  },
  {
    id: 3,
    user_id: 1,
    vehicle_id: 1,
    start_date: '2024-06-25',
    end_date: '2024-06-27',
    status: 'completed',
    total_amount: 150,
    created_at: '2024-06-20T09:00:00Z',
    updated_at: '2024-06-28T16:00:00Z'
  },
  {
    id: 4,
    user_id: 1,
    vehicle_id: 2,
    start_date: '2024-06-28',
    end_date: '2024-06-30',
    status: 'completed',
    total_amount: 195,
    created_at: '2024-06-25T11:00:00Z',
    updated_at: '2024-07-01T10:00:00Z'
  },
  {
    id: 5,
    user_id: 3,
    vehicle_id: 1,
    start_date: '2024-06-12',
    end_date: '2024-06-14',
    status: 'completed',
    total_amount: 150,
    created_at: '2024-06-08T09:00:00Z',
    updated_at: '2024-06-15T10:00:00Z'
  },
  {
    id: 6,
    user_id: 3,
    vehicle_id: 3,
    start_date: '2024-06-22',
    end_date: '2024-06-25',
    status: 'completed',
    total_amount: 360,
    created_at: '2024-06-18T11:00:00Z',
    updated_at: '2024-06-26T12:00:00Z'
  },
  {
    id: 7,
    user_id: 3,
    vehicle_id: 5,
    start_date: '2024-06-28',
    end_date: '2024-06-30',
    status: 'completed',
    total_amount: 190,
    created_at: '2024-06-25T14:00:00Z',
    updated_at: '2024-07-01T09:00:00Z'
  }
];

let reviews = [
  {
    id: 1,
    booking_id: 1,
    user_id: 1,
    vehicle_id: 1,
    rating: 5,
    comment: 'Excellent car! Very clean and comfortable. The owner was very responsive and helpful.',
    created_at: '2024-06-19T16:00:00Z',
    updated_at: '2024-06-19T16:00:00Z'
  },
  {
    id: 2,
    booking_id: 3,
    user_id: 1,
    vehicle_id: 1,
    rating: 4,
    comment: 'Great car again! Had a minor issue with the AC but overall good experience.',
    created_at: '2024-06-28T17:00:00Z',
    updated_at: '2024-06-28T17:00:00Z'
  },
  {
    id: 3,
    booking_id: 4,
    user_id: 1,
    vehicle_id: 2,
    rating: 4,
    comment: 'Good fuel efficiency and smooth ride. Perfect for city driving.',
    created_at: '2024-07-01T11:00:00Z',
    updated_at: '2024-07-01T11:00:00Z'
  },
  {
    id: 4,
    booking_id: 5,
    user_id: 3,
    vehicle_id: 1,
    rating: 5,
    comment: 'Amazing experience! The Toyota Camry was in perfect condition.',
    created_at: '2024-06-15T11:00:00Z',
    updated_at: '2024-06-15T11:00:00Z'
  },
  {
    id: 5,
    booking_id: 6,
    user_id: 3,
    vehicle_id: 3,
    rating: 5,
    comment: 'Luxury at its finest! The BMW X3 was incredible for our Nassau trip.',
    created_at: '2024-06-26T13:00:00Z',
    updated_at: '2024-06-26T13:00:00Z'
  },
  {
    id: 6,
    booking_id: 7,
    user_id: 3,
    vehicle_id: 5,
    rating: 3,
    comment: 'The Mustang was fun to drive but had some minor maintenance issues.',
    created_at: '2024-07-01T10:00:00Z',
    updated_at: '2024-07-01T10:00:00Z'
  }
];
let nextUserId = 6;
let nextConversationId = 1;
let nextMessageId = 1;
let nextVehicleId = 7;
let nextBookingId = 8;
let nextReviewId = 7;

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

function handleFailedLogin(user) {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  
  if (user.failedLoginAttempts >= 5) {
    const lockoutTime = new Date();
    lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
    user.lockoutUntil = lockoutTime.toISOString();
    logAuditEvent('ACCOUNT_LOCKED', user.id, { 
      email: user.email, 
      failedAttempts: user.failedLoginAttempts 
    });
  } else {
    logAuditEvent('LOGIN_FAILED', user.id, { 
      email: user.email, 
      failedAttempts: user.failedLoginAttempts 
    });
  }
}

function handleSuccessfulLogin(user) {
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  logAuditEvent('LOGIN_SUCCESS', user.id, { email: user.email });
}

console.log('Using in-memory database for development');

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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
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

    const existingUser = users.find(u => u.email === sanitizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = {
      id: nextUserId++,
      email: sanitizedEmail,
      password_hash: passwordHash,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
      role,
      failedLoginAttempts: 0,
      lockoutUntil: null
    };
    users.push(user);

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

    const user = users.find(u => u.email === email);
    if (!user) {
      logAuditEvent('LOGIN_FAILED', null, { 
        email: email, 
        reason: 'User not found' 
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
      handleFailedLogin(user);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    handleSuccessfulLogin(user);

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
    const otherUsers = users
      .filter(u => u.id !== req.user.userId)
      .map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role
      }));
    res.json(otherUsers);
  } catch (error) {
    logError('Get users error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userConversations = conversations
      .filter(c => c.participant_1_id === req.user.userId || c.participant_2_id === req.user.userId)
      .map(c => {
        const participant1 = users.find(u => u.id === c.participant_1_id);
        const participant2 = users.find(u => u.id === c.participant_2_id);
        const lastMessage = messages
          .filter(m => m.conversation_id === c.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        return {
          id: c.id,
          participant_1_id: c.participant_1_id,
          participant_2_id: c.participant_2_id,
          created_at: c.created_at,
          participant_1_name: participant1?.first_name,
          participant_1_lastname: participant1?.last_name,
          participant_2_name: participant2?.first_name,
          participant_2_lastname: participant2?.last_name,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at
        };
      })
      .sort((a, b) => {
        if (!a.last_message_time && !b.last_message_time) return 0;
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      });

    res.json(userConversations);
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

    const existingConversation = conversations.find(c =>
      (c.participant_1_id === userId && c.participant_2_id === participantId) ||
      (c.participant_1_id === participantId && c.participant_2_id === userId)
    );

    if (existingConversation) {
      return res.json({ conversationId: existingConversation.id });
    }

    const conversation = {
      id: nextConversationId++,
      participant_1_id: userId,
      participant_2_id: participantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    conversations.push(conversation);

    res.status(201).json({ conversationId: conversation.id });
  } catch (error) {
    logError('Create conversation error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50)); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === req.user.userId || c.participant_2_id === req.user.userId)
    );

    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const conversationMessages = messages
      .filter(m => m.conversation_id === parseInt(conversationId))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(offset, offset + limitNum)
      .map(m => {
        const sender = users.find(u => u.id === m.sender_id);
        return {
          id: m.id,
          content: m.content,
          message_type: m.message_type,
          created_at: m.created_at,
          sender_id: m.sender_id,
          first_name: sender?.first_name,
          last_name: sender?.last_name
        };
      });

    res.json(conversationMessages);// Reverse to show oldest first
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

    const booking = bookings.find(b => b.id === parseInt(bookingId));
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed bookings' });
    }

    const existingReview = reviews.find(r => r.booking_id === parseInt(bookingId));
    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    const vehicle = vehicles.find(v => v.id === booking.vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const review = {
      id: nextReviewId++,
      booking_id: parseInt(bookingId),
      user_id: userId,
      vehicle_id: booking.vehicle_id,
      rating: parseInt(rating),
      comment: validator.escape(comment.trim()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    reviews.push(review);

    const user = users.find(u => u.id === userId);
    res.status(201).json({
      message: 'Review submitted successfully',
      review: {
        id: review.id,
        booking_id: review.booking_id,
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        },
        rating: review.rating,
        comment: review.comment,
        reviewer: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name
        },
        created_at: review.created_at
      }
    });

  } catch (error) {
    logError('Submit review error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const userBookings = bookings
      .filter(b => b.user_id === req.user.userId)
      .map(b => {
        const vehicle = vehicles.find(v => v.id === b.vehicle_id);
        return {
          ...b,
          vehicle: vehicle ? {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year
          } : null
        };
      });
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

    const vehicle = vehicles.find(v => v.id === vehicleIdNum);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

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

    const conflictingBooking = bookings.find(booking => {
      if (booking.vehicle_id !== vehicleIdNum) return false;
      if (booking.status === 'cancelled') return false;
      
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      
      return start < bookingEnd && end > bookingStart;
    });

    if (conflictingBooking) {
      return res.status(409).json({ 
        error: 'Vehicle is not available for the selected dates due to existing booking',
        conflictingBooking: {
          id: conflictingBooking.id,
          start_date: conflictingBooking.start_date,
          end_date: conflictingBooking.end_date
        }
      });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalAmount = days * vehicle.daily_rate;

    const booking = {
      id: nextBookingId++,
      user_id: userId,
      vehicle_id: vehicleIdNum,
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    bookings.push(booking);

    logAuditEvent('BOOKING_CREATED', userId, {
      bookingId: booking.id,
      vehicleId: vehicleIdNum,
      startDate,
      endDate,
      totalAmount
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          location: vehicle.location,
          daily_rate: vehicle.daily_rate
        },
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
        total_amount: booking.total_amount,
        created_at: booking.created_at
      }
    });

  } catch (error) {
    logError('Create booking error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    res.json(vehicles);
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
    
    const recommendations = generateRecommendations(userId, island);
    
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

    const ownerVehicles = vehicles.filter(v => v.owner_id === ownerId);
    
    if (ownerVehicles.length === 0) {
      return res.json({
        totalRevenue: 0,
        revenueByVehicle: []
      });
    }

    const ownerVehicleIds = ownerVehicles.map(v => v.id);
    const completedBookings = bookings.filter(b => 
      b.status === 'completed' && ownerVehicleIds.includes(b.vehicle_id)
    );

    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.total_amount, 0);

    const revenueByVehicle = ownerVehicles.map(vehicle => {
      const vehicleBookings = completedBookings.filter(b => b.vehicle_id === vehicle.id);
      const totalEarnings = vehicleBookings.reduce((sum, booking) => sum + booking.total_amount, 0);

      return {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        totalEarnings
      };
    });

    res.json({
      totalRevenue,
      revenueByVehicle
    });

  } catch (error) {
    logError('Revenue report error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const WebSocket = require('ws');
const url = require('url');

const activeConnections = new Map();

const wss = new WebSocket.Server({
  port: process.env.WEBSOCKET_PORT || 3001,
  verifyClient: (info) => {
    try {
      const query = url.parse(info.req.url, true).query;
      const token = query.token;

      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token');
      return false;
    }
  }
});

wss.on('connection', (ws, req) => {
  const user = req.user;
  console.log(`User ${user.userId} connected to WebSocket`);

  activeConnections.set(user.userId, ws);

  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to messaging server',
    userId: user.userId
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message type:', message.type);

      switch (message.type) {
        case 'send_message':
          await handleSendMessage(ws, user, message);
          break;
        case 'join_conversation':
          await handleJoinConversation(ws, user, message);
          break;
        case 'typing':
          await handleTyping(ws, user, message);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      logError('Error processing WebSocket message', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unable to process your request. Please check your message format and try again.'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`User ${user.userId} disconnected from WebSocket`);
    activeConnections.delete(user.userId);
  });

  ws.on('error', (error) => {
    logError('WebSocket error', error);
    activeConnections.delete(user.userId);
  });
});

async function handleSendMessage(ws, user, message) {
  try {
    const { conversationId, content, messageType = 'text' } = message;

    if (!conversationId || !content) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Conversation ID and content are required'
      }));
      return;
    }

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === user.userId || c.participant_2_id === user.userId)
    );

    if (!conversation) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Access denied to this conversation'
      }));
      return;
    }

    const savedMessage = {
      id: nextMessageId++,
      conversation_id: parseInt(conversationId),
      sender_id: user.userId,
      content: validator.escape(content.trim()),
      message_type: messageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    messages.push(savedMessage);

    const sender = users.find(u => u.id === user.userId);

    const broadcastMessage = {
      type: 'new_message',
      id: savedMessage.id,
      conversationId: parseInt(conversationId),
      senderId: user.userId,
      senderName: `${sender?.first_name || 'Unknown'} ${sender?.last_name || 'User'}`,
      content: savedMessage.content,
      messageType,
      timestamp: savedMessage.created_at
    };

    ws.send(JSON.stringify({
      ...broadcastMessage,
      type: 'message_sent'
    }));

    const otherParticipantId = conversation.participant_1_id === user.userId 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const otherConnection = activeConnections.get(otherParticipantId);
    if (otherConnection && otherConnection.readyState === WebSocket.OPEN) {
      otherConnection.send(JSON.stringify(broadcastMessage));
    }

    console.log(`Message sent in conversation ${conversationId} from user ${user.userId}`);

  } catch (error) {
    logError('Error handling send message', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message could not be delivered. Please verify the conversation and try again.'
    }));
  }
}

async function handleJoinConversation(ws, user, message) {
  try {
    const { conversationId } = message;

    if (!conversationId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Conversation ID is required'
      }));
      return;
    }

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === user.userId || c.participant_2_id === user.userId)
    );

    if (!conversation) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Access denied to this conversation'
      }));
      return;
    }

    ws.send(JSON.stringify({
      type: 'conversation_joined',
      conversationId: parseInt(conversationId),
      message: 'Successfully joined conversation'
    }));

  } catch (error) {
    logError('Error handling join conversation', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Unable to join conversation. Please check the conversation ID and your permissions.'
    }));
  }
}

async function handleTyping(ws, user, message) {
  try {
    const { conversationId, isTyping } = message;

    if (!conversationId) {
      return;
    }

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === user.userId || c.participant_2_id === user.userId)
    );

    if (!conversation) {
      return;
    }

    const otherParticipantId = conversation.participant_1_id === user.userId 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const otherConnection = activeConnections.get(otherParticipantId);
    if (otherConnection && otherConnection.readyState === WebSocket.OPEN) {
      otherConnection.send(JSON.stringify({
        type: 'typing_indicator',
        conversationId: parseInt(conversationId),
        userId: user.userId,
        isTyping
      }));
    }

  } catch (error) {
    logError('Error handling typing indicator', error);
  }
}

console.log(`WebSocket server running on port ${process.env.WEBSOCKET_PORT || 3001}`);

module.exports = { app, users, conversations, messages, vehicles, bookings, reviews, server, wss };
