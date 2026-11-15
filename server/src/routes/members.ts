import { Router } from 'express';
import {
  supabase,
  isSupabaseConfigured,
  inMemoryDB,
  checkPlanLimits,
  calculateDynamicMemberStatus,
  executeRenewMemberMembership,
} from '../services/supabaseService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';
import { sendWhatsAppMessage, dispatchN8nWebhook } from '../services/whatsappService.js';
import crypto from 'crypto';

const router = Router();

// Apply auth and tenant isolation
router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

/**
 * GET /api/members/stats - Live Member Management KPIs for active gym
 */
router.get('/stats', async (req: AuthRequest, res) => {
  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  let tenantMembers = inMemoryDB.members.filter(
    (m) => isSuperAdmin || m.gymId === gymId || m.gym_id === gymId
  );

  // Dynamically update status based on current date
  tenantMembers.forEach((m) => {
    m.status = calculateDynamicMemberStatus(m.expiry_date || m.membershipEndDate, m.status) as any;
  });

  const totalMembers = tenantMembers.length;
  const activeMembers = tenantMembers.filter((m) => m.status === 'active').length;
  const expiredMembers = tenantMembers.filter((m) => m.status === 'expired').length;
  const expiringSoon = tenantMembers.filter((m) => m.status === 'expiring_soon').length;

  // New members this month
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const newMembersThisMonth = tenantMembers.filter((m) => {
    const createdDate = (m as any).created_at || (m as any).createdAt || (m as any).joining_date;
    return createdDate && createdDate.startsWith(currentYearMonth);
  }).length;

  // Renewal revenue (sum of payments where transaction was a renewal or this month's payments)
  const tenantPayments = inMemoryDB.payments.filter(
    (p) => isSuperAdmin || p.gymId === gymId || p.gym_id === gymId
  );
  const renewalRevenue = tenantPayments
    .filter((p) => p.payment_status === 'completed' || p.paymentStatus === 'completed')
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return res.json({
    success: true,
    data: {
      total_members: totalMembers,
      active_members: activeMembers,
      expired_members: expiredMembers,
      expiring_soon_members: expiringSoon,
      new_members_this_month: newMembersThisMonth,
      renewal_revenue: renewalRevenue,
    },
    stats: {
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      newMembersThisMonth,
      renewalRevenue,
    },
  });
});

/**
 * GET /api/members - Search, filter, sort, and paginate gym members
 */
router.get('/', async (req: AuthRequest, res) => {
  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';
  const isTrainer = req.user?.role === 'trainer';
  const isMember = req.user?.role === 'member';

  const {
    q,
    planId,
    status,
    expiryWindow,
    sortBy = 'name',
    sortOrder = 'asc',
    page = '1',
    limit = '50',
  } = req.query as Record<string, string>;

  let members = inMemoryDB.members.filter(
    (m) => isSuperAdmin || m.gymId === gymId || m.gym_id === gymId
  );

  // Role-based scoping:
  if (isTrainer) {
    const trainerProfile = inMemoryDB.trainers.find((t) => t.profile_id === req.user?.id);
    if (trainerProfile) {
      members = members.filter(
        (m) =>
          (m as any).assigned_trainer_id === trainerProfile.id ||
          (m as any).assignedTrainerId === trainerProfile.id ||
          m.assignedTrainerName === trainerProfile.full_name
      );
    }
  } else if (isMember) {
    members = members.filter((m) => m.email?.toLowerCase() === req.user?.email?.toLowerCase());
  }

  // Dynamically calculate status on current clock
  members.forEach((m) => {
    m.status = calculateDynamicMemberStatus(m.expiry_date || m.membershipEndDate, m.status) as any;
  });

  // Search filter (name, phone, memberCode)
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    members = members.filter(
      (m) =>
        (m.full_name || m.fullName || '').toLowerCase().includes(term) ||
        (m.phone || '').includes(term) ||
        ((m as any).member_code || m.memberCode || '').toLowerCase().includes(term) ||
        (m.email || '').toLowerCase().includes(term)
    );
  }

  // Plan filter
  if (planId && planId !== 'all') {
    members = members.filter(
      (m) => m.membership_plan_id === planId || (m as any).currentPlanId === planId
    );
  }

  // Status filter
  if (status && status !== 'all') {
    members = members.filter((m) => m.status === status);
  }

  // Expiry Window Filter (<= 7 days, <= 15 days, expired)
  if (expiryWindow) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    members = members.filter((m) => {
      const expDate = new Date(m.expiry_date || m.membershipEndDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (expiryWindow === '7_days') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (expiryWindow === '15_days') {
        return diffDays >= 0 && diffDays <= 15;
      }
      if (expiryWindow === 'expired') {
        return diffDays < 0;
      }
      return true;
    });
  }

  // Sorting
  members.sort((a, b) => {
    if (sortBy === 'expiry') {
      const dateA = new Date(a.expiry_date || a.membershipEndDate || 0).getTime();
      const dateB = new Date(b.expiry_date || b.membershipEndDate || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
    const nameA = (a.full_name || a.fullName || '').toLowerCase();
    const nameB = (b.full_name || b.fullName || '').toLowerCase();
    return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
  });

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 50;
  const totalCount = members.length;
  const startIndex = (pageNum - 1) * pageLimit;
  const paginatedMembers = members.slice(startIndex, startIndex + pageLimit);

  return res.json({
    success: true,
    data: {
      members: paginatedMembers,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(totalCount / pageLimit),
      },
    },
    members: paginatedMembers,
    total: totalCount,
    page: pageNum,
    totalPages: Math.ceil(totalCount / pageLimit),
  });
});

