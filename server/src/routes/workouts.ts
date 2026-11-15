import { Router } from 'express';
import {
  inMemoryDB,
  normalizeGymId,
  calculateWorkoutStats,
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  getWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  logWorkoutCompletion,
  getWorkoutLogs,
  getDietPlans,
  getDietPlanById,
  createDietPlan,
  recordMemberProgress,
  getMemberProgressHistory,
  getWorkoutCalendar,
  generateAIWorkoutAssistance,
} from '../services/supabaseService.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

// ==========================================
// 1. DASHBOARD & KPIS
// ==========================================

// GET /api/workouts/stats - 6 Live KPIs, recent activity, reviews required
router.get('/stats', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const stats = calculateWorkoutStats(gymId);
  return res.json({ success: true, stats });
});

// ==========================================
// 2. EXERCISE LIBRARY
// ==========================================

// GET /api/workouts/exercises - Search & filter exercises
router.get('/exercises', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const { muscleGroup, category, equipment, difficulty, search } = req.query;

  const result = getExercises(gymId, {
    muscleGroup: muscleGroup as string,
    category: category as string,
    equipment: equipment as string,
    difficulty: difficulty as string,
    search: search as string,
  });

  return res.json(result);
});

// POST /api/workouts/exercises - Create gym-specific custom exercise
router.post(
  '/exercises',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const exerciseName = req.body.exerciseName || req.body.name || req.body.exercise_name;
    const muscleGroup = req.body.muscleGroup || req.body.muscle_group;
    const instructions = req.body.instructions;

    if (!exerciseName || !muscleGroup || !instructions) {
      return res.status(400).json({
        error: 'exerciseName, muscleGroup, and instructions are required.',
      });
    }

    const result = createExercise(gymId, {
      ...req.body,
      exerciseName,
      userId: req.user?.id,
    });

    return res.status(201).json(result);
  }
);

// PUT /api/workouts/exercises/:id - Update gym-specific exercise
router.put(
  '/exercises/:id',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const id = req.params.id as string;

    const result = updateExercise(gymId, id, req.body);
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.json(result);
  }
);

// DELETE /api/workouts/exercises/:id - Delete gym-specific exercise
router.delete(
  '/exercises/:id',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const id = req.params.id as string;

    const result = deleteExercise(gymId, id);
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.json(result);
  }
);

// ==========================================
// 3. WORKOUT PLANS & WEEKLY SCHEDULES
// ==========================================

// GET /api/workouts/plans - List plans with role & tenant checks
router.get('/plans', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const { memberId, trainerId, status, search } = req.query;

  const result = getWorkoutPlans(
    gymId,
    {
      memberId: memberId as string,
      trainerId: trainerId as string,
      status: status as string,
      search: search as string,
    },
    req.user ? { role: req.user.role, id: req.user.id, email: req.user.email } : undefined
  );

  return res.json(result);
});

// GET /api/workouts/plans/:id - Get plan with weekly schedule
router.get('/plans/:id', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const id = req.params.id as string;

  const result = getWorkoutPlanById(
    gymId,
    id,
    req.user ? { role: req.user.role, id: req.user.id, email: req.user.email } : undefined
  );

  if (!result.success) {
    return res.status(result.statusCode || 404).json({ error: result.error });
  }

  return res.json(result);
});

// POST /api/workouts/plans - Create workout plan with weekly schedule
router.post(
  '/plans',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const { planName, title, memberId } = req.body;

    const effectiveName = planName || title || req.body.name;
    if (!effectiveName) {
      return res.status(400).json({
        error: 'Plan name is required.',
      });
    }

    const result = createWorkoutPlan(gymId, {
      ...req.body,
      planName: effectiveName,
      userId: req.user?.id,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.status(201).json(result);
  }
);

// POST /api/workouts/assign - Assign workout plan to athletes
router.post(
  '/assign',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const { planId, memberIds } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required to assign workout.' });
    }

    const ids = Array.isArray(memberIds) ? memberIds : [memberIds].filter(Boolean);
    const plan = (inMemoryDB.workout_plans || []).find(
      (p: any) => p.id === planId && normalizeGymId(p.gymId || p.gym_id) === gymId
    );

    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found for this gym facility.' });
    }

    ids.forEach((mId: string) => {
      const member: any = (inMemoryDB.members || []).find(
        (m: any) => (m.id === mId || m.alias_id === mId) && normalizeGymId(m.gymId || m.gym_id) === gymId
      );
      if (member) {
        member.assignedWorkoutPlanId = planId;
        member.assignedWorkoutPlanName = (plan as any).planName || (plan as any).name || (plan as any).title;
      }
    });

    return res.status(200).json({
      success: true,
      message: `Workout plan assigned to ${ids.length} athlete(s).`,
      assignedCount: ids.length,
      planId,
    });
  }
);

