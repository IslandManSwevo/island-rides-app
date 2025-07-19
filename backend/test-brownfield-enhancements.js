const axios = require('axios');
const BASE_URL = 'http://localhost:3003/api';
let authToken = '';

async function login() {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email: 'test@example.com', password: 'Password123!' });
  authToken = response.data.token;
}

async function testHostVerificationFlow() {
  await login();
  const session = await axios.post(`${BASE_URL}/verification/sessions`, { type: 'government_id' }, { headers: { Authorization: `Bearer ${authToken}` } });
  // Simulate upload and verification
  const verification = await axios.post(`${BASE_URL}/verification/complete`, { session_id: session.data.session_id, status: 'verified' });
  console.log('Host verification flow:', verification.data);
}

async function testSearchFlow() {
  const search = await axios.get(`${BASE_URL}/search/vehicles?query=toyota&location=nassau`);
  console.log('Search results:', search.data.length);
}

// Add more E2E tests for document management, storefront creation, etc.

async function runE2ETests() {
  await testHostVerificationFlow();
  await testSearchFlow();
  console.log('E2E tests completed');
}

runE2ETests().catch(console.error);