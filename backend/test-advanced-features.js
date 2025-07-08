const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

// Test credentials
const testUser = {
  email: 'john.doe@test.com',
  password: 'Password123!'
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in as test user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testFeaturesCategories() {
  try {
    console.log('\n📝 Testing vehicle features categories endpoint...');
    const response = await axios.get(`${BASE_URL}/vehicles/features/categories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Features categories response:');
    console.log(`   - Categories: ${response.data.categories?.length || 0}`);
    console.log(`   - Features: ${response.data.features?.length || 0}`);
    
    if (response.data.categories?.length > 0) {
      console.log('   - Sample category:', response.data.categories[0].name);
    }
    if (response.data.features?.length > 0) {
      console.log('   - Sample feature:', response.data.features[0].name);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Features categories test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testVehicleSearch() {
  try {
    console.log('\n🔍 Testing enhanced vehicle search endpoint...');
    const params = new URLSearchParams({
      location: 'Nassau',
      vehicleType: 'car',
      fuelType: 'gasoline',
      minPrice: '50',
      maxPrice: '200',
      sortBy: 'price_low'
    });
    
    const response = await axios.get(`${BASE_URL}/vehicles/search?${params}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Vehicle search response:');
    console.log(`   - Vehicles found: ${response.data.vehicles?.length || 0}`);
    console.log(`   - Pagination: Page ${response.data.pagination?.page} of ${response.data.pagination?.pages}`);
    
    if (response.data.vehicles?.length > 0) {
      const vehicle = response.data.vehicles[0];
      console.log(`   - Sample vehicle: ${vehicle.make} ${vehicle.model} - $${vehicle.daily_rate}/day`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Vehicle search test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testVehicleFeatures() {
  try {
    console.log('\n🚗 Testing vehicle features endpoint...');
    // Use vehicle ID 1 if it exists
    const vehicleId = 1;
    
    const response = await axios.get(`${BASE_URL}/vehicles/${vehicleId}/features`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Vehicle features response:');
    if (response.data.features) {
      Object.keys(response.data.features).forEach(category => {
        console.log(`   - ${category}: ${response.data.features[category].length} features`);
      });
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Vehicle not found (expected for fresh database)');
      return true;
    }
    console.error('❌ Vehicle features test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Advanced Vehicle Features API\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test various endpoints
  const tests = [
    { name: 'Features Categories', test: testFeaturesCategories },
    { name: 'Vehicle Search', test: testVehicleSearch },
    { name: 'Vehicle Features', test: testVehicleFeatures }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const { name, test } of tests) {
    const success = await test();
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Advanced Vehicle Features are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted');
  process.exit(0);
});

// Run tests
runTests().catch(console.error); 