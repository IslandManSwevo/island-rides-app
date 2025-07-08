const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'john.doe@test.com',
      password: 'Password123!'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPaymentMethods() {
  try {
    const response = await axios.get(`${BASE_URL}/payments/methods`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Payment methods endpoint working');
    console.log('📋 Available payment methods:', response.data.methods.map(m => m.name).join(', '));
    return true;
  } catch (error) {
    console.error('❌ Payment methods test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateBooking() {
  try {
    // First, create a booking
    const response = await axios.post(`${BASE_URL}/bookings`, {
      vehicleId: 1,
      startDate: '2024-02-01',
      endDate: '2024-02-03'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Booking created successfully');
    console.log('📋 Booking ID:', response.data.booking.id);
    return response.data.booking.id;
  } catch (error) {
    console.error('❌ Booking creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCreatePaymentIntent(bookingId) {
  try {
    const response = await axios.post(`${BASE_URL}/payments/create-intent`, {
      bookingId: bookingId
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Payment intent created successfully');
    console.log('📋 Payment URL:', response.data.paymentUrl);
    console.log('📋 Payment Intent ID:', response.data.paymentIntentId);
    return true;
  } catch (error) {
    console.error('❌ Payment intent creation failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Transfi Integration...\n');
  
  // Test 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Tests stopped due to login failure');
    return;
  }
  
  console.log('');
  
  // Test 2: Payment methods
  const paymentMethodsSuccess = await testPaymentMethods();
  console.log('');
  
  // Test 3: Create booking
  const bookingId = await testCreateBooking();
  console.log('');
  
  // Test 4: Create payment intent (requires Transfi API keys)
  if (bookingId) {
    const paymentIntentSuccess = await testCreatePaymentIntent(bookingId);
    console.log('');
  }
  
  console.log('🧪 Tests completed!\n');
  
  if (loginSuccess && paymentMethodsSuccess) {
    console.log('✅ Transfi integration is properly configured');
    console.log('⚠️  Note: Payment intent creation requires valid Transfi API keys in .env');
  } else {
    console.log('❌ Some tests failed - check the configuration');
  }
}

runTests().catch(console.error); 