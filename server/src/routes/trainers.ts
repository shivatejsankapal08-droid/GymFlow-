import { Router } from 'express';
import {
  inMemoryDB,
  isSupabaseConfigured,
  supabase,
  checkPlanLimits,
  normalizeGymId,
  calculateTrainerStats,
  checkTrainerSessionOverlap,
  scheduleTrainingSession,
  rescheduleTrainingSession,
  assignMembersToTrainer,
  removeMemberAssignment,
  trainerCheckIn,
  trainerCheckOut,
  getTrainerProfileDetails,
  recordTrainerSalaryPayout,
  submitTrainerFeedback,
  getTrainerFeedback,
  getTrainerPerformance,
  getMonthlySalarySummary,
} from '../services/supabaseService.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

// ==========================================
// 1. DASHBOARD & OPERATIONAL STATS
// ==========================================

// GET /api/trainers/stats - 7 Live KPIs, upcoming sessions, recent trainers & performance overview
router.get('/stats', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const stats = calculateTrainerStats(gymId);
  return res.json({ success: true, stats });
});

// GET /api/trainers/salary/summary - Monthly salary summary, liability & pending payouts (Must be before /:id)
router.get(
  '/salary/summary',
  requireRole(['gym_owner', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const salaryMonth = req.query.month as string;
    const result = getMonthlySalarySummary(gymId, salaryMonth);
    return res.json(result);
  }
);

// ==========================================
// 2. TRAINING SESSIONS & SCHEDULING (Must be before /:id)
// ==========================================

// GET /api/trainers/sessions - Filterable list of training sessions
router.get('/sessions', (req: AuthRequest, res): any => {
  const gymId = normalizeGymId(req.gymId || 'gym-1');
  const { trainerId, memberId, date, status, range } = req.query;

  let sessions = (inMemoryDB.training_sessions || []).filter((s: any) => {
    const sGym = normalizeGymId(s.gymId || s.gym_id);
    return req.user?.role === 'super_admin' || sGym === gymId;
  });

  // Trainer role restriction: trainers only see sessions assigned to them
  if (req.user?.role === 'trainer') {
    const currentTrainer = (inMemoryDB.trainers || []).find(
      (t: any) => t.profile_id === req.user?.id || t.email === req.user?.email
    );
    if (currentTrainer) {
      sessions = sessions.filter(
        (s: any) => s.trainerId === currentTrainer.id || s.trainer_id === currentTrainer.id
      );
    }
  }

  if (trainerId) {
    sessions = sessions.filter(
      (s: any) => s.trainerId === trainerId || s.trainer_id === trainerId
    );
  }

  if (memberId) {
    sessions = sessions.filter(
      (s: any) => s.memberId === memberId || s.member_id === memberId
    );
  }

  if (status && status !== 'all') {
    sessions = sessions.filter(
      (s: any) => s.sessionStatus === status || s.session_status === status
    );
  }

  if (date) {
    sessions = sessions.filter(
      (s: any) => s.sessionDate === date || s.session_date === date
    );
  }

  // Sort by date and startTime ascending
  sessions.sort((a: any, b: any) => {
    const dateA = `${a.sessionDate || a.session_date}T${a.startTime || a.start_time}`;
    const dateB = `${b.sessionDate || b.session_date}T${b.startTime || b.start_time}`;
    return dateA.localeCompare(dateB);
  });

  return res.json({ success: true, sessions });
});

// POST /api/trainers/sessions - Schedule a training session with strict overlap checking
router.post(
  '/sessions',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const {
      trainerId,
      memberId,
      sessionTitle,
      sessionDate,
      startTime,
      endTime,
      trainingType,
      notes,
    } = req.body;

    if (!trainerId || !memberId || !sessionDate || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required session parameters: trainerId, memberId, sessionDate, startTime, endTime',
      });
    }

    // Role check: If trainer role, ensure they are scheduling for themselves
    if (req.user?.role === 'trainer') {
      const currentTrainer = (inMemoryDB.trainers || []).find(
        (t: any) => t.profile_id === req.user?.id || t.email === req.user?.email
      );
      if (currentTrainer && currentTrainer.id !== trainerId) {
        return res.status(403).json({
          error: 'Trainers can only schedule sessions for themselves.',
        });
      }
    }

    const result = scheduleTrainingSession({
      gymId,
      trainerId,
      memberId,
      sessionTitle,
      sessionDate,
      startTime,
      endTime,
      trainingType,
      notes,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.status(201).json(result);
  }
);

