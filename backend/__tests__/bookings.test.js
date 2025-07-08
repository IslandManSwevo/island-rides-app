const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const db = require('../db');

const testUser = {
  userId: 1,
  email: 'john@example.com',
  role: 'customer'
};

const testToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');

describe('Bookings API', () => {
  beforeEach(async () => {
    // Clear test data
    await db.query('DELETE FROM bookings');
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM vehicles');
    
    // Create test data
    await db.query('INSERT INTO users (id, email, first_name, last_name, password_hash) VALUES (1, "test@example.com", "Test", "User", "hash")');
    await db.query('INSERT INTO vehicles (id, make, model, year, owner_id, location, daily_rate, available) VALUES (1, "Toyota", "Camry", 2020, 1, "Nassau", 50.00, true)');
    
    // Create test bookings with renter_id instead of user_id
    await db.query(
      "INSERT INTO bookings (renter_id, vehicle_id, start_date, end_date, status, total_amount) VALUES ($1, $2, $3, $4, $5, $6)",
      [1, 1, '2024-01-15', '2024-01-20', 'confirmed', 250.00]
    );
    await db.query(
      "INSERT INTO bookings (renter_id, vehicle_id, start_date, end_date, status, total_amount) VALUES ($1, $2, $3, $4, $5, $6)",
      [1, 1, '2024-02-01', '2024-02-05', 'completed', 200.00]
    );
  });

  // Add your test cases here
});