// PUT /api/workouts/plans/:id - Update workout plan
router.put(
  '/plans/:id',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const id = req.params.id as string;

    const result = updateWorkoutPlan(gymId, id, req.body);
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.json(result);
  }
);

// DELETE /api/workouts/plans/:id - Archive or delete plan
router.delete(
  '/plans/:id',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const id = req.params.id as string;

    const planIdx = (inMemoryDB.workout_plans || []).findIndex(
      (p: any) => p.id === id && normalizeGymId(p.gymId || p.gym_id) === gymId
    );

    if (planIdx === -1) {
      return res.status(404).json({ error: 'Workout plan not found or cross-gym access denied.' });
    }

    inMemoryDB.workout_plans.splice(planIdx, 1);
    return res.json({ success: true, message: 'Workout plan deleted successfully.' });
  }
);

// ==========================================
// 4. WORKOUT LOGS & COMPLETION
// ==========================================

// POST /api/workouts/logs - Mark exercise as completed
router.post('/logs', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';

  let effectiveMemberId = req.body.memberId;
  if (!effectiveMemberId && req.user?.role === 'member') {
    const memberProfile = (inMemoryDB.members || []).find(
      (m: any) => m.email?.toLowerCase() === req.user?.email?.toLowerCase() || m.id === req.user?.id
    );
    effectiveMemberId = memberProfile ? memberProfile.id : req.user?.id;
  }

  if (!effectiveMemberId) {
    return res.status(400).json({ error: 'memberId is required.' });
  }

  const result = logWorkoutCompletion(gymId, effectiveMemberId, req.body);
  if (!result.success) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }

  return res.status(201).json(result);
});

// GET /api/workouts/logs - Fetch logs for member
router.get('/logs', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  let memberId = req.query.memberId as string;

  if (req.user?.role === 'member') {
    const memberProfile = (inMemoryDB.members || []).find(
      (m: any) => m.email?.toLowerCase() === req.user?.email?.toLowerCase() || m.id === req.user?.id
    );
    memberId = memberProfile ? memberProfile.id : req.user.id;
  }

  const result = getWorkoutLogs(gymId, memberId, req.query);
  return res.json(result);
});

// ==========================================
// 5. DIET PLANS & MEALS
// ==========================================

// GET /api/workouts/diets, /api/workouts/diet-plans - List diet plans
router.get(['/diets', '/diet-plans'], (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const { memberId, trainerId, search } = req.query;

  const result = getDietPlans(
    gymId,
    {
      memberId: memberId as string,
      trainerId: trainerId as string,
      search: search as string,
    },
    req.user ? { role: req.user.role, id: req.user.id, email: req.user.email } : undefined
  );

  return res.json(result);
});

// GET /api/workouts/diets/:id, /api/workouts/diet-plans/:id - Get diet plan with 6-meal schedule
router.get(['/diets/:id', '/diet-plans/:id'], (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const id = req.params.id as string;

  const result = getDietPlanById(
    gymId,
    id,
    req.user ? { role: req.user.role, id: req.user.id, email: req.user.email } : undefined
  );

  if (!result.success) {
    return res.status(result.statusCode || 404).json({ error: result.error });
  }

  return res.json(result);
});

