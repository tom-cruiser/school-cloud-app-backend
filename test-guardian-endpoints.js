#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// Test configuration
const tests = [];
let passedTests = 0;
let failedTests = 0;

// Helper function to add test
function test(name, fn) {
  tests.push({ name, fn });
}

// Helper function to make requests
async function request(method, endpoint, token = null, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {}
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 'ERROR',
      message: error.response?.data?.message || error.message 
    };
  }
}

// Print result
function logResult(name, passed, details) {
  const icon = passed ? '✅' : '❌';
  console.log(`\n${icon} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Tests

test('Health Check', async () => {
  const result = await request('GET', '/health');
  const passed = result.success && result.status === 200;
  logResult('Health Check', passed, passed ? 'Server is running' : `Status: ${result.status}`);
  return passed;
});

test('No Token - Should Reject', async () => {
  const result = await request('GET', '/guardians/me');
  const passed = !result.success && result.status === 401;
  logResult('No Token - Should Reject', passed, passed ? 'Properly rejected' : `Got: ${result.status}`);
  return passed;
});

test('Invalid Token - Should Reject', async () => {
  const result = await request('GET', '/guardians/me', 'invalid-token');
  const passed = !result.success && result.status === 401;
  logResult('Invalid Token - Should Reject', passed, passed ? 'Properly rejected' : `Got: ${result.status}`);
  return passed;
});

test('Subjects Endpoint - No Auth', async () => {
  const result = await request('GET', '/subjects');
  const passed = !result.success && result.status === 401;
  logResult('Subjects Endpoint - No Auth', passed, passed ? 'Properly secured' : `Got: ${result.status}`);
  return passed;
});

test('Guardian Children - No Auth', async () => {
  const result = await request('GET', '/guardians/children');
  const passed = !result.success && result.status === 401;
  logResult('Guardian Children - No Auth', passed, passed ? 'Properly secured' : `Got: ${result.status}`);
  return passed;
});

test('Guardian Grades - No Auth', async () => {
  const result = await request('GET', '/guardians/children/test-id/grades');
  const passed = !result.success && result.status === 401;
  logResult('Guardian Grades - No Auth', passed, passed ? 'Properly secured' : `Got: ${result.status}`);
  return passed;
});

test('Guardian Attendance - No Auth', async () => {
  const result = await request('GET', '/guardians/children/test-id/attendance');
  const passed = !result.success && result.status === 401;
  logResult('Guardian Attendance - No Auth', passed, passed ? 'Properly secured' : `Got: ${result.status}`);
  return passed;
});

test('Guardian Assignments - No Auth', async () => {
  const result = await request('GET', '/guardians/children/test-id/assignments');
  const passed = !result.success && result.status === 401;
  logResult('Guardian Assignments - No Auth', passed, passed ? 'Properly secured' : `Got: ${result.status}`);
  return passed;
});

// Run all tests
async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GUARDIAN API ENDPOINT TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const { name, fn } of tests) {
    try {
      const passed = await fn();
      if (passed) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      console.error(`\n❌ ${name}`);
      console.error(`   Error: ${error.message}`);
      failedTests++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Results: ${passedTests} passed, ${failedTests} failed out of ${tests.length} tests\n`);

  if (failedTests === 0) {
    console.log('✅ All tests passed!\n');
  } else {
    console.log(`❌ ${failedTests} test(s) failed\n`);
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
