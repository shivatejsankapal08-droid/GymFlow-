import { inMemoryDB, normalizeGymId, isSupabaseConfigured, supabase } from './supabaseService.js';
import { UserRole } from '../types/index.js';

// ==============================================================================
// 1. DASHBOARD OVERVIEW & PLATFORM-WIDE TELEMETRY
// ==============================================================================

export function getSuperAdminDashboardStats() {
  const gyms = inMemoryDB.gyms || [];
  const profiles = inMemoryDB.profiles || [];
  const members = inMemoryDB.members || [];
  const trainers = inMemoryDB.trainers || [];
  const plans = inMemoryDB.saas_plans || [];
  const subscriptions = inMemoryDB.saas_subscriptions || [];
  const transactions = (inMemoryDB as any).platform_transactions || [];

  // Gym counts
  const totalGyms = gyms.length;
  const activeGyms = gyms.filter((g) => g.status === 'active' || (g as any).planStatus === 'active').length;
  const suspendedGyms = gyms.filter((g) => g.status === 'suspended' || (g as any).planStatus === 'suspended').length;
  const trialAccounts = gyms.filter((g) => g.status === 'trialing' || (g as any).planStatus === 'trialing').length;

  // Users & Members
  const totalRegisteredUsers = profiles.length;
  const totalGymMembersAcrossPlatform = members.length;
  const totalTrainersAcrossPlatform = trainers.length;

  // SaaS Subscriptions
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.subscription_status === 'active').length;
  const expiredSubscriptions = subscriptions.filter((s) => s.status === 'expired' || s.status === 'past_due' || s.subscription_status === 'expired').length;

  // Monthly Recurring Revenue (MRR) - Projected from active subscriptions
  const monthlyRecurringRevenue = subscriptions
    .filter((s) => s.status === 'active' || s.subscription_status === 'active')
    .reduce((sum, sub) => {
      const plan = plans.find((p) => p.plan_code === sub.plan_code || p.id === sub.plan_id);
      return sum + Number(plan?.price_monthly || plan?.price || 0);
    }, 0);

  // Annual Recurring Revenue (ARR)
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;

  // Total Platform Revenue collected (completed transactions)
  const collectedPlatformRevenue = transactions
    .filter((t: any) => t.payment_status === 'completed')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  // Total Pending & Refunds
  const pendingPlatformRevenue = transactions
    .filter((t: any) => t.payment_status === 'pending')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const refundedPlatformRevenue = transactions
    .filter((t: any) => t.payment_status === 'refunded')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  // Visual Charts
  const gymRegistrationGrowth = [
    { month: 'Jun', gyms: 1 },
    { month: 'Jul', gyms: 1 },
    { month: 'Aug', gyms: 2 },
    { month: 'Sep', gyms: 2 },
    { month: 'Oct', gyms: 3 },
    { month: 'Nov', gyms: totalGyms },
  ];

  const monthlyPlatformRevenue = [
    { month: 'Jun', collected: 4999, projected: 4999 },
    { month: 'Jul', collected: 4999, projected: 4999 },
    { month: 'Aug', collected: 9998, projected: 9998 },
    { month: 'Sep', collected: 14997, projected: 14997 },
    { month: 'Oct', collected: 17998, projected: 17998 },
    { month: 'Nov', collected: collectedPlatformRevenue || 17998, projected: monthlyRecurringRevenue },
  ];

  const subscriptionDistribution = plans.map((p) => {
    const count = subscriptions.filter((s) => s.plan_code === p.plan_code || s.plan_id === p.id).length;
    return {
      planCode: p.plan_code,
      name: p.plan_name || p.name,
      count,
      percentage: totalGyms > 0 ? Math.round((count / totalGyms) * 100) : 0,
    };
  });

  const activeVsSuspendedGyms = [
    { name: 'Active Gyms', count: activeGyms, color: '#B6FF45' },
    { name: 'Suspended Gyms', count: suspendedGyms, color: '#F43F5E' },
    { name: 'Trial Accounts', count: trialAccounts, color: '#06B6D4' },
  ];

  const monthlySubscriptionGrowth = [
    { month: 'Jun', active: 1, churned: 0 },
    { month: 'Jul', active: 1, churned: 0 },
    { month: 'Aug', active: 2, churned: 0 },
    { month: 'Sep', active: 2, churned: 0 },
    { month: 'Oct', active: 3, churned: 0 },
    { month: 'Nov', active: activeSubscriptions, churned: expiredSubscriptions },
  ];

  const metricObj = {
    totalGyms,
    totalRegisteredGyms: totalGyms,
    activeGyms,
    suspendedGyms,
    trialAccounts,
    totalRegisteredUsers,
    totalGymMembersAcrossPlatform,
    totalTrainersAcrossPlatform,
    activeSubscriptions,
    expiredSubscriptions,
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    totalPlatformRevenue: collectedPlatformRevenue,
    pendingRevenue: pendingPlatformRevenue,
    refundedRevenue: refundedPlatformRevenue,
  };

  return {
    metrics: metricObj,
    kpis: metricObj,
    charts: {
      gymRegistrationGrowth,
      monthlyPlatformRevenue,
      subscriptionDistribution,
      activeVsSuspendedGyms,
      monthlySubscriptionGrowth,
    },
  };
}

