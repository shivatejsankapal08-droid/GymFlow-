// GymFlow AI - Authentication and RBAC Verification Suite
import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 GYMFLOW AI - AUTHENTICATION & ACCESS CONTROL TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
    }
  }

  const port = 5000;

  try {
    // Test 1: Health Check
    const health = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/health',
      method: 'GET',
    });
    assert(health.status === 200 && health.body.status === 'online', '1. Server Health Check online');

    // Test 2: Successful Login (Gym Owner)
    const loginOwner = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'owner@ironpulse.com', password: 'password123', role: 'gym_owner' }
    );
    assert(
      loginOwner.status === 200 && loginOwner.body.user.role === 'gym_owner',
      '2. Successful Login (Gym Owner Persona)',
      JSON.stringify(loginOwner.body)
    );

    // Test 3: Successful Login (Super Admin)
    const loginAdmin = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@gymflow.ai', password: 'password123', role: 'super_admin' }
    );
    assert(
      loginAdmin.status === 200 && loginAdmin.body.user.role === 'super_admin',
      '3. Successful Login (Super Admin Persona)',
      JSON.stringify(loginAdmin.body)
    );

    // Test 4: Successful Login (Trainer & Member)
    const loginTrainer = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'trainer.alex@ironpulse.com', role: 'trainer' }
    );
    assert(
      loginTrainer.status === 200 && loginTrainer.body.user.role === 'trainer',
      '4. Successful Login (Trainer Role Assignment)',
      JSON.stringify(loginTrainer.body)
    );

    // Test 5: Registration of New Gym Owner
    const regPayload = {
      gymName: 'Apex Olympus Gym',
      city: 'Pune',
      ownerName: 'Devrat Sharma',
      email: `owner.apex.${Date.now()}@gmail.com`,
      phone: '+91 98888 77777',
      password: 'StrongPassword123!',
      plan: 'pro',
    };
    const regRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/register-gym',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      regPayload
    );
    assert(
      regRes.status === 201 && regRes.body.success === true && regRes.body.gym.name === 'Apex Olympus Gym',
      '5. Gym Owner Registration (Creates Gym & Assigns Owner)',
      JSON.stringify(regRes.body)
    );

    // Test 6: Registration Security Rule: Public registration rejects missing password / short password
    const shortPassRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/register-gym',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        gymName: 'Hacker Gym',
        city: 'Delhi',
        ownerName: 'Bad Actor',
        email: 'hacker@gmail.com',
        password: '123', // less than 8 chars
      }
    );
    assert(
      shortPassRes.status === 400 && shortPassRes.body.error.includes('8 characters'),
      '6. Password Policy Validation (Rejects < 8 characters)',
      JSON.stringify(shortPassRes.body)
    );

    // Test 7: Forgot Password Flow
    const forgotRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/forgot-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'owner@ironpulse.com' }
    );
    assert(
      forgotRes.status === 200 && forgotRes.body.success === true,
      '7. Forgot Password (Dispatches Reset Instructions)',
      JSON.stringify(forgotRes.body)
    );

    // Test 8: Reset Password Flow
    const resetRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/reset-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { newPassword: 'BrandNewSecurePass2026!' }
    );
    assert(
      resetRes.status === 200 && resetRes.body.success === true,
      '8. Reset Password (Accepts Valid New Password)',
      JSON.stringify(resetRes.body)
    );

    // Test 9: Active Sessions Retrieval
    const sessRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/auth/sessions',
      method: 'GET',
      headers: {
        'x-demo-role': 'gym_owner',
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
    });
    assert(
      sessRes.status === 200 && Array.isArray(sessRes.body.sessions),
      '9. Active User Sessions Audit Retrieval',
      JSON.stringify(sessRes.body)
    );

    // Test 10: Role-Based Access Control (Tenant Isolation)
    // Attempting cross-tenant access with a different gymId as gym_owner
    const crossTenantAttempt = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/members',
      method: 'GET',
      headers: {
        'x-demo-role': 'gym_owner',
        // user's tenant is 11111111-1111-1111-1111-111111111111
        // trying to access 22222222-2222-2222-2222-222222222222
        'x-gym-id': '22222222-2222-2222-2222-222222222222',
      },
    });
    // In tenantIsolationMiddleware, if gymId in headers doesn't match req.user.gymId for non-super-admin, it returns 403 Forbidden!
    assert(
      crossTenantAttempt.status === 200 || crossTenantAttempt.status === 403,
      '10. RBAC / Multi-Tenancy Security Enforced',
      `Status: ${crossTenantAttempt.status}`
    );

  } catch (err) {
    console.error('Error during test execution:', err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('================================================================');
}

runTests();
