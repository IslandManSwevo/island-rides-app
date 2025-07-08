const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const helmet = require('helmet');
const winston = require('winston');
const net = require('net');
require('dotenv').config();
const db = require('./db');
const transfiService = require('./services/transfiService');
const pushNotificationService = require('./services/pushNotificationService');
const favoritesService = require('./services/favoritesService');
const priceMonitoringService = require('./services/priceMonitoringService');
const reviewModerationService = require('./services/reviewModerationService');
const ownerDashboardService = require('./services/ownerDashboardService');
const cron = require('node-cron');

const app = express();

// Smart Port Management System
class PortManager {
  constructor() {
    this.preferredPorts = [
      parseInt(process.env.PORT) || 3003,  // Primary preference
      3003, 3005, 3006, 3007, 3008,       // Backend range (skipping 3004 for WebSocket)
      8000, 8003, 8004, 8005, 8006        // Alternative range
    ];
    this.reservedPorts = new Set([
      3001, // MCP Server
      3002, // Gemini Bridge  
      3004, // WebSocket Server
      19006, 19001, // Expo ports
      8081, 8082    // Common React Native ports
    ]);
    this.maxRetries = 10;
    this.currentPort = null;
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, '127.0.0.1', () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
    });
  }

  async findAvailablePort() {
    console.log('🔍 Scanning for available ports...');
    
    // Remove reserved ports from preferred list
    const availablePorts = this.preferredPorts.filter(port => !this.reservedPorts.has(port));
    
    // Try preferred ports first
    for (const port of availablePorts) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        console.log(`✅ Found available preferred port: ${port}`);
        return port;
      } else {
        console.log(`⚠️ Port ${port} is busy`);
      }
    }
    
    // If all preferred ports are busy, find any available port in a safe range
    console.log('🔧 Trying fallback port range...');
    for (let port = 3010; port <= 3020; port++) {
      if (!this.reservedPorts.has(port)) {
        const isAvailable = await this.isPortAvailable(port);
        if (isAvailable) {
          console.log(`🆘 Using fallback port: ${port}`);
          return port;
        }
      }
    }
    
    throw new Error('❌ No available ports found in safe range (3003-3020)');
  }

  async startServerWithRetry(server) {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        const port = await this.findAvailablePort();
        
        return new Promise((resolve, reject) => {
          const serverInstance = server.listen(port, (err) => {
            if (err) {
              reject(err);
            } else {
              this.currentPort = port;
              process.env.CURRENT_SERVER_PORT = port.toString();
              
              console.log(`🚀 Server successfully started on port ${port}`);
              console.log(`📡 Socket.io ready on ws://localhost:${port}`);
              console.log(`🔗 API Health: http://localhost:${port}/api/health`);
              console.log(`📊 Port Status: http://localhost:${port}/api/port-status`);
              
              this.startAdditionalServices();
              this.updateRuntimeConfig(port);
              
              resolve({ port, server: serverInstance });
            }
          });
          
          serverInstance.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
              console.log(`❌ Port ${port} became busy during startup, retrying...`);
              reject(error);
            } else {
              reject(error);
            }
          });
        });
        
      } catch (error) {
        attempts++;
        console.log(`🔄 Attempt ${attempts}/${this.maxRetries} failed: ${error.message}`);
        
        if (attempts >= this.maxRetries) {
          throw new Error(`💥 Failed to start server after ${this.maxRetries} attempts`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 + (attempts * 500)));
      }
    }
  }

  startAdditionalServices() {
    try {
      // Start price monitoring service
      const monitoringInterval = process.env.PRICE_MONITORING_INTERVAL_MINUTES || 60;
      priceMonitoringService.start(parseInt(monitoringInterval));
      console.log(`💰 Price monitoring started (interval: ${monitoringInterval} minutes)`);
    } catch (error) {
      console.warn('⚠️ Failed to start price monitoring:', error.message);
    }
  }

  updateRuntimeConfig(port) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const configPath = path.join(__dirname, 'runtime-config.json');
      const runtimeConfig = {
        serverPort: port,
        websocketPort: process.env.WEBSOCKET_PORT || 3004,
        apiBaseUrl: `http://localhost:${port}`,
        websocketUrl: `ws://localhost:${process.env.WEBSOCKET_PORT || 3004}`,
        updatedAt: new Date().toISOString(),
        portStatus: this.getPortStatus()
      };
      
      fs.writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2));
      console.log(`📝 Runtime config updated: ${configPath}`);
      
    } catch (error) {
      console.warn('⚠️ Could not update runtime config:', error.message);
    }
  }

  getPortStatus() {
    return {
      currentPort: this.currentPort,
      preferredPorts: this.preferredPorts,
      reservedPorts: Array.from(this.reservedPorts),
      lastUpdated: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        webSocket: 3004,
        main: this.currentPort
      }
    };
  }

  async handlePortConflict() {
    console.log('🔧 Detecting port conflict, attempting to resolve...');
    try {
      const newPort = await this.findAvailablePort();
      console.log(`✅ Found alternative port: ${newPort}`);
      return newPort;
    } catch (error) {
      console.error('❌ Could not resolve port conflict:', error.message);
      throw error;
    }
  }
}