// PUT /api/trainers/sessions/:sessionId - Reschedule training session with anti-overlap engine
router.put(
  '/sessions/:sessionId',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const sessionId = req.params.sessionId as string;
    const { newDate, newStartTime, newEndTime, notes } = req.body;

    if (!newDate || !newStartTime || !newEndTime) {
      return res.status(400).json({
        error: 'newDate, newStartTime, and newEndTime are required for rescheduling.',
      });
    }

    const result = rescheduleTrainingSession({
      gymId,
      sessionId,
      newDate,
      newStartTime,
      newEndTime,
      notes,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.json(result);
  }
);

// PUT /api/trainers/sessions/:sessionId/status - Update session completion / cancellation status
router.put(
  '/sessions/:sessionId/status',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const sessionId = req.params.sessionId as string;
    const { status, notes } = req.body;

    const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    const session: any = (inMemoryDB.training_sessions || []).find(
      (s: any) => s.id === sessionId
    );
    if (!session) {
      return res.status(404).json({ error: 'Training session not found.' });
    }

    const sGym = normalizeGymId(session.gymId || session.gym_id);
    if (req.user?.role !== 'super_admin' && sGym !== gymId) {
      return res.status(403).json({ error: 'Cross-gym access denied.' });
    }

    session.sessionStatus = status;
    session.session_status = status;
    if (notes) session.notes = notes;
    session.updated_at = new Date().toISOString();

    return res.json({ success: true, session });
  }
);

// ==========================================
// 3. TRAINER ATTENDANCE (Must be before /:id)
// ==========================================

// POST /api/trainers/attendance/check-in
router.post(
  '/attendance/check-in',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const { trainerId, notes } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'trainerId is required.' });
    }

    const result = trainerCheckIn({ gymId, trainerId, notes });
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.status(200).json(result);
  }
);

// POST /api/trainers/attendance/check-out
router.post(
  '/attendance/check-out',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const { trainerId, notes } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'trainerId is required.' });
    }

    const result = trainerCheckOut({ gymId, trainerId, notes });
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.status(200).json(result);
  }
);

// ==========================================
// 4. TRAINER ROSTER & CRUD
// ==========================================

