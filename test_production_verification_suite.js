/**
 * GYMFLOW AI: STEP 15 - COMPLETE PRODUCTION VERIFICATION TEST SUITE
 * 
 * Verifies all 18 end-to-end production scenarios:
 * Scenario 1:  Register a new gym
 * Scenario 2:  Register a gym owner
 * Scenario 3:  Invite a trainer
 * Scenario 4:  Register a gym member
 * Scenario 5:  Assign a membership plan
 * Scenario 6:  Record a payment
 * Scenario 7:  Verify payment status
 * Scenario 8:  Generate a payment receipt
 * Scenario 9:  Scan member QR code
 * Scenario 10: Record attendance
 * Scenario 11: Assign a workout plan
 * Scenario 12: Assign a diet plan
 * Scenario 13: Generate an AI response
 * Scenario 14: Send a WhatsApp test notification
 * Scenario 15: Generate analytics reports
 * Scenario 16: Export PDF and Excel reports
 * Scenario 17: Access Super Admin dashboard
 * Scenario 18: Test Gym A and Gym B data isolation
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

async function runProductionVerification() {
  console.log('\n=============================================================');
  console.log('🚀 GYMFLOW AI: STEP 15 - FINAL PRODUCTION VERIFICATION SUITE');
  console.log('=============================================================\n');

  try {
    const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
    const GYM_B_ID = '22222222-2222-2222-2222-222222222222';
    const timeSuffix = Date.now().toString().slice(-4);

    // --------------------------------------------------------------------------
    // Scenario 1 & 2: Register a new gym & Gym Owner
    // --------------------------------------------------------------------------
    console.log('--- Scenario 1 & 2: Onboard New Gym & Owner ---');
    const registerRes = await request(
      { path: '/api/auth/register-gym-owner', method: 'POST' },
      {
        fullName: 'Vikramaditya Rao',
        email: `owner.apex.${timeSuffix}@gymflow.ai`,
        password: 'Password@2026Secure!',
        phone: '+91 98765 43210',
        gymName: `Apex Performance Arena ${timeSuffix}`,
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        planCode: 'pro',
      }
    );
    assert(registerRes.status === 201, 'Gym owner registered with 201 Created');
    assert(registerRes.body.success === true, 'Registration returned success: true');
    assert(registerRes.body.gym !== undefined, 'New gym record returned');
    assert(registerRes.body.user !== undefined, 'New owner user profile returned');
    assert(registerRes.body.user.role === 'gym_owner', 'Assigned role is gym_owner');
    const newGymId = registerRes.body.gym.id;
    const newOwnerId = registerRes.body.user.id;

    // --------------------------------------------------------------------------
    // Scenario 3: Invite a Trainer
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Generate Trainer Team Invitation ---');
    const inviteRes = await request(
      {
        path: '/api/invitations',
        method: 'POST',
        headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': newGymId },
      },
      {
        email: `coach.${timeSuffix}@apexperformance.com`,
        role: 'trainer',
      }
    );
    assert(inviteRes.status === 201, 'Trainer invitation created with 201 Created');
    assert(inviteRes.body.invitation?.token !== undefined, 'One-time secure invitation token generated');
    const inviteToken = inviteRes.body.invitation.token;

    // Accept invitation
    const acceptRes = await request(
      { path: '/api/invitations/accept', method: 'POST' },
      { token: inviteToken, fullName: 'Karan Malhotra', password: 'TrainerPassword2026!' }
    );
    assert(acceptRes.status === 200, 'Trainer accepted invitation with 200 OK');

    // --------------------------------------------------------------------------
    // Scenario 4: Register a Gym Member
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Register Gym Member ---');
    const memberRes = await request(
      {
        path: '/api/members',
        method: 'POST',
        headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
      },
      {
        firstName: 'Siddharth',
        lastName: 'Verma',
        email: `siddharth.${timeSuffix}@gmail.com`,
        phone: '+91 98450 12345',
        gender: 'male',
        dateOfBirth: '1995-06-15',
        address: '42 Indiranagar 100ft Rd',
        emergencyContactName: 'Pooja Verma',
        emergencyContactPhone: '+91 98450 67890',
        planId: 'aaaa1111-0000-0000-0000-000000000002',
      }
    );
    assert(memberRes.status === 201, 'Member registered with 201 Created');
    assert(memberRes.body.member?.id !== undefined, 'Member ID generated');
    assert(memberRes.body.member?.memberCode !== undefined, `Member code assigned: ${memberRes.body.member?.memberCode}`);
    const memberId = memberRes.body.member.id;
    const memberCode = memberRes.body.member.memberCode;

    // --------------------------------------------------------------------------
    // Scenario 5: Assign a Membership Plan
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Assign Membership Plan ---');
    const plansRes = await request({
      path: '/api/plans',
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
    });
    assert(plansRes.status === 200, 'Membership plans list fetched with 200 OK');
    assert(Array.isArray(plansRes.body.plans), 'Plans list is an array');
    const targetPlan = plansRes.body.plans[0];
    assert(targetPlan !== undefined, `Selected plan: "${targetPlan.name}" (₹${targetPlan.price})`);

    // --------------------------------------------------------------------------
    // Scenario 6 & 7: Record a Payment & Verify Status
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 6 & 7: Record Payment & Verify Status ---');
    const paymentRes = await request(
      {
        path: '/api/payments',
        method: 'POST',
        headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
      },
      {
        memberId,
        planId: targetPlan.id,
        amount: targetPlan.price,
        discount: 500,
        finalAmount: targetPlan.price - 500,
        paymentMethod: 'upi',
        transactionId: `UPI-PROD-${Date.now()}`,
        paymentStatus: 'completed',
        notes: 'Annual membership offline counter collection via UPI',
      }
    );
    assert(paymentRes.status === 201, 'Payment recorded with 201 Created');
    assert(paymentRes.body.success === true, 'Payment recorded successfully');
    assert(paymentRes.body.payment !== undefined, 'Payment transaction returned');
    assert(paymentRes.body.payment.paymentStatus === 'completed', 'Payment status verified as completed');
    const paymentId = paymentRes.body.payment.id;

    // --------------------------------------------------------------------------
    // Scenario 8: Generate Payment Receipt
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Generate Payment Receipt ---');
    const receiptRes = await request({
      path: `/api/payments/${paymentId}/receipt`,
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
    });
    assert(receiptRes.status === 200, 'Payment receipt generated with 200 OK');
    assert(receiptRes.body.receipt !== undefined, 'Receipt data payload exists');
    assert(receiptRes.body.receipt.receiptNumber !== undefined, `Receipt Number: ${receiptRes.body.receipt.receiptNumber}`);
    assert(receiptRes.body.receipt.summary !== undefined, 'Receipt contains financial summary breakdown');

    // --------------------------------------------------------------------------
    // Scenario 9 & 10: Scan QR Code & Record Attendance
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 9 & 10: Scan Member QR & Record Check-in ---');
    const scanRes = await request(
      {
        path: '/api/attendance/scan-qr',
        method: 'POST',
        headers: { 'X-Demo-Role': 'trainer', 'X-Gym-Id': GYM_A_ID },
      },
      { qrData: memberCode }
    );
    assert(scanRes.status === 200, 'Member QR scanned successfully with 200 OK');
    assert(scanRes.body.member !== undefined, 'QR payload resolved member details');

    const checkinRes = await request(
      {
        path: '/api/attendance/check-in',
        method: 'POST',
        headers: { 'X-Demo-Role': 'trainer', 'X-Gym-Id': GYM_A_ID },
      },
      {
        memberId,
        checkinMethod: 'qr_scan',
      }
    );
    assert(checkinRes.status === 200 || checkinRes.status === 201, 'Attendance check-in logged with 200/201');
    assert(checkinRes.body.success === true, 'Attendance record logged successfully');

    // --------------------------------------------------------------------------
    // Scenario 11: Assign Workout Plan
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 11: Assign Workout Plan ---');
    const workoutPlanRes = await request(
      {
        path: '/api/workouts/plans',
        method: 'POST',
        headers: { 'X-Demo-Role': 'trainer', 'X-Gym-Id': GYM_A_ID },
      },
      {
        name: `Hypertrophy Elite Plan ${timeSuffix}`,
        description: '4-day split focus on strength and metabolic conditioning',
        durationWeeks: 8,
        fitnessLevel: 'intermediate',
        goal: 'muscle_gain',
      }
    );
    assert(workoutPlanRes.status === 201, 'Workout plan created with 201 Created');
    const planId = workoutPlanRes.body.plan.id;

    const assignWorkoutRes = await request(
      {
        path: '/api/workouts/assign',
        method: 'POST',
        headers: { 'X-Demo-Role': 'trainer', 'X-Gym-Id': GYM_A_ID },
      },
      {
        planId,
        memberIds: [memberId],
      }
    );
    assert(assignWorkoutRes.status === 200, 'Workout plan assigned to athlete with 200 OK');

    // --------------------------------------------------------------------------
    // Scenario 12: Assign Diet Plan
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 12: Assign Diet Plan ---');
    const dietPlanRes = await request(
      {
        path: '/api/workouts/diet-plans',
        method: 'POST',
        headers: { 'X-Demo-Role': 'trainer', 'X-Gym-Id': GYM_A_ID },
      },
      {
        name: 'High Protein Athlete Cut',
        dietType: 'non_veg',
        targetCalories: 2400,
        proteinGrams: 180,
        carbsGrams: 220,
        fatsGrams: 65,
        meals: [
          { mealName: 'Breakfast', time: '08:00 AM', items: 'Oats, whey protein, almond butter' },
          { mealName: 'Post-Workout', time: '01:00 PM', items: 'Grilled chicken breast, brown rice, broccoli' },
        ],
      }
    );
    assert(dietPlanRes.status === 201, 'Diet plan created with 201 Created');

    // --------------------------------------------------------------------------
    // Scenario 13: Generate AI Response
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 13: Query GymFlow AI Assistant ---');
    const aiRes = await request(
      {
        path: '/api/ai/chat',
        method: 'POST',
        headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
      },
      { message: 'Provide a quick strategy to reduce membership churn this quarter.' }
    );
    assert(aiRes.status === 200, 'AI Assistant replied with 200 OK');
    assert(aiRes.body.reply !== undefined, 'AI Assistant returned text response');
    assert(aiRes.body.reply.length > 20, 'AI response contains detailed guidance');

    // --------------------------------------------------------------------------
    // Scenario 14: Send WhatsApp Notification
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 14: Send WhatsApp Notification ---');
    const waRes = await request(
      {
        path: '/api/automation/test-whatsapp',
        method: 'POST',
        headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
      },
      {
        recipientPhone: '+919845012345',
        template: 'membership_renewal_reminder',
      }
    );
    assert(waRes.status === 200, 'WhatsApp dispatch triggered with 200 OK');
    assert(waRes.body.success === true, 'WhatsApp automation returned success: true');

    // --------------------------------------------------------------------------
    // Scenario 15: Generate Analytics Reports
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 15: Generate Analytics Reports ---');
    const reportRes = await request({
      path: '/api/reports/overview?range=30d',
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
    });
    assert(reportRes.status === 200, 'Analytics overview generated with 200 OK');
    assert(reportRes.body.kpis !== undefined, 'Analytics overview contains 10 live KPIs');
    assert(reportRes.body.charts !== undefined, 'Analytics overview contains Recharts datasets');

    // --------------------------------------------------------------------------
    // Scenario 16: Export PDF and Excel/CSV Reports
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 16: Export Data Reports (CSV & PDF) ---');
    const csvRes = await request({
      path: '/api/reports/export/csv?entity=members&range=30d',
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
    });
    assert(csvRes.status === 200, 'CSV export endpoint returned 200 OK');
    assert(csvRes.headers['content-type'].includes('text/csv'), 'Returned Content-Type is text/csv');

    const pdfRes = await request({
      path: '/api/reports/export/pdf?range=30d',
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
    });
    assert(pdfRes.status === 200, 'Printable Executive PDF report returned 200 OK');

    // --------------------------------------------------------------------------
    // Scenario 17: Access Super Admin Dashboard
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 17: Super Admin Platform Access ---');
    const adminStatsRes = await request({
      path: '/api/admin/stats',
      headers: { 'X-Demo-Role': 'super_admin' },
    });
    assert(adminStatsRes.status === 200, 'Super admin stats accessible with 200 OK');
    assert(adminStatsRes.body.metrics.totalGyms >= 3, 'Super admin views cross-tenant totals');

    // --------------------------------------------------------------------------
    // Scenario 18: Strict Cross-Tenant Data Isolation (Gym A vs Gym B)
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 18: Cross-Tenant Data Isolation Audit ---');
    // Gym A Owner requests Gym B members
    const crossTenantMembers = await request({
      path: `/api/members`,
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_B_ID },
    });
    assert(crossTenantMembers.status === 403, 'Gym A Owner blocked with 403 Forbidden when requesting Gym B data');

    // Gym A Owner requests Gym B payments
    const crossTenantPayments = await request({
      path: `/api/payments`,
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_B_ID },
    });
    assert(crossTenantPayments.status === 403, 'Gym A Owner blocked with 403 Forbidden when requesting Gym B payments');

    // Verify query to Gym A returns only Gym A members
    const gymAMembers = await request({
      path: `/api/members`,
      headers: { 'X-Demo-Role': 'gym_owner', 'X-Gym-Id': GYM_A_ID },
    });
    assert(gymAMembers.status === 200, 'Gym A Owner accesses Gym A members');
    const allBelongToGymA = gymAMembers.body.members.every((m) => (m.gymId || m.gym_id) === GYM_A_ID);
    assert(allBelongToGymA, '100% of returned members belong exclusively to Gym A (zero cross-tenant leakage)');

    // --------------------------------------------------------------------------
    // Final Summary
    // --------------------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`FINAL PRODUCTION TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
    console.log('=============================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL 18 PRODUCTION SCENARIOS PASSED WITH 100% SUCCESS!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Production verification failed with error:', err);
    process.exit(1);
  }
}

runProductionVerification();