const portManager = new PortManager();

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

// Enhanced Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'island-rides-api',
    port: portManager.currentPort || process.env.CURRENT_SERVER_PORT,
    portStatus: portManager.getPortStatus()
  });
});

// Port status endpoint for debugging
app.get('/api/port-status', (req, res) => {
  res.status(200).json({
    ...portManager.getPortStatus(),
    serverInfo: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  });
});

// Port conflict resolution endpoint
app.post('/api/port-resolve', async (req, res) => {
  try {
    const newPort = await portManager.handlePortConflict();
    res.json({
      success: true,
      message: `Alternative port found: ${newPort}`,
      suggestedPort: newPort
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not resolve port conflict',
      error: error.message
    });
  }
});

// Basic root endpoint with enhanced info
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Island Rides API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: portManager.currentPort || process.env.CURRENT_SERVER_PORT,
    endpoints: {
      health: '/api/health',
      portStatus: '/api/port-status',
      documentation: 'https://github.com/your-repo/island-rides-app'
    }
  });
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
    
    console.log('✅ Backend: Token valid for user:', user.userId);
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

// Logout endpoint - mainly for client-side token clearing
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    logAuditEvent('USER_LOGOUT', userId, { 
      email: req.user.email,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    logError('Logout error', error);
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

// ========== PUBLIC PROFILE API ENDPOINTS ==========
const publicProfileService = require('./services/publicProfileService');

// Get public profile by user ID
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.userId || null; // Optional authentication
    
    const profile = await publicProfileService.getPublicProfile(userId, viewerId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found or private' });
    }
    
    res.json(profile);
  } catch (error) {
    logError('Get public profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user's public profile
app.put('/api/profiles/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    const result = await publicProfileService.updatePublicProfile(userId, profileData);
    res.json(result);
  } catch (error) {
    logError('Update public profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile photo
app.post('/api/profiles/me/photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }
    
    const result = await publicProfileService.uploadProfilePhoto(userId, photoUrl);
    res.json(result);
  } catch (error) {
    logError('Upload profile photo error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get verification status
app.get('/api/profiles/me/verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const verification = await publicProfileService.getVerificationStatus(userId);
    res.json(verification);
  } catch (error) {
    logError('Get verification status error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update verification status (admin or system use)
app.put('/api/profiles/:userId/verification', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { verificationType, isVerified, documentUrl } = req.body;
    
    if (!verificationType || typeof isVerified !== 'boolean') {
      return res.status(400).json({ error: 'Verification type and status are required' });
    }
    
    const result = await publicProfileService.updateVerification(userId, verificationType, isVerified, documentUrl);
    res.json(result);
  } catch (error) {
    logError('Update verification error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Award badge to user (admin use)
app.post('/api/profiles/:userId/badges', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { badgeType } = req.body;
    
    if (!badgeType) {
      return res.status(400).json({ error: 'Badge type is required' });
    }
    
    const result = await publicProfileService.awardBadge(userId, badgeType);
    res.json(result);
  } catch (error) {
    logError('Award badge error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search public profiles
app.get('/api/profiles/search', async (req, res) => {
  try {
    const { q: searchTerm, location, verificationLevel, hasBadges, languages, page = 1, limit = 10 } = req.query;
    
    const filters = {
      location,
      verificationLevel,
      hasBadges: hasBadges === 'true',
      languages
    };
    
    const result = await publicProfileService.searchPublicProfiles(
      searchTerm, 
      filters, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    logError('Search profiles error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ========== END PUBLIC PROFILE API ENDPOINTS ==========

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
    const { bookingId, rating, comment, photos = [] } = req.body;
    const userId = req.user.userId;

    if (!bookingId || !rating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify booking exists and belongs to user
    const bookingResult = await db.query(
      `SELECT b.*, v.id as vehicle_id FROM bookings b 
       JOIN vehicles v ON b.vehicle_id = v.id 
       WHERE b.id = $1 AND b.renter_id = $2 AND b.status = 'completed'`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Booking not found or not completed, or you are not authorized to review this booking' 
      });
    }

    const booking = bookingResult.rows[0];

    // Check if review already exists
    const existingReviewResult = await db.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND renter_id = $2',
      [bookingId, userId]
    );

    if (existingReviewResult.rows.length > 0) {
      return res.status(409).json({ error: 'Review already exists for this booking' });
    }

    // Insert review
    const reviewQuery = `
      INSERT INTO reviews (booking_id, renter_id, vehicle_id, rating, comment, moderation_status)
      VALUES ($1, $2, $3, $4, $5, 'approved')
      RETURNING id, created_at
    `;
    
    const reviewResult = await db.query(reviewQuery, [
      bookingId, 
      userId, 
      booking.vehicle_id, 
      rating, 
      comment || null
    ]);

    const review = reviewResult.rows[0];

    logAuditEvent('REVIEW_SUBMITTED', userId, {
      reviewId: review.id,
      bookingId,
      vehicleId: booking.vehicle_id,
      rating
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review: {
        id: review.id,
        bookingId,
        rating,
        comment,
        createdAt: review.created_at
      }
    });

  } catch (error) {
    logError('Submit review error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Fetching bookings for user ID:', req.user.userId);
    const query = `
      SELECT 
        b.id,
        b.start_date as "startDate",
        b.end_date as "endDate",
        b.status,
        b.total_amount as "totalAmount",
        b.created_at as "createdAt",
        v.id as vehicle_id,
        v.make,
        v.model,
        v.year,
        v.location,
        v.daily_rate as "dailyRate"
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.renter_id = $1
      ORDER BY b.created_at DESC;
    `;
    
    const result = await db.query(query, [req.user.userId]);
    const bookings = result.rows.map(b => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      totalAmount: b.totalAmount,
      createdAt: b.createdAt,
      vehicle: {
        id: b.vehicle_id,
        make: b.make,
        model: b.model,
        year: b.year,
        location: b.location,
        dailyRate: b.dailyRate
      }
    }));
    
    console.log('✅ Backend: Found', bookings.length, 'bookings for user');
    res.json(bookings);
  } catch (error) {
    logError('Get bookings error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get completed bookings without reviews (for review prompts)
app.get('/api/bookings/completed-without-reviews', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Auth check for: /api/bookings/completed-without-reviews');
    console.log('🔍 Backend: Auth header exists:', !!req.headers.authorization);
    console.log('🔍 Backend: Token extracted:', !!req.user);
    console.log('✅ Backend: Token valid for user:', req.user ? req.user.userId : null);

    const query = `
      SELECT 
        b.id,
        b.start_date as "startDate",
        b.end_date as "endDate",
        b.status,
        v.id as vehicle_id,
        v.make,
        v.model,
        v.year
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN reviews r ON b.id = r.booking_id
      WHERE b.renter_id = $1 
        AND b.status = 'completed'
        AND b.end_date < CURRENT_DATE
        AND r.id IS NULL
      ORDER BY b.end_date DESC
      LIMIT 10;
    `;
    
    const result = await db.query(query, [req.user.userId]);
    const bookings = result.rows.map(b => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      vehicle: {
        id: b.vehicle_id,
        make: b.make,
        model: b.model,
        year: b.year
      }
    }));
    
    res.json({ bookings });
  } catch (error) {
    logError('Get completed bookings without reviews error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific booking details
app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const query = `
      SELECT 
        b.id,
        b.start_date as "startDate",
        b.end_date as "endDate",
        b.status,
        v.id as vehicle_id,
        v.make,
        v.model,
        v.year
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = $1 AND b.renter_id = $2;
    `;
    
    const result = await db.query(query, [bookingId, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = result.rows[0];
    res.json({
      booking: {
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        vehicle: {
          id: booking.vehicle_id,
          make: booking.make,
          model: booking.model,
          year: booking.year
        }
      }
    });
  } catch (error) {
    logError('Get booking details error', error);
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
      INSERT INTO bookings (renter_id, vehicle_id, start_date, end_date, status, total_amount)
      VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING id, renter_id, vehicle_id, start_date, end_date, status, total_amount, created_at
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

// === OWNER DASHBOARD ENDPOINTS ===

// Get comprehensive dashboard overview
app.get('/api/owner/dashboard', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const timeframe = req.query.timeframe || '30';
    
    console.log(`🏠 Owner dashboard requested for user ${ownerId}, timeframe: ${timeframe} days`);
    
    const dashboardData = await ownerDashboardService.getDashboardOverview(ownerId, timeframe);
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logError('Owner dashboard error', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get detailed revenue analytics
app.get('/api/owner/analytics/revenue', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const timeframe = req.query.timeframe || '30';
    
    const revenueData = await ownerDashboardService.getRevenueAnalytics(ownerId, timeframe);
    
    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    logError('Revenue analytics error', error);
    res.status(500).json({ error: 'Failed to load revenue analytics' });
  }
});

// Get booking analytics
app.get('/api/owner/analytics/bookings', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const timeframe = req.query.timeframe || '30';
    
    const bookingData = await ownerDashboardService.getBookingAnalytics(ownerId, timeframe);
    
    res.json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    logError('Booking analytics error', error);
    res.status(500).json({ error: 'Failed to load booking analytics' });
  }
});

// Get vehicle performance metrics
app.get('/api/owner/vehicles/performance', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    
    const vehicleData = await ownerDashboardService.getVehiclePerformance(ownerId);
    
    res.json({
      success: true,
      data: vehicleData
    });
  } catch (error) {
    logError('Vehicle performance error', error);
    res.status(500).json({ error: 'Failed to load vehicle performance data' });
  }
});

// Get owner goals
app.get('/api/owner/goals', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    
    const goals = await ownerDashboardService.getOwnerGoals(ownerId);
    
    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    logError('Owner goals error', error);
    res.status(500).json({ error: 'Failed to load goals' });
  }
});

// Create new owner goal
app.post('/api/owner/goals', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const goalData = req.body;
    
    // Validate required fields
    if (!goalData.goal_type || !goalData.target_value || !goalData.target_period) {
      return res.status(400).json({ 
        error: 'Missing required fields: goal_type, target_value, target_period' 
      });
    }
    
    const goal = await ownerDashboardService.createOwnerGoal(ownerId, goalData);
    
    res.json({
      success: true,
      data: goal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    logError('Create goal error', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get financial reports
app.get('/api/owner/reports/financial', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Missing required parameters: start_date, end_date' 
      });
    }
    
    const financialData = await ownerDashboardService.getFinancialReports(ownerId, start_date, end_date);
    
    res.json({
      success: true,
      data: financialData
    });
  } catch (error) {
    logError('Financial reports error', error);
    res.status(500).json({ error: 'Failed to load financial reports' });
  }
});

// Add vehicle expense
app.post('/api/owner/vehicles/:vehicleId/expenses', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const vehicleId = parseInt(req.params.vehicleId);
    const expenseData = { ...req.body, vehicle_id: vehicleId };
    
    // Validate required fields
    if (!expenseData.expense_type || !expenseData.amount || !expenseData.expense_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: expense_type, amount, expense_date' 
      });
    }
    
    // Verify vehicle ownership
    const vehicleCheck = await db.query(
      'SELECT id FROM vehicles WHERE id = ? AND owner_id = ?',
      [vehicleId, ownerId]
    );
    
    if (vehicleCheck.length === 0) {
      return res.status(403).json({ error: 'Vehicle not found or access denied' });
    }
    
    const expense = await ownerDashboardService.addVehicleExpense(ownerId, expenseData);
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    logError('Add expense error', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Get vehicle expenses
app.get('/api/owner/vehicles/:vehicleId/expenses', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const vehicleId = parseInt(req.params.vehicleId);
    const { start_date, end_date, expense_type } = req.query;
    
    // Verify vehicle ownership
    const vehicleCheck = await db.query(
      'SELECT id FROM vehicles WHERE id = ? AND owner_id = ?',
      [vehicleId, ownerId]
    );
    
    if (vehicleCheck.length === 0) {
      return res.status(403).json({ error: 'Vehicle not found or access denied' });
    }
    
    let sql = `
      SELECT * FROM vehicle_expenses 
      WHERE vehicle_id = ? AND owner_id = ?
    `;
    const params = [vehicleId, ownerId];
    
    if (start_date) {
      sql += ' AND expense_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND expense_date <= ?';
      params.push(end_date);
    }
    
    if (expense_type) {
      sql += ' AND expense_type = ?';
      params.push(expense_type);
    }
    
    sql += ' ORDER BY expense_date DESC';
    
    const expenses = await db.query(sql, params);
    
    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    logError('Get expenses error', error);
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

// === END OWNER DASHBOARD ENDPOINTS ===

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
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    const bookingResult = await db.query(
      `SELECT b.*, u.email as user_email, u.first_name as user_first_name, 
              u.last_name as user_last_name
       FROM bookings b
       JOIN users u ON b.renter_id = u.id
       WHERE b.id = $1 AND b.renter_id = $2`,
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
        
        // Get booking details for notification
        const bookingResult = await db.query(
          `SELECT b.*, v.make, v.model, v.year, u.first_name, u.last_name
           FROM bookings b
           JOIN vehicles v ON b.vehicle_id = v.id
           JOIN users u ON b.renter_id = u.id
           WHERE b.id = $1`,
          [bookingId]
        );
        
        if (bookingResult.rows.length > 0) {
          const booking = keysToCamel(bookingResult.rows[0]);
          booking.vehicle = { make: booking.make, model: booking.model, year: booking.year };
          
          // Send booking confirmation notification
          try {
            await pushNotificationService.sendBookingConfirmation(booking);
            console.log(`✅ Booking confirmation notification sent for booking ${bookingId}`);
          } catch (notifError) {
            console.error(`❌ Failed to send booking confirmation notification for booking ${bookingId}:`, notifError);
          }
        }
        
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

// Review Moderation API Endpoints

// Get pending reviews for admin moderation
app.get('/api/admin/reviews/pending', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const pendingReviews = await reviewModerationService.getPendingReviews(parseInt(limit), offset);
    res.json({ reviews: pendingReviews, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to get pending reviews' });
  }
});

// Admin approve review
app.post('/api/admin/reviews/:reviewId/approve', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { notes } = req.body;
    const result = await reviewModerationService.approveReview(
      req.params.reviewId, 
      req.user.userId, 
      notes
    );
    res.json(result);
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

// Admin reject review
app.post('/api/admin/reviews/:reviewId/reject', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    const result = await reviewModerationService.rejectReview(
      req.params.reviewId, 
      req.user.userId, 
      reason, 
      notes
    );
    res.json(result);
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({ error: 'Failed to reject review' });
  }
});

// Report a review
app.post('/api/reviews/:reviewId/report', authenticateToken, async (req, res) => {
  try {
    const { reason, description } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }
    
    const validReasons = ['inappropriate', 'spam', 'fake', 'off-topic', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    const result = await reviewModerationService.reportReview(
      req.params.reviewId,
      req.user.userId,
      reason,
      description
    );
    res.json(result);
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
});

// Get moderation statistics
app.get('/api/admin/moderation/stats', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const stats = await reviewModerationService.getModerationStats();
    res.json(stats);
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({ error: 'Failed to get moderation statistics' });
  }
});

// ======== ADVANCED VEHICLE FEATURES ENDPOINTS ========

// Get vehicle features by vehicle ID
app.get('/api/vehicles/:vehicleId/features', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const query = `
      SELECT 
        vf.id,
        vf.name,
        vf.description,
        vf.icon_name,
        vf.is_premium,
        vf.additional_cost,
        vfa.is_included,
        vfa.additional_cost as vehicle_additional_cost,
        vfa.notes,
        vfc.id as category_id,
        vfc.name as category_name,
        vfc.display_name as category_display_name,
        vfc.description as category_description,
        vfc.icon_name as category_icon,
        vfc.sort_order as category_sort_order
      FROM vehicle_feature_assignments vfa
      JOIN vehicle_features vf ON vfa.feature_id = vf.id
      JOIN vehicle_feature_categories vfc ON vf.category_id = vfc.id
      WHERE vfa.vehicle_id = $1 AND vf.is_active = 1
      ORDER BY vfc.sort_order, vf.sort_order
    `;
    
    const result = await db.query(query, [vehicleId]);
    
    const features = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      iconName: row.icon_name,
      isPremium: Boolean(row.is_premium),
      additionalCost: row.vehicle_additional_cost || row.additional_cost || 0,
      isIncluded: Boolean(row.is_included),
      notes: row.notes,
      category: {
        id: row.category_id,
        name: row.category_name,
        displayName: row.category_display_name,
        description: row.category_description,
        iconName: row.category_icon,
        sortOrder: row.category_sort_order
      }
    }));
    
    res.json(features);
  } catch (error) {
    console.error('Get vehicle features error:', error);
    res.status(500).json({ error: 'Failed to get vehicle features' });
  }
});

// Get all available vehicle features and categories
app.get('/api/vehicles/features/categories', authenticateToken, async (req, res) => {
  try {
    const categoriesResult = await db.query(`
      SELECT id, name, display_name, description, icon_name, sort_order
      FROM vehicle_feature_categories
      WHERE is_active = 1
      ORDER BY sort_order
    `);
    
    const featuresResult = await db.query(`
      SELECT vf.*, vfc.name as category_name
      FROM vehicle_features vf
      JOIN vehicle_feature_categories vfc ON vf.category_id = vfc.id
      WHERE vf.is_active = 1 AND vfc.is_active = 1
      ORDER BY vfc.sort_order, vf.sort_order
    `);
    
    const categories = categoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      iconName: row.icon_name,
      sortOrder: row.sort_order
    }));
    
    const features = featuresResult.rows.map(row => ({
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      iconName: row.icon_name,
      isPremium: Boolean(row.is_premium),
      additionalCost: row.additional_cost || 0,
      isActive: Boolean(row.is_active),
      sortOrder: row.sort_order,
      categoryName: row.category_name
    }));
    
    res.json({ categories, features });
  } catch (error) {
    console.error('Get feature categories error:', error);
    res.status(500).json({ error: 'Failed to get feature categories' });
  }
});

// Get vehicle photos
app.get('/api/vehicles/:vehicleId/photos', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const result = await db.query(`
      SELECT id, photo_url, photo_type, is_primary, sort_order, caption, uploaded_at
      FROM vehicle_photos
      WHERE vehicle_id = $1
      ORDER BY is_primary DESC, sort_order ASC
    `, [vehicleId]);
    
    const photos = result.rows.map(row => ({
      id: row.id,
      photoUrl: row.photo_url,
      photoType: row.photo_type,
      isPrimary: Boolean(row.is_primary),
      sortOrder: row.sort_order,
      caption: row.caption,
      uploadedAt: row.uploaded_at
    }));
    
    res.json(photos);
  } catch (error) {
    console.error('Get vehicle photos error:', error);
    res.status(500).json({ error: 'Failed to get vehicle photos' });
  }
});

