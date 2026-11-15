import { Router, Response } from 'express';
import {
  inMemoryDB,
  normalizeGymId,
  getAutomationStats,
  getNotificationLogs,
  logNotificationRecord,
  getAutomationSettings,
  updateAutomationSetting,
  getMemberNotificationPreferences,
  updateMemberNotificationPreferences,
  optOutMemberByPhone,
  checkMembershipExpiries,
  processBirthdayWishes,
  processAttendanceNotification,
  processInactiveMemberReminders,
  generateDailyOwnerReport,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  sendTestWhatsAppNotification,
  handleInboundWhatsAppWebhook,
  processPaymentNotification,
} from '../services/supabaseService.js';
import { sendWhatsAppMessage, dispatchN8nWebhook, isWhatsAppConfigured } from '../services/whatsappService.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// ==============================================================================
// PUBLIC WEBHOOKS (Meta WhatsApp Verification & Inbound Events)
// ==============================================================================

/**
 * GET /api/automation/webhook
 * Meta WhatsApp Cloud API Verification Handshake
 */
router.get('/webhook', (req: any, res: Response): any => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'gymflow_webhook_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }

  res.status(403).json({ error: 'Verification token mismatch' });
});

/**
 * POST /api/automation/webhook
 * Meta WhatsApp Cloud API Inbound Webhook (Message Statuses & Inbound Texts)
 */
router.post('/webhook', (req: any, res: Response) => {
  const body = req.body;
  const result = handleInboundWhatsAppWebhook(body);
  res.status(200).json({ received: true, ...result });
});

// ==============================================================================
// PROTECTED MULTI-TENANT AUTOMATION ROUTES
// ==============================================================================
router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

/**
 * GET /api/automation/stats
 * Dashboard KPIs & Message Telemetry
 */
router.get('/stats', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const stats = getAutomationStats(gymId);
  res.json({
    gymId,
    stats,
    isMetaApiConnected: isWhatsAppConfigured,
  });
});

/**
 * GET /api/automation/logs
 * Filtered & Paginated Notification Audit Logs
 */
router.get('/logs', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const { status, type, search, limit, offset } = req.query;

  const result = getNotificationLogs(gymId, {
    status: status as string,
    type: type as string,
    search: search as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  res.json({
    gymId,
    ...result,
  });
});

/**
 * GET /api/automation/settings
 * Multi-Tenant Automation Workflows
 */
router.get('/settings', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const settings = getAutomationSettings(gymId);
  res.json({
    gymId,
    settings,
  });
});

/**
 * PUT /api/automation/settings/:workflowName
 * Update Workflow Toggle or Configuration
 */
router.put('/settings/:workflowName', requireRole(['gym_owner', 'super_admin']), (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const workflowName = String(req.params.workflowName);
  const { enabled, configuration } = req.body;

  const result = updateAutomationSetting(
    gymId,
    workflowName,
    enabled !== undefined ? Boolean(enabled) : true,
    configuration
  );

  res.json(result);
});

/**
 * GET /api/automation/preferences/:memberId
 * Retrieve Member WhatsApp Notification Preferences
 */
router.get('/preferences/:memberId', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const memberId = String(req.params.memberId);

  const pref = getMemberNotificationPreferences(gymId, memberId);
  res.json({
    gymId,
    memberId,
    preferences: pref,
  });
});

/**
 * PUT /api/automation/preferences/:memberId
 * Update Member WhatsApp Notification Preferences
 */
router.put('/preferences/:memberId', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const memberId = String(req.params.memberId);

  const result = updateMemberNotificationPreferences(gymId, memberId, req.body);
  res.json(result);
});

/**
 * POST /api/automation/opt-out
 * Immediate Opt-Out by Phone or Member ID
 */
router.post('/opt-out', (req: AuthRequest, res: Response): any => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const { phone, memberId, reason } = req.body;

  if (phone) {
    const result = optOutMemberByPhone(gymId, phone, reason || 'User requested opt-out');
    return res.json(result);
  }

  if (memberId) {
    const result = updateMemberNotificationPreferences(gymId, memberId, {
      whatsapp_consent: false,
      opt_out_reason: reason || 'Opted out by ID',
    });
    return res.json(result);
  }

  return res.status(400).json({ error: 'Either phone or memberId must be provided' });
});