// GET /api/trainers - List trainers for current gym tenant
router.get('/', (req: AuthRequest, res): any => {
  const gymId = normalizeGymId(req.gymId || 'gym-1');
  const { search, status, specialization } = req.query;

  let gymTrainers = (inMemoryDB.trainers || []).filter((t: any) => {
    const tGym = normalizeGymId(t.gymId || t.gym_id);
    return req.user?.role === 'super_admin' || tGym === gymId;
  });

  // Calculate live assigned members count for each trainer
  gymTrainers = gymTrainers.map((t: any) => {
    const assignedCount = (inMemoryDB.members || []).filter(
      (m: any) =>
        (m.assignedTrainerId === t.id || m.assigned_trainer_id === t.id) &&
        normalizeGymId(m.gymId || m.gym_id) === gymId
    ).length;

    return {
      ...t,
      assignedMembersCount: assignedCount || t.assignedMembersCount || 0,
    };
  });

  if (search) {
    const q = String(search).toLowerCase();
    gymTrainers = gymTrainers.filter(
      (t: any) =>
        (t.fullName || t.full_name || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.specialization || '').toLowerCase().includes(q) ||
        (t.trainerCode || t.trainer_code || '').toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    gymTrainers = gymTrainers.filter((t: any) => {
      const empStatus = t.employmentStatus || t.employment_status || (t.isActive ? 'active' : 'inactive');
      return empStatus === status;
    });
  }

  if (specialization && specialization !== 'all') {
    gymTrainers = gymTrainers.filter((t: any) =>
      (t.specialization || '').toLowerCase().includes(String(specialization).toLowerCase())
    );
  }

  return res.json({ success: true, trainers: gymTrainers });
});

// POST /api/trainers - Register new trainer (Enforces SaaS plan limits, auto-generates TR-XXXX)
router.post(
  '/',
  requireRole(['gym_owner', 'super_admin']),
  async (req: AuthRequest, res): Promise<any> => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      specialization,
      experience,
      certifications,
      skills,
      joiningDate,
      employmentType,
      shiftTiming,
      salaryType,
      baseSalary,
      hourlyRate,
      commissionRate,
      bankAccountNumber,
      bankIfscCode,
      notes,
      sendInvitation,
    } = req.body;

    if (!fullName || !specialization) {
      return res.status(400).json({ error: 'fullName and specialization are required.' });
    }

    // Backend SaaS Plan Limit Check for Trainers
    if (gymId) {
      const limitCheck = checkPlanLimits(gymId, 'trainers');
      if (!limitCheck.allowed) {
        return res.status(403).json({
          error: limitCheck.message,
          current: limitCheck.current,
          limit: limitCheck.limit,
        });
      }
    }

    // Generate next trainer code TR-100X
    const existingCodes = (inMemoryDB.trainers || [])
      .map((t: any) => t.trainerCode || t.trainer_code)
      .filter(Boolean);
    const nextCodeNum = 1001 + existingCodes.length;
    const trainerCode = `TR-${nextCodeNum}`;

    const newTrainer: any = {
      id: `trainer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gymId,
      gym_id: gymId,
      profileId: null,
      profile_id: null,
      trainerCode,
      trainer_code: trainerCode,
      fullName,
      full_name: fullName,
      email: email || '',
      phone: phone || '',
      dateOfBirth: dateOfBirth || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || 'unspecified',
      address: address || '',
      emergencyContact: emergencyContact || '',
      emergency_contact: emergencyContact || '',
      specialization,
      experience: experience || '2+ years',
      certifications: certifications || ['Certified Fitness Trainer'],
      skills: skills || [specialization],
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      joining_date: joiningDate || new Date().toISOString().split('T')[0],
      employmentType: employmentType || 'full_time',
      employment_type: employmentType || 'full_time',
      employmentStatus: 'active',
      employment_status: 'active',
      shiftTiming: shiftTiming || '06:00 AM - 02:00 PM',
      shift_timing: shiftTiming || '06:00 AM - 02:00 PM',
      availability: shiftTiming || '06:00 AM - 02:00 PM',
      salaryType: salaryType || 'monthly',
      salary_type: salaryType || 'monthly',
      baseSalary: Number(baseSalary) || 35000,
      base_salary: Number(baseSalary) || 35000,
      salary: Number(baseSalary) || 35000,
      hourlyRate: Number(hourlyRate) || 800,
      hourly_rate: Number(hourlyRate) || 800,
      commissionRate: Number(commissionRate) || 10,
      commission_rate: Number(commissionRate) || 10,
      bankAccountNumber: bankAccountNumber || '',
      bank_account_number: bankAccountNumber || '',
      bankIfscCode: bankIfscCode || '',
      bank_ifsc_code: bankIfscCode || '',
      notes: notes || '',
      rating: 5.0,
      assignedMembersCount: 0,
      isActive: true,
      created_at: new Date().toISOString(),
    };

    inMemoryDB.trainers.unshift(newTrainer);

    // If invitation requested and email present, create gym_invitation
    let inviteToken: string | null = null;
    if (sendInvitation && email) {
      inMemoryDB.gym_invitations = inMemoryDB.gym_invitations || [];
      inviteToken = `inv-tr-${Date.now()}`;
      inMemoryDB.gym_invitations.push({
        id: `invite-${Date.now()}`,
        gym_id: gymId,
        email,
        role: 'trainer',
        invitation_token_hash: inviteToken,
        invited_by: req.user?.id || 'system',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString(),
      });
    }

    inMemoryDB.audit_logs.push({
      id: `log-${Date.now()}`,
      gym_id: gymId,
      user_id: req.user?.id || null,
      action: 'ADD_TRAINER',
      entity_type: 'trainers',
      entity_id: newTrainer.id,
      created_at: new Date().toISOString(),
    } as any);

    return res.status(201).json({
      success: true,
      trainer: newTrainer,
      invitationToken: inviteToken,
      inviteUrl: inviteToken ? `https://app.gymflow.ai/invite/${inviteToken}` : null,
    });
  }
);

