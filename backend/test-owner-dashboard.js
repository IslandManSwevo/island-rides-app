const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

// Test script for owner dashboard functionality
async function testOwnerDashboard() {
  try {
    console.log('🚀 Testing Owner Dashboard API endpoints...\n');

    // First, we need to authenticate as a test user
    console.log('1. Authenticating test user...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Authentication failed');
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Authentication successful\n');

    // Test owner dashboard overview
    console.log('2. Testing dashboard overview...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/owner/dashboard?timeframe=30`, { headers });
      console.log('✅ Dashboard overview endpoint working');
      console.log(`   Overview data keys: ${Object.keys(dashboardResponse.data).join(', ')}\n`);
    } catch (error) {
      console.log('❌ Dashboard overview failed:', error.response?.data?.error || error.message);
    }

    // Test vehicle performance
    console.log('3. Testing vehicle performance...');
    try {
      const performanceResponse = await axios.get(`${BASE_URL}/api/owner/vehicles/performance`, { headers });
      console.log('✅ Vehicle performance endpoint working');
      console.log(`   Found ${performanceResponse.data?.length || 0} vehicles\n`);
    } catch (error) {
      console.log('❌ Vehicle performance failed:', error.response?.data?.error || error.message);
    }

    // Test financial reports
    console.log('4. Testing financial reports...');
    try {
      const reportsResponse = await axios.get(`${BASE_URL}/api/owner/reports/financial?start_date=2024-01-01&end_date=2024-12-31`, { headers });
      console.log('✅ Financial reports endpoint working');
      console.log(`   Report data keys: ${Object.keys(reportsResponse.data).join(', ')}\n`);
    } catch (error) {
      console.log('❌ Financial reports failed:', error.response?.data?.error || error.message);
    }

    // Test fleet management
    console.log('5. Testing fleet management...');
    try {
      const fleetResponse = await axios.get(`${BASE_URL}/api/owner/fleet`, { headers });
      console.log('✅ Fleet management endpoint working');
      console.log(`   Found ${fleetResponse.data?.length || 0} vehicles in fleet\n`);
    } catch (error) {
      console.log('❌ Fleet management failed:', error.response?.data?.error || error.message);
    }

    // Test bulk operations
    console.log('6. Testing bulk operations...');
    try {
      const bulkResponse = await axios.post(`${BASE_URL}/api/owner/fleet/bulk/availability`, {
        vehicleIds: [1],
        available: true
      }, { headers });
      console.log('✅ Bulk operations endpoint working\n');
    } catch (error) {
      console.log('❌ Bulk operations failed:', error.response?.data?.error || error.message);
    }

    // Test goals endpoint
    console.log('7. Testing goals management...');
    try {
      const goalsResponse = await axios.get(`${BASE_URL}/api/owner/goals`, { headers });
      console.log('✅ Goals endpoint working');
      console.log(`   Found ${goalsResponse.data?.length || 0} goals\n`);
    } catch (error) {
      console.log('❌ Goals management failed:', error.response?.data?.error || error.message);
    }

    console.log('🎉 Owner Dashboard API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the tests
testOwnerDashboard(); 