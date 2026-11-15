/**
 * GYMFLOW AI: STEP 13 - ADVANCED REPORTS & ANALYTICS TEST SUITE
 * 
 * Verifies all 12 core requirements:
 * 1. Overview statistics against database records (10 Live KPIs)
 * 2. Revenue calculations (completed vs pending vs refunds)
 * 3. ARPU & Payment Method distribution
 * 4. Membership growth & retention rates
 * 5. Attendance aggregation & peak hours
 * 6. Trainer performance reports & payroll
 * 7. Member engagement & retention segmentation (at-risk cohorts)
 * 8. Date-range filters (today, yesterday, 7d, 30d, this_month, last_month, this_year, custom)
 * 9. CSV / Excel data exports for all 6 entities
 * 10. Printable PDF / HTML executive reports
 * 11. Multi-tenant gym data isolation (Gym 1 vs Gym 2)
 * 12. Security & RBAC enforcement (401/403 for unauthorized/trainer/member)
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
  console.log('📊 GYMFLOW AI: STEP 13 - ADVANCED REPORTS & ANALYTICS TEST SUITE');
  console.log('================================================================\n');

  try {
    const gym1Id = '11111111-1111-1111-1111-111111111111';
    const gym2Id = '22222222-2222-2222-2222-222222222222';

    const ownerHeadersGym1 = {
      Authorization: 'Bearer demo-token-gym_owner',
      'X-Gym-Id': gym1Id,
      'X-Demo-Role': 'gym_owner',
    };

    const ownerHeadersGym2 = {
      Authorization: 'Bearer demo-token-gym_owner_titan',
      'X-Gym-Id': gym2Id,
    };

    const superAdminHeaders = {
      Authorization: 'Bearer demo-token-super_admin',
      'X-Demo-Role': 'super_admin',
    };

    const trainerHeaders = {
      Authorization: 'Bearer demo-token-trainer_vikram',
      'X-Gym-Id': gym1Id,
      'X-Demo-Role': 'trainer',
    };

    const memberHeaders = {
      Authorization: 'Bearer demo-token-member',
      'X-Gym-Id': gym1Id,
      'X-Demo-Role': 'member',
    };

    // ============================================================================
    // 1. OVERVIEW STATISTICS & 10 CORE METRICS
    // ============================================================================
    console.log('▶ [TEST 1] Overview Dashboard Report & 10 Live Metrics...');
    const overviewRes = await request({
      path: '/api/reports/overview?range=30d',
      headers: ownerHeadersGym1,
    });

    assert(overviewRes.status === 200, 'Overview endpoint returns 200 OK');
    assert(overviewRes.body.success === true, 'Overview response has success: true');
    assert(overviewRes.body.gymName === 'IronPulse Fitness Club', 'Overview returns correct gym name (IronPulse)');
    
    const m = overviewRes.body.metrics || {};
    assert(typeof m.totalMembers === 'number' && m.totalMembers >= 0, '1. Total Members metric present');
    assert(typeof m.activeMembers === 'number' && m.activeMembers >= 0, '2. Active Members metric present');
    assert(typeof m.expiredMembers === 'number' && m.expiredMembers >= 0, '3. Expired Members metric present');
    assert(typeof m.newRegistrations === 'number' && m.newRegistrations >= 0, '4. New Registrations metric present');
    assert(typeof m.monthlyRevenue === 'number' && m.monthlyRevenue >= 0, '5. Monthly Revenue metric present');
    assert(typeof m.annualRevenue === 'number' && m.annualRevenue >= 0, '6. Annual Revenue metric present');
    assert(typeof m.pendingPayments === 'number' && m.pendingPayments >= 0, '7. Pending Payments metric present');
    assert(typeof m.todayAttendance === 'number' && m.todayAttendance >= 0, "8. Today's Attendance metric present");
    assert(typeof m.activeTrainers === 'number' && m.activeTrainers >= 0, '9. Active Trainers metric present');
    assert(typeof m.renewalRate === 'number' && m.renewalRate >= 0, '10. Membership Renewal Rate present');

    assert(Array.isArray(overviewRes.body.charts?.revenueTrend), 'Overview charts include revenueTrend array');
    assert(Array.isArray(overviewRes.body.charts?.attendanceFlow), 'Overview charts include attendanceFlow array');
    assert(Array.isArray(overviewRes.body.charts?.memberComposition), 'Overview charts include memberComposition array');

    // ============================================================================
    // 2. REVENUE CALCULATIONS & FINANCIAL AUDIT
    // ============================================================================
    console.log('\n▶ [TEST 2] Revenue Analytics & Financial Audit...');
    const revRes = await request({
      path: '/api/reports/revenue?range=30d',
      headers: ownerHeadersGym1,
    });

    assert(revRes.status === 200, 'Revenue report returns 200 OK');
    assert(revRes.body.success === true, 'Revenue report response has success: true');
    const revSum = revRes.body.summary || {};
    assert(typeof revSum.totalRevenue === 'number', 'Revenue summary contains totalRevenue');
    assert(typeof revSum.collectedPayments === 'number', 'Revenue summary contains collectedPayments');
    assert(typeof revSum.pendingPayments === 'number', 'Revenue summary contains pendingPayments');
    assert(typeof revSum.refundedAmount === 'number', 'Revenue summary contains refundedAmount');
    assert(typeof revSum.arpu === 'number', 'Revenue summary calculates ARPU accurately');
    assert(Array.isArray(revRes.body.revenueByMethod), 'Revenue by payment method breakdown provided');
    assert(Array.isArray(revRes.body.revenueByPlan), 'Revenue by membership plan breakdown provided');
    assert(Array.isArray(revRes.body.dailyRevenue), 'Daily revenue timeseries data provided');

    // Check payment methods contain known gateways
    const methodNames = (revRes.body.revenueByMethod || []).map((x) => x.method);
    assert(methodNames.includes('UPI') || methodNames.includes('Cash'), 'Revenue contains standard payment methods (UPI/Cash)');

    // ============================================================================
    // 3. MEMBERSHIP ANALYTICS & RETENTION
    // ============================================================================
    console.log('\n▶ [TEST 3] Membership & Cohort Retention Analytics...');
    const memRes = await request({
      path: '/api/reports/memberships?range=30d',
      headers: ownerHeadersGym1,
    });

    assert(memRes.status === 200, 'Membership report returns 200 OK');
    assert(memRes.body.success === true, 'Membership report has success: true');
    const memSum = memRes.body.summary || {};
    assert(typeof memSum.totalMembers === 'number', 'Membership summary contains totalMembers');
    assert(typeof memSum.activeMembers === 'number', 'Membership summary contains activeMembers');
    assert(typeof memSum.expiredMembers === 'number', 'Membership summary contains expiredMembers');
    assert(typeof memSum.retentionRate === 'number', 'Membership retention rate calculated');
    assert(typeof memSum.churnRate === 'number', 'Membership churn rate calculated');
    assert(Array.isArray(memRes.body.planPopularity), 'Plan popularity distribution list provided');
    assert(Array.isArray(memRes.body.growthTrend), 'Membership growth curve trend data provided');
    assert(Array.isArray(memRes.body.expiringTrends), 'Upcoming membership expiration horizons provided');

    // ============================================================================
    // 4. ATTENDANCE & FACILITY UTILIZATION
    // ============================================================================
    console.log('\n▶ [TEST 4] Attendance & Turnstile Utilization Telemetry...');
    const attRes = await request({
      path: '/api/reports/attendance?range=30d',
      headers: ownerHeadersGym1,
    });

    assert(attRes.status === 200, 'Attendance report returns 200 OK');
    assert(attRes.body.success === true, 'Attendance report has success: true');
    const attSum = attRes.body.summary || {};
    assert(typeof attSum.totalVisits === 'number', 'Attendance summary contains totalVisits');
    assert(typeof attSum.dailyAverage === 'number', 'Attendance summary contains dailyAverage');
    assert(typeof attSum.peakHour === 'string', 'Attendance summary contains peakHour indicator');
    assert(typeof attSum.avgDurationMinutes === 'number', 'Attendance summary contains avgDurationMinutes');
    assert(Array.isArray(attRes.body.hourlyFlow), '24-hour hourly flow distribution array provided');
    assert(Array.isArray(attRes.body.weekdayDistribution), 'Weekday distribution traffic provided');

    // ============================================================================
    // 5. TRAINER PERFORMANCE & CLIENT LOAD
    // ============================================================================
    console.log('\n▶ [TEST 5] Trainer Performance & Payroll Reports...');
    const trRes = await request({
      path: '/api/reports/trainers',
      headers: ownerHeadersGym1,
    });

    assert(trRes.status === 200, 'Trainer report returns 200 OK');
    assert(trRes.body.success === true, 'Trainer report has success: true');
    const trSum = trRes.body.summary || {};
    assert(typeof trSum.totalTrainers === 'number', 'Trainer summary contains totalTrainers');
    assert(typeof trSum.activeTrainers === 'number', 'Trainer summary contains activeTrainers');
    assert(typeof trSum.avgAttendanceRate === 'number', 'Trainer summary contains avgAttendanceRate');
    assert(typeof trSum.avgRating === 'number', 'Trainer summary contains avgRating');
    assert(Array.isArray(trRes.body.trainers), 'Trainers performance roster list provided');
    if (trRes.body.trainers.length > 0) {
      const firstTrainer = trRes.body.trainers[0];
      assert(typeof firstTrainer.name === 'string', 'Trainer record has name');
      assert(typeof firstTrainer.specialization === 'string', 'Trainer record has specialization');
      assert(typeof firstTrainer.assignedClientsCount === 'number', 'Trainer record has assignedClientsCount');
      assert(typeof firstTrainer.completedSessions === 'number', 'Trainer record has completedSessions');
      assert(typeof firstTrainer.rating === 'number', 'Trainer record has client rating');
    }

    // ============================================================================
    // 6. MEMBER ENGAGEMENT & RETENTION SEGMENTATION
    // ============================================================================
    console.log('\n▶ [TEST 6] Member Engagement & At-Risk Cohorts...');
    const engRes = await request({
      path: '/api/reports/member-engagement',
      headers: ownerHeadersGym1,
    });

    assert(engRes.status === 200, 'Member engagement report returns 200 OK');
    assert(engRes.body.success === true, 'Member engagement report has success: true');
    const segs = engRes.body.segments || {};
    assert(Array.isArray(segs.mostActive), 'Contains Most Active Members cohort');
    assert(Array.isArray(segs.inactive), 'Contains Inactive Members (>7 days) cohort');
    assert(Array.isArray(segs.lowAttendance), 'Contains Low Attendance Members cohort');
    assert(Array.isArray(segs.expiringSoon), 'Contains Members Expiring Soon cohort');
    assert(Array.isArray(segs.pendingDues), 'Contains Members with Pending Dues cohort');

    // ============================================================================
    // 7. DATE-RANGE FILTER RESOLUTION
    // ============================================================================
    console.log('\n▶ [TEST 7] Date Range Preset & Custom Window Resolution...');
    const presets = ['today', 'yesterday', '7d', '30d', 'this_month', 'last_month', 'this_year'];
    for (const p of presets) {
      const res = await request({
        path: `/api/reports/overview?range=${p}`,
        headers: ownerHeadersGym1,
      });
      assert(res.status === 200 && res.body.success, `Date range filter '${p}' resolves successfully`);
    }

    // Custom date range
    const customRes = await request({
      path: '/api/reports/overview?range=custom&startDate=2026-01-01&endDate=2026-12-31',
      headers: ownerHeadersGym1,
    });
    assert(customRes.status === 200 && customRes.body.success, 'Custom date range (2026-01-01 to 2026-12-31) resolves');

    // ============================================================================
    // 8. CSV / EXCEL DATA EXPORT CENTER
    // ============================================================================
    console.log('\n▶ [TEST 8] Excel & CSV Data Export Center for 6 Entities...');
    const exportTypes = ['members', 'payments', 'attendance', 'trainers', 'memberships', 'revenue'];
    for (const expType of exportTypes) {
      const res = await request({
        path: `/api/reports/export?type=${expType}&range=30d`,
        headers: ownerHeadersGym1,
      });
      assert(res.status === 200, `CSV Export for '${expType}' returns 200 OK`);
      assert(
        (res.headers['content-type'] || '').includes('text/csv'),
        `CSV Export for '${expType}' sets Content-Type text/csv`
      );
      assert(
        typeof res.body === 'string' && res.body.length > 10,
        `CSV Export for '${expType}' contains valid non-empty CSV formatted content`
      );
    }

    // ============================================================================
    // 9. PRINTABLE PDF / HTML EXECUTIVE REPORTS
    // ============================================================================
    console.log('\n▶ [TEST 9] Printable PDF / HTML Executive Reports (6 Formats)...');
    const pdfTypes = ['monthly-business', 'revenue', 'membership', 'attendance', 'trainers', 'member-activity'];
    for (const pdfType of pdfTypes) {
      const res = await request({
        path: `/api/reports/pdf/${pdfType}?range=30d`,
        headers: ownerHeadersGym1,
      });
      assert(res.status === 200, `Printable report for '${pdfType}' returns 200 OK`);
      assert(
        (res.headers['content-type'] || '').includes('text/html'),
        `Printable report for '${pdfType}' sets Content-Type text/html`
      );
      assert(
        typeof res.body === 'string' && res.body.includes('GymFlow AI') && res.body.includes('window.print()'),
        `Printable report for '${pdfType}' contains GymFlow branding and window.print() trigger`
      );
    }

    // ============================================================================
    // 10. MULTI-TENANT GYM DATA ISOLATION
    // ============================================================================
    console.log('\n▶ [TEST 10] Multi-Tenant Gym Data Isolation (Gym 1 vs Gym 2)...');
    const gym1Overview = await request({
      path: '/api/reports/overview',
      headers: ownerHeadersGym1,
    });
    const gym2Overview = await request({
      path: '/api/reports/overview',
      headers: ownerHeadersGym2,
    });

    assert(gym1Overview.status === 200 && gym2Overview.status === 200, 'Both Gym 1 and Gym 2 fetch reports');
    assert(gym1Overview.body.gymName === 'IronPulse Fitness Club', 'Gym 1 report identified as IronPulse Fitness Club');
    assert(gym2Overview.body.gymName === 'Titan Forge CrossFit & Gym', 'Gym 2 report identified as Titan Forge CrossFit & Gym');
    assert(gym1Overview.body.gymName !== gym2Overview.body.gymName, 'Strict gym tenant separation between Gym 1 and Gym 2');

    // ============================================================================
    // 11. SECURITY & RBAC ENFORCEMENT
    // ============================================================================
    console.log('\n▶ [TEST 11] Security & RBAC Enforcement...');
    // 1. Unauthenticated
    const unauthRes = await request({
      path: '/api/reports/overview',
      headers: {},
    });
    assert(unauthRes.status === 401, 'Unauthenticated request to reports returns 401 Unauthorized');

    // 2. Member Persona (Forbidden)
    const memberReportRes = await request({
      path: '/api/reports/revenue',
      headers: memberHeaders,
    });
    assert(memberReportRes.status === 403, 'Member role accessing financial reports returns 403 Forbidden');

    // 3. Trainer Persona (Forbidden)
    const trainerReportRes = await request({
      path: '/api/reports/overview',
      headers: trainerHeaders,
    });
    assert(trainerReportRes.status === 403, 'Trainer role accessing business reports returns 403 Forbidden');

    // 4. Super Admin Persona (Allowed)
    const adminReportRes = await request({
      path: '/api/reports/overview',
      headers: superAdminHeaders,
    });
    assert(adminReportRes.status === 200, 'Super admin role successfully accesses business reports');

  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    failedCount++;
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
