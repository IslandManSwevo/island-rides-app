# Backend-Frontend Consistency Fix Guide

## 🚨 Critical Issues Found & Solutions

After analyzing both backend and frontend, I found several critical inconsistencies that will cause authentication and API failures. Here are the issues and how to fix them:

---

## **Issue 1: Missing Refresh Token Support**

### Problem:
- Frontend expects `refreshToken` in auth responses
- Backend only sends `token`
- Frontend will crash when trying to access `response.refreshToken`

### Fix:
Add refresh token generation and endpoints to backend.

**🔧 Implementation:**

1. **Add to backend/server.js** (after existing JWT functions):

```javascript
// Add refresh token functions
function generateRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
```

2. **Update Registration Response** (line ~650 in server.js):

```javascript
// REPLACE existing registration response with:
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

const refreshToken = generateRefreshToken(user.id, user.email); // ADD THIS

res.status(201).json({
  message: 'User created successfully',
  user: {
    id: user.id,
    email: user.email,
    firstName: user.first_name,  // ✅ Already correct
    lastName: user.last_name,    // ✅ Already correct
    role: user.role
  },
  token,
  refreshToken  // ADD THIS
});
```

3. **Update Login Response** (line ~710 in server.js):

```javascript
// REPLACE existing login response with:
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

const refreshToken = generateRefreshToken(user.id, user.email); // ADD THIS

res.json({
  message: 'Login successful',
  user: {
    id: user.id,
    email: user.email,
    firstName: user.first_name,  // ✅ Already correct
    lastName: user.last_name,    // ✅ Already correct
    role: user.role
  },
  token,
  refreshToken  // ADD THIS
});
```

---

## **Issue 2: Missing `/api/auth/refresh` Endpoint**

### Problem:
- Frontend calls `/api/auth/refresh` for token renewal
- Backend has no such endpoint
- Will cause 404 errors and authentication failures

### Fix:
Add refresh endpoint to backend.

**🔧 Implementation:**

Add this endpoint after the logout endpoint in server.js:

```javascript
// ADD this new endpoint
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
```

---

## **Issue 3: Missing `/api/auth/me` Endpoint**

### Problem:
- Frontend calls `/api/auth/me` to get current user data
- Backend has no such endpoint
- Will cause 404 errors in user profile screens

### Fix:
Add current user endpoint to backend.

**🔧 Implementation:**

Add this endpoint after the refresh endpoint:

```javascript
// ADD this new endpoint
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
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at
    });
  } catch (error) {
    logError('Get current user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## **Issue 4: Missing Health Check Endpoint**

### Problem:
- Docker health checks and frontend environment detection expect `/api/health`
- Backend may not have this endpoint
- Will cause container startup failures

### Fix:
Add health check endpoint.

**🔧 Implementation:**

Add this endpoint:

```javascript
// ADD this endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});
```

---

## **Environment Variables Update**

Add to your `backend/.env` file:

```env
# JWT Configuration
JWT_SECRET=be0382a80cd910fbecf47e8d5369808702522da9b98aa6895e3adeff4a4bc73a
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here_different_from_main_jwt_secret
JWT_EXPIRES_IN=24h

# Port Configuration
PORT=3003
WEBSOCKET_PORT=3004

# Database
DB_PATH=./island-rides.db
```

---

## **Testing the Fixes**

After implementing these changes:

### 1. Test Registration:
```bash
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "customer"
  },
  "token": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### 2. Test Login:
```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 3. Test Current User:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3003/api/auth/me
```

### 4. Test Refresh Token:
```bash
curl -X POST http://localhost:3003/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 5. Test Health Check:
```bash
curl http://localhost:3003/api/health
```

---

## **Database Schema (Optional Enhancement)**

If you want to track refresh tokens in the database for better security:

```sql
-- Add refresh token version tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token_version INTEGER DEFAULT 0;

-- Create refresh tokens table
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
```

---

## **Implementation Priority**

1. **HIGH PRIORITY** (Will break authentication):
   - Add refresh token to login/register responses
   - Add `/api/auth/refresh` endpoint
   - Add `/api/auth/me` endpoint

2. **MEDIUM PRIORITY** (Will improve reliability):
   - Add `/api/health` endpoint
   - Add refresh token environment variable

3. **LOW PRIORITY** (Optional security enhancement):
   - Database refresh token tracking

---

## **Summary**

✅ **Currently Working:**
- Basic login/register logic
- JWT token generation
- Password validation
- Database schema
- User data transformation (snake_case → camelCase)

❌ **Needs Fixing:**
- Missing `refreshToken` in auth responses
- Missing `/api/auth/refresh` endpoint
- Missing `/api/auth/me` endpoint  
- Missing `/api/health` endpoint

After implementing these fixes, the frontend and backend will be fully compatible and authentication will work correctly! 🚀