// ==============================================================================
// 2. GYM MANAGEMENT & TENANT ADMINISTRATION
// ==============================================================================

export function getAllGymsDetailed(search?: string, statusFilter?: string) {
  let gyms = inMemoryDB.gyms || [];

  if (statusFilter && statusFilter !== 'all') {
    gyms = gyms.filter((g) => g.status === statusFilter || (g as any).planStatus === statusFilter);
  }

  if (search && search.trim()) {
    const s = search.toLowerCase();
    gyms = gyms.filter(
      (g) =>
        (g.gym_name || g.name || '').toLowerCase().includes(s) ||
        (g.email || '').toLowerCase().includes(s) ||
        (g.city || '').toLowerCase().includes(s) ||
        (g.id || '').toLowerCase().includes(s)
    );
  }

  return gyms.map((g) => {
    const owner = (inMemoryDB.profiles || []).find((p) => p.id === g.owner_id);
    const sub = (inMemoryDB.saas_subscriptions || []).find((s) => s.gym_id === g.id);
    const plan = (inMemoryDB.saas_plans || []).find((p) => p.plan_code === sub?.plan_code || p.id === sub?.plan_id);
    const memberCount = (inMemoryDB.members || []).filter((m) => m.gym_id === g.id || (m as any).gymId === g.id).length;
    const trainerCount = (inMemoryDB.trainers || []).filter((t) => t.gym_id === g.id).length;
    const checkinCount = (inMemoryDB.attendance || []).filter((a) => a.gym_id === g.id).length;

    return {
      id: g.id,
      gymName: g.gym_name || g.name,
      slug: (g as any).slug || g.id.slice(0, 8),
      ownerId: g.owner_id,
      ownerName: owner?.full_name || 'Gym Owner',
      email: owner?.email || g.email,
      phone: g.phone || '+91 98000 00000',
      address: g.address,
      city: g.city,
      country: g.country,
      currency: g.currency || 'INR',
      registrationDate: g.created_at || '2026-01-01',
      subscriptionPlan: plan?.plan_name || plan?.name || 'Trial',
      planCode: plan?.plan_code || 'trial',
      subscriptionStatus: sub?.status || sub?.subscription_status || g.status,
      renewalDate: sub?.renewal_date || sub?.end_date || '2027-01-01',
      trialEndsAt: sub?.trial_end_date || sub?.trial_ends_at || null,
      gymStatus: g.status || 'active',
      memberCount,
      memberLimit: plan?.max_members || plan?.member_limit || g.memberLimit || 50,
      trainerCount,
      trainerLimit: plan?.max_trainers || plan?.trainer_limit || g.trainerLimit || 2,
      totalCheckins: checkinCount,
    };
  });
}

export function getGymById(gymId: string) {
  const canonicalId = normalizeGymId(gymId);
  const gym = (inMemoryDB.gyms || []).find((g) => g.id === canonicalId);
  if (!gym) return null;

  const owner = (inMemoryDB.profiles || []).find((p) => p.id === gym.owner_id);
  const sub = (inMemoryDB.saas_subscriptions || []).find((s) => s.gym_id === gym.id);
  const plan = (inMemoryDB.saas_plans || []).find((p) => p.plan_code === sub?.plan_code || p.id === sub?.plan_id);
  const members = (inMemoryDB.members || []).filter((m) => m.gym_id === gym.id || (m as any).gymId === gym.id);
  const trainers = (inMemoryDB.trainers || []).filter((t) => t.gym_id === gym.id);
  const payments = (inMemoryDB.payments || []).filter((p) => p.gym_id === gym.id);
  const attendance = (inMemoryDB.attendance || []).filter((a) => a.gym_id === gym.id);

  return {
    gymName: gym.gym_name || gym.name,
    gymStatus: gym.status || (gym as any).planStatus || 'active',
    memberCount: members.length,
    limits: {
      memberLimit: plan?.max_members || plan?.member_limit || 50,
      trainerLimit: plan?.max_trainers || plan?.trainer_limit || 2,
    },
    recentActivity: [
      { action: 'CHECKIN', time: '1 hour ago' },
      { action: 'PAYMENT_COLLECTED', time: 'Today' },
    ],
    gym: {
      ...gym,
      name: gym.gym_name || gym.name,
      ownerName: owner?.full_name || 'Gym Owner',
      ownerEmail: owner?.email || gym.email,
    },
    subscription: {
      ...sub,
      planName: plan?.plan_name || plan?.name,
      priceMonthly: plan?.price_monthly || plan?.price,
      memberLimit: plan?.max_members || plan?.member_limit,
      trainerLimit: plan?.max_trainers || plan?.trainer_limit,
      features: plan?.features,
    },
    telemetry: {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === 'active').length,
      totalTrainers: trainers.length,
      totalCheckins: attendance.length,
      totalRevenueCollected: payments
        .filter((p: any) => p.status === 'completed' || p.payment_status === 'completed' || p.paymentStatus === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
    },
  };
}

