const http = require('http');

const BASE_URL = 'http://localhost:5000';
const GYM_1 = '11111111-1111-1111-1111-111111111111'; // gym-1 (IronPulse)
const GYM_2 = '22222222-2222-2222-2222-222222222222'; // gym-2 (Titan Forge)
const GYM_3 = '33333333-3333-3333-3333-333333333333'; // gym-3 (Zenith)

const OWNER_TOKEN_GYM1 = 'demo-token-gym_owner';
const OWNER_TOKEN_GYM2 = 'demo-token-gym_owner_titan';
const TRAINER_TOKEN = 'demo-token-trainer';
const MEMBER_TOKEN = 'demo-token-member';
const SUPERADMIN_TOKEN = 'demo-token-super_admin';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawBody: body });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(data);
    }
    req.end();
  });
}

async function runTrainerSuite() {
  console.log('================================================================');
  console.log('🏋️‍♂️ GYMFLOW AI - STEP 9: COMPLETE TRAINER MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // 1. Live Trainer KPIs & Dashboard Stats
  // -------------------------------------------------------------
  console.log('--- 1. Live Trainer KPIs & Dashboard Stats ---');
  const statsRes = await request('/api/trainers/stats', {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });

  assert(statsRes.status === 200, 'GET /api/trainers/stats returns HTTP 200');
  assert(statsRes.body && statsRes.body.success === true, 'Response indicates success: true');
  const stats = statsRes.body?.stats;
  assert(stats && typeof stats.totalTrainers === 'number', 'Contains totalTrainers metric');
  assert(stats && typeof stats.activeTrainers === 'number', 'Contains activeTrainers metric');
  assert(stats && typeof stats.trainersAvailableToday === 'number', 'Contains trainersAvailableToday metric');
  assert(stats && typeof stats.totalAssignedMembers === 'number', 'Contains totalAssignedMembers metric');
  assert(stats && typeof stats.trainingSessionsToday === 'number', 'Contains trainingSessionsToday metric');
  assert(stats && typeof stats.monthlyTrainerSalary === 'number', 'Contains monthlyTrainerSalary metric');
  assert(Array.isArray(stats?.upcomingSessions), 'Contains upcomingSessions array');
  assert(Array.isArray(stats?.trainerPerformance), 'Contains trainerPerformance breakdown');

  // -------------------------------------------------------------
  // 2. Multi-Tenant Trainer Roster & Filters
  // -------------------------------------------------------------
  console.log('\n--- 2. Multi-Tenant Trainer Roster & Filtering ---');
  const trainersGym1 = await request('/api/trainers', {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });

  assert(trainersGym1.status === 200, 'GET /api/trainers returns HTTP 200');
  assert(Array.isArray(trainersGym1.body?.trainers), 'Returns list of trainers');
  const g1Trainers = trainersGym1.body.trainers;
  const allGym1 = g1Trainers.every((t) => t.gymId === 'gym-1' || t.gym_id === 'gym-1' || t.gym_id === GYM_1);
  assert(allGym1, 'All trainers strictly belong to Gym 1 tenant (no data leakage)');

  // Search filter
  const searchRes = await request('/api/trainers?search=Alex', {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(searchRes.status === 200, 'Search filter returns HTTP 200');
  assert(
    searchRes.body?.trainers?.some((t) => (t.fullName || t.full_name).includes('Alex')),
    'Search filter successfully locates "Alex Rivera"'
  );

  // Specialization filter
  const specRes = await request('/api/trainers?specialization=CrossFit', {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(specRes.status === 200, 'Specialization filter returns HTTP 200');
  assert(
    specRes.body?.trainers?.every((t) => t.specialization.toLowerCase().includes('crossfit')),
    'Specialization filter correctly matches CrossFit trainers'
  );

  // -------------------------------------------------------------
  // 3. Register New Trainer (Enforcing TR-XXXX & SaaS Limits)
  // -------------------------------------------------------------
  console.log('\n--- 3. Register New Trainer & Invitation ---');
  const newTrainerRes = await request('/api/trainers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      fullName: 'Vikramaditya Rathore',
      email: 'vikram.rathore@ironpulse.com',
      phone: '+91 99112 33445',
      dateOfBirth: '1992-06-15',
      gender: 'Male',
      address: '402 Palm Heights, Bandra West',
      emergencyContact: '+91 98220 11223',
      specialization: 'Olympic Weightlifting & Mobility',
      experience: '6+ years',
      certifications: ['CSCS', 'USAW Level 2'],
      skills: ['Snatch Mechanics', 'Clean & Jerk', 'Thoracic Mobility'],
      employmentType: 'full_time',
      shiftTiming: '06:00 AM - 02:00 PM',
      salaryType: 'monthly',
      baseSalary: 55000,
      hourlyRate: 1200,
      commissionRate: 15,
      bankAccountNumber: '50100456789123',
      bankIfscCode: 'HDFC0001234',
      sendInvitation: true,
      notes: 'Former national level weightlifter and certified strength coach.',
    },
  });

  assert(newTrainerRes.status === 201, 'POST /api/trainers registers trainer with HTTP 201 Created');
  const createdTrainer = newTrainerRes.body?.trainer;
  assert(createdTrainer && createdTrainer.full_name === 'Vikramaditya Rathore', 'Trainer name preserved');
  assert(
    createdTrainer && (createdTrainer.trainer_code || createdTrainer.trainerCode)?.startsWith('TR-'),
    `Trainer ID auto-generated in TR-XXXX format: ${createdTrainer?.trainerCode || createdTrainer?.trainer_code}`
  );
  assert(createdTrainer && Number(createdTrainer.base_salary || createdTrainer.baseSalary) === 55000, 'Base salary recorded correctly');
  assert(Boolean(newTrainerRes.body?.invitationToken), 'Trainer invitation token generated successfully');
  const invitationToken = newTrainerRes.body?.invitationToken;

  // -------------------------------------------------------------
  // 3b. Accept Trainer Invitation Token (Section 13.3)
  // -------------------------------------------------------------
  console.log('\n--- 3b. Accept Trainer Invitation Workflow ---');
  const acceptRes = await request('/api/invitations/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer demo-token-trainer_vikram` },
    body: { token: invitationToken },
  });

  assert(acceptRes.status === 200, 'POST /api/invitations/accept accepts invitation with HTTP 200');
  assert(acceptRes.body?.success === true, 'Invitation acceptance indicates success: true');
  assert(acceptRes.body?.role === 'trainer', 'Assigned role correctly confirmed as trainer');

  // Verify duplicate acceptance is rejected
  const dupAcceptRes = await request('/api/invitations/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer demo-token-trainer_vikram` },
    body: { token: invitationToken },
  });
  assert(dupAcceptRes.status === 400, 'Re-accepting spent invitation rejected with HTTP 400');

  // -------------------------------------------------------------
  // 4. Trainer Profile Details & Dossier
  // -------------------------------------------------------------
  console.log('\n--- 4. Trainer Profile Details Dossier ---');
  const trainerId = createdTrainer.id;
  const profileRes = await request(`/api/trainers/${trainerId}`, {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });

  assert(profileRes.status === 200, 'GET /api/trainers/:id returns HTTP 200');
  assert(profileRes.body?.success === true, 'Profile query indicates success: true');
  assert(profileRes.body?.trainer?.id === trainerId, 'Returns correct trainer entity');
  assert(Array.isArray(profileRes.body?.assignedMembers), 'Includes assignedMembers array');
  assert(Array.isArray(profileRes.body?.sessions), 'Includes sessions array');
  assert(Array.isArray(profileRes.body?.attendance), 'Includes attendance history');
  assert(Array.isArray(profileRes.body?.salaries), 'Includes salary records');
  assert(profileRes.body?.performance && typeof profileRes.body.performance.rating === 'number', 'Includes performance rating');

  // -------------------------------------------------------------
  // 5. Cross-Gym Tenant Security Isolation
  // -------------------------------------------------------------
  console.log('\n--- 5. Cross-Gym Tenant Security Isolation ---');
  // Attempt to access Gym 1 trainer from Gym 2 context as Gym 2 owner
  const crossGymRes = await request(`/api/trainers/${trainerId}`, {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM2}`, 'X-Gym-Id': 'gym-2' },
  });
  assert(crossGymRes.status === 403, 'Cross-gym trainer profile lookup rejected with HTTP 403 Forbidden');

  // -------------------------------------------------------------
  // 6. RBAC: Trainer Role Self-Profile Isolation
  // -------------------------------------------------------------
  console.log('\n--- 6. RBAC: Trainer Role Restrictive Visibility ---');
  // A trainer (Alex Rivera) trying to access another coach's profile (Priya Sharma)
  const unauthorizedTrainerRes = await request(`/api/trainers/bbbb1111-0000-0000-0000-000000000002`, {
    headers: { Authorization: `Bearer ${TRAINER_TOKEN}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(
    unauthorizedTrainerRes.status === 403,
    'Trainer role restricted from inspecting other coaches profiles (HTTP 403 Forbidden)'
  );

  // -------------------------------------------------------------
  // 7. Member Assignment & Workload Gauge
  // -------------------------------------------------------------
  console.log('\n--- 7. Member Assignment & Workload Capacity ---');
  // Assign 2 members from Gym 1 to Vikramaditya Rathore
  const member1Id = 'cccc1111-0000-0000-0000-000000000001'; // Aarav Patel (Gym 1)
  const member2Id = 'cccc1111-0000-0000-0000-000000000002'; // Sneha Sharma (Gym 1)

  const assignRes = await request(`/api/trainers/${trainerId}/assign-members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      memberIds: [member1Id, member2Id],
      notes: 'Initial 12-week strength & mobility block assignment',
    },
  });

  assert(assignRes.status === 200, 'POST /api/trainers/:id/assign-members returns HTTP 200');
  assert(assignRes.body?.assignedCount === 2, 'Assigned 2 athletes successfully');
  assert(assignRes.body?.trainer?.assignedMembersCount >= 2, 'Trainer client count updated dynamically');

  // Verify member listing for trainer
  const trainerMembersRes = await request(`/api/trainers/${trainerId}/members`, {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(trainerMembersRes.status === 200, 'GET /api/trainers/:id/members returns HTTP 200');
  assert(
    trainerMembersRes.body?.members?.some((m) => m.id === member1Id),
    'Aarav Patel listed under assigned athletes'
  );

  // -------------------------------------------------------------
  // 8. Cross-Gym Member Assignment Prevention (Strict Anti-Leakage)
  // -------------------------------------------------------------
  console.log('\n--- 8. Cross-Gym Assignment Prevention ---');
  // Attempt to assign Gym 2 athlete (Rohan Joshi) to Gym 1 coach
  const gym2MemberId = 'cccc2222-0000-0000-0000-000000000001'; // Rohan Joshi (Gym 2)
  const crossAssignRes = await request(`/api/trainers/${trainerId}/assign-members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      memberIds: [gym2MemberId],
    },
  });

  assert(crossAssignRes.status === 403, 'Cross-gym athlete assignment rejected with HTTP 403 Forbidden');
  assert(
    crossAssignRes.body?.error?.includes('Cross-gym') || crossAssignRes.body?.error?.includes('another gym'),
    'Error message clearly communicates cross-gym violation'
  );

  // -------------------------------------------------------------
  // 9. Member Unassignment
  // -------------------------------------------------------------
  console.log('\n--- 9. Member Unassignment ---');
  const unassignRes = await request(`/api/trainers/${trainerId}/unassign-member`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: { memberId: member2Id },
  });

  assert(unassignRes.status === 200, 'POST /api/trainers/:id/unassign-member returns HTTP 200');
  assert(unassignRes.body?.success === true, 'Member unassigned successfully');

  // -------------------------------------------------------------
  // 9b. Member Reassignment (Section 13.5)
  // -------------------------------------------------------------
  console.log('\n--- 9b. Member Reassignment ---');
  const priyaTrainerId = 'bbbb1111-0000-0000-0000-000000000002'; // Priya Sharma
  const reassignRes = await request(`/api/trainers/${priyaTrainerId}/assign-members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      memberIds: [member1Id],
      notes: 'Reassigned from Vikramaditya to Priya Sharma for functional conditioning block',
    },
  });

  assert(reassignRes.status === 200, 'Reassignment of athlete to new coach returns HTTP 200');
  assert(reassignRes.body?.assignedCount === 1, 'Reassigned 1 athlete successfully');

  // -------------------------------------------------------------
  // 10. Training Session Scheduling
  // -------------------------------------------------------------
  console.log('\n--- 10. Training Session Scheduling ---');
  const testSessionDate = '2026-11-20';
  const scheduleRes = await request('/api/trainers/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      trainerId,
      memberId: member1Id,
      sessionTitle: 'Snatch Technique & Mobility',
      sessionDate: testSessionDate,
      startTime: '08:00',
      endTime: '09:00',
      trainingType: 'Olympic Weightlifting',
      notes: 'Focus on tall snatch and overhead squat stability.',
    },
  });

  assert(scheduleRes.status === 201, 'POST /api/trainers/sessions creates session with HTTP 201 Created');
  const session1 = scheduleRes.body?.session;
  assert(session1 && session1.sessionTitle === 'Snatch Technique & Mobility', 'Session title preserved');
  assert(session1 && session1.sessionStatus === 'scheduled', 'Session status marked as "scheduled"');
  const sessionId = session1?.id;

  // -------------------------------------------------------------
  // 11. Anti-Overlap Conflict Detection Engine
  // -------------------------------------------------------------
  console.log('\n--- 11. Anti-Overlap Conflict Detection Engine ---');
  // Attempt to schedule an overlapping session for same trainer on same date: 08:30 - 09:30
  const overlapRes = await request('/api/trainers/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      trainerId,
      memberId: member1Id,
      sessionTitle: 'Conflicting Barbell Session',
      sessionDate: testSessionDate,
      startTime: '08:30',
      endTime: '09:30',
      trainingType: 'Strength',
    },
  });

  assert(overlapRes.status === 400, 'Overlapping session strictly rejected with HTTP 400 Bad Request');
  assert(
    overlapRes.body?.error?.includes('Schedule Conflict') || overlapRes.body?.error?.includes('overlap'),
    `Conflict engine returned error: "${overlapRes.body?.error}"`
  );

  // Attempt to schedule session right after previous session (09:00 - 10:00) -> Non-overlapping, should succeed!
  const nonOverlapRes = await request('/api/trainers/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      trainerId,
      memberId: member1Id,
      sessionTitle: 'Accessory & Core Work',
      sessionDate: testSessionDate,
      startTime: '09:00',
      endTime: '10:00',
      trainingType: 'Functional Strength',
    },
  });

  assert(nonOverlapRes.status === 201, 'Contiguous non-overlapping session (09:00-10:00) succeeds with HTTP 201');

  // -------------------------------------------------------------
  // 12. Cross-Gym Session Scheduling Rejection
  // -------------------------------------------------------------
  console.log('\n--- 12. Cross-Gym Session Scheduling Rejection ---');
  const crossSessionRes = await request('/api/trainers/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      trainerId,
      memberId: gym2MemberId, // Athlete from Gym 2
      sessionTitle: 'Cross-Gym Sneak Session',
      sessionDate: testSessionDate,
      startTime: '11:00',
      endTime: '12:00',
    },
  });

  assert(crossSessionRes.status === 403, 'Cross-gym session booking rejected with HTTP 403 Forbidden');

  // -------------------------------------------------------------
  // 13. Reschedule Session with Anti-Overlap Check
  // -------------------------------------------------------------
  console.log('\n--- 13. Reschedule Session with Anti-Overlap Check ---');
  // Attempt to reschedule session1 (08:00-09:00) into session2's slot (09:15-10:15)
  const badRescheduleRes = await request(`/api/trainers/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      newDate: testSessionDate,
      newStartTime: '09:15',
      newEndTime: '10:15',
      notes: 'Attempting to move into another slot',
    },
  });

  assert(badRescheduleRes.status === 400, 'Rescheduling into conflicting slot rejected with HTTP 400');

  // Reschedule into completely free afternoon slot (16:00 - 17:00)
  const goodRescheduleRes = await request(`/api/trainers/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      newDate: testSessionDate,
      newStartTime: '16:00',
      newEndTime: '17:00',
      notes: 'Moved to afternoon per member request',
    },
  });

  assert(goodRescheduleRes.status === 200, 'Rescheduling to free slot succeeds with HTTP 200');
  assert(goodRescheduleRes.body?.session?.sessionStatus === 'rescheduled', 'Status updated to "rescheduled"');

  // -------------------------------------------------------------
  // 14. Session Status Updates
  // -------------------------------------------------------------
  console.log('\n--- 14. Session Completion Status ---');
  const completeRes = await request(`/api/trainers/sessions/${sessionId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: { status: 'completed', notes: 'Great PR on clean & jerk!' },
  });

  assert(completeRes.status === 200, 'PUT /api/trainers/sessions/:id/status returns HTTP 200');
  assert(completeRes.body?.session?.sessionStatus === 'completed', 'Session marked as "completed"');

  // -------------------------------------------------------------
  // 15. Trainer Shift Attendance & Working Hours
  // -------------------------------------------------------------
  console.log('\n--- 15. Trainer Attendance & Working Hours ---');
  const checkInRes = await request('/api/trainers/attendance/check-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: { trainerId, notes: 'Morning shift start' },
  });

  assert(checkInRes.status === 200, 'Trainer check-in returns HTTP 200');
  assert(checkInRes.body?.attendance?.status === 'checked_in', 'Attendance record marked "checked_in"');

  const checkOutRes = await request('/api/trainers/attendance/check-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: { trainerId, notes: 'Morning shift completed smoothly' },
  });

  assert(checkOutRes.status === 200, 'Trainer check-out returns HTTP 200');
  assert(checkOutRes.body?.attendance?.status === 'checked_out', 'Attendance record marked "checked_out"');
  assert(typeof checkOutRes.body?.workingHours === 'number', `Computed working hours: ${checkOutRes.body?.workingHours} hrs`);

  // -------------------------------------------------------------
  // 16. Monthly Salary Payout & Payroll Record
  // -------------------------------------------------------------
  console.log('\n--- 16. Monthly Salary Payout & Payroll Record ---');
  const payoutRes = await request(`/api/trainers/${trainerId}/salaries/record`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
    body: {
      salaryMonth: '2026-11',
      baseAmount: 55000,
      commissionAmount: 8500,
      bonusAmount: 3000,
      deductions: 1500,
      paymentMethod: 'bank_transfer',
      notes: 'November coaching disbursement + PT commissions',
    },
  });

  assert(payoutRes.status === 201, 'POST /api/trainers/:id/salaries/record returns HTTP 201 Created');
  const salaryRecord = payoutRes.body?.salary;
  assert(salaryRecord && salaryRecord.netPaid === 65000, `Net payout calculated accurately: ₹${salaryRecord?.netPaid} (55000 + 8500 + 3000 - 1500)`);
  assert(salaryRecord && salaryRecord.paymentStatus === 'paid', 'Payout marked as "paid"');

  // Verify salary history
  const salaryHistoryRes = await request(`/api/trainers/${trainerId}/salaries`, {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(salaryHistoryRes.status === 200, 'GET /api/trainers/:id/salaries returns HTTP 200');
  assert(
    salaryHistoryRes.body?.salaries?.some((s) => s.salaryMonth === '2026-11'),
    'November salary payout listed in historical ledger'
  );

  // -------------------------------------------------------------
  // 17. Monthly Salary Summary & Liability Calculation (Section 13.9)
  // -------------------------------------------------------------
  console.log('\n--- 17. Monthly Salary Summary & Liability Calculation ---');
  const salarySummaryRes = await request('/api/trainers/salary/summary?month=2026-11', {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });

  assert(salarySummaryRes.status === 200, 'GET /api/trainers/salary/summary returns HTTP 200');
  assert(salarySummaryRes.body?.success === true, 'Salary summary indicates success: true');
  const salSummary = salarySummaryRes.body?.summary;
  assert(salSummary && typeof salSummary.totalBaseSalary === 'number', 'Summary contains totalBaseSalary liability');
  assert(salSummary && typeof salSummary.totalDisbursed === 'number', 'Summary contains totalDisbursed amount');
  assert(salSummary && typeof salSummary.pendingSalary === 'number', 'Summary contains pendingSalary calculation');
  assert(
    salSummary && salSummary.totalDisbursed >= 65000,
    `Total disbursed accurately includes recorded payout: ₹${salSummary?.totalDisbursed}`
  );

  // -------------------------------------------------------------
  // 18. Member Feedback & Transparent Performance (Section 13.10)
  // -------------------------------------------------------------
  console.log('\n--- 18. Member Feedback & Transparent Performance ---');
  const feedbackRes = await request(`/api/trainers/${trainerId}/feedback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${MEMBER_TOKEN}`, 'X-Gym-Id': 'gym-1' },
    body: {
      rating: 5,
      feedback: 'Outstanding Olympic lifting coaching! Dialed in my clean & jerk technique in just two sessions.',
      memberId: member1Id,
    },
  });

  assert(feedbackRes.status === 201, 'POST /api/trainers/:id/feedback submits review with HTTP 201 Created');
  assert(feedbackRes.body?.review?.rating === 5, 'Rating preserved as 5 stars');

  // Verify feedback list
  const getFeedbackRes = await request(`/api/trainers/${trainerId}/feedback`, {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(getFeedbackRes.status === 200, 'GET /api/trainers/:id/feedback returns HTTP 200');
  assert(
    getFeedbackRes.body?.feedbackList?.some((f) => f.rating === 5),
    'Submitted review present in trainer feedback list'
  );

  // Verify transparent performance metrics
  const perfRes = await request(`/api/trainers/${trainerId}/performance`, {
    headers: { Authorization: `Bearer ${OWNER_TOKEN_GYM1}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(perfRes.status === 200, 'GET /api/trainers/:id/performance returns HTTP 200');
  const perf = perfRes.body?.performance;
  assert(perf && typeof perf.rating === 'number', `Trainer average rating calculated: ${perf?.rating} ★`);
  assert(perf && typeof perf.retentionRate === 'number', `Transparent athlete retention rate: ${perf?.retentionRate}%`);
  assert(perf && typeof perf.attendanceRate === 'number', `Transparent shift attendance rate: ${perf?.attendanceRate}%`);

  // -------------------------------------------------------------
  // 19. RBAC Trainer Role Permissions (Section 13.11)
  // -------------------------------------------------------------
  console.log('\n--- 19. RBAC Trainer Role Permissions ---');
  // Alex Rivera viewing their OWN profile -> 200 OK
  const alexTrainerId = 'bbbb1111-0000-0000-0000-000000000001';
  const selfProfileRes = await request(`/api/trainers/${alexTrainerId}`, {
    headers: { Authorization: `Bearer ${TRAINER_TOKEN}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(selfProfileRes.status === 200, 'Trainer can view their own profile (HTTP 200)');
  assert(selfProfileRes.body?.trainer?.id === alexTrainerId, 'Correct self trainer entity returned');

  // Alex Rivera viewing their assigned athletes -> 200 OK
  const selfMembersRes = await request(`/api/trainers/${alexTrainerId}/members`, {
    headers: { Authorization: `Bearer ${TRAINER_TOKEN}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(selfMembersRes.status === 200, 'Trainer can view their assigned athletes (HTTP 200)');

  // Alex Rivera attempting to access owner-only salary summary -> 403 Forbidden
  const forbiddenSalaryRes = await request('/api/trainers/salary/summary', {
    headers: { Authorization: `Bearer ${TRAINER_TOKEN}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(forbiddenSalaryRes.status === 403, 'Trainer blocked from viewing gym-wide salary summary (HTTP 403 Forbidden)');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTrainerSuite().catch((err) => {
  console.error('Test suite crashed with unhandled error:', err);
  process.exit(1);
});