/**
 * GET /api/automation/config
 * WhatsApp Business Account & Cloud API Configuration
 */
router.get('/config', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const config = getWhatsAppConfig(gymId);
  res.json({
    gymId,
    config,
  });
});

/**
 * PUT /api/automation/config
 * Update WhatsApp Business Account Settings
 */
router.put('/config', requireRole(['gym_owner', 'super_admin']), (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const result = updateWhatsAppConfig(gymId, req.body);
  res.json(result);
});

/**
 * POST /api/automation/test-message, POST /api/automation/test-whatsapp
 * Dispatch a Test WhatsApp Message
 */
router.post(['/test-message', '/test-whatsapp'], async (req: AuthRequest, res: Response): Promise<any> => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const recipient = req.body.recipient || req.body.recipientPhone;
  const recipientName = req.body.recipientName || 'Member';
  const templateName = req.body.templateName || req.body.template || 'membership_renewal_reminder';
  const messageText = req.body.messageText;
  const parameters = req.body.parameters || { member_name: 'Member', expiry_date: '31 Dec 2026' };

  if (!recipient) {
    return res.status(400).json({ error: 'Recipient phone number is required.' });
  }

  try {
    const result = await sendTestWhatsAppNotification(gymId, {
      recipient,
      recipientName,
      templateName,
      messageText,
      parameters,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/automation/trigger/:workflowName
 * Manually Trigger or Run a Workflow
 */
router.post('/trigger/:workflowName', async (req: AuthRequest, res: Response): Promise<any> => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const workflowName = String(req.params.workflowName);

  try {
    let result: any = null;

    if (workflowName === 'expiry_reminder' || workflowName === 'membership_expiry') {
      result = await checkMembershipExpiries(gymId);
    } else if (workflowName === 'birthday_wishes' || workflowName === 'birthday') {
      result = await processBirthdayWishes(gymId);
    } else if (workflowName === 'inactive_member_reminder' || workflowName === 'inactive_members') {
      result = await processInactiveMemberReminders(gymId);
    } else if (workflowName === 'daily_owner_report' || workflowName === 'daily_report') {
      result = await generateDailyOwnerReport(gymId);
    } else if (workflowName === 'attendance_notification') {
      result = await processAttendanceNotification(gymId, {
        memberId: req.body.memberId || 'cccc1111-0000-0000-0000-000000000001',
        type: req.body.type || 'check_in',
      });
    } else if (workflowName === 'payment_confirmation') {
      result = await processPaymentNotification(gymId, {
        memberId: req.body.memberId || 'cccc1111-0000-0000-0000-000000000001',
        amount: req.body.amount || 2999,
        planName: req.body.planName || 'Monthly Standard',
      });
    } else {
      // Generic dispatch
      const { recipient, messageText } = req.body;
      result = await sendTestWhatsAppNotification(gymId, {
        recipient: recipient || '+919820112345',
        messageText: messageText || `Workflow ${workflowName} test trigger completed.`,
      });
    }

    await dispatchN8nWebhook(`workflow.${workflowName}`, { gymId, result });
    return res.json({ success: true, workflowName, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// POLLING ENDPOINTS (Consumed by n8n Cron Triggers)
// ==============================================================================

/**
 * GET /api/automation/expiring-members
 * Polled by n8n 9:00 AM Cron: returns expiring members for current gym
 */
router.get('/expiring-members', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const normGym = normalizeGymId(gymId);

  const expiring = (inMemoryDB.members || []).filter(
    (m: any) =>
      normalizeGymId(m.gym_id || m.gymId) === normGym &&
      (m.status === 'expiring_soon' || m.status === 'expired')
  );

  const gym = inMemoryDB.gyms.find((g: any) => normalizeGymId(g.id) === normGym) || inMemoryDB.gyms[0];

  const formatted = expiring.map((m: any) => ({
    memberId: m.id,
    gymId: normGym,
    gymName: gym.gym_name || gym.name,
    fullName: m.fullName || m.full_name,
    phone: m.phone,
    expiryDate: m.expiry_date || m.membershipEndDate,
    status: m.status,
    daysRemaining: 3,
    renewalLink: `https://pay.gymflow.ai/renew?code=${m.memberCode || m.id}&gym=${normGym}`,
  }));

  res.json({
    count: formatted.length,
    members: formatted,
  });
});

/**
 * GET /api/automation/birthday-members
 * Polled by n8n 8:30 AM Cron: returns members celebrating birthdays today
 */
router.get('/birthday-members', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const normGym = normalizeGymId(gymId);
  const now = new Date();
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const gym = inMemoryDB.gyms.find((g: any) => normalizeGymId(g.id) === normGym) || inMemoryDB.gyms[0];

  const birthdayMembers = (inMemoryDB.members || []).filter((m: any) => {
    if (normalizeGymId(m.gym_id || m.gymId) !== normGym) return false;
    if (!m.date_of_birth) return false;
    const parts = m.date_of_birth.split('-');
    return parts.length >= 3 && `${parts[1]}-${parts[2]}` === currentMonthDay;
  });

  res.json({
    count: birthdayMembers.length,
    gymName: gym.gym_name || gym.name,
    members: birthdayMembers.map((m: any) => ({
      memberId: m.id,
      name: m.fullName || m.full_name,
      phone: m.phone,
      dateOfBirth: m.date_of_birth,
    })),
  });
});

/**
 * GET /api/automation/inactive-members
 * Polled by n8n Weekly Cron: returns members absent > 7 days
 */
router.get('/inactive-members', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const normGym = normalizeGymId(gymId);
  const gym = inMemoryDB.gyms.find((g: any) => normalizeGymId(g.id) === normGym) || inMemoryDB.gyms[0];

  const now = new Date();
  const inactiveMembers: any[] = [];

  const members = (inMemoryDB.members || []).filter(
    (m: any) => normalizeGymId(m.gym_id || m.gymId) === normGym && m.status === 'active'
  );

  for (const m of members) {
    const memberAttendance = (inMemoryDB.attendance || []).filter(
      (a: any) =>
        normalizeGymId(a.gym_id || a.gymId) === normGym &&
        (a.member_id === m.id || a.memberId === m.id)
    );

    let lastActiveDate = new Date(m.joining_date || m.membershipStartDate || m.created_at);
    if (memberAttendance.length > 0) {
      memberAttendance.sort(
        (a: any, b: any) =>
          new Date((b as any).check_in_time || (b as any).checkInTime).getTime() -
          new Date((a as any).check_in_time || (a as any).checkInTime).getTime()
      );
      lastActiveDate = new Date((memberAttendance[0] as any).check_in_time || (memberAttendance[0] as any).checkInTime);
    }

    const daysAbsent = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAbsent >= 7) {
      inactiveMembers.push({
        memberId: m.id,
        name: m.fullName || m.full_name,
        phone: m.phone,
        daysAbsent,
      });
    }
  }

  res.json({
    count: inactiveMembers.length,
    gymName: gym.gym_name || gym.name,
    members: inactiveMembers,
  });
});

/**
 * GET /api/automation/daily-report
 * Polled by n8n 9:00 PM Cron: generates executive summary and triggers dispatch
 */
router.get('/daily-report', async (req: AuthRequest, res: Response): Promise<any> => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  try {
    const report = await generateDailyOwnerReport(gymId);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/automation/log-dispatch
 * Dispatched by n8n after message execution to register telemetry
 */
router.post('/log-dispatch', (req: AuthRequest, res: Response) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const {
    memberId,
    notificationType,
    recipient,
    recipientName,
    templateName,
    channel,
    messageBody,
    status,
    providerMessageId,
    errorMessage,
    payload,
  } = req.body;

  const log = logNotificationRecord({
    gym_id: gymId,
    member_id: memberId,
    notification_type: notificationType || 'generic_notification',
    recipient: recipient || '+919999999999',
    recipient_name: recipientName || 'Athlete',
    template_name: templateName,
    channel: channel || 'whatsapp',
    message_body: messageBody || 'Notification delivered via automation pipeline.',
    message_status: status || 'delivered',
    provider_message_id: providerMessageId,
    error_message: errorMessage,
    payload,
  });

  res.json({ success: true, log });
});

export default router;