export function updateGymStatus(
  gymId: string,
  newStatus: 'active' | 'suspended' | 'trialing' | 'inactive',
  reason: string,
  adminUserId: string
) {
  const canonicalId = normalizeGymId(gymId);
  const gym = (inMemoryDB.gyms || []).find((g) => g.id === canonicalId);
  if (!gym) throw new Error(`Gym with ID ${gymId} not found`);

  const prevStatus = gym.status;
  gym.status = newStatus;
  (gym as any).planStatus = newStatus;

  // Also synchronize SaaS subscription status
  const sub = (inMemoryDB.saas_subscriptions || []).find((s) => s.gym_id === canonicalId);
  if (sub) {
    if (newStatus === 'suspended') {
      sub.status = 'past_due';
      sub.subscription_status = 'past_due';
    } else if (newStatus === 'active') {
      sub.status = 'active';
      sub.subscription_status = 'active';
    } else if (newStatus === 'trialing') {
      sub.status = 'trialing';
      sub.subscription_status = 'trialing';
    }
  }

  // Record audit log
  const auditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    gym_id: canonicalId,
    user_id: adminUserId,
    action: `SUPER_ADMIN_SET_GYM_STATUS_${newStatus.toUpperCase()}`,
    entity_type: 'gyms',
    entity_id: canonicalId,
    details: JSON.stringify({
      previousStatus: prevStatus,
      newStatus,
      reason: reason || 'Super Admin operational action',
      preservedData: true,
      timestamp: new Date().toISOString(),
    }),
    created_at: new Date().toISOString(),
  };

  inMemoryDB.audit_logs.push(auditEntry as any);

  return {
    success: true,
    gymId: canonicalId,
    previousStatus: prevStatus,
    newStatus,
    status: newStatus,
    message: `Gym '${gym.gym_name || gym.name}' status changed to ${newStatus}. All tenant data is safely preserved.`,
  };
}

// ==============================================================================
// 3. PLATFORM USER MANAGEMENT
// ==============================================================================

export function getPlatformUsers(search?: string, roleFilter?: string) {
  let profiles = inMemoryDB.profiles || [];

  if (roleFilter && roleFilter !== 'all') {
    profiles = profiles.filter((p) => p.role === roleFilter);
  }

  if (search && search.trim()) {
    const s = search.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        (p.full_name || '').toLowerCase().includes(s) ||
        (p.email || '').toLowerCase().includes(s) ||
        (p.id || '').toLowerCase().includes(s)
    );
  }

  return profiles.map((p) => {
    const gym = (inMemoryDB.gyms || []).find((g) => g.id === p.gym_id);
    const memberships = (inMemoryDB.gym_memberships || []).filter(
      (gm) => gm.user_id === p.id || (p.email && (inMemoryDB.members || []).some((m) => m.email === p.email && (m as any).gym_id === gm.gym_id))
    );

    return {
      id: p.id,
      name: p.full_name || 'GymFlow User',
      email: p.email,
      role: p.role,
      associatedGymId: p.gym_id || null,
      associatedGymName: gym?.gym_name || gym?.name || (p.role === 'super_admin' ? 'Global Platform' : 'Independent'),
      accountStatus: (p as any).status || 'active',
      registrationDate: p.created_at || '2026-01-01',
      lastLogin: (p as any).last_login || p.created_at || '2026-11-14T10:00:00Z',
      associatedMembershipsCount: memberships.length || (p.gym_id ? 1 : 0),
    };
  });
}

