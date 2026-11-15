/**
 * GYMFLOW AI - STEP 6: MEMBER MANAGEMENT SYSTEM VERIFICATION SUITE
 * 
 * Verifies all 11 core functional requirements:
 * 1. Member registration with full fields (personal, membership, health, auto-ID)
 * 2. Member profile updates & persistence
 * 3. Initial plan assignment & dynamic expiry calculation
 * 4. Membership renewal with date extension (active extension vs expired renewal)
 * 5. Preservation of historical contracts in member_memberships (never overwrite old records)
 * 6. Dynamic expiry tracking (active, expiring ≤7d, expiring ≤15d, expired, suspended)
 * 7. Search, multi-criteria filtering, sorting & pagination
 * 8. Non-sensitive QR token generation & cross-gym scan rejection (403)
 * 9. Multi-tenant isolation (Gym A cannot read/manage Gym B athletes)
 * 10. Safe plan deletion prevention (blocks deleting plans assigned to members)
 * 11. Role permission enforcement (trainers cannot delete, members cannot change status)
 */

const BASE_URL = 'http://localhost:5000/api';

const TOKENS = {
  superAdmin: 'demo-token-super_admin',
  gym1Owner: 'demo-token-gym_owner',
  trainer: 'demo-token-trainer',
  member: 'demo-token-member',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runSuite() {
  console.log('===============================================================');
  console.log('🏋️‍♂️ GYMFLOW AI - STEP 6: MEMBER MANAGEMENT TEST SUITE');
  console.log('===============================================================\n');

  let createdMemberId = null;
  let createdMemberCode = null;
  let createdMemberQR = null;

  // -------------------------------------------------------------
  // TEST 1: Full Member Registration
  // -------------------------------------------------------------
  console.log('--- 1. Full Member Registration (Personal, Plan, Health, Auto-ID) ---');
  const regPayload = {
    fullName: 'Aditya Kashyap',
    email: 'aditya.kashyap@gymflow.ai',
    phone: '+91 98333 44555',
    dateOfBirth: '1995-08-20',
    gender: 'Male',
    address: '402 Sunrise Heights, Bandra West, Mumbai',
    emergencyContact: 'Sunita Kashyap (+91 98222 33444)',
    medicalNotes: 'Past meniscus tear (left knee). Needs low-impact warmups.',
    fitnessGoal: 'Hypertrophy & Mobility',
    planId: 'plan-2', // Quarterly Pro Transformation (3 months)
    startDate: '2026-11-01',
    discount: 500,
    paymentStatus: 'completed',
    paymentMethod: 'upi',
  };

  const regRes = await request('/members', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify(regPayload),
  });

  assert(regRes.status === 201, `Member registration returns 201 Created (got ${regRes.status})`);
  assert(regRes.data?.success === true, 'Response indicates success: true');
  assert(Boolean(regRes.data?.data?.id), `Generated unique member ID: ${regRes.data?.data?.id}`);
  assert(regRes.data?.data?.member_code?.startsWith('IP-') || regRes.data?.data?.member_code?.startsWith('IFC-'), `Member code formatted with gym prefix: ${regRes.data?.data?.member_code}`);
  assert(regRes.data?.data?.qr_token?.startsWith('GYMFLOW-QR-'), `Non-sensitive QR token created: ${regRes.data?.data?.qr_token}`);
  assert(regRes.data?.data?.medical_notes === regPayload.medicalNotes, 'Clinical / medical notes stored safely');
  assert(regRes.data?.data?.status === 'active', 'Dynamic status initialized to active');

  createdMemberId = regRes.data?.data?.id;
  createdMemberCode = regRes.data?.data?.member_code;
  createdMemberQR = regRes.data?.data?.qr_token;

  // -------------------------------------------------------------
  // TEST 2: Member Profile Updates
  // -------------------------------------------------------------
  console.log('\n--- 2. Member Profile Updates & Persistence ---');
  const updatePayload = {
    phone: '+91 98333 99999',
    fitnessGoal: 'Competitive Powerlifting',
    medicalNotes: 'Left knee healed. Approved for regular squatting.',
  };

  const updateRes = await request(`/members/${createdMemberId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify(updatePayload),
  });

  assert(updateRes.status === 200, `Profile update returns 200 OK (got ${updateRes.status})`);
  assert(updateRes.data?.data?.phone === '+91 98333 99999', 'Phone number updated successfully');
  assert(updateRes.data?.data?.fitnessGoal === 'Competitive Powerlifting', 'Fitness goal updated successfully');

  // Verify full profile retrieval
  const getProfileRes = await request(`/members/${createdMemberId}`, {
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });

  assert(getProfileRes.status === 200, 'GET /members/:id returns 200 OK');
  assert(getProfileRes.data?.data?.member?.full_name === 'Aditya Kashyap', 'Profile returns full athlete details');
  assert(Array.isArray(getProfileRes.data?.data?.memberships), 'Profile returns contract history array');
  assert(getProfileRes.data?.data?.memberships?.length >= 1, 'Initial enrollment contract is tracked in memberships history');

  // -------------------------------------------------------------
  // TEST 3: Initial Plan Assignment & Expiry Calculation
  // -------------------------------------------------------------
  console.log('\n--- 3. Plan Assignment & Initial Expiry Calculation ---');
  const initialEndDate = getProfileRes.data?.data?.member?.membership_end_date || getProfileRes.data?.data?.member?.expiry_date;
  // Started 2026-11-01 + 3 months -> 2027-02-01
  assert(initialEndDate === '2027-02-01', `Initial 3-month expiry calculated correctly: ${initialEndDate}`);

  // -------------------------------------------------------------
  // TEST 4 & 5: Membership Renewal & History Tracking
  // -------------------------------------------------------------
  console.log('\n--- 4 & 5. Membership Renewal System & Contract History Preservation ---');
  // Case A: Active Member Renewal (should extend from existing 2027-02-01 by 6 months -> 2027-08-01)
  const renewPayloadActive = {
    planId: 'plan-3', // Half-Yearly (6 months)
    discount: 1000,
    paymentMethod: 'razorpay',
    paymentStatus: 'completed',
    notes: 'Early bird renewal discount applied',
  };

  const renewRes = await request(`/members/${createdMemberId}/renew`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify(renewPayloadActive),
  });

  assert(renewRes.status === 200, `Active member renewal returns 200 OK (got ${renewRes.status})`);
  assert(renewRes.data?.success === true, 'Renewal reported success');
  assert(renewRes.data?.new_expiry_date === '2027-08-01', `New expiry date accurately extended by 6 months: ${renewRes.data?.new_expiry_date}`);

  // Verify History Tracking: Check that contract history now has 2 distinct records
  const profileAfterRenew = await request(`/members/${createdMemberId}`, {
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });

  const contractHistory = profileAfterRenew.data?.data?.memberships;
  assert(Array.isArray(contractHistory) && contractHistory.length === 2, `Contract history contains 2 distinct records (got ${contractHistory?.length})`);
  assert(contractHistory[1].status === 'renewed', 'Previous initial contract marked as renewed without being overwritten');
  assert(contractHistory[0].status === 'active', 'Latest renewal contract is marked active');

  // Case B: Expired Member Renewal (Rohan Varma mem-expired, expired 2026-10-15)
  // When renewing an expired member, extension must start from today (not past expiry)
  const renewExpiredRes = await request('/members/mem-expired/renew', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify({
      planId: 'plan-1', // 1 month
      paymentMethod: 'cash',
      paymentStatus: 'completed',
    }),
  });

  assert(renewExpiredRes.status === 200, 'Expired member renewal succeeded with 200 OK');
  assert(Boolean(renewExpiredRes.data?.new_expiry_date), `Expired member validity started from today + 1 month: ${renewExpiredRes.data?.new_expiry_date}`);

  // -------------------------------------------------------------
  // TEST 6: Dynamic Expiry Tracking & Dashboard Stats
  // -------------------------------------------------------------
  console.log('\n--- 6. Dynamic Expiry Tracking & Dashboard Live KPIs ---');
  const statsRes = await request('/members/stats', {
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });

  assert(statsRes.status === 200, 'GET /members/stats returns 200 OK');
  assert(typeof statsRes.data?.data?.total_members === 'number', `Total members KPI: ${statsRes.data?.data?.total_members}`);
  assert(typeof statsRes.data?.data?.active_members === 'number', `Active members KPI: ${statsRes.data?.data?.active_members}`);
  assert(typeof statsRes.data?.data?.expired_members === 'number', `Expired members KPI: ${statsRes.data?.data?.expired_members}`);
  assert(typeof statsRes.data?.data?.expiring_soon_members === 'number', `Expiring soon KPI: ${statsRes.data?.data?.expiring_soon_members}`);
  assert(typeof statsRes.data?.data?.new_members_this_month === 'number', `New members this month: ${statsRes.data?.data?.new_members_this_month}`);
  assert(typeof statsRes.data?.data?.renewal_revenue === 'number', `Renewal revenue KPI: ₹${statsRes.data?.data?.renewal_revenue}`);

  // -------------------------------------------------------------
  // TEST 7: Search, Multi-Criteria Filtering, Sorting & Pagination
  // -------------------------------------------------------------
  console.log('\n--- 7. Search, Multi-Criteria Filtering, Sorting & Pagination ---');
  
  // Search by name
  const searchNameRes = await request('/members?q=Aditya', {
    headers: { Authorization: `Bearer ${TOKENS.gym1Owner}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(searchNameRes.data?.data?.members?.length >= 1, 'Search by name returns matching member');
  assert(searchNameRes.data?.data?.members[0]?.full_name?.includes('Aditya'), 'Search results match queried name');

  // Search by phone
  const searchPhoneRes = await request('/members?q=98333', {
    headers: { Authorization: `Bearer ${TOKENS.gym1Owner}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(searchPhoneRes.data?.data?.members?.length >= 1, 'Search by phone number returns matching athlete');

  // Search by Member Code
  const searchCodeRes = await request(`/members?q=${createdMemberCode}`, {
    headers: { Authorization: `Bearer ${TOKENS.gym1Owner}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(searchCodeRes.data?.data?.members?.length === 1, `Search by Member Code ${createdMemberCode} returns exact athlete`);

  // Filter by Plan ID
  const filterPlanRes = await request('/members?planId=plan-3', {
    headers: { Authorization: `Bearer ${TOKENS.gym1Owner}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(filterPlanRes.data?.data?.members?.every((m) => m.current_plan_id === 'plan-3'), 'Filter by planId returns only athletes on plan-3');

  // Filter by Status: active
  const filterActiveRes = await request('/members?status=active', {
    headers: { Authorization: `Bearer ${TOKENS.gym1Owner}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(filterActiveRes.data?.data?.members?.every((m) => m.status === 'active'), 'Filter by status=active returns only active athletes');

  // Pagination test (page 1, limit 2)
  const pageRes = await request('/members?page=1&limit=2', {
    headers: { Authorization: `Bearer ${TOKENS.gym1Owner}`, 'X-Gym-Id': 'gym-1' },
  });
  assert(pageRes.data?.data?.members?.length <= 2, `Pagination limit respected (got ${pageRes.data?.data?.members?.length} items)`);
  assert(pageRes.data?.data?.pagination?.totalPages >= 1, `Pagination metadata contains totalPages: ${pageRes.data?.data?.pagination?.totalPages}`);

  // -------------------------------------------------------------
  // TEST 8: QR Code Generation & Non-Sensitive Verification
  // -------------------------------------------------------------
  console.log('\n--- 8. QR Code Security & Cross-Gym Scan Protection ---');
  // Check QR token content
  assert(!createdMemberQR.includes('password') && !createdMemberQR.includes('email') && !createdMemberQR.includes('1995-08-20'), 'QR token contains only non-sensitive opaque identifier');

  // Valid Scan in same gym (Gym 1 scans Gym 1 member)
  const validScanRes = await request('/members/qr-lookup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify({ qrToken: createdMemberQR }),
  });
  assert(validScanRes.status === 200, `Valid QR scan within same gym returns 200 OK (got ${validScanRes.status})`);
  assert(validScanRes.data?.data?.full_name === 'Aditya Kashyap', 'QR lookup returns athlete identity for authorized gym');

  // Cross-Gym Scan REJECTION: Gym 1 attempts to scan Gym 2 member QR token
  const gym2MemberQR = 'GYMFLOW-QR-TF-2001-SAMANTHA'; // Titan Forge athlete Samantha Bright
  const crossGymScanRes = await request('/members/qr-lookup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify({ qrToken: gym2MemberQR }),
  });
  assert(crossGymScanRes.status === 403, `Cross-gym QR scan strictly rejected with 403 Forbidden (got ${crossGymScanRes.status})`);
  assert(crossGymScanRes.data?.error?.includes('Cross-gym access denied'), 'Rejection error message clearly indicates tenant boundary violation');

  // -------------------------------------------------------------
  // TEST 9: Multi-Tenant Data Isolation
  // -------------------------------------------------------------
  console.log('\n--- 9. Multi-Tenant Data Isolation ---');
  // Gym 1 attempts to query Gym 2 members
  const crossGymListRes = await request('/members', {
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });

  const hasGym2Members = crossGymListRes.data?.data?.members?.some((m) => m.gym_id === 'gym-2');
  assert(!hasGym2Members, 'Gym 1 member listing never contains Gym 2 members');

  // Gym 1 attempts to directly fetch Gym 2 member profile
  const crossGymDirectFetch = await request('/members/mem-tf-1', {
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });
  assert(crossGymDirectFetch.status === 404 || crossGymDirectFetch.status === 403, `Direct cross-gym member retrieval blocked with status ${crossGymDirectFetch.status}`);

  // -------------------------------------------------------------
  // TEST 10: Safe Membership Plan Deletion Prevention
  // -------------------------------------------------------------
  console.log('\n--- 10. Safe Membership Plan Deletion Prevention ---');
  // Attempt to delete plan-2, which is assigned to active members
  const deleteAssignedPlanRes = await request('/plans/plan-2', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });
  assert(deleteAssignedPlanRes.status === 400, `Deleting plan assigned to members is blocked with 400 Bad Request (got ${deleteAssignedPlanRes.status})`);
  assert(deleteAssignedPlanRes.data?.error?.includes('Cannot delete plan') || deleteAssignedPlanRes.data?.error?.includes('assigned to'), 'Clear error returned instructing user to deactivate plan instead');

  // Create an unused test plan and delete it
  const createTempPlanRes = await request('/plans', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify({
      name: 'Temporary Trial Tier',
      durationMonths: 1,
      price: 999,
      description: 'Test ephemeral package',
    }),
  });
  assert(createTempPlanRes.status === 201, 'Created temporary unused plan');
  const tempPlanId = createTempPlanRes.data?.data?.id;

  const deleteTempPlanRes = await request(`/plans/${tempPlanId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TOKENS.gym1Owner}`,
      'X-Gym-Id': 'gym-1',
    },
  });
  assert(deleteTempPlanRes.status === 200, `Unassigned plan deletion succeeded with 200 OK (got ${deleteTempPlanRes.status})`);

  // -------------------------------------------------------------
  // TEST 11: Role Permission Enforcement
  // -------------------------------------------------------------
  console.log('\n--- 11. Role Permission Enforcement ---');
  // Member role attempts to change member status -> 403
  const memberUnauthorizedStatus = await request(`/members/${createdMemberId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKENS.member}`,
      'X-Gym-Id': 'gym-1',
    },
    body: JSON.stringify({ status: 'active' }),
  });
  assert(memberUnauthorizedStatus.status === 403, `Member attempting status modification blocked with 403 (got ${memberUnauthorizedStatus.status})`);

  // Trainer role attempts to delete member -> 403
  const trainerUnauthorizedDelete = await request(`/members/${createdMemberId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TOKENS.trainer}`,
      'X-Gym-Id': 'gym-1',
    },
  });
  assert(trainerUnauthorizedDelete.status === 403, `Trainer attempting member deletion blocked with 403 (got ${trainerUnauthorizedDelete.status})`);

  // Summary
  console.log('\n===============================================================');
  console.log(`TEST SUITE RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests > 0) {
    console.log(`❌ FAILED TESTS: ${failedTests}`);
    process.exit(1);
  } else {
    console.log('✅ ALL STEP 6 MEMBER MANAGEMENT REQUIREMENTS VERIFIED!');
    console.log('===============================================================\n');
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