// GET /api/trainers/:id - Full trainer profile details with RBAC trainer isolation
router.get('/:id', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const id = req.params.id as string;

  // Trainer role restriction: trainers can only view their own trainer profile
  if (req.user?.role === 'trainer') {
    const currentTrainer = (inMemoryDB.trainers || []).find(
      (t: any) => t.profile_id === req.user?.id || t.email === req.user?.email
    );
    if (!currentTrainer || currentTrainer.id !== id) {
      return res.status(403).json({ error: 'Forbidden: Trainers can only view their own assigned profile.' });
    }
  }

  const result = getTrainerProfileDetails(
    id,
    gymId,
    req.user?.role,
    req.user?.id
  );

  if (!result.success) {
    return res.status(result.statusCode || 404).json({ error: result.error });
  }

  return res.json(result);
});

// PUT /api/trainers/:id - Update trainer details
router.put(
  '/:id',
  requireRole(['gym_owner', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const id = req.params.id as string;

    const trainer: any = inMemoryDB.trainers.find((t: any) => t.id === id);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found.' });
    }

    const tGym = normalizeGymId(trainer.gymId || trainer.gym_id);
    if (req.user?.role !== 'super_admin' && tGym !== gymId) {
      return res.status(403).json({ error: 'Cross-gym access denied.' });
    }

    // Merge updates
    const b = req.body;
    if (b.fullName) {
      trainer.fullName = b.fullName;
      trainer.full_name = b.fullName;
    }
    if (b.specialization) trainer.specialization = b.specialization;
    if (b.phone) trainer.phone = b.phone;
    if (b.email) trainer.email = b.email;
    if (b.experience) trainer.experience = b.experience;
    if (b.employmentType) {
      trainer.employmentType = b.employmentType;
      trainer.employment_type = b.employmentType;
    }
    if (b.shiftTiming) {
      trainer.shiftTiming = b.shiftTiming;
      trainer.shift_timing = b.shiftTiming;
      trainer.availability = b.shiftTiming;
    }
    if (b.salaryType) {
      trainer.salaryType = b.salaryType;
      trainer.salary_type = b.salaryType;
    }
    if (b.baseSalary !== undefined) {
      trainer.baseSalary = Number(b.baseSalary);
      trainer.base_salary = Number(b.baseSalary);
      trainer.salary = Number(b.baseSalary);
    }
    if (b.hourlyRate !== undefined) {
      trainer.hourlyRate = Number(b.hourlyRate);
      trainer.hourly_rate = Number(b.hourlyRate);
    }
    if (b.commissionRate !== undefined) {
      trainer.commissionRate = Number(b.commissionRate);
      trainer.commission_rate = Number(b.commissionRate);
    }
    if (b.employmentStatus) {
      trainer.employmentStatus = b.employmentStatus;
      trainer.employment_status = b.employmentStatus;
      trainer.isActive = b.employmentStatus === 'active';
    }
    if (b.notes !== undefined) trainer.notes = b.notes;
    trainer.updated_at = new Date().toISOString();

    return res.json({ success: true, trainer });
  }
);

// DELETE /api/trainers/:id - Terminate / deactivate trainer
router.delete(
  '/:id',
  requireRole(['gym_owner', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const id = req.params.id as string;

    const trainer: any = inMemoryDB.trainers.find((t: any) => t.id === id);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found.' });
    }

    const tGym = normalizeGymId(trainer.gymId || trainer.gym_id);
    if (req.user?.role !== 'super_admin' && tGym !== gymId) {
      return res.status(403).json({ error: 'Cross-gym access denied.' });
    }

    trainer.employmentStatus = 'terminated';
    trainer.employment_status = 'terminated';
    trainer.isActive = false;
    trainer.updated_at = new Date().toISOString();

    return res.json({ success: true, message: 'Trainer employment marked as terminated.' });
  }
);

// ==========================================
// 5. MEMBER ASSIGNMENTS
// ==========================================

// POST /api/trainers/:id/assign-members - Assign athletes to trainer (with cross-gym protection)
router.post(
  '/:id/assign-members',
  requireRole(['gym_owner', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const id = req.params.id as string;
    const { memberIds, notes } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'memberIds array is required and must not be empty.' });
    }

    const result = assignMembersToTrainer({
      gymId,
      trainerId: id,
      memberIds,
      notes,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.json(result);
  }
);

