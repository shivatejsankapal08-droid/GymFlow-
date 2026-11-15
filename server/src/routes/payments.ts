import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';
import {
  inMemoryDB,
  isSupabaseConfigured,
  supabase,
  normalizeGymId,
  calculatePaymentStats,
  executeRecordPayment,
  executeProcessRefund,
  generatePaymentReceipt,
  getPendingDuesList,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from '../services/supabaseService.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/razorpayService.js';
import { sendWhatsAppMessage, dispatchN8nWebhook } from '../services/whatsappService.js';
import { config } from '../config/index.js';

const router = Router();

// ==============================================================================
// 1. PAYMENT DASHBOARD & LIVE KPIS (GET /api/payments/stats)
// ==============================================================================
router.get('/stats', authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const stats = calculatePaymentStats(gymId);
    return res.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error('Error calculating payment stats:', err);
    return res.status(500).json({ error: 'Failed to calculate payment analytics' });
  }
});

// ==============================================================================
// 2. PAYMENT HISTORY LEDGER (GET /api/payments, GET /api/payments/history)
// ==============================================================================
router.get(['/', '/history'], authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  try {
    const normGym = normalizeGymId(req.gymId);
    const {
      range = 'all',
      startDate,
      endDate,
      method = 'all',
      status = 'all',
      search = '',
      page = '1',
      limit = '25',
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Filter by tenant
    let payments = inMemoryDB.payments.filter(
      (p: any) => p.gymId === normGym || p.gym_id === normGym
    );

    // Range filtering
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (range === 'today') {
      payments = payments.filter((p: any) => {
        const d = (p.payment_date || p.paidAt || p.created_at || '').split('T')[0];
        return d === todayStr;
      });
    } else if (range === 'week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      payments = payments.filter((p: any) => {
        const d = (p.payment_date || p.paidAt || p.created_at || '').split('T')[0];
        return d >= sevenDaysAgo;
      });
    } else if (range === 'month') {
      const currentMonth = now.toISOString().slice(0, 7);
      payments = payments.filter((p: any) => {
        const d = (p.payment_date || p.paidAt || p.created_at || '').slice(0, 7);
        return d === currentMonth;
      });
    } else if (range === 'custom' && startDate && endDate) {
      payments = payments.filter((p: any) => {
        const d = (p.payment_date || p.paidAt || p.created_at || '').split('T')[0];
        return d >= (startDate as string) && d <= (endDate as string);
      });
    }

    // Payment Method filter
    if (method !== 'all') {
      payments = payments.filter((p: any) => {
        const m = (p.paymentMethod || p.payment_method || '').toLowerCase();
        return m === (method as string).toLowerCase();
      });
    }

    // Status filter
    if (status !== 'all') {
      payments = payments.filter((p: any) => {
        const s = (p.paymentStatus || p.payment_status || '').toLowerCase();
        return s === (status as string).toLowerCase();
      });
    }

    // Search query filter
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      payments = payments.filter((p: any) => {
        const name = (p.memberName || p.member_name || '').toLowerCase();
        const code = (p.memberCode || p.member_code || '').toLowerCase();
        const txn = (p.transactionId || p.transaction_id || '').toLowerCase();
        const rec = (p.receiptNumber || p.receipt_number || p.invoiceNumber || '').toLowerCase();
        return name.includes(q) || code.includes(q) || txn.includes(q) || rec.includes(q);
      });
    }

    // Sorting
    payments.sort((a: any, b: any) => {
      if (sortBy === 'amount') {
        const amtA = Number(a.finalAmount ?? a.final_amount ?? a.amount ?? 0);
        const amtB = Number(b.finalAmount ?? b.final_amount ?? b.amount ?? 0);
        return sortOrder === 'asc' ? amtA - amtB : amtB - amtA;
      }
      const dateA = new Date(a.payment_date || a.paidAt || a.created_at || 0).getTime();
      const dateB = new Date(b.payment_date || b.paidAt || b.created_at || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 25);
    const total = payments.length;
    const paginated = payments.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.json({
      success: true,
      payments: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    console.error('Error fetching payment history:', err);
    return res.status(500).json({ error: 'Failed to retrieve payment history ledger' });
  }
});

// ==============================================================================
// 3. PENDING PAYMENTS & OUTSTANDING DUES (GET /api/payments/dues)
// ==============================================================================
router.get('/dues', authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const duesData = getPendingDuesList(gymId);
    return res.json(duesData);
  } catch (err: any) {
    console.error('Error retrieving pending dues:', err);
    return res.status(500).json({ error: 'Failed to retrieve pending dues' });
  }
});

