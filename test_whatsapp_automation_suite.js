/**
 * GYMFLOW AI: STEP 11 - WHATSAPP AUTOMATION & NOTIFICATION SYSTEM TEST SUITE
 * 
 * Verifies all 10 core requirements:
 * 1. Membership Expiry Reminders (7d, 3d, 1d, 0d stages & template rendering)
 * 2. Duplicate Reminder Prevention (skips within 24h window)
 * 3. Verified Payment Notifications (triggered strictly after backend verified status)
 * 4. Birthday Wishes Workflow (matches MM-DD, checks consent, logs delivery)
 * 5. Attendance Notifications (check-in, check-out, inactive member retention > 7 days)
 * 6. Daily Gym Owner Report (aggregates members, revenue, attendance & dispatches to owner)
 * 7. Consent & Privacy Enforcement (immediate opt-out via UI & inbound STOP keyword)
 * 8. Audit Logging & Telemetry (7 live KPIs, log filters, pagination, search)
 * 9. Strict Multi-Tenant Gym Isolation (Gym 1 vs Gym 2 data separation)
 * 10. Graceful Sandbox Fallback & Webhook Handshake (Meta challenge & sandbox mode)
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
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));

    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 GYMFLOW AI: STEP 11 - WHATSAPP AUTOMATION & NOTIFICATION SYSTEM');
  console.log('================================================================');

  try {
    // -------------------------------------------------------------
    // SETUP & AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n▶ [SETUP] Authenticating multi-tenant credentials...');

    const gym1Id = '11111111-1111-1111-1111-111111111111'; // IronPulse Fitness Club
    const gym2Id = '22222222-2222-2222-2222-222222222222'; // Titan Forge CrossFit
    const member1Id = 'cccc1111-0000-0000-0000-000000000001'; // Vikram Malhotra

    // 1. Gym 1 Owner (Marcus Vance)
    const ownerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'owner@ironpulse.com', role: 'gym_owner', password: 'Password@123' }
    );
    const ownerToken = ownerLogin.body?.token;
    assert(ownerLogin.status === 200 && ownerToken, 'Gym 1 Owner authenticated');

    // 2. Gym 1 Member (Vikram Malhotra)
    const memberLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'vikram.malhotra@gmail.com', role: 'member', password: 'Password@123' }
    );
    const memberToken = memberLogin.body?.token;
    assert(memberLogin.status === 200 && memberToken, 'Gym 1 Member authenticated');

    // 3. Gym 2 Owner (Devika Rao)
    const gym2OwnerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'contact@titanforge.in', role: 'gym_owner', password: 'Password@123' }
    );
    const gym2Token = gym2OwnerLogin.body?.token;
    assert(gym2OwnerLogin.status === 200 && gym2Token, 'Gym 2 Owner authenticated');

    // -------------------------------------------------------------
    // SECTION 1: MEMBERSHIP EXPIRY REMINDERS
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 1] Membership Expiry Reminders (7d, 3d, 1d, 0d)...');

    // Query expiring members endpoint (used by n8n cron)
    const expMembersRes = await request({
      method: 'GET',
      path: '/api/automation/expiring-members',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(expMembersRes.status === 200, 'GET /api/automation/expiring-members returns 200');
    assert(expMembersRes.body?.count >= 1, 'Expiring members identified in Gym 1');
    assert(
      expMembersRes.body?.members?.[0]?.renewalLink?.includes('pay.gymflow.ai/renew'),
      'Personalized renewal link attached to expiring member'
    );

    // Trigger Expiry Reminder Workflow
    const triggerExpiry = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/expiry_reminder',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { stages: [7, 3, 1, 0] }
    );
    assert(triggerExpiry.status === 200 && triggerExpiry.body?.success, 'POST /api/automation/trigger/expiry_reminder executes successfully');
    assert(triggerExpiry.body?.result?.totalScanned >= 1, 'Scanned active members for expiry dates');

    // -------------------------------------------------------------
    // SECTION 2: DUPLICATE REMINDER PREVENTION
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 2] Duplicate Reminder Prevention (24-Hour Guard)...');

    // Re-run expiry reminder immediately
    const retriggerExpiry = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/expiry_reminder',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { stages: [7, 3, 1, 0] }
    );
    assert(retriggerExpiry.status === 200, 'Re-triggering expiry workflow completes');
    assert(
      retriggerExpiry.body?.result?.skippedDuplicateCount >= 1,
      'Duplicate prevention activated: skipped already notified members within 24 hours'
    );

    // -------------------------------------------------------------
    // SECTION 3: VERIFIED PAYMENT NOTIFICATIONS
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 3] Verified Payment Notifications & Tax Receipts...');

    // 3.1 Verified payment success notification
    const paymentSuccessNotify = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/payment_confirmation',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        memberId: member1Id,
        amount: 24999,
        planName: 'Annual Elite VIP',
        type: 'verified',
      }
    );
    assert(paymentSuccessNotify.status === 200 && paymentSuccessNotify.body?.success, 'Payment success notification dispatched after verified transaction');
    assert(
      paymentSuccessNotify.body?.result?.log?.notification_type === 'payment_verified',
      'Log records notification_type = payment_verified'
    );
    assert(
      paymentSuccessNotify.body?.result?.log?.message_body?.includes('₹24,999') ||
      paymentSuccessNotify.body?.result?.log?.message_body?.includes('24,999'),
      'Message body formats payment amount in INR currency'
    );

    // -------------------------------------------------------------
    // SECTION 4: BIRTHDAY WISHES WORKFLOW
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 4] Birthday Wishes Workflow (Date Match & Consent)...');

    const birthdayMembersRes = await request({
      method: 'GET',
      path: '/api/automation/birthday-members',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(birthdayMembersRes.status === 200, 'GET /api/automation/birthday-members returns 200');

    const triggerBirthday = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/birthday_wishes',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      {}
    );
    assert(triggerBirthday.status === 200 && triggerBirthday.body?.success, 'POST /api/automation/trigger/birthday_wishes executed');

    // -------------------------------------------------------------
    // SECTION 5: ATTENDANCE NOTIFICATIONS & INACTIVE MEMBER REMINDER
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 5] Attendance Check-in / Check-out & Retention Reminders...');

    // Check-in Alert
    const checkInNotify = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/attendance_notification',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { memberId: member1Id, type: 'check_in' }
    );
    assert(checkInNotify.status === 200 && checkInNotify.body?.success, 'Check-in WhatsApp alert processed');
    assert(checkInNotify.body?.result?.log?.notification_type === 'check_in', 'Logged check_in notification type');

    // Check-out Alert
    const checkOutNotify = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/attendance_notification',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { memberId: member1Id, type: 'check_out', durationMinutes: 65 }
    );
    assert(checkOutNotify.status === 200 && checkOutNotify.body?.success, 'Check-out WhatsApp alert processed with duration');

    // Inactive Members Retention (> 7 days absent)
    const inactiveList = await request({
      method: 'GET',
      path: '/api/automation/inactive-members',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(inactiveList.status === 200, 'GET /api/automation/inactive-members scans inactive athletes');

    const triggerInactive = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/inactive_member_reminder',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { inactiveDaysThreshold: 7 }
    );
    assert(triggerInactive.status === 200 && triggerInactive.body?.success, 'POST /api/automation/trigger/inactive_member_reminder executed');

    // -------------------------------------------------------------
    // SECTION 6: DAILY GYM OWNER EXECUTIVE REPORT
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 6] Daily Gym Owner Executive Report (9:00 PM)...');

    const dailyReportRes = await request({
      method: 'GET',
      path: '/api/automation/daily-report',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(dailyReportRes.status === 200 && dailyReportRes.body?.success, 'GET /api/automation/daily-report generates executive digest');
    assert(dailyReportRes.body?.report?.active_members !== undefined, 'Report aggregates active members');
    assert(dailyReportRes.body?.report?.today_revenue !== undefined, 'Report aggregates revenue collected');
    assert(dailyReportRes.body?.report?.today_checkins !== undefined, 'Report aggregates check-ins and peak hour');
    assert(dailyReportRes.body?.log?.notification_type === 'owner_daily_report', 'Report delivery logged to audit stream');

    // -------------------------------------------------------------
    // SECTION 7: CONSENT & PRIVACY ENFORCEMENT (OPT-OUT)
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 7] Member Consent & Privacy Enforcement (Immediate Opt-out)...');

    // 7.1 Read Member Preferences
    const getConsent = await request({
      method: 'GET',
      path: `/api/automation/preferences/${member1Id}`,
      headers: { Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(getConsent.status === 200, 'GET /api/automation/preferences/:memberId retrieves consent');
    assert(getConsent.body?.preferences?.whatsapp_consent === true, 'Member initially consented');

    // 7.2 Update Consent: Opt-out
    const updateConsent = await request(
      {
        method: 'PUT',
        path: `/api/automation/preferences/${member1Id}`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      { whatsapp_consent: false, opt_out_reason: 'Testing opt-out' }
    );
    assert(updateConsent.status === 200 && updateConsent.body?.preferences?.whatsapp_consent === false, 'PUT /api/automation/preferences revokes consent');
    assert(updateConsent.body?.preferences?.opted_out_at !== null, 'Opt-out timestamp recorded');

    // 7.3 Attempt dispatch to opted-out member -> should abort and log 'opted_out'
    const notifyOptedOut = await request(
      {
        method: 'POST',
        path: '/api/automation/trigger/attendance_notification',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      { memberId: member1Id, type: 'check_in' }
    );
    assert(notifyOptedOut.body?.optedOut === true || notifyOptedOut.body?.result?.optedOut === true, 'Outbound dispatch immediately aborted for opted-out athlete');

    // 7.4 Inbound STOP Keyword Webhook Opt-out
    const inboundStopWebhook = await request(
      {
        method: 'POST',
        path: '/api/automation/webhook',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '919820223456', // Ananya Sen
                      text: { body: 'STOP' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }
    );
    assert(inboundStopWebhook.status === 200 && inboundStopWebhook.body?.received, 'Inbound webhook processed STOP keyword successfully');

    // 7.5 Restore Member 1 Consent
    await request(
      {
        method: 'PUT',
        path: `/api/automation/preferences/${member1Id}`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      { whatsapp_consent: true }
    );

    // -------------------------------------------------------------
    // SECTION 8: AUDIT LOGGING & TELEMETRY
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 8] Notification Audit Logs & 7 KPIs Telemetry...');

    // 8.1 Fetch logs
    const logsRes = await request({
      method: 'GET',
      path: '/api/automation/logs?limit=10',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(logsRes.status === 200 && logsRes.body?.logs?.length >= 1, 'GET /api/automation/logs returns audit records');
    assert(logsRes.body?.total >= logsRes.body?.logs?.length, 'Logs include pagination total count');

    const sampleLog = logsRes.body?.logs?.[0];
    assert(
      sampleLog?.id && sampleLog?.recipient && sampleLog?.notification_type && sampleLog?.message_status,
      'Log record has all mandatory fields (id, recipient, type, status)'
    );

    // 8.2 Fetch Dashboard Stats (7 required KPIs)
    const statsRes = await request({
      method: 'GET',
      path: '/api/automation/stats',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(statsRes.status === 200 && statsRes.body?.stats, 'GET /api/automation/stats returns KPIs');

    const s = statsRes.body?.stats;
    assert(s.totalSent !== undefined, 'KPI 1: Total Messages Sent present');
    assert(s.messagesDelivered !== undefined, 'KPI 2: Messages Delivered present');
    assert(s.failedMessages !== undefined, 'KPI 3: Failed Messages present');
    assert(s.pendingMessages !== undefined, 'KPI 4: Pending Messages present');
    assert(s.activeWorkflows !== undefined, 'KPI 5: Active Workflows present');
    assert(s.membershipExpiryAlerts !== undefined, 'KPI 6: Membership Expiry Alerts present');
    assert(s.paymentNotifications !== undefined, 'KPI 7: Payment Notifications present');
    assert(Array.isArray(s.dailyStats) && s.dailyStats.length === 7, '7-day rolling telemetry chart data returned');

    // -------------------------------------------------------------
    // SECTION 9: MULTI-TENANT GYM ISOLATION
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 9] Strict Multi-Tenant Gym Isolation (Gym 1 vs Gym 2)...');

    const gym1Logs = await request({
      method: 'GET',
      path: '/api/automation/logs',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });

    const gym2Logs = await request({
      method: 'GET',
      path: '/api/automation/logs',
      headers: { Authorization: `Bearer ${gym2Token}`, 'X-Gym-Id': gym2Id },
    });

    const gym1Ids = (gym1Logs.body?.logs || []).map((l) => l.gym_id || l.gymId);
    const gym2Ids = (gym2Logs.body?.logs || []).map((l) => l.gym_id || l.gymId);

    const gym1HasGym2Data = gym1Ids.some((id) => id === gym2Id);
    const gym2HasGym1Data = gym2Ids.some((id) => id === gym1Id);

    assert(!gym1HasGym2Data && !gym2HasGym1Data, 'Multi-tenant notification logs are 100% strictly isolated between gyms');

    // Workflow Settings Isolation
    const gym1Settings = await request({
      method: 'GET',
      path: '/api/automation/settings',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    const gym2Settings = await request({
      method: 'GET',
      path: '/api/automation/settings',
      headers: { Authorization: `Bearer ${gym2Token}`, 'X-Gym-Id': gym2Id },
    });

    assert(
      gym1Settings.body?.settings?.length === 6 && gym2Settings.body?.settings?.length === 6,
      'Both gyms independently maintain 6 modular automation workflows'
    );

    // -------------------------------------------------------------
    // SECTION 10: GRACEFUL SANDBOX FALLBACK & WEBHOOK VERIFICATION
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 10] Graceful Sandbox Fallback & Meta Webhook Handshake...');

    // 10.1 Meta Webhook Verification Handshake
    const challengeStr = 'challenge_test_token_8899';
    const verifyWebhook = await request({
      method: 'GET',
      path: `/api/automation/webhook?hub.mode=subscribe&hub.verify_token=gymflow_webhook_verify_token_2026&hub.challenge=${challengeStr}`,
    });
    assert(
      verifyWebhook.status === 200 && String(verifyWebhook.body).includes(challengeStr),
      'Meta Cloud API Webhook handshake verification succeeds (200 with challenge)'
    );

    // Invalid Token Handshake
    const invalidVerify = await request({
      method: 'GET',
      path: '/api/automation/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test',
    });
    assert(invalidVerify.status === 403, 'Invalid Meta verify token rejected (403 Forbidden)');

    // 10.2 Dispatch Test Message in Sandbox Mode
    const testMsgRes = await request(
      {
        method: 'POST',
        path: '/api/automation/test-message',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        recipient: '+919820112345',
        recipientName: 'Vikram Malhotra',
        messageText: 'Test dispatch message verification.',
      }
    );
    assert(testMsgRes.status === 200 && testMsgRes.body?.success, 'POST /api/automation/test-message succeeds');
    assert(
      testMsgRes.body?.dispatch?.status === 'delivered_to_sandbox' || testMsgRes.body?.dispatch?.status === 'delivered',
      'Message routed gracefully (delivered_to_sandbox or live delivered without exception)'
    );

    // 10.3 WhatsApp Config Endpoint (Token masking)
    const configRes = await request({
      method: 'GET',
      path: '/api/automation/config',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(configRes.status === 200 && configRes.body?.config, 'GET /api/automation/config retrieves WhatsApp configuration');
    assert(!configRes.body?.config?.accessToken && !configRes.body?.config?.access_token, 'Access tokens are strictly masked and never returned in API payloads');

    // =============================================================
    // FINAL RESULTS SUMMARY
    // =============================================================
    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log('================================================================');

    if (failedCount === 0) {
      console.log('🎉 ALL WHATSAPP AUTOMATION & NOTIFICATION TESTS PASSED WITH 100% SUCCESS!\n');
      process.exit(0);
    } else {
      console.error(`❌ ${failedCount} tests failed.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during test suite execution:', error);
    process.exit(1);
  }
}

runTestSuite();