// POST /api/trainers/:id/unassign-member - Remove athlete assignment from trainer
router.post(
  '/:id/unassign-member',
  requireRole(['gym_owner', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const id = req.params.id as string;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required.' });
    }

    const result = removeMemberAssignment({
      gymId,
      trainerId: id,
      memberId,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.json(result);
  }
);

// GET /api/trainers/:id/members - List members assigned to trainer
router.get('/:id/members', (req: AuthRequest, res): any => {
  const gymId = normalizeGymId(req.gymId || 'gym-1');
  const id = req.params.id as string;

  const trainer: any = inMemoryDB.trainers.find((t: any) => t.id === id);
  if (!trainer) {
    return res.status(404).json({ error: 'Trainer not found.' });
  }

  const tGym = normalizeGymId(trainer.gymId || trainer.gym_id);
  if (req.user?.role !== 'super_admin' && tGym !== gymId) {
    return res.status(403).json({ error: 'Cross-gym access denied.' });
  }

  // Trainer role restriction: trainers can only query their own assigned athletes
  if (req.user?.role === 'trainer' && trainer.profile_id && trainer.profile_id !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own assigned athletes.' });
  }

  const assignedMembers = (inMemoryDB.members || []).filter(
    (m: any) =>
      (m.assignedTrainerId === id || m.assigned_trainer_id === id) &&
      normalizeGymId(m.gymId || m.gym_id) === gymId
  );

  return res.json({ success: true, members: assignedMembers });
});

// ==========================================
// 6. ATTENDANCE & SALARY HISTORY FOR INDIVIDUAL TRAINER
// ==========================================

// GET /api/trainers/:id/attendance - Attendance history for trainer
router.get('/:id/attendance', (req: AuthRequest, res): any => {
  const gymId = normalizeGymId(req.gymId || 'gym-1');
  const id = req.params.id as string;

  const attendance = (inMemoryDB.trainer_attendance || []).filter(
    (a: any) =>
      (a.trainerId === id || a.trainer_id === id) &&
      normalizeGymId(a.gymId || a.gym_id) === gymId
  );

  return res.json({ success: true, attendance });
});

// GET /api/trainers/:id/salaries - Salary history for trainer
router.get('/:id/salaries', (req: AuthRequest, res): any => {
  const gymId = normalizeGymId(req.gymId || 'gym-1');
  const id = req.params.id as string;

  const salaries = (inMemoryDB.trainer_salaries || []).filter(
    (s: any) =>
      (s.trainerId === id || s.trainer_id === id) &&
      normalizeGymId(s.gymId || s.gym_id) === gymId
  );

  return res.json({ success: true, salaries });
});

// POST /api/trainers/:id/salaries/record - Record salary payout
router.post(
  '/:id/salaries/record',
  requireRole(['gym_owner', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const id = req.params.id as string;
    const {
      salaryMonth,
      baseAmount,
      commissionAmount,
      bonusAmount,
      deductions,
      paymentMethod,
      notes,
    } = req.body;

    if (!salaryMonth) {
      return res.status(400).json({ error: 'salaryMonth is required (e.g. 2026-11).' });
    }

    const result = recordTrainerSalaryPayout({
      gymId,
      trainerId: id,
      salaryMonth,
      baseAmount,
      commissionAmount,
      bonusAmount,
      deductions,
      paymentMethod,
      notes,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.status(201).json(result);
  }
);

// ==========================================
// 7. TRAINER PERFORMANCE & MEMBER FEEDBACK
// ==========================================

// POST /api/trainers/:id/feedback - Submit trainer rating and review
router.post('/:id/feedback', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const trainerId = req.params.id as string;
  const { rating, feedback, memberId } = req.body;

  const effectiveMemberId =
    memberId ||
    (inMemoryDB.members || []).find((m: any) => m.email === req.user?.email || m.id === req.user?.id)?.id ||
    'cccc1111-0000-0000-0000-000000000001';

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  const result = submitTrainerFeedback({
    gymId,
    trainerId,
    memberId: effectiveMemberId,
    rating: Number(rating),
    feedback: feedback || '',
  });

  if (!result.success) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }

  return res.status(201).json(result);
});

// GET /api/trainers/:id/feedback - Get transparent feedback list for trainer
router.get('/:id/feedback', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const trainerId = req.params.id as string;
  const result = getTrainerFeedback(gymId, trainerId);
  return res.json(result);
});

// GET /api/trainers/:id/performance - Transparent performance metrics and trends
router.get('/:id/performance', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const trainerId = req.params.id as string;
  const result = getTrainerPerformance(gymId, trainerId);
  if (!result.success) {
    return res.status(result.statusCode || 404).json({ error: result.error });
  }
  return res.json(result);
});

export default router;