/**
 * GET /api/members/:id - Full Member Profile including contracts, payments, and attendance
 */
router.get('/:id', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  const memberId = req.params.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const member = inMemoryDB.members.find(
    (m) =>
      (m.id === memberId ||
        (m as any).alias_id === memberId ||
        ((m as any).alias_ids && (m as any).alias_ids.includes(memberId))) &&
      (isSuperAdmin || m.gymId === gymId || m.gym_id === gymId)
  );

  if (!member) {
    return res.status(404).json({ error: 'Member not found or access denied.' });
  }

  // Dynamic status refresh
  member.status = calculateDynamicMemberStatus(member.expiry_date || member.membershipEndDate, member.status) as any;

  // Membership & Renewal Contracts history
  const contracts = inMemoryDB.member_memberships.filter(
    (mm) => mm.memberId === member.id || mm.member_id === member.id
  );

  // Payment transactions history
  const payments = inMemoryDB.payments.filter(
    (p) => p.memberId === member.id || p.member_id === member.id
  );

  // Attendance history
  const attendance = inMemoryDB.attendance.filter(
    (a) => a.memberId === member.id || a.member_id === member.id
  );

  // Workout plans
  const workoutPlans = inMemoryDB.workout_plans.filter(
    (wp) => wp.member_id === member.id
  );

  return res.json({
    success: true,
    data: {
      member,
      memberships: contracts,
      contracts,
      payments,
      attendance,
      workoutPlans,
    },
    member,
    memberships: contracts,
    contracts,
    payments,
    attendance,
    workoutPlans,
  });
});

/**
 * POST /api/members - Register a new member with full personal, plan, and medical details
 */