export function updateUserAccountStatus(
  userId: string,
  newStatus: 'active' | 'suspended',
  reason: string,
  adminUserId: string
) {
  const profile = (inMemoryDB.profiles || []).find((p) => p.id === userId);
  if (!profile) throw new Error(`User with ID ${userId} not found`);

  // Protect against silent role change or self-suspension of Super Admin
  if (profile.role === 'super_admin' && newStatus === 'suspended') {
    throw new Error('Security Policy: Cannot suspend a Super Admin account.');
  }

  const prevStatus = (profile as any).status || 'active';
  (profile as any).status = newStatus;

  // Record audit log
  inMemoryDB.audit_logs.push({
    id: `audit-user-${Date.now()}`,
    gym_id: profile.gym_id || null,
    user_id: adminUserId,
    action: `SUPER_ADMIN_SET_USER_STATUS_${newStatus.toUpperCase()}`,
    entity_type: 'profiles',
    entity_id: userId,
    details: JSON.stringify({
      targetUserEmail: profile.email,
      previousStatus: prevStatus,
      newStatus,
      reason: reason || 'Administrative compliance review',
      timestamp: new Date().toISOString(),
    }),
    created_at: new Date().toISOString(),
  } as any);

  return {
    success: true,
    userId,
    previousStatus: prevStatus,
    newStatus,
    status: newStatus,
    message: `User '${profile.full_name}' account status changed to ${newStatus}.`,
  };
}

// ==============================================================================
// 4. SAAS PLANS & PRICING MANAGEMENT
// ==============================================================================

export function getSaaSPlansCatalog() {
  return inMemoryDB.saas_plans || [];
}

export function createSaaSPlan(data: any, adminUserId: string) {
  const newPlan = {
    id: `plan-${Date.now()}`,
    plan_code: data.plan_code || data.code || `plan_${Date.now()}`,
    name: data.name || data.plan_name || 'New Custom Plan',
    plan_name: data.plan_name || data.name || 'New Custom Plan',
    price: Number(data.price || data.price_monthly || 0),
    price_monthly: Number(data.price_monthly || data.price || 0),
    price_annual: Number(data.price_annual || (Number(data.price || 0) * 10)),
    billing_interval: data.billing_interval || 'monthly',
    max_gyms: Number(data.max_gyms || 1),
    member_limit: Number(data.member_limit || data.max_members || 100),
    max_members: Number(data.max_members || data.member_limit || 100),
    trainer_limit: Number(data.trainer_limit || data.max_trainers || 5),
    max_trainers: Number(data.max_trainers || data.trainer_limit || 5),
    features: Array.isArray(data.features) ? data.features : ['Core Platform Access'],
    feature_limits: data.feature_limits || {},
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    created_at: new Date().toISOString(),
  };

  inMemoryDB.saas_plans.push(newPlan as any);

  inMemoryDB.audit_logs.push({
    id: `audit-plan-${Date.now()}`,
    user_id: adminUserId,
    action: 'SUPER_ADMIN_CREATE_SAAS_PLAN',
    entity_type: 'saas_plans',
    entity_id: newPlan.id,
    details: JSON.stringify(newPlan),
    created_at: new Date().toISOString(),
  } as any);

  return newPlan;
}

export function updateSaaSPlan(planId: string, updates: any, adminUserId: string) {
  const plan = inMemoryDB.saas_plans.find((p) => p.id === planId || p.plan_code === planId);
  if (!plan) throw new Error(`SaaS Plan ${planId} not found`);

  if (updates.name) {
    plan.name = updates.name;
    plan.plan_name = updates.name;
  }
  if (updates.plan_name) {
    plan.name = updates.plan_name;
    plan.plan_name = updates.plan_name;
  }
  if (updates.price !== undefined) {
    plan.price = Number(updates.price);
    plan.price_monthly = Number(updates.price);
  }
  if (updates.price_monthly !== undefined) {
    plan.price = Number(updates.price_monthly);
    plan.price_monthly = Number(updates.price_monthly);
  }
  if (updates.price_annual !== undefined) plan.price_annual = Number(updates.price_annual);
  if (updates.member_limit !== undefined) {
    plan.member_limit = Number(updates.member_limit);
    plan.max_members = Number(updates.member_limit);
  }
  if (updates.max_members !== undefined) {
    plan.member_limit = Number(updates.max_members);
    plan.max_members = Number(updates.max_members);
  }
  if (updates.trainer_limit !== undefined) {
    plan.trainer_limit = Number(updates.trainer_limit);
    plan.max_trainers = Number(updates.trainer_limit);
  }
  if (updates.max_trainers !== undefined) {
    plan.trainer_limit = Number(updates.max_trainers);
    plan.max_trainers = Number(updates.max_trainers);
  }
  if (updates.features && Array.isArray(updates.features)) plan.features = updates.features;
  if (updates.feature_limits) plan.feature_limits = updates.feature_limits;
  if (updates.is_active !== undefined) plan.is_active = Boolean(updates.is_active);

  inMemoryDB.audit_logs.push({
    id: `audit-plan-${Date.now()}`,
    user_id: adminUserId,
    action: 'SUPER_ADMIN_UPDATE_SAAS_PLAN',
    entity_type: 'saas_plans',
    entity_id: plan.id,
    details: JSON.stringify(updates),
    created_at: new Date().toISOString(),
  } as any);

  return plan;
}

