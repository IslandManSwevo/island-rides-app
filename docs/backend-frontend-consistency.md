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

const refreshToken = generateRefreshToken(user.id, user.email);

res.status(201).json({
  message: 'User registered successfully',
  token,
  refreshToken,
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name
  }
});
```

3. **Update Login Response** (line ~700 in server.js):

```javascript
// REPLACE existing login response with:
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

const refreshToken = generateRefreshToken(user.id, user.email);

res.json({
  message: 'Login successful',
  token,
  refreshToken,
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name
  }
});
```

4. **Add Refresh Token Endpoint** (add to backend/server.js):

```javascript
// Add after existing auth routes
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'Refresh token required' 
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token: newToken,
      refreshToken // Send back the same refresh token
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token' 
    });
  }
});
```

---

## **Issue 2: User Object Structure Mismatch**

### Problem:
- Frontend expects snake_case fields (`first_name`, `last_name`)
- Backend database uses snake_case but responses might be inconsistent
- This causes UI to show "undefined undefined" for user names

### Fix:
Ensure consistent user object structure in all API responses.

**🔧 Implementation:**

Update all user-related API responses to consistently return:

```javascript
const userObject = {
  id: user.id,
  email: user.email,
  role: user.role,
  first_name: user.first_name,
  last_name: user.last_name,
  phone: user.phone,
  avatar_url: user.avatar_url,
  created_at: user.created_at
};
```

---

## **Issue 3: API Endpoint URL Consistency**

### Problem:
- Frontend calls different endpoints than what backend provides
- Some endpoints use `/api/auth/` while others use `/auth/`
- This causes 404 errors

### Fix:
Standardize all auth endpoints to use `/api/auth/` prefix.

**🔧 Implementation:**

Verify these endpoints exist in backend:
- `POST /api/auth/register`
- `POST /api/auth/login` 
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

---

## **Issue 4: CORS Configuration**

### Problem:
- Frontend running on different port than backend
- CORS issues will block API calls
- Need proper CORS setup for development

### Fix:
Update CORS configuration in backend.

**🔧 Implementation:**

In `backend/server.js`, update CORS configuration:

```javascript
const cors = require('cors');

// Update CORS configuration
app.use(cors({
  origin: [
    'http://localhost:19006', // Expo web
    'http://localhost:8081',  // Metro bundler
    'http://localhost:3000',  // Alternative port
    'exp://192.168.*:19000'   // Expo mobile
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

---

## **Issue 5: Environment Configuration**

### Problem:
- Frontend API URL configuration may not match backend setup
- Port conflicts between services
- Missing environment variables

### Fix:
Update environment configuration for both frontend and backend.

**🔧 Frontend Implementation:**

In `IslandRidesApp/src/config/environment.ts`, ensure:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3003/api'  // Match backend port
    : process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com/api',
  
  TIMEOUT: 10000,
  
  WEBSOCKET_URL: __DEV__
    ? 'ws://localhost:3004'
    : process.env.EXPO_PUBLIC_WS_URL || 'wss://your-production-ws.com'
};
```

**🔧 Backend Implementation:**

In `backend/.env`:

```env
PORT=3003
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
DATABASE_URL=./island_rides.db
NODE_ENV=development
```

---

## **Issue 6: Authentication Middleware Consistency**

### Problem:
- Frontend sends Authorization header as `Bearer ${token}`
- Backend middleware must properly parse this format
- Inconsistent authentication checks

### Fix:
Update authentication middleware.

**🔧 Implementation:**

In `backend/server.js`, update the `authenticateToken` middleware:

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    req.user = decoded;
    next();
  });
}
```

---

## **🧪 Testing the Fixes**

After implementing these fixes:

1. **Test Registration:**
```bash
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"John","last_name":"Doe"}'
```

2. **Test Login:**
```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. **Test Token Refresh:**
```bash
curl -X POST http://localhost:3003/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token-here"}'
```

4. **Test Protected Route:**
```bash
curl -X GET http://localhost:3003/api/protected-route \
  -H "Authorization: Bearer your-access-token-here"
```

---

## **🎯 Priority Order**

Implement fixes in this order:

1. **🔴 Critical**: Fix refresh token support (Issue #1)
2. **🔴 Critical**: Fix user object structure (Issue #2)  
3. **🟡 Important**: Update CORS configuration (Issue #4)
4. **🟡 Important**: Fix environment config (Issue #5)
5. **🟢 Nice-to-have**: Standardize endpoints (Issue #3)
6. **🟢 Nice-to-have**: Update auth middleware (Issue #6)

---

## **📝 Checklist**

- [ ] Add refresh token generation functions
- [ ] Update registration response with refreshToken
- [ ] Update login response with refreshToken  
- [ ] Add `/api/auth/refresh` endpoint
- [ ] Fix user object structure consistency
- [ ] Update CORS configuration
- [ ] Verify environment variables
- [ ] Test all auth endpoints
- [ ] Test frontend auth flow
- [ ] Verify token refresh works

---

**⚠️ Important**: After implementing these fixes, restart both frontend and backend servers to ensure all changes take effect.

This will resolve the major backend-frontend consistency issues and ensure proper authentication flow!