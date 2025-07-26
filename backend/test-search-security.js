/**
 * Security Test for Vehicle Search Endpoint
 * Tests the SQL injection vulnerability fixes
 */

const axios = require('axios');

// Test cases for SQL injection attempts
const maliciousInputs = [
  // SQL injection attempts
  { location: "'; DROP TABLE vehicles; --" },
  { location: "' OR '1'='1" },
  { vehicleType: "car'; DELETE FROM users; --" },
  { sortBy: "price_low'; DROP TABLE bookings; --" },
  { features: "1,2,3'; INSERT INTO admin_users VALUES ('hacker'); --" },
  
  // XSS attempts
  { location: "<script>alert('xss')</script>" },
  { vehicleType: "javascript:alert('xss')" },
  
  // Invalid data types
  { seatingCapacity: "not_a_number" },
  { minPrice: "invalid_price" },
  { page: "-1" },
  { limit: "999999" },
  
  // Boundary testing
  { seatingCapacity: "999" },
  { minPrice: "-100" },
  { maxPrice: "999999" },
  { page: "0" },
  { limit: "0" },
];

// Valid test cases
const validInputs = [
  { location: "Nassau" },
  { vehicleType: "car" },
  { fuelType: "gasoline" },
  { transmissionType: "automatic" },
  { seatingCapacity: "4" },
  { minPrice: "50" },
  { maxPrice: "200" },
  { sortBy: "price_low" },
  { page: "1" },
  { limit: "10" },
];

async function testSearchSecurity() {
  const baseUrl = 'http://localhost:3000/api/vehicles/search';
  
  console.log('🔒 Testing SQL Injection Protection...\n');
  
  // Test malicious inputs
  for (const input of maliciousInputs) {
    try {
      const params = new URLSearchParams(input);
      const response = await axios.get(`${baseUrl}?${params}`, {
        headers: {
          'Authorization': 'Bearer test_token' // You'll need a valid token
        },
        timeout: 5000
      });
      
      console.log(`❌ SECURITY ISSUE: Malicious input accepted:`, input);
      console.log(`Response status: ${response.status}`);
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`✅ PROTECTED: Malicious input rejected:`, input);
      } else if (error.response && error.response.status === 401) {
        console.log(`🔐 AUTH REQUIRED: Need valid token for:`, input);
      } else {
        console.log(`⚠️  UNEXPECTED ERROR for:`, input, error.message);
      }
    }
  }
  
  console.log('\n✅ Testing Valid Inputs...\n');
  
  // Test valid inputs
  for (const input of validInputs) {
    try {
      const params = new URLSearchParams(input);
      const response = await axios.get(`${baseUrl}?${params}`, {
        headers: {
          'Authorization': 'Bearer test_token' // You'll need a valid token
        },
        timeout: 5000
      });
      
      console.log(`✅ VALID: Input accepted:`, input);
      
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`🔐 AUTH REQUIRED: Need valid token for:`, input);
      } else {
        console.log(`❌ UNEXPECTED ERROR for valid input:`, input, error.message);
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting Security Tests for Vehicle Search Endpoint\n');
  console.log('Note: You need a running server and valid JWT token for full testing\n');
  
  testSearchSecurity()
    .then(() => {
      console.log('\n🏁 Security testing completed!');
      console.log('\n📋 Summary:');
      console.log('- All malicious inputs should be rejected with 400 status');
      console.log('- Valid inputs should be accepted (or require auth)');
      console.log('- No SQL injection vulnerabilities should exist');
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
    });
}

module.exports = { testSearchSecurity, maliciousInputs, validInputs };