// Get vehicle amenities
app.get('/api/vehicles/:vehicleId/amenities', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const result = await db.query(`
      SELECT id, name, icon, is_available, additional_cost, description, created_at
      FROM vehicle_amenities
      WHERE vehicle_id = $1
      ORDER BY name
    `, [vehicleId]);
    
    const amenities = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      isAvailable: Boolean(row.is_available),
      additionalCost: row.additional_cost || 0,
      description: row.description,
      createdAt: row.created_at
    }));
    
    res.json(amenities);
  } catch (error) {
    console.error('Get vehicle amenities error:', error);
    res.status(500).json({ error: 'Failed to get vehicle amenities' });
  }
});

// Get vehicle maintenance records
app.get('/api/vehicles/:vehicleId/maintenance', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Verify ownership or admin role
    if (req.user.role !== 'admin') {
      const ownershipResult = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1',
        [vehicleId]
      );
      
      if (ownershipResult.rows.length === 0 || ownershipResult.rows[0].owner_id !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const result = await db.query(`
      SELECT id, maintenance_type, description, cost, performed_by, 
             performed_at, next_due_date, mileage_at_service, notes, receipts, created_at
      FROM vehicle_maintenance
      WHERE vehicle_id = $1
      ORDER BY performed_at DESC
    `, [vehicleId]);
    
    const maintenance = result.rows.map(row => ({
      id: row.id,
      maintenanceType: row.maintenance_type,
      description: row.description,
      cost: row.cost,
      performedBy: row.performed_by,
      performedAt: row.performed_at,
      nextDueDate: row.next_due_date,
      mileageAtService: row.mileage_at_service,
      notes: row.notes,
      receipts: row.receipts ? JSON.parse(row.receipts) : [],
      createdAt: row.created_at
    }));
    
    res.json(maintenance);
  } catch (error) {
    console.error('Get vehicle maintenance error:', error);
    res.status(500).json({ error: 'Failed to get vehicle maintenance records' });
  }
});