// ==============================================================================
// 4. RECORD NEW OFFLINE / COUNTER PAYMENT (POST /api/payments, POST /api/payments/record)
// ==============================================================================
router.post(['/', '/record'], authMiddleware, tenantIsolationMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      memberId,
      amount,
      discount = 0,
      paymentMethod = 'cash',
      transactionId,
      paymentDate,
      paymentStatus = 'completed',
      notes = '',
      isRenewal = false,
    } = req.body;
    const membershipPlanId = req.body.membershipPlanId || req.body.planId;

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required to record a payment' });
    }

    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ error: 'A valid payment amount is required' });
    }

    const recordedBy = (req.user as any)?.name || req.user?.fullName || req.user?.email || 'Authorized Staff';

    const result = executeRecordPayment({
      gymId: req.gymId || '11111111-1111-1111-1111-111111111111',
      memberId,
      membershipPlanId,
      amount: Number(amount),
      discount: Number(discount) || 0,
      paymentMethod,
      transactionId,
      paymentDate,
      paymentStatus,
      notes,
      recordedBy,
      isRenewal: !!isRenewal,
    });

    if (!result.success || !result.payment) {
      return res.status(result.statusCode || 400).json({ error: result.error || 'Failed to record payment' });
    }

    // Supabase cloud persistence fallback if configured
    if (isSupabaseConfigured && supabase && req.gymId) {
      try {
        await supabase.from('payments').insert({
          gym_id: req.gymId,
          member_id: memberId,
          amount: Number(amount),
          discount: Number(discount) || 0,
          final_amount: result.payment.finalAmount,
          payment_method: paymentMethod,
          transaction_id: result.payment.transactionId,
          receipt_number: result.receiptNumber,
          payment_status: paymentStatus,
          payment_date: paymentDate || new Date().toISOString(),
          notes,
        });
      } catch (err) {
        console.warn('Supabase offline payment sync warning:', err);
      }
    }

    // Async WhatsApp notification
    const member: any = inMemoryDB.members.find((m: any) => m.id === memberId || m.alias_id === memberId);
    if (member?.phone) {
      sendWhatsAppMessage({
        toPhone: member.phone,
        messageText: `🧾 Payment Receipt ${result.receiptNumber}: ₹${result.payment.finalAmount} received via ${paymentMethod.toUpperCase()}. Remaining balance: ₹${result.remainingDue}. Thank you!`,
      }).catch((e) => console.warn('WhatsApp receipt dispatch error:', e));
    }

    // Async n8n webhook notification
    dispatchN8nWebhook('payment.recorded', {
      payment: result.payment,
      remainingDue: result.remainingDue,
      gymId: req.gymId,
    }).catch((e) => console.warn('n8n dispatch error:', e));

    return res.status(201).json({
      success: true,
      message: 'Payment recorded and receipt generated successfully.',
      payment: result.payment,
      receiptNumber: result.receiptNumber,
      remainingDue: result.remainingDue,
      memberStatus: result.memberStatus,
    });
  } catch (err: any) {
    console.error('Error recording payment:', err);
    return res.status(500).json({ error: 'Internal error recording payment' });
  }
});

