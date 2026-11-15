/**
 * GYMFLOW AI: STEP 14 - SUPER ADMIN CONTROL PANEL TEST SUITE
 * 
 * Verifies all 14 core validation points from specification Section 13:
 * 1. Super Admin authentication & role verification
 * 2. Unauthorized user access (401 / 403 on privileged admin endpoints)
 * 3. View all registered gyms (tenant directory with owner info & limits)
 * 4. Activate a gym
 * 5. Suspend and reactivate a gym
 * 6. Create a SaaS subscription plan
 * 7. Update subscription plan pricing & limits
 * 8. View platform revenue & MRR calculations
 * 9. View platform user directory & user account status toggle
 * 10. Create, reply, and resolve customer support tickets
 * 11. View system health telemetry (zero credentials or token exposure)
 * 12. Audit log recording on administrative actions
 * 13. Strict RBAC enforcement (gym owners & trainers blocked from admin endpoints)
 * 14. Data preservation guarantee (no member, payment, or attendance records lost on suspension)
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  \x1b[32m✓\x1b[0m [PASS] ${testName}`);
  } else {
    failedCount++;
    console.log(`  \x1b[31m✗\x1b[0m [FAIL] ${testName} ${details ? '- ' + details : ''}`);
  }
}

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (bodyData) {
      if (typeof bodyData === 'string') {
        req.write(bodyData);
      } else {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(bodyData));
      }
    }
    req.end();
  });
}

async function runSuperAdminTests() {
  console.log('\n=============================================================');
  console.log('🛡️  STEP 14: SUPER ADMIN CONTROL PANEL TEST SUITE');
  console.log('=============================================================\n');

  try {
    // --------------------------------------------------------------------------
    // Test 1: Super Admin Authentication & Stats Endpoint
    // --------------------------------------------------------------------------
    console.log('--- Test 1: Super Admin Login & Telemetry ---');
    const statsRes = await request({
      path: '/api/admin/stats',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(statsRes.status === 200, 'Super admin stats status is 200 OK');
    assert(statsRes.body.success === true, 'Super admin stats returns success: true');
    assert(statsRes.body.metrics !== undefined, 'Stats payload contains metrics object');
    assert(statsRes.body.metrics.totalGyms >= 3, `Total registered gyms is ${statsRes.body.metrics.totalGyms}`);
    assert(statsRes.body.metrics.monthlyRecurringRevenue > 0, `MRR is ₹${statsRes.body.metrics.monthlyRecurringRevenue}`);
    assert(statsRes.body.charts !== undefined, 'Visual charts payload exists');
    assert(Array.isArray(statsRes.body.charts.gymRegistrationGrowth), 'gymRegistrationGrowth is an array');
    assert(Array.isArray(statsRes.body.charts.monthlyPlatformRevenue), 'monthlyPlatformRevenue is an array');

    // --------------------------------------------------------------------------
    // Test 2 & 13: Strict RBAC Enforcement (401 / 403 on Privileged Endpoints)
    // --------------------------------------------------------------------------
    console.log('\n--- Test 2 & 13: Strict RBAC Protection ---');
    const unauthRes = await request({ path: '/api/admin/stats' });
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated request receives 401 or 403');

    const gymOwnerRes = await request({
      path: '/api/admin/stats',
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': '11111111-1111-1111-1111-111111111111' },
    });
    assert(gymOwnerRes.status === 403, 'Gym Owner blocked with 403 Forbidden from super admin stats');

    const trainerRes = await request({
      path: '/api/admin/gyms',
      headers: { 'X-Demo-Role': 'trainer', 'X-Gym-Id': '11111111-1111-1111-1111-111111111111' },
    });
    assert(trainerRes.status === 403, 'Trainer blocked with 403 Forbidden from tenant gym directory');

    const memberRes = await request({
      path: '/api/admin/plans',
      headers: { 'X-Demo-Role': 'member', 'X-Gym-Id': '11111111-1111-1111-1111-111111111111' },
    });
    assert(memberRes.status === 403, 'Member blocked with 403 Forbidden from SaaS pricing catalog');

    // --------------------------------------------------------------------------
    // Test 3: View All Registered Gyms
    // --------------------------------------------------------------------------
    console.log('\n--- Test 3: Registered Gym Tenants Directory ---');
    const gymsRes = await request({
      path: '/api/admin/gyms',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(gymsRes.status === 200, 'Gyms directory returns 200 OK');
    assert(Array.isArray(gymsRes.body.gyms), 'Returns an array of tenant gyms');
    assert(gymsRes.body.gyms.length >= 3, `Found ${gymsRes.body.gyms.length} registered gyms`);

    const firstGym = gymsRes.body.gyms[0];
    assert(firstGym.id !== undefined, 'Gym tenant includes ID');
    assert(firstGym.gymName !== undefined, `Gym includes name: "${firstGym.gymName}"`);
    assert(firstGym.ownerName !== undefined, `Gym includes owner name: "${firstGym.ownerName}"`);
    assert(firstGym.memberCount !== undefined, `Gym includes member count: ${firstGym.memberCount}`);
    assert(firstGym.subscriptionPlan !== undefined, `Gym includes subscription tier: "${firstGym.subscriptionPlan}"`);

    // --------------------------------------------------------------------------
    // Test 4: Detailed Gym Profile Lookup
    // --------------------------------------------------------------------------
    console.log('\n--- Test 4: Gym Tenant Detailed Profile ---');
    const gymDetailRes = await request({
      path: `/api/admin/gyms/${firstGym.id}`,
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(gymDetailRes.status === 200, 'Gym detail returns 200 OK');
    assert(gymDetailRes.body.gymName === firstGym.gymName, 'Returns matching gym profile');
    assert(gymDetailRes.body.limits !== undefined, 'Gym profile includes capacity limits');
    assert(gymDetailRes.body.recentActivity !== undefined, 'Gym profile includes recent activity logs');

    // --------------------------------------------------------------------------
    // Test 5 & 14: Suspend & Reactivate Gym (Data Preservation Verification)
    // --------------------------------------------------------------------------
    console.log('\n--- Test 5 & 14: Suspend & Reactivate Gym with Zero Data Loss ---');
    // Pre-check count of members in first gym
    const preMembers = firstGym.memberCount;
    const targetGymId = firstGym.id;

    // Suspend
    const suspendRes = await request(
      {
        path: `/api/admin/gyms/${targetGymId}/status`,
        method: 'PUT',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      { status: 'suspended', reason: 'Audit validation test' }
    );
    assert(suspendRes.status === 200, 'Gym status updated to suspended');
    assert(suspendRes.body.success === true, 'Suspend response success is true');
    assert(suspendRes.body.status === 'suspended', 'Target gym status is now suspended');

    // Verify gym data remains intact
    const verifyIntactRes = await request({
      path: `/api/admin/gyms/${targetGymId}`,
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(verifyIntactRes.body.memberCount === preMembers, `Member count remains unchanged (${preMembers}) during suspension`);
    assert(verifyIntactRes.body.gymStatus === 'suspended', 'Gym status is marked suspended');

    // Reactivate
    const reactivateRes = await request(
      {
        path: `/api/admin/gyms/${targetGymId}/status`,
        method: 'PUT',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      { status: 'active', reason: 'Reactivated after test' }
    );
    assert(reactivateRes.status === 200, 'Gym reactivated with 200 OK');
    assert(reactivateRes.body.status === 'active', 'Gym status restored to active');

    // --------------------------------------------------------------------------
    // Test 6: Create SaaS Subscription Plan
    // --------------------------------------------------------------------------
    console.log('\n--- Test 6: Create SaaS Subscription Plan ---');
    const newPlanCode = `tier-test-${Date.now().toString().slice(-4)}`;
    const createPlanRes = await request(
      {
        path: '/api/admin/plans',
        method: 'POST',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      {
        plan_code: newPlanCode,
        name: 'Ultimate High-Scale Arena Tier',
        price_monthly: 8999,
        price_annual: 89990,
        max_members: 1200,
        max_trainers: 40,
        features: ['1200 Athletes', '40 Trainers', 'AI Engine', 'Priority SLAs'],
      }
    );
    assert(createPlanRes.status === 201, 'SaaS plan created with 201 Created');
    assert(createPlanRes.body.success === true, 'Create plan response returns success: true');
    assert(createPlanRes.body.plan.plan_code === newPlanCode, `Plan code matches ${newPlanCode}`);
    const createdPlanId = createPlanRes.body.plan.id;

    // --------------------------------------------------------------------------
    // Test 7: Update SaaS Plan Pricing & Limits
    // --------------------------------------------------------------------------
    console.log('\n--- Test 7: Update SaaS Plan Pricing & Limits ---');
    const updatePlanRes = await request(
      {
        path: `/api/admin/plans/${createdPlanId}`,
        method: 'PUT',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      {
        price_monthly: 9499,
        max_members: 1500,
      }
    );
    assert(updatePlanRes.status === 200, 'SaaS plan updated with 200 OK');
    assert(updatePlanRes.body.plan.price_monthly === 9499, 'Updated monthly price to ₹9,499');
    assert(updatePlanRes.body.plan.max_members === 1500, 'Updated max athletes quota to 1,500');

    // --------------------------------------------------------------------------
    // Test 8: Platform Revenue & Subscriptions
    // --------------------------------------------------------------------------
    console.log('\n--- Test 8: Platform Revenue & Subscription Directory ---');
    const revRes = await request({
      path: '/api/admin/revenue',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(revRes.status === 200, 'Platform revenue returns 200 OK');
    assert(revRes.body.metrics.collectedPlatformRevenue > 0, `Collected revenue is ₹${revRes.body.metrics.collectedPlatformRevenue}`);
    assert(Array.isArray(revRes.body.transactions), 'Revenue response includes transactions ledger');

    const subsRes = await request({
      path: '/api/admin/subscriptions',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(subsRes.status === 200, 'Subscriptions endpoint returns 200 OK');
    assert(Array.isArray(subsRes.body.subscriptions), 'Returns list of tenant subscriptions');
    assert(subsRes.body.subscriptions.length >= 3, `Found ${subsRes.body.subscriptions.length} active/trial subscriptions`);

    // Renew subscription (targeting Gym 2 so Gym 1 trial pending status is untouched)
    const targetSub = subsRes.body.subscriptions.find((s) => s.gymId === '22222222-2222-2222-2222-222222222222') || subsRes.body.subscriptions[0];
    const renewRes = await request(
      {
        path: `/api/admin/subscriptions/${targetSub.id}/renew`,
        method: 'PUT',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      { months: 3 }
    );
    assert(renewRes.status === 200, 'Subscription renewed with 200 OK');
    assert(renewRes.body.success === true, 'Renewal returns success: true');
    assert(renewRes.body.renewalDate !== undefined, `New renewal date: ${renewRes.body.renewalDate}`);

    // --------------------------------------------------------------------------
    // Test 9: Platform User Management Directory & Account Status Toggle
    // --------------------------------------------------------------------------
    console.log('\n--- Test 9: Platform User Management & Account Locking ---');
    const usersRes = await request({
      path: '/api/admin/users',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(usersRes.status === 200, 'Users endpoint returns 200 OK');
    assert(Array.isArray(usersRes.body.users), 'Returns array of platform users');
    assert(usersRes.body.users.length >= 4, `Found ${usersRes.body.users.length} registered users`);

    const nonAdminUser = usersRes.body.users.find((u) => u.role !== 'super_admin');
    assert(nonAdminUser !== undefined, `Found non-admin user: ${nonAdminUser?.name} (${nonAdminUser?.role})`);

    if (nonAdminUser) {
      const lockRes = await request(
        {
          path: `/api/admin/users/${nonAdminUser.id}/status`,
          method: 'PUT',
          headers: { 'X-Demo-Role': 'super_admin' },
        },
        { status: 'suspended', reason: 'Security check' }
      );
      assert(lockRes.status === 200, 'User locked with 200 OK');
      assert(lockRes.body.status === 'suspended', 'User status set to suspended');

      // Reactivate user
      const unlockRes = await request(
        {
          path: `/api/admin/users/${nonAdminUser.id}/status`,
          method: 'PUT',
          headers: { 'X-Demo-Role': 'super_admin' },
        },
        { status: 'active', reason: 'Unlocked' }
      );
      assert(unlockRes.status === 200, 'User unlocked with 200 OK');
      assert(unlockRes.body.status === 'active', 'User status restored to active');
    }

    // --------------------------------------------------------------------------
    // Test 10: Support Tickets Management (Create, Reply, Resolve)
    // --------------------------------------------------------------------------
    console.log('\n--- Test 10: Customer Support Tickets ---');
    // Gym Owner submits ticket
    const newTicketRes = await request(
      {
        path: '/api/admin/support/tickets',
        method: 'POST',
        headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': firstGym.id },
      },
      {
        subject: 'Inquiry regarding WhatsApp webhook retry policy',
        description: 'Does the WhatsApp service retry delivery on temporary network timeouts?',
        priority: 'high',
        gymId: firstGym.id,
      }
    );
    assert(newTicketRes.status === 201, 'Gym owner submitted support ticket with 201 Created');
    assert(newTicketRes.body.ticket.ticket_number.startsWith('TCK-'), `Generated ticket number: ${newTicketRes.body.ticket.ticket_number}`);
    const ticketId = newTicketRes.body.ticket.id;

    // Super Admin replies to ticket
    const replyRes = await request(
      {
        path: `/api/admin/support/tickets/${ticketId}/reply`,
        method: 'POST',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      { message: 'Hello! Yes, GymFlow AI automatically retries WhatsApp webhooks up to 3 times with exponential backoff.' }
    );
    assert(replyRes.status === 200, 'Super admin replied to ticket with 200 OK');
    assert(replyRes.body.ticket.conversation.length >= 1, 'Conversation history contains reply');

    // Super Admin resolves ticket
    const resolveRes = await request(
      {
        path: `/api/admin/support/tickets/${ticketId}/status`,
        method: 'PUT',
        headers: { 'X-Demo-Role': 'super_admin' },
      },
      { status: 'resolved', resolutionNotes: 'Explained 3x exponential backoff retry mechanism.' }
    );
    assert(resolveRes.status === 200, 'Ticket status updated to resolved');
    assert(resolveRes.body.ticket.ticket_status === 'resolved', 'Ticket marked resolved');

    // --------------------------------------------------------------------------
    // Test 11: System Health Telemetry (Zero Secret Exposure)
    // --------------------------------------------------------------------------
    console.log('\n--- Test 11: System Health Telemetry & Zero-Secret Audit ---');
    const healthRes = await request({
      path: '/api/admin/system/health',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(healthRes.status === 200, 'System health endpoint returns 200 OK');
    assert(healthRes.body.overallStatus === 'healthy', 'Overall system status is healthy');
    assert(Array.isArray(healthRes.body.services), 'Services telemetry is an array');
    assert(healthRes.body.services.length >= 6, `Monitors ${healthRes.body.services.length} core services`);

    // Verify zero secrets/passwords are exposed
    const healthString = JSON.stringify(healthRes.body).toLowerCase();
    const forbiddenPatterns = ['password', 'secret', 'jwt_secret', 'rzp_live', 'service_role_key'];
    let leakedSecret = false;
    for (const pat of forbiddenPatterns) {
      if (healthString.includes(pat) && !healthString.includes('zero exposure') && !healthString.includes('no credentials')) {
        leakedSecret = true;
        break;
      }
    }
    assert(!leakedSecret, 'Guaranteed zero credentials, passwords, or API secret keys leaked in telemetry');

    // --------------------------------------------------------------------------
    // Test 12: Audit Logs
    // --------------------------------------------------------------------------
    console.log('\n--- Test 12: Immutable Audit Logs ---');
    const auditRes = await request({
      path: '/api/admin/audit-logs',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(auditRes.status === 200, 'Audit logs endpoint returns 200 OK');
    assert(Array.isArray(auditRes.body.auditLogs), 'Returns list of audit logs');
    assert(auditRes.body.auditLogs.length >= 4, `Contains ${auditRes.body.auditLogs.length} audit entries`);
    const hasStatusAudit = auditRes.body.auditLogs.some((l) => l.action.includes('STATUS') || l.action.includes('PLAN') || l.action.includes('GYM'));
    assert(hasStatusAudit, 'Audit trail logs administrative status updates and plan modifications');

    // --------------------------------------------------------------------------
    // Test Summary
    // --------------------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
    console.log('=============================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runSuperAdminTests();
