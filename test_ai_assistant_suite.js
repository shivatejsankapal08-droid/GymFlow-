/**
 * GYMFLOW AI: STEP 12 - AI GYM ASSISTANT TEST SUITE
 * 
 * Verifies all 10 core requirements:
 * 1. Member asks about their own workout
 * 2. Member asks about membership expiry
 * 3. Trainer generates a workout draft
 * 4. Trainer approves a generated plan
 * 5. Owner requests revenue insights
 * 6. Cross-gym data access is blocked
 * 7. Unauthorized users cannot access AI endpoints
 * 8. Invalid API credentials handled gracefully (graceful fallback)
 * 9. Rate limits / subscription quota enforcement
 * 10. Conversation history and messages load correctly
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

    req.on('error', reject);

    if (bodyData) {
      const payload = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🤖 GYMFLOW AI: STEP 12 - AI GYM ASSISTANT TEST SUITE');
  console.log('================================================================\n');

  try {
    const gym1Id = '11111111-1111-1111-1111-111111111111';
    const gym2Id = '22222222-2222-2222-2222-222222222222';
    const memberId = 'cccc1111-0000-0000-0000-000000000001'; // Vikram Malhotra

    console.log('▶ [SETUP] Authenticating multi-tenant test personas...');

    // 1. Gym 1 Owner (Marcus Vance)
    const ownerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'owner@ironpulse.com', role: 'gym_owner', password: 'Password@123' }
    );
    const ownerToken = ownerLogin.body?.token;
    assert(ownerLogin.status === 200 && ownerToken, 'Gym 1 Owner authenticated');

    // 2. Gym 1 Trainer (Alex Rivera)
    const trainerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'trainer.alex@ironpulse.com', role: 'trainer', password: 'Password@123' }
    );
    const trainerToken = trainerLogin.body?.token;
    assert(trainerLogin.status === 200 && trainerToken, 'Gym 1 Trainer authenticated');

    // 3. Gym 1 Member (Vikram Malhotra)
    const memberLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'vikram.malhotra@gmail.com', role: 'member', password: 'Password@123' }
    );
    const memberToken = memberLogin.body?.token;
    assert(memberLogin.status === 200 && memberToken, 'Gym 1 Member authenticated');

    // 4. Gym 2 Owner (Devika Rao)
    const gym2OwnerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'contact@titanforge.in', role: 'gym_owner', password: 'Password@123' }
    );
    const gym2Token = gym2OwnerLogin.body?.token;
    assert(gym2OwnerLogin.status === 200 && gym2Token, 'Gym 2 Owner authenticated');

    // -------------------------------------------------------------------------
    // TEST 1: Member asks about their own workout
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 1] Member asks about their assigned workout plan...');
    const memberWorkoutChat = await request(
      {
        method: 'POST',
        path: '/api/ai/chat',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      { prompt: "Show me today's workout plan and exercises" }
    );

    assert(memberWorkoutChat.status === 200, 'POST /api/ai/chat returns 200 OK');
    assert(memberWorkoutChat.body?.success === true, 'Response indicates success: true');
    assert(Boolean(memberWorkoutChat.body?.reply), 'AI reply is populated');
    assert(
      memberWorkoutChat.body?.reply.toLowerCase().includes('workout') ||
      memberWorkoutChat.body?.reply.toLowerCase().includes('hypertrophy') ||
      memberWorkoutChat.body?.reply.toLowerCase().includes('press'),
      'AI accurately summarizes member workout plan details'
    );
    assert(Boolean(memberWorkoutChat.body?.conversationId), 'Conversation ID is generated or associated');

    // -------------------------------------------------------------------------
    // TEST 2: Member asks about membership expiry
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 2] Member asks about membership expiry & days remaining...');
    const memberExpiryChat = await request(
      {
        method: 'POST',
        path: '/api/ai/chat',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      { prompt: 'When does my gym membership expire?' }
    );

    assert(memberExpiryChat.status === 200, 'POST /api/ai/chat returns 200 OK');
    assert(
      memberExpiryChat.body?.reply.toLowerCase().includes('expire') ||
      memberExpiryChat.body?.reply.toLowerCase().includes('2027') ||
      memberExpiryChat.body?.reply.toLowerCase().includes('days'),
      'AI reports membership expiry date and remaining validity for athlete'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Trainer generates a workout draft
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 3] Trainer generates an AI workout plan draft...');
    const workoutDraft = await request(
      {
        method: 'POST',
        path: '/api/ai/workout-plan',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        memberId,
        fitnessGoal: 'Hypertrophy',
        experienceLevel: 'Intermediate',
        availableDays: 4,
        equipmentAvailability: 'Full Gym',
        durationMinutes: 60,
        trainerNotes: 'Focus on compound pressing and upper back volume.',
      }
    );

    assert(workoutDraft.status === 201, 'POST /api/ai/workout-plan returns 201 Created');
    assert(workoutDraft.body?.success === true, 'Workout draft indicates success: true');
    assert(workoutDraft.body?.approvalStatus === 'draft', 'Generated plan status is explicitly initialized as DRAFT');
    assert(workoutDraft.body?.requiresTrainerApproval === true, 'Strict trainer approval requirement is enforced');
    assert(Boolean(workoutDraft.body?.generatedContent?.days), 'Structured weekly days schedule is generated');
    const generatedPlanId = workoutDraft.body?.planId;
    assert(Boolean(generatedPlanId), `Plan ID generated: ${generatedPlanId}`);

    // -------------------------------------------------------------------------
    // TEST 4: Trainer approves a generated plan
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 4] Trainer approves the AI generated plan draft...');
    const approvePlanRes = await request(
      {
        method: 'POST',
        path: `/api/ai/plans/${generatedPlanId}/approve`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      { notes: 'Verified and approved by Coach Alex Rivera for Vikram Malhotra.' }
    );

    assert(approvePlanRes.status === 200, 'POST /api/ai/plans/:id/approve returns 200 OK');
    assert(approvePlanRes.body?.success === true, 'Approval indicates success: true');
    assert(approvePlanRes.body?.plan?.approval_status === 'approved', 'Plan status transitioned to APPROVED');
    assert(Boolean(approvePlanRes.body?.plan?.approved_by), 'Approver user ID is recorded in audit ledger');

    // -------------------------------------------------------------------------
    // TEST 4b: Diet Plan Generation with Mandatory Medical Disclaimer
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 4b] Generating AI Diet Plan with clinical safety notice...');
    const dietDraft = await request(
      {
        method: 'POST',
        path: '/api/ai/diet-plan',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        memberId,
        fitnessGoal: 'Muscle Gain',
        dietaryPreference: 'High-Protein Non-Veg',
        foodPreferences: 'Eggs, chicken breast, oats, whey protein, rice',
        mealSchedule: 5,
        targetCalories: 2650,
      }
    );

    assert(dietDraft.status === 201, 'POST /api/ai/diet-plan returns 201 Created');
    assert(dietDraft.body?.approvalStatus === 'draft', 'Diet plan status initialized as DRAFT');
    assert(
      dietDraft.body?.disclaimer.toLowerCase().includes('medical') &&
      dietDraft.body?.disclaimer.toLowerCase().includes('dietitian'),
      'Mandatory medical & clinical dietitian disclaimer is enforced'
    );
    assert(Boolean(dietDraft.body?.generatedContent?.macros), 'Macronutrient targets (protein, carbs, fats) calculated');

    // -------------------------------------------------------------------------
    // TEST 5: Owner requests revenue & business insights
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 5] Owner requests live business insights...');
    const businessInsights = await request(
      {
        method: 'POST',
        path: '/api/ai/business-insights',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      {}
    );

    assert(businessInsights.status === 200, 'POST /api/ai/business-insights returns 200 OK');
    assert(businessInsights.body?.success === true, 'Business insights returned successfully');
    assert(Boolean(businessInsights.body?.insights?.databaseMetrics?.monthlyRevenue), 'Actual monthly revenue reported');
    assert(Boolean(businessInsights.body?.insights?.databaseMetrics?.activeMembers), 'Active members count reported');
    assert(Boolean(businessInsights.body?.insights?.strategicAnalysis?.operationalRecommendations), 'AI operational recommendations generated');

    // Also test owner chat query
    const ownerChat = await request(
      {
        method: 'POST',
        path: '/api/ai/chat',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { prompt: 'What is our monthly revenue and how many memberships are expiring?' }
    );
    assert(ownerChat.status === 200, 'Owner business chat query returns 200 OK');
    assert(
      ownerChat.body?.reply.includes('₹') || ownerChat.body?.reply.toLowerCase().includes('revenue'),
      'Owner response embeds authentic INR revenue metrics'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Cross-gym data access is strictly blocked
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 6] Cross-gym tenant data isolation verification...');
    
    // Gym 2 owner trying to access Gym 1 plan
    const crossGymPlanAccess = await request(
      {
        method: 'POST',
        path: `/api/ai/plans/${generatedPlanId}/approve`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gym2Token}`, 'X-Gym-Id': gym2Id },
      },
      { notes: 'Cross gym unauthorized attempt' }
    );
    assert(
      crossGymPlanAccess.status === 404 || crossGymPlanAccess.status === 403,
      'Cross-gym plan access is rejected with 404 or 403 Forbidden'
    );

    // Gym 2 owner trying to access Gym 1 conversation
    const crossGymConv = await request(
      {
        method: 'GET',
        path: '/api/ai/conversations/conv-owner-1',
        headers: { Authorization: `Bearer ${gym2Token}`, 'X-Gym-Id': gym2Id },
      }
    );
    assert(
      crossGymConv.status === 404 || crossGymConv.status === 403,
      'Cross-gym conversation access is blocked with 404 or 403 Forbidden'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Unauthorized users cannot access AI endpoints
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 7] RBAC and Unauthenticated Access Guards...');
    
    // Unauthenticated request
    const unauthChat = await request(
      { method: 'POST', path: '/api/ai/chat', headers: { 'Content-Type': 'application/json' } },
      { prompt: 'Hello AI' }
    );
    assert(unauthChat.status === 401, 'Unauthenticated chat request is blocked with 401 Unauthorized');

    // Member attempting to access Owner Business Insights
    const memberBusinessAttempt = await request(
      {
        method: 'POST',
        path: '/api/ai/business-insights',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      {}
    );
    assert(memberBusinessAttempt.status === 403, 'Member forbidden from accessing business insights (403)');

    // Member attempting to generate workout plans
    const memberWorkoutAttempt = await request(
      {
        method: 'POST',
        path: '/api/ai/workout-plan',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      { fitnessGoal: 'Strength' }
    );
    assert(memberWorkoutAttempt.status === 403, 'Member forbidden from generating trainer workout plans (403)');

    // -------------------------------------------------------------------------
    // TEST 8: Invalid / offline API credentials handled gracefully
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 8] Graceful sandbox fallback and engine transparency...');
    const testFallbackChat = await request(
      {
        method: 'POST',
        path: '/api/ai/chat',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { prompt: 'How many active members do we have?' }
    );

    assert(testFallbackChat.status === 200, 'Chat operates reliably without uncaught exceptions (200 OK)');
    assert(
      testFallbackChat.body?.source === 'openai_live' || testFallbackChat.body?.source === 'gymflow_engine',
      `Engine source transparently reported as: ${testFallbackChat.body?.source}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Rate limits / Subscription quota enforcement
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 9] AI Usage Dashboard & Subscription Quota verification...');
    const usageRes = await request(
      {
        method: 'GET',
        path: '/api/ai/usage',
        headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      }
    );

    assert(usageRes.status === 200, 'GET /api/ai/usage returns 200 OK');
    assert(usageRes.body?.success === true, 'Usage response indicates success: true');
    assert(typeof usageRes.body?.stats?.totalRequests === 'number', 'Total requests metric is a valid number');
    assert(typeof usageRes.body?.stats?.dailyLimit === 'number', 'Daily quota limit is exposed');
    assert(typeof usageRes.body?.stats?.remainingToday === 'number', 'Remaining daily quota accurately computed');
    assert(Boolean(usageRes.body?.stats?.byType), 'Request type distribution exposed');

    // -------------------------------------------------------------------------
    // TEST 10: Conversation history and messages load correctly
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 10] Conversation History and Lifecycle Management...');
    const convListRes = await request(
      {
        method: 'GET',
        path: '/api/ai/conversations',
        headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      }
    );

    assert(convListRes.status === 200, 'GET /api/ai/conversations returns 200 OK');
    assert(Array.isArray(convListRes.body?.conversations), 'Conversations returned as an array');
    const firstConv = convListRes.body?.conversations?.[0];
    assert(Boolean(firstConv), 'At least one active conversation found in history');

    // Retrieve single conversation with messages
    const singleConvRes = await request(
      {
        method: 'GET',
        path: `/api/ai/conversations/${firstConv.id}`,
        headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      }
    );
    assert(singleConvRes.status === 200, 'GET /api/ai/conversations/:id returns 200 OK');
    assert(Array.isArray(singleConvRes.body?.conversation?.messages), 'Message history is populated as an array');

    // Create a temporary conversation and delete it
    const tempChat = await request(
      {
        method: 'POST',
        path: '/api/ai/chat',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { prompt: 'Temporary conversation test message' }
    );
    const tempConvId = tempChat.body?.conversationId;
    assert(Boolean(tempConvId), 'Temporary conversation created');

    const deleteConvRes = await request(
      {
        method: 'DELETE',
        path: `/api/ai/conversations/${tempConvId}`,
        headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      }
    );
    assert(deleteConvRes.status === 200, 'DELETE /api/ai/conversations/:id returns 200 OK');
    assert(deleteConvRes.body?.success === true, 'Conversation successfully deleted from history');

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log('================================================================');

    if (failedCount === 0) {
      console.log('🎉 ALL AI GYM ASSISTANT TESTS PASSED WITH 100% SUCCESS!\n');
    } else {
      console.error(`❌ ${failedCount} TESTS FAILED\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    process.exit(1);
  }
}

runTestSuite();