// ==============================================================================
// 5. RAZORPAY ORDER CREATION (POST /api/payments/razorpay/create-order)
// ==============================================================================
async function handleCreateRazorpayOrder(req: AuthRequest, res: any) {
  try {
    const { amount, currency = 'INR', memberId, planId, planName } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount greater than zero is required' });
    }

    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const order = await createRazorpayOrder({
      amount: Number(amount),
      currency: currency || 'INR',
      receipt,
      idempotencyKey,
      notes: {
        gymId: req.gymId || '',
        memberId: memberId || '',
        planId: planId || '',
        planName: planName || 'GymFlow AI Membership',
      },
    });

    return res.json({
      success: true,
      order,
      keyId: config.razorpayKeyId,
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({ error: 'Failed to create Razorpay checkout order' });
  }
}

router.post('/razorpay/create-order', authMiddleware, tenantIsolationMiddleware, handleCreateRazorpayOrder);
router.post('/create-order', authMiddleware, tenantIsolationMiddleware, handleCreateRazorpayOrder);

// ==============================================================================
// 6. RAZORPAY PAYMENT VERIFICATION (POST /api/payments/razorpay/verify-payment)
// ==============================================================================
async function handleVerifyRazorpayPayment(req: AuthRequest, res: any) {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      memberId,
      amount,
      planName,
      membershipPlanId,
      isRenewal = false,
      discount = 0,
    } = req.body;

    // Cryptographic HMAC SHA-256 Signature Verification
    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay payment verification failed: Invalid HMAC signature',
      });
    }

    const normGym = normalizeGymId(req.gymId);
    const member: any = inMemoryDB.members.find(
      (m: any) => m.id === memberId || m.alias_id === memberId
    );

    // Generate unique sequential receipt number
    const gymPayments = inMemoryDB.payments.filter(
      (p: any) => p.gymId === normGym || p.gym_id === normGym
    );
    const nextSeq = gymPayments.length + 1;
    const year = new Date().getFullYear();
    const receiptNumber = `REC-${year}-${String(nextSeq).padStart(5, '0')}`;

    const numAmount = Number(amount) || 2999;
    const numDiscount = Number(discount) || 0;
    const finalAmount = Math.max(0, numAmount - numDiscount);

    // Membership state update
    if (member) {
      member.pendingDue = 0;
      member.status = 'active';

      if (isRenewal) {
        const expDate = new Date();
        expDate.setMonth(expDate.getMonth() + 1);
        member.expiry_date = expDate.toISOString().split('T')[0];
        member.membershipEndDate = expDate.toISOString().split('T')[0];

        inMemoryDB.member_memberships.unshift({
          id: `mm-${Date.now()}`,
          gymId: normGym,
          gym_id: normGym,
          memberId: member.id,
          member_id: member.id,
          plan_id: member.membership_plan_id || 'aaaa1111-0000-0000-0000-000000000001',
          plan_name: planName || member.currentPlanName || 'Membership Renewal',
          duration_months: 1,
          original_price: numAmount,
          discount_amount: numDiscount,
          final_price: finalAmount,
          start_date: new Date().toISOString().split('T')[0],
          end_date: member.expiry_date,
          payment_status: 'completed',
          payment_method: 'razorpay',
          is_renewal: true,
          notes: 'Renewed via Razorpay verified gateway',
          created_at: new Date().toISOString(),
        });
      }
    }

    const newPayment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gymId: normGym,
      gym_id: normGym,
      memberId: member?.id || memberId,
      member_id: member?.id || memberId,
      memberName: member?.fullName || member?.full_name || 'Athlete',
      memberCode: member?.memberCode || member?.member_code || 'IP-1001',
      membershipPlanId: membershipPlanId || member?.membership_plan_id,
      planName: planName || member?.currentPlanName || 'Membership Plan',
      amount: numAmount,
      discount: numDiscount,
      finalAmount,
      final_amount: finalAmount,
      currency: 'INR',
      paymentStatus: 'completed',
      payment_status: 'completed',
      paymentMethod: 'razorpay',
      payment_method: 'razorpay',
      razorpayOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpayPaymentId,
      razorpay_payment_id: razorpayPaymentId,
      razorpaySignature,
      razorpay_signature: razorpaySignature,
      receiptNumber,
      receipt_number: receiptNumber,
      invoiceNumber: receiptNumber,
      paidAt: new Date().toISOString(),
      payment_date: new Date().toISOString(),
      recordedBy: 'Razorpay Payment Gateway',
      recorded_by: 'Razorpay Payment Gateway',
      isRenewal: !!isRenewal,
      is_renewal: !!isRenewal,
      notes: `Verified Razorpay payment for ${planName || 'Membership'}`,
      created_at: new Date().toISOString(),
    };

    inMemoryDB.payments.unshift(newPayment as any);

    // Allocation record
    inMemoryDB.payment_allocations.unshift({
      id: `alloc-${Date.now()}`,
      gymId: normGym,
      gym_id: normGym,
      paymentId: newPayment.id,
      payment_id: newPayment.id,
      memberId: member?.id || memberId,
      member_id: member?.id || memberId,
      allocatedAmount: finalAmount,
      allocated_amount: finalAmount,
      notes: 'Online payment auto-allocation',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    // Supabase fallback
    if (isSupabaseConfigured && supabase && req.gymId && memberId) {
      try {
        await supabase.from('payments').insert({
          gym_id: req.gymId,
          member_id: memberId,
          amount: numAmount,
          discount: numDiscount,
          final_amount: finalAmount,
          payment_method: 'razorpay',
          transaction_id: razorpayPaymentId || `pay_${Date.now()}`,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          receipt_number: receiptNumber,
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase payment insert fallback warning:', e);
      }
    }

    // Dispatch WhatsApp Tax Invoice Receipt
    if (member?.phone) {
      sendWhatsAppMessage({
        toPhone: member.phone,
        messageText: `✅ Payment of ₹${newPayment.finalAmount} confirmed for ${newPayment.memberName}! Tax Receipt: ${receiptNumber}. Active membership unlocked.`,
      }).catch((e) => console.warn('WhatsApp message warning:', e));
    }

    // Trigger n8n webhook
    dispatchN8nWebhook('payment.completed', newPayment).catch((e) =>
      console.warn('n8n dispatch warning:', e)
    );

    return res.json({
      success: true,
      message: 'Razorpay HMAC signature verified and payment processed successfully.',
      payment: newPayment,
      receiptNumber,
    });
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err);
    return res.status(500).json({ error: 'Failed to verify and record payment' });
  }
}

router.post('/razorpay/verify-payment', authMiddleware, tenantIsolationMiddleware, handleVerifyRazorpayPayment);
router.post('/verify', authMiddleware, tenantIsolationMiddleware, handleVerifyRazorpayPayment);

// ==============================================================================
// 7. RAZORPAY WEBHOOK ENDPOINT (POST /api/payments/razorpay/webhook)
// ==============================================================================
async function handleRazorpayWebhook(req: any, res: any) {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const isSignatureValid = verifyWebhookSignature(
      rawPayload,
      signature,
      config.razorpayWebhookSecret || 'gymflow_webhook_secret_2026'
    );

    if (!isSignatureValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventId = event.id || event.event_id || `evt_${Date.now()}`;

    // Webhook Idempotency Check
    if (isWebhookEventProcessed(eventId)) {
      return res.status(200).json({
        status: 'duplicate_ignored',
        message: `Webhook event ${eventId} already processed. Idempotency preserved.`,
      });
    }

    // Mark processed
    markWebhookEventProcessed(eventId, event.event || 'unknown', 'Razorpay Webhook');

    const paymentEntity = event.payload?.payment?.entity;
    const eventType = event.event;

    if (eventType === 'payment.captured') {
      const notes = paymentEntity?.notes || {};
      const memberId = notes.memberId;
      const gymId = notes.gymId ? normalizeGymId(notes.gymId) : null;

      if (memberId) {
        const member: any = inMemoryDB.members.find(
          (m: any) => m.id === memberId || m.alias_id === memberId
        );
        if (member) {
          member.status = 'active';
          member.pendingDue = 0;
        }
      }

      await dispatchN8nWebhook('razorpay.payment.captured', {
        eventId,
        payment: paymentEntity,
        gymId,
      });
    } else if (eventType === 'payment.failed') {
      await dispatchN8nWebhook('razorpay.payment.failed', {
        eventId,
        payment: paymentEntity,
      });
    } else if (eventType === 'refund.processed') {
      await dispatchN8nWebhook('razorpay.refund.processed', {
        eventId,
        refund: event.payload?.refund?.entity,
      });
    }

    return res.status(200).json({
      status: 'ok',
      processedEvent: eventType,
      eventId,
    });
  } catch (err: any) {
    console.error('Error processing Razorpay webhook:', err);
    return res.status(500).json({ error: 'Internal error processing webhook' });
  }
}

router.post('/razorpay/webhook', handleRazorpayWebhook);
router.post('/webhook', handleRazorpayWebhook);

// ==============================================================================
// 8. PAYMENT TAX RECEIPT (GET /api/payments/receipt/:id, GET /api/payments/:id/receipt)
// ==============================================================================
router.get(['/receipt/:id', '/:id/receipt'], authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  try {
    const rawId = req.params.id;
    const paymentId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';

    const result = generatePaymentReceipt(paymentId, gymId);

    if (!result.success) {
      return res.status(result.statusCode || 404).json({ error: result.error });
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Error generating payment receipt:', err);
    return res.status(500).json({ error: 'Failed to generate payment receipt' });
  }
});

// ==============================================================================
// 9. REFUND MANAGEMENT (POST /api/payments/refund)
// ==============================================================================
router.post('/refund', authMiddleware, tenantIsolationMiddleware, async (req: AuthRequest, res) => {
  try {
    const { paymentId, refundAmount, refundReason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required to process refund' });
    }

    if (!refundReason || refundReason.trim() === '') {
      return res.status(400).json({ error: 'Refund reason is mandatory for audit trail compliance' });
    }

    // Role check: Gym Owner or Super Admin only
    const userRole = req.user?.role || 'member';
    const approvedByName = (req.user as any)?.name || req.user?.fullName || 'Administrator';
    const approvedById = req.user?.id || (req.user as any)?.sub;

    const result = executeProcessRefund({
      gymId: req.gymId || '11111111-1111-1111-1111-111111111111',
      paymentId,
      refundAmount: refundAmount ? Number(refundAmount) : undefined,
      refundReason,
      approvedByRole: userRole,
      approvedById,
      approvedByName,
    });

    if (!result.success || !result.refund) {
      return res.status(result.statusCode || 400).json({ error: result.error || 'Failed to process refund' });
    }

    // Supabase DB refund insert fallback
    if (isSupabaseConfigured && supabase && req.gymId) {
      try {
        await supabase.from('payment_refunds').insert({
          gym_id: req.gymId,
          payment_id: paymentId,
          refund_amount: result.refund.refundAmount,
          refund_reason: refundReason,
          approved_by: approvedById,
        });
      } catch (err) {
        console.warn('Supabase refund sync warning:', err);
      }
    }

    // Dispatch n8n refund notification
    dispatchN8nWebhook('payment.refunded', {
      refund: result.refund,
      payment: result.payment,
      gymId: req.gymId,
    }).catch((e) => console.warn('n8n refund dispatch warning:', e));

    return res.json({
      success: true,
      message: 'Refund processed successfully.',
      refund: result.refund,
      payment: result.payment,
    });
  } catch (err: any) {
    console.error('Error processing refund:', err);
    return res.status(500).json({ error: 'Internal error processing payment refund' });
  }
});

// ==============================================================================
// 10. REFUNDS AUDIT LIST (GET /api/payments/refunds)
// ==============================================================================
router.get('/refunds', authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  try {
    const normGym = normalizeGymId(req.gymId);
    const refunds = inMemoryDB.payment_refunds.filter(
      (r: any) => r.gymId === normGym || r.gym_id === normGym
    );
    return res.json({ success: true, count: refunds.length, refunds });
  } catch (err: any) {
    console.error('Error fetching refunds list:', err);
    return res.status(500).json({ error: 'Failed to retrieve refund history' });
  }
});

// ==============================================================================
// 11. GATEWAY SETTINGS STATUS (GET /api/payments/settings)
// ==============================================================================
router.get('/settings', authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  const isOwner = req.user?.role === 'gym_owner' || req.user?.role === 'super_admin';
  return res.json({
    success: true,
    gateway: {
      provider: 'Razorpay Payments & Payouts',
      keyId: config.razorpayKeyId,
      keySecretConfigured: !!config.razorpayKeySecret,
      webhookConfigured: !!config.razorpayWebhookSecret,
      environment: config.razorpayKeyId.startsWith('rzp_test') ? 'test' : 'live',
      currency: 'INR',
      supportedMethods: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash'],
      instantSettlementEnabled: true,
      canManageSettings: isOwner,
    },
  });
});

// ==============================================================================
// 12. LEGACY INVOICES ALIAS (GET /api/payments/invoices)
// ==============================================================================
router.get('/invoices', authMiddleware, tenantIsolationMiddleware, (req: AuthRequest, res) => {
  const normGym = normalizeGymId(req.gymId);
  const tenantInvoices = inMemoryDB.payments.filter((p: any) => p.gymId === normGym || p.gym_id === normGym);
  return res.json({ payments: tenantInvoices });
});

export default router;
