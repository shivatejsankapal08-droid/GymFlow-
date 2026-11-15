/**
 * GYMFLOW AI - STEP 7: SMART ATTENDANCE MANAGEMENT SYSTEM TEST SUITE
 * Verifies live KPIs, contactless QR turnstile, multi-tenant isolation,
 * duplicate check-in prevention, status enforcement, manual staff actions,
 * attendance history filtering, and individual athlete analytics.
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const GYM_1_ID = '11111111-1111-1111-1111-111111111111'; // IronPulse Fitness
const GYM_2_ID = '22222222-2222-2222-2222-222222222222'; // Titan Forge Gym

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failedCount++;
  }
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (e) {
          json = { raw: rawData };
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAttendanceTests() {
  console.log('\n=============================================================');
  console.log('🏋️‍♂️ GYMFLOW AI - STEP 7: SMART ATTENDANCE TEST SUITE');
  console.log('=============================================================\n');

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: Live Attendance Dashboard & 6 KPI Metrics
    // ------------------------------------------------------------------------
    console.log('--- SECTION 1: Live Attendance Dashboard & 6 KPIs ---');

    const statsRes = await makeRequest('GET', '/api/attendance/stats', null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(statsRes.status === 200, 'GET /api/attendance/stats returns HTTP 200');
    assert(statsRes.data?.success === true, 'Response contains success: true');

    const stats = statsRes.data?.data || statsRes.data?.stats;
    assert(typeof stats?.totalCheckInsToday === 'number', 'KPI 1: totalCheckInsToday is a valid number');
    assert(typeof stats?.currentlyInsideGym === 'number', 'KPI 2: currentlyInsideGym is a valid number');
    assert(typeof stats?.totalMembersPresent === 'number', 'KPI 3: totalMembersPresent is a valid number');
    assert(typeof stats?.membersAbsentToday === 'number', 'KPI 4: membersAbsentToday is a valid number');
    assert(typeof stats?.peakAttendanceTime === 'string', `KPI 5: peakAttendanceTime is a valid string (${stats?.peakAttendanceTime})`);
    assert(typeof stats?.weeklyAttendancePercentage === 'number', `KPI 6: weeklyAttendancePercentage is a valid number (${stats?.weeklyAttendancePercentage}%)`);

    assert(Array.isArray(stats?.hourlyFlow), 'hourlyFlow distribution is returned as an array');
    assert(stats?.hourlyFlow.length >= 8, 'hourlyFlow contains operational hourly buckets');
    assert(Array.isArray(stats?.activeVisits), 'activeVisits is returned as an array');

    // GET /api/attendance/today
    const todayRes = await makeRequest('GET', '/api/attendance/today', null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(todayRes.status === 200, 'GET /api/attendance/today returns HTTP 200');
    assert(Array.isArray(todayRes.data?.data), "today's logs array returned");

    // GET /api/attendance/active
    const activeRes = await makeRequest('GET', '/api/attendance/active', null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(activeRes.status === 200, 'GET /api/attendance/active returns HTTP 200');
    assert(Array.isArray(activeRes.data?.data), 'active visits array returned');

    // ------------------------------------------------------------------------
    // SECTION 2: QR Scanner Kiosk & Contactless Verification
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: QR Scanner Kiosk & Contactless Verification ---');

    // 2.1 Unrecognized QR pass
    const invalidScanRes = await makeRequest('POST', '/api/attendance/scan', {
      qrToken: 'GYMFLOW-QR-NONEXISTENT-TOKEN-999',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(invalidScanRes.status === 404, 'Unrecognized QR pass returns HTTP 404 Not Found');
    assert(invalidScanRes.data?.code === 'MEMBER_NOT_FOUND', 'Returns MEMBER_NOT_FOUND error code');

    // 2.2 Cross-Gym Scan Rejection (Samantha Bright is registered at Titan Forge, scanned at IronPulse)
    const crossGymRes = await makeRequest('POST', '/api/attendance/scan', {
      qrToken: 'GYMFLOW-QR-TF-2001-SAMANTHA',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(crossGymRes.status === 403, 'Cross-gym pass scan returns HTTP 403 Forbidden');
    assert(crossGymRes.data?.code === 'CROSS_GYM_DENIED', 'Returns CROSS_GYM_DENIED error code');
    assert(crossGymRes.data?.member?.fullName === 'Samantha Bright', 'Cross-gym athlete identified');

    // 2.3 Expired Member Scan Rejection (Tanya Roy / IP-1006-EXP)
    const expiredRes = await makeRequest('POST', '/api/attendance/scan', {
      qrToken: 'GYMFLOW-QR-IP-1006-EXPIRED',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(expiredRes.status === 403, 'Expired member pass scan returns HTTP 403 Forbidden');
    assert(expiredRes.data?.code === 'MEMBERSHIP_EXPIRED', 'Returns MEMBERSHIP_EXPIRED error code');

    // 2.4 Suspended Member Scan Rejection (Siddharth Joshi / IP-1005)
    const suspendedRes = await makeRequest('POST', '/api/attendance/scan', {
      qrToken: 'GYMFLOW-QR-IP-1005-SUSPENDED',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(suspendedRes.status === 403, 'Suspended member pass scan returns HTTP 403 Forbidden');
    assert(suspendedRes.data?.code === 'MEMBERSHIP_SUSPENDED', 'Returns MEMBERSHIP_SUSPENDED error code');

    // ------------------------------------------------------------------------
    // SECTION 3: Check-in, Duplicate Prevention & Check-Out Duration Engine
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Check-In, Duplicate Prevention & Check-Out ---');

    const testMemberId = '11111111-1111-1111-1111-000000000001'; // Vikram Malhotra

    // 3.1 First close any open visit if any
    await makeRequest('POST', '/api/attendance/check-out', {
      memberId: testMemberId,
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    // 3.2 Now check in Vikram Malhotra
    const checkInRes = await makeRequest('POST', '/api/attendance/check-in', {
      memberId: testMemberId,
      method: 'qr_scanner',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(checkInRes.status === 200, 'Check-in with valid active pass returns HTTP 200');
    assert(checkInRes.data?.action === 'check_in', 'Response action is check_in');
    assert(checkInRes.data?.attendance?.status === 'checked_in', 'Attendance status is checked_in');
    assert(Boolean(checkInRes.data?.member?.fullName), `Member name resolved (${checkInRes.data?.member?.fullName})`);

    // 3.3 Duplicate Check-In Prevention (attempting to check in Vikram again while still inside)
    const duplicateRes = await makeRequest('POST', '/api/attendance/check-in', {
      memberId: testMemberId,
      method: 'qr_scanner',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(duplicateRes.status === 400, 'Duplicate check-in rejected with HTTP 400 Bad Request');
    assert(duplicateRes.data?.code === 'ALREADY_CHECKED_IN', 'Returns ALREADY_CHECKED_IN error code');

    // 3.4 Check-Out with Automatic Duration Calculation
    const checkOutRes = await makeRequest('POST', '/api/attendance/check-out', {
      memberId: testMemberId,
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(checkOutRes.status === 200, 'Check-out with active session returns HTTP 200');
    assert(checkOutRes.data?.action === 'check_out', 'Response action is check_out');
    assert(typeof checkOutRes.data?.durationMinutes === 'number', `Duration calculated in minutes (${checkOutRes.data?.durationMinutes}m)`);
    assert(checkOutRes.data?.attendance?.status === 'checked_out', 'Attendance status updated to checked_out');

    // 3.5 Invalid Check-out (checking out when not inside)
    const invalidCheckOutRes = await makeRequest('POST', '/api/attendance/check-out', {
      memberId: testMemberId,
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(invalidCheckOutRes.status === 400, 'Check-out without active visit returns HTTP 400');
    assert(invalidCheckOutRes.data?.code === 'NO_ACTIVE_CHECKIN', 'Returns NO_ACTIVE_CHECKIN error code');

    // ------------------------------------------------------------------------
    // SECTION 4: Front-Desk Manual Attendance & Staff Attribution
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Front-Desk Manual Attendance & Staff Attribution ---');

    const manualMemberId = '11111111-1111-1111-1111-000000000003'; // Kabir Deshmukh

    // Close any open visit for Kabir first
    await makeRequest('POST', '/api/attendance/manual', {
      memberId: manualMemberId,
      action: 'check_out',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    // 4.1 Manual check-in by authorized gym owner/staff
    const manualInRes = await makeRequest('POST', '/api/attendance/manual', {
      memberId: manualMemberId,
      action: 'check_in',
      notes: 'Reception desk entry • Forgot wristband',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(manualInRes.status === 200, 'Manual check-in by staff returns HTTP 200');
    assert(manualInRes.data?.attendance?.verificationMethod === 'manual', 'Verification method recorded as manual');
    assert(manualInRes.data?.attendance?.notes === 'Reception desk entry • Forgot wristband', 'Staff notes recorded');
    assert(Boolean(manualInRes.data?.attendance?.recorded_by_name || manualInRes.data?.attendance?.recordedByName), 'Staff member name attributed');

    // 4.2 Manual check-out by staff
    const manualOutRes = await makeRequest('POST', '/api/attendance/manual', {
      memberId: manualMemberId,
      action: 'check_out',
      notes: 'Reception assisted checkout',
    }, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(manualOutRes.status === 200, 'Manual check-out by staff returns HTTP 200');
    assert(manualOutRes.data?.attendance?.status === 'checked_out', 'Session status set to checked_out');

    // 4.3 Member Role Blocked from Manual Attendance (403 Forbidden)
    const memberUnauthorizedRes = await makeRequest('POST', '/api/attendance/manual', {
      memberId: manualMemberId,
      action: 'check_in',
    }, {
      Authorization: 'Bearer demo-token-member',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(memberUnauthorizedRes.status === 403, 'Member role blocked from manual attendance with HTTP 403 Forbidden');

    // ------------------------------------------------------------------------
    // SECTION 5: Attendance History, Multi-Filters & Analytics
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Attendance History, Filters & Analytics ---');

    // 5.1 History with range=today
    const histTodayRes = await makeRequest('GET', '/api/attendance/history?range=today', null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(histTodayRes.status === 200, 'GET /api/attendance/history?range=today returns HTTP 200');
    const todayLogsArr = Array.isArray(histTodayRes.data?.data) ? histTodayRes.data?.data : histTodayRes.data?.attendance;
    assert(Array.isArray(todayLogsArr), 'Returns filtered history array');
    assert(typeof histTodayRes.data?.total === 'number', `Total count returned (${histTodayRes.data?.total})`);

    // 5.2 History search query (q=Vikram or q=IP-1001)
    const histSearchRes = await makeRequest('GET', '/api/attendance/history?q=IP-1001', null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });
    assert(histSearchRes.status === 200, 'GET /api/attendance/history?q=IP-1001 returns HTTP 200');
    const searchMatches = Array.isArray(histSearchRes.data?.data) ? histSearchRes.data?.data : histSearchRes.data?.attendance || [];
    assert(Array.isArray(searchMatches) && searchMatches.length > 0, `Search returned matches (${searchMatches.length})`);
    assert(searchMatches.every((l) => (l.memberName && l.memberName.includes('Vikram')) || (l.memberCode && l.memberCode.includes('IP-1001'))), 'All search results match IP-1001');

    // 5.3 Member-specific Attendance Analytics
    const memberAnalyticsRes = await makeRequest('GET', `/api/attendance/member/${testMemberId}`, null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_1_ID,
    });

    assert(memberAnalyticsRes.status === 200, 'GET /api/attendance/member/:id returns HTTP 200');
    const athleteStats = memberAnalyticsRes.data?.data || memberAnalyticsRes.data?.analytics;
    assert(athleteStats?.memberCode === 'IP-1001', 'Athlete code identified as IP-1001');
    assert(typeof athleteStats?.totalVisits === 'number', `totalVisits is a number (${athleteStats?.totalVisits})`);
    assert(typeof athleteStats?.currentMonthVisits === 'number', `currentMonthVisits is a number (${athleteStats?.currentMonthVisits})`);
    assert(typeof athleteStats?.attendancePercentage === 'number', `attendancePercentage is a number (${athleteStats?.attendancePercentage}%)`);
    assert(typeof athleteStats?.averageDurationMinutes === 'number', `averageDurationMinutes is a number (${athleteStats?.averageDurationMinutes}m)`);
    assert(Array.isArray(athleteStats?.history), 'Detailed attendance history array returned for athlete');

    // ------------------------------------------------------------------------
    // SECTION 6: Multi-Tenant Data Isolation Verification
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 6: Multi-Tenant Data Isolation ---');

    // 6.1 Unauthorized Cross-Tenant Access to Gym 2 by Gym 1 Owner is Blocked (403)
    const unauthorizedCrossGymStatsRes = await makeRequest('GET', '/api/attendance/stats', null, {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': GYM_2_ID,
    });
    assert(unauthorizedCrossGymStatsRes.status === 403, 'Cross-tenant access to Gym 2 blocked with HTTP 403 Forbidden');

    // 6.2 Authorized Access to Gym 2 by Gym 2 Owner (Devika Rao) succeeds (200)
    const gym2StatsRes = await makeRequest('GET', '/api/attendance/stats', null, {
      Authorization: 'Bearer demo-token-gym_owner_titan',
      'X-Gym-Id': GYM_2_ID,
    });
    assert(gym2StatsRes.status === 200, 'GET /api/attendance/stats for Gym 2 returns HTTP 200 for Gym 2 owner');

    // 6.3 Gym 2 attendance records are isolated
    const gym2HistRes = await makeRequest('GET', '/api/attendance/history', null, {
      Authorization: 'Bearer demo-token-gym_owner_titan',
      'X-Gym-Id': GYM_2_ID,
    });
    const gym2Logs = Array.isArray(gym2HistRes.data?.data) ? gym2HistRes.data?.data : gym2HistRes.data?.attendance || [];
    assert(gym2Logs.every((l) => l.gymId === GYM_2_ID || l.gym_id === GYM_2_ID), 'Gym 2 history contains ONLY Gym 2 records');

    console.log('\n=============================================================');
    console.log(`🎉 SUITE COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('=============================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error executing attendance test suite:', error);
    process.exit(1);
  }
}

runAttendanceTests();
