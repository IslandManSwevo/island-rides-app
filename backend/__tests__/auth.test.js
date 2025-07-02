const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, users } = require('../server');

let testUserToken = null;
let testUserId = null;

describe('Authentication Flow', () => {
  beforeAll(async () => {
    users.length = 0;
    users.push(
      {
        id: 1,
        email: 'john@example.com',
        password_hash: '$2b$10$K8BvQZ9X.vQZ9X.vQZ9X.uK8BvQZ9X.vQZ9X.vQZ9X.vQZ9X.vQZ9X.',
        first_name: 'John',
        last_name: 'Doe',
        role: 'customer',
        failedLoginAttempts: 0,
        lockoutUntil: null
      },
      {
        id: 2,
        email: 'jane@example.com',
        password_hash: '$2b$10$K8BvQZ9X.vQZ9X.vQZ9X.uK8BvQZ9X.vQZ9X.vQZ9X.vQZ9X.vQZ9X.',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'host',
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    );

    const registerData = {
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registerData);

    if (registerResponse.status === 201) {
      testUserToken = registerResponse.body.token;
      testUserId = registerResponse.body.user.id;
    }
  });

  describe('POST /api/auth/register - Successful user registration', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser2@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User2',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        email: 'newuser2@example.com',
        firstName: 'New',
        lastName: 'User2',
        role: 'customer'
      });
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        email: 'weakpass@example.com',
        password: 'weak',
        firstName: 'Weak',
        lastName: 'Password',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('Password must be at least 8 characters');
    });

    test('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'john@example.com', // Already exists in test data
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Duplicate',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });

    test('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'incomplete@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('All fields are required');
    });

    test('should reject registration with missing firstName', async () => {
      const userData = {
        email: 'missing@example.com',
        password: 'SecurePass123!',
        lastName: 'User',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('All fields are required');
    });
  });

  describe('POST /api/auth/login - Successful user login', () => {
    test('should login with valid credentials using pre-registered user', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        email: 'testuser@example.com',
        role: 'customer'
      });
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.email).toBe('testuser@example.com');
      expect(decoded.userId).toBeDefined();
    });
  });

  describe('POST /api/auth/login - Failed login with incorrect password', () => {
    test('should reject login with incorrect password using pre-registered user', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.token).toBeUndefined();
    });

    test('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with missing credentials', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('Protected endpoint access without valid JWT token', () => {
    test('should reject access to protected endpoint without token', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('should reject access to protected endpoint with invalid token', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(403);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject access to protected endpoint with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'InvalidFormat token-here')
        .expect(403);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject access to protected endpoint with expired token', async () => {
      const expiredPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };

      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should allow access to protected endpoint with valid token', async () => {
      expect(testUserToken).toBeDefined();

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true); // Should return bookings array
    });
  });
});