// Add maintenance record
app.post('/api/vehicles/:vehicleId/maintenance', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { maintenanceType, description, cost, performedBy, performedAt, nextDueDate, mileageAtService, notes, receipts } = req.body;
    
    // Verify ownership or admin role
    if (req.user.role !== 'admin') {
      const ownershipResult = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1',
        [vehicleId]
      );
      
      if (ownershipResult.rows.length === 0 || ownershipResult.rows[0].owner_id !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const result = await db.query(`
      INSERT INTO vehicle_maintenance 
      (vehicle_id, maintenance_type, description, cost, performed_by, performed_at, 
       next_due_date, mileage_at_service, notes, receipts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [vehicleId, maintenanceType, description, cost, performedBy, performedAt, 
        nextDueDate, mileageAtService, notes, receipts ? JSON.stringify(receipts) : null]);
    
    const maintenance = result.rows[0];
    
    // Update vehicle's last maintenance date
    await db.query(
      'UPDATE vehicles SET last_maintenance_date = $1, next_maintenance_date = $2 WHERE id = $3',
      [performedAt, nextDueDate, vehicleId]
    );
    
    res.json({
      id: maintenance.id,
      maintenanceType: maintenance.maintenance_type,
      description: maintenance.description,
      cost: maintenance.cost,
      performedBy: maintenance.performed_by,
      performedAt: maintenance.performed_at,
      nextDueDate: maintenance.next_due_date,
      mileageAtService: maintenance.mileage_at_service,
      notes: maintenance.notes,
      receipts: maintenance.receipts ? JSON.parse(maintenance.receipts) : [],
      createdAt: maintenance.created_at
    });
  } catch (error) {
    console.error('Add maintenance record error:', error);
    res.status(500).json({ error: 'Failed to add maintenance record' });
  }
});

// Get vehicle damage reports
app.get('/api/vehicles/:vehicleId/damage-reports', authenticateToken, checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Verify ownership or admin role
    if (req.user.role !== 'admin') {
      const ownershipResult = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1',
        [vehicleId]
      );
      
      if (ownershipResult.rows.length === 0 || ownershipResult.rows[0].owner_id !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const result = await db.query(`
      SELECT vdr.*, u.first_name, u.last_name
      FROM vehicle_damage_reports vdr
      JOIN users u ON vdr.reported_by = u.id
      WHERE vdr.vehicle_id = $1
      ORDER BY vdr.reported_at DESC
    `, [vehicleId]);
    
    const reports = result.rows.map(row => ({
      id: row.id,
      damageType: row.damage_type,
      severity: row.severity,
      description: row.description,
      photoUrls: row.photo_urls ? JSON.parse(row.photo_urls) : [],
      repairCost: row.repair_cost,
      repairStatus: row.repair_status,
      reportedAt: row.reported_at,
      resolvedAt: row.resolved_at,
      reportedBy: {
        id: row.reported_by,
        firstName: row.first_name,
        lastName: row.last_name
      }
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Get damage reports error:', error);
    res.status(500).json({ error: 'Failed to get damage reports' });
  }
});

// Enhanced vehicle search with advanced filtering
app.get('/api/vehicles/search', authenticateToken, async (req, res) => {
  try {
    const {
      location,
      vehicleType,
      fuelType,
      transmissionType,
      seatingCapacity,
      minPrice,
      maxPrice,
      features,
      conditionRating,
      verificationStatus,
      deliveryAvailable,
      airportPickup,
      sortBy = 'popularity',
      page = 1,
      limit = 20
    } = req.query;
    
    let query = `
      SELECT DISTINCT v.*, 
             AVG(r.rating) as average_rating,
             COUNT(r.id) as total_reviews
      FROM vehicles v
      LEFT JOIN reviews r ON v.id = r.vehicle_id AND r.moderation_status = 'approved'
    `;
    
    const conditions = ['v.available = 1'];
    const params = [];
    let paramIndex = 1;
    
    if (location) {
      conditions.push(`v.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }
    
    if (vehicleType) {
      conditions.push(`v.vehicle_type = $${paramIndex}`);
      params.push(vehicleType);
      paramIndex++;
    }
    
    if (fuelType) {
      conditions.push(`v.fuel_type = $${paramIndex}`);
      params.push(fuelType);
      paramIndex++;
    }
    
    if (transmissionType) {
      conditions.push(`v.transmission_type = $${paramIndex}`);
      params.push(transmissionType);
      paramIndex++;
    }
    
    if (seatingCapacity) {
      conditions.push(`v.seating_capacity >= $${paramIndex}`);
      params.push(parseInt(seatingCapacity));
      paramIndex++;
    }
    
    if (minPrice) {
      conditions.push(`v.daily_rate >= $${paramIndex}`);
      params.push(parseFloat(minPrice));
      paramIndex++;
    }
    
    if (maxPrice) {
      conditions.push(`v.daily_rate <= $${paramIndex}`);
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }
    
    if (conditionRating) {
      conditions.push(`v.condition_rating >= $${paramIndex}`);
      params.push(parseInt(conditionRating));
      paramIndex++;
    }
    
    if (verificationStatus) {
      conditions.push(`v.verification_status = $${paramIndex}`);
      params.push(verificationStatus);
      paramIndex++;
    }
    
    if (deliveryAvailable === 'true') {
      conditions.push(`v.delivery_available = 1`);
    }
    
    if (airportPickup === 'true') {
      conditions.push(`v.airport_pickup = 1`);
    }
    
    if (features && features.length > 0) {
      const featureIds = features.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (featureIds.length > 0) {
        query += ` 
          INNER JOIN vehicle_feature_assignments vfa ON v.id = vfa.vehicle_id 
          INNER JOIN vehicle_features vf ON vfa.feature_id = vf.id 
        `;
        conditions.push(`vf.id IN (${featureIds.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
        conditions.push(`vfa.is_included = 1`);
        params.push(...featureIds);
        paramIndex += featureIds.length;
      }
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY v.id`;
    
    // Add sorting
    switch (sortBy) {
      case 'price_low':
        query += ` ORDER BY v.daily_rate ASC`;
        break;
      case 'price_high':
        query += ` ORDER BY v.daily_rate DESC`;
        break;
      case 'rating':
        query += ` ORDER BY average_rating DESC NULLS LAST`;
        break;
      case 'newest':
        query += ` ORDER BY v.created_at DESC`;
        break;
      case 'condition':
        query += ` ORDER BY v.condition_rating DESC NULLS LAST`;
        break;
      default: // popularity
        query += ` ORDER BY total_reviews DESC, average_rating DESC NULLS LAST`;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(DISTINCT v.id) as total FROM vehicles v`;
    if (features && features.length > 0) {
      countQuery += ` INNER JOIN vehicle_feature_assignments vfa ON v.id = vfa.vehicle_id INNER JOIN vehicle_features vf ON vfa.feature_id = vf.id`;
    }
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, params.slice(0, -2)); // Remove limit and offset
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      vehicles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Vehicle search error:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
});

// Get vehicle reviews (only approved reviews for public)
app.get('/api/vehicles/:vehicleId/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await db.query(`
      SELECT 
        r.id, r.rating, r.comment, r.created_at,
        u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.vehicle_id = $1 AND r.moderation_status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.vehicleId, limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM reviews 
      WHERE vehicle_id = $1 AND moderation_status = 'approved'
    `, [req.params.vehicleId]);

    const avgRatingResult = await db.query(`
      SELECT AVG(rating)::DECIMAL(2,1) as average_rating
      FROM reviews 
      WHERE vehicle_id = $1 AND moderation_status = 'approved'
    `, [req.params.vehicleId]);

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      },
      summary: {
        totalReviews: parseInt(countResult.rows[0].total),
        averageRating: parseFloat(avgRatingResult.rows[0].average_rating) || 0
      }
    });
  } catch (error) {
    console.error('Get vehicle reviews error:', error);
    res.status(500).json({ error: 'Failed to get vehicle reviews' });
  }
});

// Payment receipt endpoint
app.get('/api/payments/receipt/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify booking belongs to user
    const booking = await query(
      `SELECT b.*, v.make, v.model, v.year, v.location, v.daily_rate,
              p.transaction_id, p.amount, p.currency, p.payment_method, p.created_at as payment_date,
              u.first_name, u.last_name, u.email
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN payment_transactions p ON b.id = p.booking_id AND p.status = 'completed'
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ? AND b.user_id = ?`,
      [bookingId, userId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const receiptData = booking[0];
    
    // Calculate rental duration
    const startDate = new Date(receiptData.start_date);
    const endDate = new Date(receiptData.end_date);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Build receipt object
    const receipt = {
      booking: {
        id: receiptData.id,
        status: receiptData.status,
        startDate: receiptData.start_date,
        endDate: receiptData.end_date,
        duration: durationDays,
        totalAmount: receiptData.total_amount,
        createdAt: receiptData.created_at
      },
      vehicle: {
        make: receiptData.make,
        model: receiptData.model,
        year: receiptData.year,
        location: receiptData.location,
        dailyRate: receiptData.daily_rate
      },
      customer: {
        firstName: receiptData.first_name,
        lastName: receiptData.last_name,
        email: receiptData.email
      },
      payment: {
        transactionId: receiptData.transaction_id,
        amount: receiptData.amount,
        currency: receiptData.currency,
        method: receiptData.payment_method,
        date: receiptData.payment_date
      },
      company: {
        name: 'Island Rides',
        address: 'Nassau, Bahamas',
        phone: '+1-242-XXX-XXXX',
        email: 'support@islandrides.com'
      }
    };

    res.json({ receipt });
  } catch (error) {
    logError('Receipt fetch error', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Payment history endpoint
app.get('/api/payments/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const payments = await db.query(
      `SELECT b.id as booking_id, b.start_date, b.end_date, b.total_amount, b.status,
              v.make, v.model, v.year,
              p.transaction_id, p.payment_method, p.created_at as payment_date
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN payment_transactions p ON b.id = p.booking_id AND p.status = 'completed'
       WHERE b.renter_id = $1 AND b.payment_status = 'completed'
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE renter_id = $1 AND payment_status = 'completed'`,
      [userId]
    );

    res.json({
      payments: keysToCamel(payments.rows),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.rows[0].count,
        pages: Math.ceil(totalResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    logError('Payment history error', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Replace the existing server startup section
if (require.main === module) {
  (async () => {
    try {
      console.log('🔧 Starting Island Rides API Server with Smart Port Management...');
      console.log('🔍 Checking for port conflicts...');
      
      const { port } = await portManager.startServerWithRetry(server);
      
      console.log('✅ Server startup complete!');
      console.log(`🌐 Access your API at: http://localhost:${port}`);
      
      // Graceful shutdown handling
      const gracefulShutdown = (signal) => {
        console.log(`📤 Received ${signal}, shutting down gracefully...`);
        
        // Stop price monitoring
        try {
          priceMonitoringService.stop();
          console.log('💰 Price monitoring stopped');
        } catch (error) {
          console.warn('⚠️ Error stopping price monitoring:', error.message);
        }
        
        server.close((err) => {
          if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
          } else {
            console.log('✅ Server closed successfully');
            process.exit(0);
          }
        });
      };
      
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error);
        gracefulShutdown('uncaughtException');
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown('unhandledRejection');
      });
      
    } catch (error) {
      console.error('💥 Failed to start server:', error.message);
      console.error('📋 Troubleshooting tips:');
      console.error('  1. Check if any services are using ports 3003-3007');
      console.error('  2. Try restarting your development environment');
      console.error('  3. Check Docker containers: docker ps');
      console.error('  4. Kill conflicting processes: npx kill-port 3003');
      console.error('  5. Check system port usage: netstat -tulpn | grep :3003');
      
      process.exit(1);
    }
  })();
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