router.post('/', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym tenant context is required.' });
  }

  const fullName =
    (req.body.fullName || `${req.body.firstName || ''} ${req.body.lastName || ''}`).trim();
  const emergencyContact =
    req.body.emergencyContact ||
    req.body.emergencyContactName ||
    req.body.emergencyContactPhone ||
    '';

  const {
    email,
    phone,
    gender = 'Male',
    dateOfBirth,
    address,
    planId,
    startDate,
    discount = 0,
    paymentStatus = 'completed',
    paymentMethod = 'upi',
    medicalNotes,
    fitnessGoal = 'General Fitness',
    assignedTrainerId,
    avatarUrl,
  } = req.body;

  // Form Validation
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Mobile Phone Number is required.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!planId) {
    return res.status(400).json({ error: 'A membership plan selection is required.' });
  }

  // SaaS Quota Limit Check
  const limitCheck = checkPlanLimits(gymId, 'members');
  if (!limitCheck.allowed) {
    return res.status(403).json({
      error: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
      limitExceeded: true,
    });
  }

  // Lookup Plan
  const plan = inMemoryDB.membership_plans.find(
    (p) =>
      (p.id === planId || (p as any).alias_id === planId) &&
      (p.gym_id === gymId || (p as any).gymId === gymId)
  );
  if (!plan) {
    return res.status(400).json({ error: 'Selected membership plan is invalid or does not belong to this gym.' });
  }

  // Trainer lookup
  const trainer = assignedTrainerId
    ? inMemoryDB.trainers.find((t) => t.id === assignedTrainerId)
    : null;

  // Auto-generate gym-scoped Member Code & non-sensitive QR token
  const gym = inMemoryDB.gyms.find((g) => g.id === gymId);
  const prefix = (gym?.gym_name || gym?.name || 'GF')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3) || 'IP';

  const memberSeq = 1000 + inMemoryDB.members.filter((m) => m.gymId === gymId || m.gym_id === gymId).length + 1;
  const memberCode = `${prefix}-${memberSeq}`;
  const qrToken = `GYMFLOW-QR-${prefix}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  // Calculate validity dates without timezone distortion
  const joiningDate = startDate ? startDate : new Date().toISOString().split('T')[0];
  const [sy, sm, sd] = joiningDate.split('-').map(Number);
  const endObj = new Date(Date.UTC(sy, sm - 1 + plan.duration_months, sd));
  const expiryDate = endObj.toISOString().split('T')[0];

  const originalPrice = plan.price || 0;
  const finalAmount = Math.max(0, originalPrice - Number(discount || 0));

  const memberId = `member-${Date.now()}`;
  const newMember = {
    id: memberId,
    gymId,
    gym_id: gymId,
    memberCode,
    member_code: memberCode,
    fullName: fullName.trim(),
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    gender,
    dateOfBirth,
    date_of_birth: dateOfBirth,
    address,
    emergencyContact,
    emergency_contact: emergencyContact,
    membership_plan_id: plan.id,
    currentPlanId: plan.id,
    currentPlanName: plan.plan_name || plan.name,
    membershipStartDate: joiningDate,
    joining_date: joiningDate,
    membershipEndDate: expiryDate,
    expiry_date: expiryDate,
    membership_end_date: expiryDate,
    status: 'active',
    qrToken,
    qr_token: qrToken,
    medicalNotes,
    medical_notes: medicalNotes,
    fitnessGoal,
    fitness_goal: fitnessGoal,
    assignedTrainerId: trainer?.id || null,
    assigned_trainer_id: trainer?.id || null,
    assignedTrainerName: trainer?.full_name || null,
    avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    totalCheckIns: 0,
    pendingDue: paymentStatus === 'pending' ? finalAmount : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryDB.members.unshift(newMember as any);

  // Record initial contract history
  const contractRecord = {
    id: `mm-${Date.now()}`,
    gymId,
    gym_id: gymId,
    memberId,
    member_id: memberId,
    plan_id: plan.id,
    plan_name: plan.plan_name || plan.name,
    duration_months: plan.duration_months,
    original_price: originalPrice,
    discount_amount: Number(discount || 0),
    final_price: finalAmount,
    start_date: joiningDate,
    end_date: expiryDate,
    status: 'active',
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    is_renewal: false,
    notes: 'Initial registration membership package',
    created_at: new Date().toISOString(),
  };
  inMemoryDB.member_memberships.unshift(contractRecord as any);

  // Record payment if completed or pending
  if (finalAmount > 0) {
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      gymId,
      gym_id: gymId,
      memberId,
      member_id: memberId,
      memberName: fullName,
      memberCode,
      amount: finalAmount,
      currency: 'INR',
      payment_method: paymentMethod,
      paymentMethod,
      transaction_id: `TXN-${Date.now()}`,
      payment_status: paymentStatus,
      paymentStatus,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      payment_date: new Date().toISOString(),
      paidAt: paymentStatus === 'completed' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    };
    inMemoryDB.payments.unshift(paymentRecord as any);
  }

  // Audit Log
  inMemoryDB.audit_logs.unshift({
    id: `log-${Date.now()}`,
    gym_id: gymId,
    user_id: req.user?.id || null,
    action: 'REGISTER_MEMBER',
    entity_type: 'members',
    entity_id: memberId,
    created_at: new Date().toISOString(),
  } as any);

  // Notifications & Webhook
  await sendWhatsAppMessage({
    toPhone: phone,
    messageText: `Welcome to GymFlow AI, ${fullName}! Your gym pass code is ${memberCode}. View your digital pass at https://app.gymflow.ai`,
  });
  await dispatchN8nWebhook('member.created', newMember);

  return res.status(201).json({
    success: true,
    data: newMember,
    member: newMember,
    contract: contractRecord,
    message: `Member registered successfully with Member ID ${memberCode}`,
  });
});

