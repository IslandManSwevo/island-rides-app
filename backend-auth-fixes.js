// ===============================================
// BACKEND AUTHENTICATION FIXES
// Add these endpoints to server.js to fix frontend-backend inconsistencies
// ===============================================

// 1. GENERATE REFRESH TOKEN FUNCTION (Add this function near the top of server.js)
function generateRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' } // Refresh tokens last 7 days
  );
}

// 2. VERIFY REFRESH TOKEN FUNCTION
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

// 3. UPDATE REGISTRATION ENDPOINT (Replace existing registration endpoint)
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

    // Generate both access and refresh tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = generateRefreshToken(user.id, user.email);

    logAuditEvent('USER_REGISTRATION', user.id, { 
      email: user.email, 
      role: user.role 
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,  // Convert to camelCase
        lastName: user.last_name,    // Convert to camelCase
        role: user.role
      },
      token,
      refreshToken  // Add refresh token
    });
  } catch (error) {
    logError('Registration error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. UPDATE LOGIN ENDPOINT (Replace existing login endpoint)
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

    // Generate both access and refresh tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = generateRefreshToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,  // Convert to camelCase
        lastName: user.last_name,    // Convert to camelCase
        role: user.role
      },
      token,
      refreshToken  // Add refresh token
    });
  } catch (error) {
    logError('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. ADD REFRESH TOKEN ENDPOINT (Add this new endpoint)
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user from database to ensure they still exist
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const newRefreshToken = generateRefreshToken(user.id, user.email);

    res.json({
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logError('Token refresh error', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// 6. ADD CURRENT USER ENDPOINT (Add this new endpoint)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await db.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1', 
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,  // Convert to camelCase
      lastName: user.last_name,    // Convert to camelCase
      role: user.role,
      createdAt: user.created_at
    });
  } catch (error) {
    logError('Get current user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. ADD HEALTH CHECK ENDPOINT (Add this if missing)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ===============================================
// ENVIRONMENT VARIABLES TO ADD TO .env
// ===============================================
/*
# Add this to your .env file in the backend directory:
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here_different_from_main_jwt_secret
JWT_EXPIRES_IN=24h
*/

// ===============================================
// DATABASE SCHEMA UPDATE (if needed)
// ===============================================
/*
-- Add these columns if you want to track refresh tokens (optional)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token_version INTEGER DEFAULT 0;

-- Create refresh tokens table (optional, for better security)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
*/