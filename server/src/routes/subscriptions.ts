import { Router } from 'express';
import {
  inMemoryDB,
  isSupabaseConfigured,
  supabase,
} from '../services/supabaseService.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';

const router = Router();

// GET /api/subscriptions/plans - Catalog of SaaS plans for gyms
router.get('/plans', (req, res) => {
  return res.json({ plans: inMemoryDB.saas_plans });
});

// GET /api/subscriptions/current - Current gym's SaaS subscription & limit telemetry
router.get(
  '/current',
  authMiddleware,
  tenantIsolationMiddleware,
  async (req: AuthRequest, res) => {
    const gymId = req.gymId;

    const sub = inMemoryDB.saas_subscriptions.find((s) => s.gym_id === gymId);
    const planCode = sub?.plan_code || 'trial';
    const plan = inMemoryDB.saas_plans.find((p) => p.plan_code === planCode) || inMemoryDB.saas_plans[0];

    const currentMembers = inMemoryDB.members.filter(
      (m) => m.gym_id === gymId || m.gymId === gymId
    ).length;
    const currentTrainers = inMemoryDB.trainers.filter((t) => t.gym_id === gymId).length;

    const subscriptionData = {
      subscriptionId: sub?.id || 'sub-default',
      gymId,
      planCode,
      planName: plan.name,
      status: sub?.status || 'trialing',
      billingCycle: sub?.billing_cycle || 'monthly',
      startDate: sub?.start_date || '2026-01-01',
      renewalDate: sub?.end_date || '2027-01-01',
      trialEndsAt: sub?.trial_ends_at || null,
      paymentStatus: sub?.payment_status || 'pending', // Clearly marked as pending
      limits: {
        memberLimit: plan.member_limit,
        currentMembers,
        memberUsagePercent: Math.round((currentMembers / plan.member_limit) * 100),
        trainerLimit: plan.trainer_limit,
        currentTrainers,
        trainerUsagePercent: Math.round((currentTrainers / plan.trainer_limit) * 100),
      },
      pricing: {
        monthly: plan.price_monthly,
        annual: plan.price_annual,
      },
      features: plan.features,
    };

    return res.json({ subscription: subscriptionData });
  }
);

// POST /api/subscriptions/change-plan - Upgrade or Downgrade Plan
// Note: Payment status remains clearly marked as 'pending' until live payment gateway is wired
router.post(
  '/change-plan',
  authMiddleware,
  tenantIsolationMiddleware,
  requireRole(['gym_owner', 'super_admin']),
  async (req: AuthRequest, res): Promise<any> => {
    const gymId = req.gymId;
    const { planCode, billingCycle } = req.body;

    const targetPlan = inMemoryDB.saas_plans.find((p) => p.plan_code === planCode);
    if (!targetPlan) {
      return res.status(400).json({ error: `Invalid SaaS plan code: ${planCode}` });
    }

    let sub: any = inMemoryDB.saas_subscriptions.find((s) => s.gym_id === gymId);
    if (!sub) {
      sub = {
        id: `sub-${Date.now()}`,
        gym_id: gymId as string,
        plan_id: targetPlan.id,
        plan_code: planCode,
        status: 'active',
        subscription_status: 'active',
        billing_cycle: billingCycle || 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trial_end_date: null,
        trial_ends_at: null,
        cancellation_date: null,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      };
      inMemoryDB.saas_subscriptions.push(sub);
    } else {
      sub.plan_code = planCode;
      sub.plan_id = targetPlan.id;
      sub.billing_cycle = billingCycle || sub.billing_cycle;
      sub.payment_status = 'pending'; // Stays pending until gateway is configured
      if (planCode !== 'trial') {
        sub.status = 'active';
        sub.subscription_status = 'active';
      }
    }

    // Update gym record plan limits
    const gym = inMemoryDB.gyms.find((g) => g.id === gymId);
    if (gym) {
      gym.plan = planCode;
      gym.memberLimit = targetPlan.member_limit;
      gym.trainerLimit = targetPlan.trainer_limit;
    }

    inMemoryDB.audit_logs.push({
      id: `log-${Date.now()}`,
      gym_id: gymId,
      user_id: req.user?.id || null,
      action: `CHANGE_SAAS_PLAN_${planCode.toUpperCase()}`,
      entity_type: 'saas_subscriptions',
      entity_id: sub.id,
      created_at: new Date().toISOString(),
    } as any);

    return res.json({
      success: true,
      message: `SaaS Subscription updated to ${targetPlan.name}. Payment status is marked as PENDING (payment gateway credentials not yet configured).`,
      subscription: sub,
      plan: targetPlan,
    });
  }
);

export default router;