// POST /api/workouts/diets, /api/workouts/diet-plans - Create personalized diet plan
router.post(
  ['/diets', '/diet-plans'],
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = req.gymId || 'gym-1';
    const { planName, memberId } = req.body;
    const effectiveName = planName || req.body.name;

    if (!effectiveName) {
      return res.status(400).json({
        error: 'Plan name is required.',
      });
    }

    const result = createDietPlan(gymId, {
      ...req.body,
      planName: effectiveName,
      userId: req.user?.id,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }

    return res.status(201).json(result);
  }
);

// DELETE /api/workouts/diets/:id - Delete diet plan
router.delete(
  '/diets/:id',
  requireRole(['gym_owner', 'trainer', 'super_admin']),
  (req: AuthRequest, res): any => {
    const gymId = normalizeGymId(req.gymId || 'gym-1');
    const id = req.params.id as string;

    const dietIdx = (inMemoryDB.diet_plans || []).findIndex(
      (d: any) => d.id === id && normalizeGymId(d.gymId || d.gym_id) === gymId
    );

    if (dietIdx === -1) {
      return res.status(404).json({ error: 'Diet plan not found or cross-gym access denied.' });
    }

    inMemoryDB.diet_plans.splice(dietIdx, 1);
    return res.json({ success: true, message: 'Diet plan deleted successfully.' });
  }
);

// ==========================================
// 6. MEMBER PROGRESS TRACKING
// ==========================================

// POST /api/workouts/progress - Record fitness progress
router.post('/progress', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';

  let effectiveMemberId = req.body.memberId;
  if (req.user?.role === 'member') {
    const memberProfile = (inMemoryDB.members || []).find(
      (m: any) => m.email?.toLowerCase() === req.user?.email?.toLowerCase() || m.id === req.user?.id || m.user_id === req.user?.id
    );
    const authedMemberId = memberProfile ? memberProfile.id : req.user?.id;
    if (effectiveMemberId && effectiveMemberId !== authedMemberId && effectiveMemberId !== req.user?.id) {
      return res.status(403).json({ error: 'Members can only record fitness progress for their own profile.' });
    }
    effectiveMemberId = authedMemberId;
  }

  if (!effectiveMemberId || req.body.weight === undefined) {
    return res.status(400).json({
      error: 'memberId and weight are required to log progress.',
    });
  }

  const result = recordMemberProgress(gymId, effectiveMemberId, {
    ...req.body,
    recordedBy: req.user?.id,
  });

  if (!result.success) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }

  return res.status(201).json(result);
});

// GET /api/workouts/progress/:memberId - Get member progress timeline and chart data
router.get('/progress/:memberId', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const memberId = req.params.memberId as string;

  const result = getMemberProgressHistory(
    gymId,
    memberId,
    req.user ? { role: req.user.role, id: req.user.id, email: req.user.email } : undefined
  );

  if (!result.success) {
    return res.status(result.statusCode || 404).json({ error: result.error });
  }

  return res.json(result);
});

// ==========================================
// 7. WORKOUT CALENDAR
// ==========================================

// GET /api/workouts/calendar - Monthly/Weekly schedule events
router.get('/calendar', (req: AuthRequest, res): any => {
  const gymId = req.gymId || 'gym-1';
  const { month, memberId, trainerId } = req.query;

  const result = getWorkoutCalendar(
    gymId,
    {
      month: month as string,
      memberId: memberId as string,
      trainerId: trainerId as string,
    },
    req.user ? { role: req.user.role, id: req.user.id, email: req.user.email } : undefined
  );

  return res.json(result);
});

// ==========================================
// 8. AI WORKOUT ASSISTANT
// ==========================================

// POST /api/workouts/ai/assist - Secure proxy for workout & diet generation
router.post('/ai/assist', async (req: AuthRequest, res): Promise<any> => {
  const { action, prompt, context } = req.body;

  if (!action || !prompt) {
    return res.status(400).json({
      error: 'action and prompt are required for AI workout assistance.',
    });
  }

  const result = await generateAIWorkoutAssistance({
    action,
    prompt,
    context: {
      ...context,
      gymId: req.gymId,
      userRole: req.user?.role,
      userName: req.user?.fullName,
    },
  });

  return res.json(result);
});

export default router;