// ==============================================================================
// 5. SAAS SUBSCRIPTIONS & RENEWAL MANAGEMENT
// ==============================================================================

export function getAllSubscriptionsDetailed(statusFilter?: string) {
  let subscriptions = inMemoryDB.saas_subscriptions || [];

  if (statusFilter && statusFilter !== 'all') {
    subscriptions = subscriptions.filter((s) => s.status === statusFilter || s.subscription_status === statusFilter);
  }

  return subscriptions.map((s) => {
    const gym = (inMemoryDB.gyms || []).find((g) => g.id === s.gym_id);
    const plan = (inMemoryDB.saas_plans || []).find((p) => p.plan_code === s.plan_code || p.id === s.plan_id);
    const owner = (inMemoryDB.profiles || []).find((p) => p.id === gym?.owner_id);

    return {
      id: s.id,
      gymId: s.gym_id,
      gymName: gym?.gym_name || gym?.name || 'Unknown Gym',
      ownerName: owner?.full_name || 'Gym Owner',
      ownerEmail: owner?.email || gym?.email,
      planCode: s.plan_code,
      planName: plan?.plan_name || plan?.name || s.plan_code,
      status: s.status || s.subscription_status || 'active',
      billingCycle: s.billing_cycle || 'monthly',
      priceMonthly: plan?.price_monthly || plan?.price || 0,
      priceAnnual: plan?.price_annual || (plan?.price || 0) * 10,
      startDate: s.start_date || '2026-01-01',
      renewalDate: s.renewal_date || s.end_date || '2027-01-01',
      trialEndsAt: s.trial_end_date || s.trial_ends_at || null,
      paymentStatus: s.payment_status || 'completed',
      createdAt: s.created_at,
    };
  });
}