/**
 * PUT /api/members/:id - Update member information
 */
router.put('/:id', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const member = inMemoryDB.members.find(
    (m) => (m.id === req.params.id || (m as any).alias_id === req.params.id) && (isSuperAdmin || m.gymId === gymId || m.gym_id === gymId)
  );

  if (!member) {
    return res.status(404).json({ error: 'Member not found or access denied.' });
  }

  const {
    fullName,
    email,
    phone,
    gender,
    dateOfBirth,
    address,
    emergencyContact,
    medicalNotes,
    fitnessGoal,
    assignedTrainerId,
    avatarUrl,
  } = req.body;

  if (fullName) {
    member.fullName = fullName;
    member.full_name = fullName;
  }
  if (email) member.email = email;
  if (phone) member.phone = phone;
  if (gender) member.gender = gender;
  if (dateOfBirth) {
    (member as any).dateOfBirth = dateOfBirth;
    (member as any).date_of_birth = dateOfBirth;
  }
  if (address) member.address = address;
  if (emergencyContact) {
    (member as any).emergencyContact = emergencyContact;
    (member as any).emergency_contact = emergencyContact;
  }
  if (medicalNotes !== undefined) {
    (member as any).medicalNotes = medicalNotes;
    (member as any).medical_notes = medicalNotes;
  }
  if (fitnessGoal) {
    member.fitnessGoal = fitnessGoal;
    (member as any).fitness_goal = fitnessGoal;
  }
  if (assignedTrainerId !== undefined) {
    (member as any).assignedTrainerId = assignedTrainerId;
    (member as any).assigned_trainer_id = assignedTrainerId;
    const trainer = inMemoryDB.trainers.find((t) => t.id === assignedTrainerId);
    member.assignedTrainerName = trainer?.full_name || '';
  }
  if (avatarUrl) (member as any).avatarUrl = avatarUrl;
  (member as any).updated_at = new Date().toISOString();

  // Audit Log
  inMemoryDB.audit_logs.unshift({
    id: `log-${Date.now()}`,
    gym_id: gymId,
    user_id: req.user?.id || null,
    action: 'UPDATE_MEMBER',
    entity_type: 'members',
    entity_id: member.id,
    created_at: new Date().toISOString(),
  } as any);

  return res.json({
    success: true,
    data: member,
    member,
    message: 'Member profile updated successfully.',
  });
});

/**
 * POST /api/members/:id/renew - Renew member's subscription preserving history
 */
router.post('/:id/renew', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym context is required.' });
  }

  const memberId = String(req.params.id);
  const { planId, discount = 0, paymentMethod = 'upi', paymentStatus = 'completed', notes } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'A renewal membership plan must be selected.' });
  }

  const result = await executeRenewMemberMembership({
    gymId,
    memberId,
    planId,
    discount: Number(discount || 0),
    paymentMethod,
    paymentStatus,
    notes,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    ...result,
    message: `Membership renewed successfully. New expiry date: ${result.new_expiry_date}`,
  });
});

/**
 * PUT /api/members/:id/status - Toggle member status (active / suspended / frozen)
 */
