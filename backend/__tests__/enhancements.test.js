const request = require('supertest');
const { app } = require('../server');
const db = require('../db');
const jwt = require('jsonwebtoken');

const testUser = { userId: 1, email: 'test@example.com', role: 'host' };
const testToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');

describe('Brownfield Enhancements API', () => {
  beforeEach(async () => {
    // Setup test data
    await db.query('DELETE FROM host_profiles');
    await db.query('INSERT INTO host_profiles (host_id, business_name) VALUES (1, \'Test Host\')');
  });

  test('should create host profile', async () => {
    const response = await request(app)
      .post('/api/host/profiles')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ business_name: 'New Host' })
      .expect(201);
    expect(response.body.business_name).toBe('New Host');
  });

  test('should get vehicle documents', async () => {
    const response = await request(app)
      .get('/api/vehicles/1/documents')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should start verification session', async () => {
    const response = await request(app)
      .post('/api/verification/sessions')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ type: 'government_id' })
      .expect(201);
    expect(response.body.session_id).toBeDefined();
  });

  test('should search vehicles with filters', async () => {
    const response = await request(app)
      .get('/api/search/vehicles?location=Nassau&make=Toyota')
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should create host storefront', async () => {
    const response = await request(app)
      .post('/api/host/storefronts')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ name: 'My Storefront', description: 'Best vehicles' })
      .expect(201);
    expect(response.body.name).toBe('My Storefront');
  });
});