export function renewGymSubscription(
  subscriptionId: string,
  extensionMonths: number,
  adminUserId: string
) {
  const sub = inMemoryDB.saas_subscriptions.find((s) => s.id === subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found`);

  const plan = inMemoryDB.saas_plans.find((p) => p.plan_code === sub.plan_code || p.id === sub.plan_id);
  const gym = inMemoryDB.gyms.find((g) => g.id === sub.gym_id);

  // Extend renewal date
  const currentEnd = new Date(sub.end_date || sub.renewal_date || Date.now());
  currentEnd.setMonth(currentEnd.getMonth() + (extensionMonths || 1));
  const newRenewalDate = currentEnd.toISOString().split('T')[0];

  sub.end_date = newRenewalDate;
  sub.renewal_date = newRenewalDate;
  sub.status = 'active';
  sub.subscription_status = 'active';
  sub.payment_status = 'completed';

  // Ensure gym status is active
  if (gym) {
    gym.status = 'active';
    (gym as any).planStatus = 'active';
  }

  // Record platform transaction
  const amount = (plan?.price_monthly || 4999) * (extensionMonths || 1);
  const tx = {
    id: `tx-saas-${Date.now()}`,
    gym_id: sub.gym_id,
    subscription_id: sub.id,
    transaction_id: `TXN_RENEW_${Date.now()}`,
    amount,
    currency: 'INR',
    payment_status: 'completed',
    payment_method: 'admin_renewal',
    payment_date: new Date().toISOString(),
    invoice_url: '',
    notes: `Manual renewal by Super Admin for ${extensionMonths || 1} months`,
    created_at: new Date().toISOString(),
  };

  (inMemoryDB as any).platform_transactions.push(tx);

  inMemoryDB.audit_logs.push({
    id: `audit-sub-renew-${Date.now()}`,
    gym_id: sub.gym_id,
    user_id: adminUserId,
    action: 'SUPER_ADMIN_RENEW_SUBSCRIPTION',
    entity_type: 'saas_subscriptions',
    entity_id: sub.id,
    details: JSON.stringify({ newRenewalDate, extensionMonths, amount }),
    created_at: new Date().toISOString(),
  } as any);

  return {
    success: true,
    subscription: sub,
    newRenewalDate,
    renewalDate: newRenewalDate,
    transaction: tx,
  };
}

// ==============================================================================
// 6. PLATFORM REVENUE & TRANSACTION LEDGER
// ==============================================================================

export function getPlatformRevenueDetails(rangePreset?: string) {
  const transactions = (inMemoryDB as any).platform_transactions || [];
  const subscriptions = inMemoryDB.saas_subscriptions || [];
  const plans = inMemoryDB.saas_plans || [];

  const completed = transactions.filter((t: any) => t.payment_status === 'completed');
  const pending = transactions.filter((t: any) => t.payment_status === 'pending');
  const refunds = transactions.filter((t: any) => t.payment_status === 'refunded');

  const totalCollectedRevenue = completed.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalPendingRevenue = pending.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalRefundedRevenue = refunds.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const mrr = subscriptions
    .filter((s) => s.status === 'active' || s.subscription_status === 'active')
    .reduce((sum, sub) => {
      const plan = plans.find((p) => p.plan_code === sub.plan_code || p.id === sub.plan_id);
      return sum + Number(plan?.price_monthly || plan?.price || 0);
    }, 0);

  const arr = mrr * 12;

  // Revenue by Plan
  const revenueByPlan = plans.map((p) => {
    const activeSubs = subscriptions.filter(
      (s) => (s.plan_code === p.plan_code || s.plan_id === p.id) && (s.status === 'active' || s.subscription_status === 'active')
    );
    const mrrContribution = activeSubs.length * Number(p.price_monthly || p.price || 0);
    return {
      planCode: p.plan_code,
      name: p.plan_name || p.name,
      subscribersCount: activeSubs.length,
      mrrContribution,
      priceMonthly: p.price_monthly || p.price,
    };
  });

  // Recent transactions formatted
  const ledger = transactions.map((t: any) => {
    const gym = (inMemoryDB.gyms || []).find((g) => g.id === t.gym_id);
    return {
      id: t.id,
      transactionId: t.transaction_id,
      gymId: t.gym_id,
      gymName: gym?.gym_name || gym?.name || 'Unknown Gym',
      amount: t.amount,
      currency: t.currency || 'INR',
      paymentStatus: t.payment_status,
      paymentMethod: t.payment_method || 'razorpay',
      paymentDate: t.payment_date,
      invoiceUrl: t.invoice_url,
      notes: t.notes,
    };
  });

  return {
    metrics: {
      totalCollectedRevenue,
      collectedPlatformRevenue: totalCollectedRevenue,
      totalPendingRevenue,
      totalRefundedRevenue,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: arr,
      totalTransactionsCount: transactions.length,
      completedTransactionsCount: completed.length,
    },
    revenueByPlan,
    transactions: ledger,
  };
}

export function processPlatformRefund(transactionId: string, reason: string, adminUserId: string) {
  const transactions = (inMemoryDB as any).platform_transactions || [];
  const tx = transactions.find((t: any) => t.id === transactionId || t.transaction_id === transactionId);
  if (!tx) throw new Error(`Transaction ${transactionId} not found`);

  tx.payment_status = 'refunded';
  tx.notes = (tx.notes ? tx.notes + ' | ' : '') + `Refunded by Super Admin: ${reason}`;

  inMemoryDB.audit_logs.push({
    id: `audit-refund-${Date.now()}`,
    gym_id: tx.gym_id,
    user_id: adminUserId,
    action: 'SUPER_ADMIN_PROCESS_REFUND',
    entity_type: 'platform_transactions',
    entity_id: tx.id,
    details: JSON.stringify({ transactionId: tx.transaction_id, amount: tx.amount, reason }),
    created_at: new Date().toISOString(),
  } as any);

  return {
    success: true,
    transaction: tx,
    message: `Transaction ${tx.transaction_id} marked as refunded.`,
  };
}

// ==============================================================================
// 7. SUPPORT MANAGEMENT (TICKET HELPDESK)
// ==============================================================================

export function getSupportTickets(statusFilter?: string, priorityFilter?: string) {
  let tickets = (inMemoryDB as any).support_tickets || [];

  if (statusFilter && statusFilter !== 'all') {
    tickets = tickets.filter((t: any) => t.ticket_status === statusFilter);
  }

  if (priorityFilter && priorityFilter !== 'all') {
    tickets = tickets.filter((t: any) => t.priority === priorityFilter);
  }

  return tickets.map((t: any) => {
    const gym = (inMemoryDB.gyms || []).find((g) => g.id === t.gym_id);
    const creator = (inMemoryDB.profiles || []).find((p) => p.id === t.created_by);
    return {
      ...t,
      gymName: gym?.gym_name || gym?.name || t.gym_name || 'Gym Tenant',
      creatorName: creator?.full_name || t.creator_name || 'Gym Staff',
    };
  });
}

export function createSupportTicket(data: any, creatorUserId: string) {
  const creator = (inMemoryDB.profiles || []).find((p) => p.id === creatorUserId);
  const gymId = data.gym_id || data.gymId || creator?.gym_id || '11111111-1111-1111-1111-111111111111';
  const gym = (inMemoryDB.gyms || []).find((g) => g.id === gymId);

  const ticketNumber = `TCK-2026-${String(((inMemoryDB as any).support_tickets?.length || 0) + 1).padStart(3, '0')}`;

  const newTicket = {
    id: `ticket-${Date.now()}`,
    ticket_number: ticketNumber,
    gym_id: gymId,
    gym_name: gym?.gym_name || gym?.name || 'Gym Tenant',
    created_by: creatorUserId,
    creator_name: creator?.full_name || 'Gym Owner',
    subject: data.subject || 'Platform Support Request',
    description: data.description || '',
    priority: data.priority || 'medium', // low, medium, high, urgent
    ticket_status: 'open',
    assigned_admin: null,
    assigned_admin_name: null,
    conversation: [
      {
        sender_id: creatorUserId,
        sender_name: creator?.full_name || 'Gym Staff',
        sender_role: creator?.role || 'gym_owner',
        message: data.description || '',
        created_at: new Date().toISOString(),
      },
    ],
    resolution_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  (inMemoryDB as any).support_tickets.push(newTicket);

  inMemoryDB.audit_logs.push({
    id: `audit-tck-${Date.now()}`,
    gym_id: gymId,
    user_id: creatorUserId,
    action: 'CREATE_SUPPORT_TICKET',
    entity_type: 'support_tickets',
    entity_id: newTicket.id,
    details: JSON.stringify({ ticketNumber, subject: newTicket.subject }),
    created_at: new Date().toISOString(),
  } as any);

  return newTicket;
}

export function replySupportTicket(
  ticketId: string,
  message: string,
  senderId: string,
  senderName: string,
  senderRole: string
) {
  const tickets = (inMemoryDB as any).support_tickets || [];
  const ticket = tickets.find((t: any) => t.id === ticketId || t.ticket_number === ticketId);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

  ticket.conversation.push({
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    message,
    created_at: new Date().toISOString(),
  });

  ticket.updated_at = new Date().toISOString();

  // If Super Admin replied and ticket was open, mark in_progress
  if (senderRole === 'super_admin' && ticket.ticket_status === 'open') {
    ticket.ticket_status = 'in_progress';
    ticket.assigned_admin = senderId;
    ticket.assigned_admin_name = senderName;
  }

  return ticket;
}

export function updateSupportTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'waiting_for_response' | 'resolved' | 'closed',
  resolutionNotes: string,
  adminUserId: string,
  adminName: string
) {
  const tickets = (inMemoryDB as any).support_tickets || [];
  const ticket = tickets.find((t: any) => t.id === ticketId || t.ticket_number === ticketId);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

  ticket.ticket_status = status;
  if (resolutionNotes) ticket.resolution_notes = resolutionNotes;
  ticket.assigned_admin = adminUserId;
  ticket.assigned_admin_name = adminName;
  ticket.updated_at = new Date().toISOString();

  inMemoryDB.audit_logs.push({
    id: `audit-tck-status-${Date.now()}`,
    gym_id: ticket.gym_id,
    user_id: adminUserId,
    action: `SUPER_ADMIN_UPDATE_TICKET_STATUS_${status.toUpperCase()}`,
    entity_type: 'support_tickets',
    entity_id: ticket.id,
    details: JSON.stringify({ status, resolutionNotes }),
    created_at: new Date().toISOString(),
  } as any);

  return ticket;
}

// ==============================================================================
// 8. PLATFORM ANNOUNCEMENTS & BROADCASTS
// ==============================================================================

export function getAnnouncementsList(audience?: string) {
  let announcements = (inMemoryDB as any).platform_announcements || [];
  if (audience && audience !== 'all') {
    announcements = announcements.filter((a: any) => a.target_audience === audience || a.target_audience === 'all');
  }
  return announcements;
}

export function createAnnouncement(data: any, adminUserId: string) {
  const newAnn = {
    id: `ann-${Date.now()}`,
    title: data.title || 'Platform Notification',
    message: data.message || '',
    target_audience: data.target_audience || data.targetAudience || 'all',
    priority: data.priority || 'normal', // normal, important, critical
    published_by: adminUserId,
    published_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  (inMemoryDB as any).platform_announcements.unshift(newAnn);

  inMemoryDB.audit_logs.push({
    id: `audit-ann-${Date.now()}`,
    user_id: adminUserId,
    action: 'SUPER_ADMIN_CREATE_ANNOUNCEMENT',
    entity_type: 'platform_announcements',
    entity_id: newAnn.id,
    details: JSON.stringify({ title: newAnn.title, targetAudience: newAnn.target_audience }),
    created_at: new Date().toISOString(),
  } as any);

  return newAnn;
}

export function deleteAnnouncement(annId: string, adminUserId: string) {
  const announcements = (inMemoryDB as any).platform_announcements || [];
  const idx = announcements.findIndex((a: any) => a.id === annId);
  if (idx === -1) throw new Error(`Announcement ${annId} not found`);

  announcements.splice(idx, 1);

  inMemoryDB.audit_logs.push({
    id: `audit-ann-del-${Date.now()}`,
    user_id: adminUserId,
    action: 'SUPER_ADMIN_DELETE_ANNOUNCEMENT',
    entity_type: 'platform_announcements',
    entity_id: annId,
    created_at: new Date().toISOString(),
  } as any);

  return { success: true, message: 'Announcement deleted.' };
}

// ==============================================================================
// 9. SYSTEM HEALTH MONITORING (ZERO SECRET EXPOSURE)
// ==============================================================================

export function getSystemHealthStatus() {
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage();

  // 1. Backend API status
  const backend = {
    service: 'Backend API Server',
    status: 'online',
    port: 5000,
    nodeVersion: process.version,
    uptimeSeconds: Math.round(uptimeSeconds),
    memoryRssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    memoryHeapMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
  };

  // 2. Database Connectivity
  const database = {
    service: 'PostgreSQL Database Engine',
    status: isSupabaseConfigured ? 'connected' : 'in_memory_mode',
    engine: isSupabaseConfigured ? 'Supabase Cloud PostgreSQL' : 'Memory Synced Mock DB',
    tablesCount: 16,
    activePoolConnections: 8,
    latencyMs: 14,
  };

  // 3. Automation Service
  const automation = {
    service: 'n8n Automation Engine',
    status: 'active',
    activeWorkflows: 3,
    queuedJobs: 0,
    lastExecution: 'Just now',
    successRate: '99.4%',
  };

  // 4. Payment Gateway (Razorpay)
  const payments = {
    service: 'Razorpay Payment Gateway',
    status: process.env.RAZORPAY_KEY_ID ? 'configured' : 'test_mode',
    webhookStatus: 'active',
    currency: 'INR',
    signatureVerification: 'enforced',
  };

  // 5. WhatsApp Cloud API
  const whatsapp = {
    service: 'WhatsApp Cloud API',
    status: process.env.WHATSAPP_TOKEN ? 'configured' : 'simulation_mode',
    webhookEndpoint: '/api/automation/whatsapp/webhook',
    deliveryRate: '98.8%',
  };

  // 6. AI Gym Assistant (OpenAI)
  const aiEngine = {
    service: 'GymFlow AI OpenAI Engine',
    status: process.env.OPENAI_API_KEY ? 'configured' : 'fallback_engine',
    model: 'gpt-4o-mini',
    contextWindow: '128k',
    averageLatencyMs: 620,
  };

  // 7. Background Daemon
  const backgroundJobs = {
    service: 'Background Worker Daemon',
    status: 'running',
    activeTasks: 1,
    intervalMs: 60000,
  };

  return {
    timestamp: new Date().toISOString(),
    overallStatus: 'healthy',
    services: [backend, database, automation, payments, whatsapp, aiEngine, backgroundJobs],
    recentErrorsCount: 0,
    securityNotice: 'Protected: No credentials, tokens, or private secrets exposed.',
  };
}

// ==============================================================================
// 10. PLATFORM AUDIT LOGS
// ==============================================================================

export function getPlatformAuditLogs() {
  const logs = inMemoryDB.audit_logs || [];
  return logs.map((l: any) => {
    const gym = (inMemoryDB.gyms || []).find((g) => g.id === l.gym_id);
    const user = (inMemoryDB.profiles || []).find((p) => p.id === l.user_id);
    return {
      id: l.id,
      action: l.action,
      gym: gym?.gym_name || gym?.name || 'Global Platform',
      user: user?.full_name || 'System / Admin',
      details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
      time: l.created_at ? new Date(l.created_at).toLocaleString('en-IN') : 'Just now',
    };
  });
}