router.put('/:id/status', async (req: AuthRequest, res): Promise<any> => {
  if (req.user?.role === 'member') {
    return res.status(403).json({ error: 'Permission Denied: Members cannot modify membership status.' });
  }

  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const member = inMemoryDB.members.find(
    (m) => (m.id === req.params.id || (m as any).alias_id === req.params.id) && (isSuperAdmin || m.gymId === gymId || m.gym_id === gymId)
  );

  if (!member) {
    return res.status(404).json({ error: 'Member not found or access denied.' });
  }

  const { status } = req.body;
  if (!['active', 'suspended', 'frozen', 'expired'].includes(status)) {
    return res.status(400).json({ error: `Invalid status '${status}'. Must be active, suspended, frozen, or expired.` });
  }

  member.status = status;
  (member as any).updated_at = new Date().toISOString();

  // Audit Log
  inMemoryDB.audit_logs.unshift({
    id: `log-${Date.now()}`,
    gym_id: gymId,
    user_id: req.user?.id || null,
    action: `MEMBER_STATUS_${status.toUpperCase()}`,
    entity_type: 'members',
    entity_id: member.id,
    created_at: new Date().toISOString(),
  } as any);

  return res.json({ success: true, member, message: `Member status set to ${status}` });
});

/**
 * POST /api/members/qr-lookup - Scan QR token, verify gym tenant, and return permitted member info
 */
router.post('/qr-lookup', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  const { qrToken } = req.body;

  if (!qrToken || !qrToken.trim()) {
    return res.status(400).json({ error: 'QR token is required.' });
  }

  const cleanToken = qrToken.trim();

  // Find member by qr_token or memberCode
  const member = inMemoryDB.members.find(
    (m) =>
      ((m as any).qrToken && (m as any).qrToken.toLowerCase() === cleanToken.toLowerCase()) ||
      ((m as any).qr_token && (m as any).qr_token.toLowerCase() === cleanToken.toLowerCase()) ||
      ((m as any).memberCode && (m as any).memberCode.toLowerCase() === cleanToken.toLowerCase()) ||
      ((m as any).member_code && (m as any).member_code.toLowerCase() === cleanToken.toLowerCase())
  );

  if (!member) {
    return res.status(404).json({
      valid: false,
      error: 'Unrecognized QR pass. No athlete found with this code.',
    });
  }

  // Multi-Tenant Isolation Check: Member MUST belong to active gym!
  const isSameGym = member.gymId === gymId || member.gym_id === gymId;
  if (!isSameGym && req.user?.role !== 'super_admin') {
    return res.status(403).json({
      valid: false,
      error: 'Cross-gym access denied: This digital QR pass belongs to an athlete registered at another gym facility.',
      tenantMismatch: true,
    });
  }

  // Refresh dynamic status
  const currentStatus = calculateDynamicMemberStatus(member.expiry_date || member.membershipEndDate, member.status);

  const payload = {
    id: member.id,
    memberCode: (member as any).member_code || member.memberCode,
    fullName: member.full_name || member.fullName,
    full_name: member.full_name || member.fullName,
    status: currentStatus,
    planName: member.currentPlanName,
    expiryDate: member.expiry_date || member.membershipEndDate,
    avatarUrl: (member as any).avatarUrl || (member as any).avatar_url,
    fitnessGoal: (member as any).fitnessGoal || (member as any).fitness_goal,
    assignedTrainerName: member.assignedTrainerName,
    pendingDue: member.pendingDue || 0,
  };

  // Return permitted, non-sensitive athlete info
  return res.json({
    valid: true,
    data: payload,
    member: payload,
  });
});

/**
 * DELETE /api/members/:id - Deactivate / delete member
 */
router.delete('/:id', async (req: AuthRequest, res): Promise<any> => {
  if (req.user?.role !== 'gym_owner' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Permission Denied: Trainers and members cannot delete member accounts.' });
  }

  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const index = inMemoryDB.members.findIndex(
    (m) => (m.id === req.params.id || (m as any).alias_id === req.params.id) && (isSuperAdmin || m.gymId === gymId || m.gym_id === gymId)
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Member not found or access denied.' });
  }

  const removed = inMemoryDB.members.splice(index, 1)[0];

  inMemoryDB.audit_logs.unshift({
    id: `log-${Date.now()}`,
    gym_id: gymId,
    user_id: req.user?.id || null,
    action: 'DELETE_MEMBER',
    entity_type: 'members',
    entity_id: removed.id,
    created_at: new Date().toISOString(),
  } as any);

  return res.json({ success: true, message: 'Member deleted from gym directory.' });
});

export default router;
