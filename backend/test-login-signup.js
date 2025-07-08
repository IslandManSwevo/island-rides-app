const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;

async function testSignup() {
  try {
    console.log('📝 Testing user registration...');
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testUser.email,
      password: testUser.password,
      firstName: testUser.firstName,
      lastName: testUser.lastName
    });
    
    console.log('✅ Registration successful');
    console.log('   - User ID:', response.data.user.id);
    console.log('   - Email:', response.data.user.email);
    console.log('   - Token received:', !!response.data.token);
    
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists, will test login instead');
      return true;
    }
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  try {
    console.log('\n🔐 Testing user login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('   - User ID:', response.data.user.id);
    console.log('   - Email:', response.data.user.email);
    console.log('   - Role:', response.data.user.role);
    console.log('   - Token received:', !!authToken);
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testExistingUser() {
  try {
    console.log('\n🔐 Testing login with existing test user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'john.doe@test.com',
      password: 'Password123!'
    });
    
    authToken = response.data.token;
    console.log('✅ Existing user login successful');
    console.log('   - User ID:', response.data.user.id);
    console.log('   - Email:', response.data.user.email);
    console.log('   - Role:', response.data.user.role);
    
    return true;
  } catch (error) {
    console.error('❌ Existing user login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProtectedEndpoint() {
  if (!authToken) {
    console.log('\n⚠️  Skipping protected endpoint test - no auth token');
    return false;
  }
  
  try {
    console.log('\n🔒 Testing protected endpoint...');
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Protected endpoint access successful');
    console.log('   - Profile data received:', !!response.data);
    
    return true;
  } catch (error) {
    console.error('❌ Protected endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAuthTests() {
  console.log('🧪 Testing Login & Signup Functionality\n');
  
  // Test server connectivity
  try {
    console.log('🌐 Testing server connectivity...');
    await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is responding\n');
  } catch (error) {
    console.error('❌ Server not accessible:', error.message);
    return;
  }
  
  const tests = [
    { name: 'User Registration', test: testSignup },
    { name: 'User Login', test: testLogin },
    { name: 'Existing User Login', test: testExistingUser },
    { name: 'Protected Endpoint', test: testProtectedEndpoint }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const { name, test } of tests) {
    const success = await test();
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All authentication tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted');
  process.exit(0);
});

// Run tests
runAuthTests().catch(console.error); 