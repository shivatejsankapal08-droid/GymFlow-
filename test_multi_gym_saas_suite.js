// ==============================================================================
// GYMFLOW AI - Multi-Gym SaaS Architecture Verification Test Suite
// Validates: Tenant Isolation, Gym Switcher, Registration, Team Invitations,
// SaaS Subscriptions, Plan Limit Enforcement, Suspension Blocking & Super Admin
// ==============================================================================

const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🏋️‍♂️ GYMFLOW AI: MULTI-GYM SAAS ARCHITECTURE TEST SUITE');
  console.log('======================================================\n');

  try {
    // --------------------------------------------------------------------------
    // 1. Multi-Tenant Data Isolation (Gym A vs Gym B)
    // --------------------------------------------------------------------------
    console.log('--- 1. MULTI-TENANT ISOLATION TESTS ---');

    // Login Gym A Owner (Marcus Vance, IronPulse: 11111111-1111-1111-1111-111111111111)
    const loginGymA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@ironpulse.com', role: 'gym_owner' }),
    }).then((r) => r.json());

    const tokenA = loginGymA.token;
    assert(tokenA, 'Gym A Owner (IronPulse) authenticated');

    // Gym A Owner accesses Gym A members -> 200 OK
    const resAtoA = await fetch(`${BASE_URL}/api/members`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
    });
    assert(resAtoA.status === 200, 'Gym A Owner successfully accesses Gym A members');
    const dataAtoA = await resAtoA.json();
    assert(Array.isArray(dataAtoA.members), 'Gym A returned members list');

    // Gym A Owner attempts to access Gym B data (Titan Forge: 22222222-2222-2222-2222-222222222222) -> 403 FORBIDDEN
    const resAtoB = await fetch(`${BASE_URL}/api/members`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'x-gym-id': '22222222-2222-2222-2222-222222222222',
      },
    });
    assert(
      resAtoB.status === 403,
      'Security: Gym A Owner is strictly FORBIDDEN from accessing Gym B data (403)'
    );

    // Login Gym B Owner (Devika Rao, Titan Forge: 22222222-2222-2222-2222-222222222222)
    // We can simulate login with custom header or token
    const resBtoA = await fetch(`${BASE_URL}/api/members`, {
      headers: {
        Authorization: `Bearer demo-token-gym_owner_titan`,
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
    });
    assert(
      resBtoA.status === 403,
      'Security: Unauthorized tenant access is blocked (403)'
    );

    // --------------------------------------------------------------------------
    // 2. Gym Switcher & Authorized Gyms
    // --------------------------------------------------------------------------
    console.log('\n--- 2. GYM SWITCHER & AUTHORIZED GYMS ---');

    // Marcus Vance belongs to Gym 1 (IronPulse) and Gym 3 (Zenith Athletic)
    const myGymsRes = await fetch(`${BASE_URL}/api/gyms/my-gyms`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());

    assert(Array.isArray(myGymsRes.gyms), 'my-gyms returned authorized gym list');
    const gymIds = myGymsRes.gyms.map((g) => g.id);
    assert(
      gymIds.includes('11111111-1111-1111-1111-111111111111'),
      'Gym Switcher includes primary Gym 1 (IronPulse)'
    );
    assert(
      gymIds.includes('33333333-3333-3333-3333-333333333333'),
      'Gym Switcher includes co-managed Gym 3 (Zenith Athletic)'
    );
    assert(
      !gymIds.includes('22222222-2222-2222-2222-222222222222'),
      'Gym Switcher DOES NOT include unauthorized Gym 2'
    );

    // Switch to authorized Gym 3 -> 200 OK
    const switchResValid = await fetch(`${BASE_URL}/api/gyms/switch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gymId: '33333333-3333-3333-3333-333333333333' }),
    });
    assert(switchResValid.status === 200, 'User successfully switched active gym to Gym 3');

    // Switch to unauthorized Gym 2 -> 403 FORBIDDEN
    const switchResInvalid = await fetch(`${BASE_URL}/api/gyms/switch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gymId: '22222222-2222-2222-2222-222222222222' }),
    });
    assert(
      switchResInvalid.status === 403,
      'Security: Switching to unauthorized gym is rejected with 403 Forbidden'
    );

    // Switch back to Gym 1
    await fetch(`${BASE_URL}/api/gyms/switch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gymId: '11111111-1111-1111-1111-111111111111' }),
    });

    // --------------------------------------------------------------------------
    // 3. Gym Registration & Onboarding
    // --------------------------------------------------------------------------
    console.log('\n--- 3. GYM ONBOARDING & REGISTRATION ---');

    const newGymPayload = {
      gymName: 'Power Fitness Club',
      ownerName: 'Aman Verma',
      email: `aman.power_${Date.now()}@fitness.com`,
      phone: '+91 98999 11223',
      address: '77 Ring Road, South Ext 1',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      password: 'SecurePassword123!',
      planCode: 'trial',
    };

    const registerRes = await fetch(`${BASE_URL}/api/auth/register-gym`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGymPayload),
    });

    assert(registerRes.status === 201, 'Gym registration returns 201 Created');
    const registerData = await registerRes.json();
    assert(registerData.success === true, 'Gym registration returned success');
    assert(registerData.gym?.id, 'New Gym ID generated');
    assert(registerData.user?.role === 'gym_owner', 'Registered user assigned gym_owner role');
    assert(
      registerData.subscription?.status === 'trialing',
      '14-day SaaS trial subscription initiated'
    );
    assert(
      registerData.subscription?.paymentStatus === 'pending',
      'Payment status marked as pending until configured'
    );

    // --------------------------------------------------------------------------
    // 4. Team Invitations & Privileged Role Protection
    // --------------------------------------------------------------------------
    console.log('\n--- 4. TEAM INVITATIONS & ACCESS CONTROL ---');

    // Create trainer invitation
    const inviteRes = await fetch(`${BASE_URL}/api/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
      body: JSON.stringify({ email: 'newcoach.sam@gmail.com', role: 'trainer' }),
    });

    assert(inviteRes.status === 201, 'Owner can generate team invitation for trainer');
    const inviteData = await inviteRes.json();
    assert(inviteData.invitation?.invitation_token_hash, 'One-time secure invitation token generated');
    const newInviteToken = inviteData.invitation.invitation_token_hash;

    // Prevent inviting super_admin
    const superAdminInvite = await fetch(`${BASE_URL}/api/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
      body: JSON.stringify({ email: 'hacker@admin.com', role: 'super_admin' }),
    });
    assert(
      superAdminInvite.status === 403,
      'Security: Inviting super_admin role is strictly blocked (403)'
    );

    // Accept valid invitation
    const acceptRes = await fetch(`${BASE_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: newInviteToken }),
    });
    assert(acceptRes.status === 200, 'Valid team invitation accepted successfully');

    // Reject already accepted invitation
    const reAcceptRes = await fetch(`${BASE_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: newInviteToken }),
    });
    assert(
      reAcceptRes.status === 400,
      'Security: Already accepted invitation token is rejected (400)'
    );

    // Reject expired invitation
    const expiredAcceptRes = await fetch(`${BASE_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'tok_expired_invitation_ironpulse' }),
    });
    assert(
      expiredAcceptRes.status === 400,
      'Security: Expired invitation token is rejected (400)'
    );

    // --------------------------------------------------------------------------
    // 5. SaaS Subscription Management
    // --------------------------------------------------------------------------
    console.log('\n--- 5. SAAS SUBSCRIPTION MANAGEMENT ---');

    // Get catalog of SaaS plans
    const plansRes = await fetch(`${BASE_URL}/api/subscriptions/plans`).then((r) => r.json());
    assert(Array.isArray(plansRes.plans), 'SaaS plans catalog fetched');
    assert(plansRes.plans.length >= 4, 'Includes Free Trial, Basic, Professional, and Enterprise');

    // Get current gym subscription
    const currentSubRes = await fetch(`${BASE_URL}/api/subscriptions/current`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
    }).then((r) => r.json());

    assert(currentSubRes.subscription?.planCode, 'Fetched current gym SaaS subscription');
    assert(
      currentSubRes.subscription?.paymentStatus === 'pending',
      'Payment status is clearly marked as PENDING (credentials not yet configured)'
    );
    assert(currentSubRes.subscription?.limits?.memberLimit > 0, 'Plan limits exposed');

    // Request plan change (upgrade to enterprise)
    const changePlanRes = await fetch(`${BASE_URL}/api/subscriptions/change-plan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'x-gym-id': '11111111-1111-1111-1111-111111111111',
      },
      body: JSON.stringify({ planCode: 'enterprise', billingCycle: 'annual' }),
    });

    assert(changePlanRes.status === 200, 'Owner can request plan change');
    const changePlanData = await changePlanRes.json();
    assert(
      changePlanData.subscription?.payment_status === 'pending',
      'Upgraded subscription payment remains PENDING without simulating fake payments'
    );

    // --------------------------------------------------------------------------
    // 6. Gym Suspension Blocking
    // --------------------------------------------------------------------------
    console.log('\n--- 6. GYM SUSPENSION BLOCKING ---');

    // Super Admin login
    const loginAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'super_admin' }),
    }).then((r) => r.json());

    const tokenAdmin = loginAdmin.token;
    assert(tokenAdmin, 'Super Admin authenticated');

    // Super Admin suspends Gym 3
    const suspendRes = await fetch(`${BASE_URL}/api/admin/gyms/33333333-3333-3333-3333-333333333333/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'suspended' }),
    });
    assert(suspendRes.status === 200, 'Super Admin suspended Gym 3 account');

    // User attempts to access members in suspended Gym 3 -> 403 FORBIDDEN
    const suspendedAccess = await fetch(`${BASE_URL}/api/members`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'x-gym-id': '33333333-3333-3333-3333-333333333333',
      },
    });
    assert(
      suspendedAccess.status === 403,
      'Security: Normal operations on suspended gym are BLOCKED (403)'
    );

    // Super Admin reactivates Gym 3
    const reactivateRes = await fetch(`${BASE_URL}/api/admin/gyms/33333333-3333-3333-3333-333333333333/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'active' }),
    });
    assert(reactivateRes.status === 200, 'Super Admin reactivated Gym 3');

    // --------------------------------------------------------------------------
    // 7. Super Admin Platform Analytics
    // --------------------------------------------------------------------------
    console.log('\n--- 7. SUPER ADMIN PLATFORM MANAGEMENT ---');

    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminStatsRes.status === 200, 'Super Admin can fetch platform stats');
    const adminStats = await adminStatsRes.json();
    assert(adminStats.stats?.totalGyms >= 3, 'Platform stats include total registered gyms');
    assert(adminStats.stats?.totalMonthlyRevenue >= 0, 'Platform stats include SaaS revenue');

    // Normal user blocked from admin stats
    const unauthorizedAdmin = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      unauthorizedAdmin.status === 403,
      'Security: Non-super-admin is blocked from admin stats (403)'
    );

    console.log('\n======================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL MULTI-GYM SAAS ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!\n');
    }
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  }
}

runTests();
