import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  getSuperAdminDashboardStats,
  getAllGymsDetailed,
  getGymById,
  updateGymStatus,
  getPlatformUsers,
  updateUserAccountStatus,
  getSaaSPlansCatalog,
  createSaaSPlan,
  updateSaaSPlan,
  getAllSubscriptionsDetailed,
  renewGymSubscription,
  getPlatformRevenueDetails,
  processPlatformRefund,
  getSupportTickets,
  createSupportTicket,
  replySupportTicket,
  updateSupportTicketStatus,
  getAnnouncementsList,
  createAnnouncement,
  deleteAnnouncement,
  getSystemHealthStatus,
  getPlatformAuditLogs,
} from '../services/adminService.js';

const router = Router();

// 1. Enforce authentication on all admin endpoints
router.use(authMiddleware);

// ==============================================================================
// 1. SUPPORT TICKETS - ACCESSIBLE TO GYM OWNERS & SUPER ADMINS
// ==============================================================================
// POST /api/admin/support/tickets - Submit support ticket
router.post('/support/tickets', (req: AuthRequest, res): any => {
  try {
    const role = req.user?.role;
    if (role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only gym owners and admins can submit support tickets' });
    }

    const { subject, description, priority, gymId } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticket = createSupportTicket(
      { subject, description, priority, gymId },
      req.user?.id || '00000000-0000-0000-0000-000000000001'
    );

    return res.status(201).json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/support/tickets/:id/reply - Post message on ticket
router.post('/support/tickets/:id/reply', (req: AuthRequest, res): any => {
  try {
    const role = req.user?.role;
    if (role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message content is required' });

    const ticket = replySupportTicket(
      String(req.params.id),
      message,
      req.user?.id || 'admin',
      req.user?.fullName || 'GymFlow Staff',
      role
    );

    return res.json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// SUPER ADMIN ROLE GUARD (All following routes restricted to Super Admin)
// ==============================================================================
router.use((req: AuthRequest, res, next): any => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      error: `Forbidden: Super Admin access required. Current role: ${req.user?.role || 'unauthorized'}`,
    });
  }
  next();
});

// ==============================================================================
// 2. DASHBOARD OVERVIEW & STATS
// ==============================================================================
// GET /api/admin/stats - Platform KPIs and visual telemetry
router.get('/stats', (req: AuthRequest, res) => {
  try {
    const data = getSuperAdminDashboardStats();
    return res.json({
      success: true,
      ...data,
      stats: {
        totalMonthlyRevenue: data.metrics.monthlyRecurringRevenue,
        ...data.metrics,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 3. GYM TENANT MANAGEMENT
// ==============================================================================
// GET /api/admin/gyms - Comprehensive gym tenant accounts list
router.get('/gyms', (req: AuthRequest, res) => {
  try {
    const { search, status } = req.query;
    const gyms = getAllGymsDetailed(search ? String(search) : undefined, status ? String(status) : undefined);
    return res.json({ success: true, gyms });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/gyms/:id - Detailed gym tenant profile
router.get('/gyms/:id', (req: AuthRequest, res): any => {
  try {
    const details = getGymById(String(req.params.id));
    if (!details) return res.status(404).json({ error: 'Gym not found' });
    return res.json({ success: true, ...details });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/gyms/:id/status - Activate, suspend, or reactivate a gym
router.put('/gyms/:id/status', (req: AuthRequest, res): any => {
  try {
    const { status, reason } = req.body;
    if (!['active', 'suspended', 'trialing', 'inactive'].includes(status)) {
      return res.status(400).json({ error: `Invalid status '${status}'. Must be active, suspended, trialing, or inactive.` });
    }

    const result = updateGymStatus(
      String(req.params.id),
      status,
      reason || 'Super Admin operational action',
      req.user?.id || 'admin'
    );

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 4. PLATFORM USER MANAGEMENT
// ==============================================================================
// GET /api/admin/users - Platform user directory
router.get('/users', (req: AuthRequest, res) => {
  try {
    const { search, role } = req.query;
    const users = getPlatformUsers(search ? String(search) : undefined, role ? String(role) : undefined);
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/status - Suspend or reactivate user account
router.put('/users/:id/status', (req: AuthRequest, res): any => {
  try {
    const { status, reason } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: `Invalid status '${status}'. Must be active or suspended.` });
    }

    const result = updateUserAccountStatus(
      String(req.params.id),
      status,
      reason || 'Administrative action',
      req.user?.id || 'admin'
    );

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// 5. SAAS PLANS & PRICING
// ==============================================================================
// GET /api/admin/plans - Catalog of SaaS plans
router.get('/plans', (req: AuthRequest, res) => {
  try {
    const plans = getSaaSPlansCatalog();
    return res.json({ success: true, plans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/plans - Create new SaaS plan
router.post('/plans', (req: AuthRequest, res): any => {
  try {
    const { plan_name, name, price, price_monthly, member_limit, max_members } = req.body;
    if ((!plan_name && !name) || (price === undefined && price_monthly === undefined)) {
      return res.status(400).json({ error: 'Plan name and price are required' });
    }

    const plan = createSaaSPlan(req.body, req.user?.id || 'admin');
    return res.status(201).json({ success: true, plan });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/plans/:id - Update SaaS plan pricing and feature limits
router.put('/plans/:id', (req: AuthRequest, res): any => {
  try {
    const plan = updateSaaSPlan(String(req.params.id), req.body, req.user?.id || 'admin');
    return res.json({ success: true, plan });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 6. SAAS SUBSCRIPTIONS & RENEWALS
// ==============================================================================
// GET /api/admin/subscriptions - All gym subscriptions
router.get('/subscriptions', (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const subscriptions = getAllSubscriptionsDetailed(status ? String(status) : undefined);
    return res.json({ success: true, subscriptions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/subscriptions/:id/renew - Renew gym subscription
router.put('/subscriptions/:id/renew', (req: AuthRequest, res): any => {
  try {
    const { months = 1 } = req.body;
    const result = renewGymSubscription(String(req.params.id), Number(months), req.user?.id || 'admin');
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 7. PLATFORM REVENUE & TRANSACTIONS
// ==============================================================================
// GET /api/admin/revenue - Comprehensive SaaS revenue breakdown
router.get('/revenue', (req: AuthRequest, res) => {
  try {
    const { range } = req.query;
    const report = getPlatformRevenueDetails(range ? String(range) : undefined);
    return res.json({ success: true, ...report });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/transactions - Transaction ledger
router.get('/transactions', (req: AuthRequest, res) => {
  try {
    const report = getPlatformRevenueDetails();
    return res.json({ success: true, transactions: report.transactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/transactions/refund - Process SaaS subscription refund
router.post('/transactions/refund', (req: AuthRequest, res): any => {
  try {
    const { transactionId, reason } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });

    const result = processPlatformRefund(transactionId, reason || 'Customer requested refund', req.user?.id || 'admin');
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 8. SUPPORT TICKETS MANAGEMENT (Super Admin View & Resolve)
// ==============================================================================
// GET /api/admin/support/tickets - View all support tickets
router.get('/support/tickets', (req: AuthRequest, res) => {
  try {
    const { status, priority } = req.query;
    const tickets = getSupportTickets(status ? String(status) : undefined, priority ? String(priority) : undefined);
    return res.json({ success: true, tickets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/support/tickets/:id/status - Update ticket status & resolution
router.put('/support/tickets/:id/status', (req: AuthRequest, res): any => {
  try {
    const { status, resolutionNotes } = req.body;
    if (!['open', 'in_progress', 'waiting_for_response', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: `Invalid ticket status '${status}'` });
    }

    const ticket = updateSupportTicketStatus(
      String(req.params.id),
      status,
      resolutionNotes || '',
      req.user?.id || 'admin',
      req.user?.fullName || 'Super Admin'
    );

    return res.json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 9. PLATFORM ANNOUNCEMENTS
// ==============================================================================
// GET /api/admin/announcements - View platform announcements
router.get('/announcements', (req: AuthRequest, res) => {
  try {
    const { audience } = req.query;
    const announcements = getAnnouncementsList(audience ? String(audience) : undefined);
    return res.json({ success: true, announcements });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/announcements - Create and publish platform announcement
router.post('/announcements', (req: AuthRequest, res): any => {
  try {
    const { title, message, target_audience, priority } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const announcement = createAnnouncement(req.body, req.user?.id || 'admin');
    return res.status(201).json({ success: true, announcement });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/announcements/:id - Deactivate announcement
router.delete('/announcements/:id', (req: AuthRequest, res): any => {
  try {
    const result = deleteAnnouncement(String(req.params.id), req.user?.id || 'admin');
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 10. SYSTEM HEALTH MONITORING & AUDIT LOGS
// ==============================================================================
// GET /api/admin/system/health - Operational telemetry (no secrets)
router.get('/system/health', (req: AuthRequest, res) => {
  try {
    const health = getSystemHealthStatus();
    return res.json({ success: true, ...health });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs - Immutable platform audit logs
router.get('/audit-logs', (req: AuthRequest, res) => {
  try {
    const auditLogs = getPlatformAuditLogs();
    return res.json({ success: true, auditLogs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
