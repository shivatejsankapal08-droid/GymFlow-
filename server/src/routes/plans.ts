import { Router } from 'express';
import { inMemoryDB, safeDeleteMembershipPlan } from '../services/supabaseService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

/**
 * GET /api/plans - List membership plans for the active gym
 */
router.get('/', async (req: AuthRequest, res) => {
  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const plans = inMemoryDB.membership_plans.filter(
    (p) => isSuperAdmin || p.gym_id === gymId || (p as any).gymId === gymId
  );

  // Compute active subscribers count for each plan
  const plansWithCounts = plans.map((p) => {
    const activeSubscribers = inMemoryDB.members.filter(
      (m) =>
        (m.gym_id === p.gym_id || m.gymId === p.gym_id) &&
        (m.membership_plan_id === p.id || (m as any).currentPlanId === p.id) &&
        m.status === 'active'
    ).length;

    return {
      ...p,
      activeSubscribers,
    };
  });

  return res.json({ plans: plansWithCounts });
});

/**
 * POST /api/plans - Create a new membership plan
 */
router.post('/', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym context is required.' });
  }

  const { name, planName, durationMonths, price, description, features, status = 'active' } = req.body;
  const finalName = name || planName;

  if (!finalName || !finalName.trim()) {
    return res.status(400).json({ error: 'Plan name is required.' });
  }
  if (!durationMonths || Number(durationMonths) <= 0) {
    return res.status(400).json({ error: 'Duration in months must be greater than 0.' });
  }
  if (price === undefined || Number(price) < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number.' });
  }

  const planId = `plan-${Date.now()}`;
  const newPlan = {
    id: planId,
    gymId,
    gym_id: gymId,
    name: finalName.trim(),
    plan_name: finalName.trim(),
    durationMonths: Number(durationMonths),
    duration_months: Number(durationMonths),
    price: Number(price),
    description: description || 'Gym membership package',
    features: Array.isArray(features) ? features : (features || '').split('\n').filter(Boolean),
    status,
    isActive: status === 'active',
    created_at: new Date().toISOString(),
  };

  inMemoryDB.membership_plans.push(newPlan as any);

  // Audit log
  inMemoryDB.audit_logs.unshift({
    id: `log-${Date.now()}`,
    gym_id: gymId,
    user_id: req.user?.id || null,
    action: 'CREATE_MEMBERSHIP_PLAN',
    entity_type: 'membership_plans',
    entity_id: planId,
    created_at: new Date().toISOString(),
  } as any);

  return res.status(201).json({
    success: true,
    data: newPlan,
    plan: newPlan,
    message: `Plan '${newPlan.name}' created successfully.`,
  });
});

/**
 * PUT /api/plans/:id - Update an existing membership plan
 */
router.put('/:id', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const plan = inMemoryDB.membership_plans.find(
    (p) => p.id === req.params.id && (isSuperAdmin || p.gym_id === gymId || (p as any).gymId === gymId)
  );

  if (!plan) {
    return res.status(404).json({ error: 'Membership plan not found.' });
  }

  const { name, planName, durationMonths, price, description, features, status } = req.body;
  if (name || planName) {
    const n = name || planName;
    plan.name = n;
    plan.plan_name = n;
  }
  if (durationMonths !== undefined) {
    plan.duration_months = Number(durationMonths);
    (plan as any).durationMonths = Number(durationMonths);
  }
  if (price !== undefined) {
    plan.price = Number(price);
  }
  if (description !== undefined) {
    plan.description = description;
  }
  if (features !== undefined) {
    (plan as any).features = Array.isArray(features) ? features : (features || '').split('\n').filter(Boolean);
  }
  if (status) {
    plan.status = status;
    (plan as any).isActive = status === 'active';
  }

  return res.json({
    success: true,
    plan,
    message: 'Membership plan updated successfully.',
  });
});

/**
 * PUT /api/plans/:id/status - Toggle plan active/inactive status
 */
router.put('/:id/status', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const plan = inMemoryDB.membership_plans.find(
    (p) => p.id === req.params.id && (isSuperAdmin || p.gym_id === gymId || (p as any).gymId === gymId)
  );

  if (!plan) {
    return res.status(404).json({ error: 'Membership plan not found.' });
  }

  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or inactive.' });
  }

  plan.status = status;
  (plan as any).isActive = status === 'active';

  return res.json({
    success: true,
    plan,
    message: `Plan status set to ${status}.`,
  });
});

/**
 * DELETE /api/plans/:id - Safely delete a plan only if not associated with members
 */
router.delete('/:id', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym context is required.' });
  }

  const result = safeDeleteMembershipPlan(gymId, String(req.params.id));
  if (!result.success) {
    return res.status(400).json({ error: result.error, isAssigned: true });
  }

  return res.json({ success: true, message: 'Membership plan deleted successfully.' });
});

export default router;
