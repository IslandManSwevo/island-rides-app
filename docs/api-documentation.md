# KeyLo API Documentation

## Overview

This document provides comprehensive API documentation for the KeyLo vehicle rental platform backend. The API follows RESTful principles with a **modular architecture** that ensures scalability, maintainability, and consistent error handling patterns.

## Architecture Overview

The API is built using a **modular backend architecture** with the following components:

- **Configuration Layer**: Database, CORS, and logging configuration
- **Middleware Layer**: Authentication, error handling, and request validation
- **Routes Layer**: Modular endpoint organization by feature
- **Services Layer**: Business logic and external API integrations
- **Utils Layer**: Smart port management and utility functions

## Base URL and Smart Port Management

The backend implements intelligent port management:

- **Development**: `http://localhost:3003/api` (or next available port 3004-3007)
- **Production**: `https://api.keylo.com/api`
- **Health Check**: `GET /api/health`
- **Port Status**: `GET /api/port-status`

The server automatically detects port conflicts and selects the next available port, with WebSocket and monitoring services configured accordingly.

## Authentication System (Enhanced)

KeyLo uses JWT (JSON Web Tokens) with comprehensive audit logging and security enhancements:

```
Authorization: Bearer <your-jwt-token>
```

### Enhanced Authentication Features

- **Audit Logging**: All authentication events are logged with IP, user agent, and context
- **Rate Limiting**: Protection against brute force attacks (5 attempts per 15 minutes)
- **Role-Based Access**: Granular permissions based on user roles
- **Token Refresh**: Automatic token refresh with security validation
- **Security Monitoring**: Failed login attempts and suspicious activity tracking

### Authentication Flow

1. **Register/Login** → Receive JWT token with audit logging
2. **Include token** in subsequent requests with automatic validation
3. **Token expires** after 24 hours (configurable)
4. **Refresh token** using the refresh endpoint with security checks
5. **Logout** → Token invalidation with audit trail

## Error Handling (Comprehensive)

The API implements comprehensive error handling with consistent response formats:

### Error Response Format

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST",
  "requestId": "req-123456789"
}
```

### Error Types and Status Codes

| Status Code | Error Type | Description | Example |
|-------------|------------|-------------|---------|
| 400 | `VALIDATION_ERROR` | Invalid input data | Missing required fields |
| 401 | `AUTHENTICATION_ERROR` | Authentication required | Invalid or expired token |
| 403 | `AUTHORIZATION_ERROR` | Insufficient permissions | User role restrictions |
| 404 | `NOT_FOUND` | Resource not found | User or vehicle not found |
| 409 | `DUPLICATE_ENTRY` | Resource already exists | Email already registered |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Authentication rate limit |
| 500 | `INTERNAL_ERROR` | Server error | Database connection failure |

### Error Handling Features

- **Consistent Formatting**: All errors follow the same response structure
- **Detailed Logging**: Comprehensive error logging with context
- **User-Friendly Messages**: Clear, actionable error messages
- **Development Support**: Stack traces and detailed information in development
- **Security**: Sensitive information is never exposed in error responses

## Authentication Endpoints

### POST /api/auth/register

Register a new user with comprehensive validation and security.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

**Validation Rules:**
- Email: Valid email format, not already registered
- Password: Minimum 8 characters, must contain uppercase, lowercase, and number
- Names: Required, sanitized for security
- Role: Optional, defaults to "user"

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2025-01-23T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limiting:** 5 requests per 15 minutes per IP

### POST /api/auth/login

Authenticate user with enhanced security monitoring.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Security Features:**
- Failed login attempt tracking
- Account lockout after multiple failures
- Audit logging with IP and user agent
- Rate limiting protection

### GET /api/auth/me

Get current user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2025-01-23T10:30:00.000Z",
    "lastLogin": "2025-01-23T15:45:00.000Z"
  }
}
```

### POST /api/auth/refresh

Refresh JWT token with security validation.

**Headers:**
```
Authorization: Bearer <current-token>
```

**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/logout

Logout user with audit trail.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

## System Endpoints

### GET /api/health

Health check endpoint for monitoring system status.

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": "connected",
  "services": {
    "authentication": "operational",
    "websocket": "operational",
    "logging": "operational"
  }
}
```

### GET /api/port-status

Get current server port and configuration information.

**Success Response (200):**
```json
{
  "port": 3003,
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 32456789,
    "heapUsed": 23456789
  },
  "version": "v18.17.0",
  "environment": "development",
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

## Middleware and Security

### Authentication Middleware

All protected endpoints use the authentication middleware:

```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/protected-endpoint', authenticateToken, (req, res) => {
  // req.user contains authenticated user information
  res.json({ message: 'Access granted', user: req.user });
});
```

### Role-Based Authorization

Endpoints can require specific user roles:

```javascript
const { checkRole } = require('../middleware/auth');

// Only hosts and owners can access
router.get('/host-only', authenticateToken, checkRole(['host', 'owner']), handler);

// Only admins can access
router.delete('/admin-only', authenticateToken, checkRole(['admin']), handler);
```

### Request Validation

Input validation middleware ensures data integrity:

```javascript
const { validateRequest } = require('../middleware/errorHandler');
const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required()
});

router.post('/users', validateRequest(userSchema), handler);
```

## Database Configuration

The API supports both PostgreSQL (production) and SQLite (development) with intelligent connection management:

### Connection Features

- **Automatic Detection**: Switches between PostgreSQL and SQLite based on environment
- **Connection Pooling**: Efficient connection management for PostgreSQL
- **Error Handling**: Comprehensive database error handling and recovery
- **Health Monitoring**: Database connection health checks
- **Migration Support**: Automatic schema initialization for SQLite

### Environment Configuration

```bash
# PostgreSQL (Production)
DATABASE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=keylo_production
DB_USER=keylo_user
DB_PASSWORD=secure_password

# SQLite (Development)
DATABASE_TYPE=sqlite
DATABASE_URL=./keylo_development.db
```

## Logging and Monitoring

### Structured Logging

All API operations are logged with structured data:

```json
{
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": 145,
  "userId": 123,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

### Audit Logging

Security-sensitive operations are logged to a separate audit log:

```json
{
  "eventType": "LOGIN_SUCCESS",
  "userId": 123,
  "timestamp": "2025-01-23T10:30:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "details": {
    "email": "user@example.com"
  }
}
```

### Performance Monitoring

API performance is tracked and logged:

```json
{
  "operation": "database_query",
  "duration": 45,
  "timestamp": "2025-01-23T10:30:00.000Z",
  "query": "SELECT * FROM users WHERE id = $1",
  "success": true
}
```

## Development and Testing

### Local Development

1. **Start the server**: `npm run backend`
2. **Health check**: `GET http://localhost:3003/api/health`
3. **View logs**: Check console output and `backend/logs/` directory

### Testing Endpoints

Use tools like Postman, curl, or automated tests:

```bash
# Health check
curl http://localhost:3003/api/health

# Register user
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Error Testing

Test error scenarios to ensure proper error handling:

```bash
# Test validation error
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'

# Test authentication error
curl -X GET http://localhost:3003/api/auth/me \
  -H "Authorization: Bearer invalid-token"
```

This modular API architecture ensures scalability, maintainability, and excellent developer experience while providing comprehensive security and error handling.
