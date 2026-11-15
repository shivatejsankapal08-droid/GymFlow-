const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000';
const GYM_1 = '11111111-1111-1111-1111-111111111111';
const GYM_2 = '22222222-2222-2222-2222-222222222222';
const OWNER_TOKEN_GYM1 = 'demo-token-gym_owner';
const OWNER_TOKEN_GYM2 = 'demo-token-gym_owner_titan';
const TRAINER_TOKEN = 'demo-token-trainer';
const MEMBER_TOKEN = 'demo-token-member';
const RAZORPAY_SECRET = 'YourTestKeySecret';
const WEBHOOK_SECRET = 'gymflow_webhook_secret_2026';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawBody: body });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(data);
    }
    req.end();
  });
}

function generateHmacSignature(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function runPaymentSuite() {
  console.log('================================================================');
  console.log('🏋️‍♂️ GYMFLOW AI - STEP 8: SMART PAYMENT MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Record Cash Payment
    console.log('Test 1: Record Offline Cash Payment');
    const cashRes = await request('/api/payments/record', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        memberId: 'cccc1111-0000-0000-0000-000000000001',
        amount: 2999,
        discount: 0,
        paymentMethod: 'cash',
        notes: 'Monthly standard counter cash payment',
      },
    });
    assert(cashRes.status === 201, 'Cash payment recorded with status 201');
    assert(cashRes.body?.success === true, 'Success flag returned true');
    assert(cashRes.body?.payment?.paymentMethod === 'cash', 'Payment method is cash');
    assert(cashRes.body?.receiptNumber?.startsWith('REC-'), 'Valid sequential receipt number generated');

    // 2. Record UPI Payment with Discount
    console.log('\nTest 2: Record UPI Payment with Discount');
    const upiRes = await request('/api/payments/record', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        memberId: 'cccc1111-0000-0000-0000-000000000002',
        amount: 5000,
        discount: 500,
        paymentMethod: 'upi',
        transactionId: 'UPI-TEST-998822',
        notes: 'GPay payment with discount voucher',
      },
    });
    assert(upiRes.status === 201, 'UPI payment recorded with status 201');
    assert(upiRes.body?.payment?.finalAmount === 4500, 'Final amount correctly deducted discount (5000 - 500 = 4500)');
    assert(upiRes.body?.payment?.transactionId === 'UPI-TEST-998822', 'Transaction ID preserved');

    // 3. Create Razorpay Order
    console.log('\nTest 3: Create Razorpay Checkout Order');
    const orderRes = await request('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        amount: 7499,
        currency: 'INR',
        memberId: 'cccc1111-0000-0000-0000-000000000001',
        planName: 'Quarterly Pro Transformation',
      },
    });
    assert(orderRes.status === 200, 'Order created with HTTP 200');
    const orderId = orderRes.body?.order?.id || orderRes.body?.order?.orderId;
    assert(orderId?.startsWith('order_'), 'Razorpay order ID generated');
    assert(orderRes.body?.order?.amount === 749900, 'Amount correctly converted to paise (7499 * 100)');

    // 4. Verify Valid HMAC Payment Signature
    console.log('\nTest 4: Verify Valid HMAC-SHA256 Payment Signature');
    const paymentId = `pay_${Date.now()}`;
    const validSignature = generateHmacSignature(`${orderId}|${paymentId}`, RAZORPAY_SECRET);

    const verifyRes = await request('/api/payments/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
        memberId: 'cccc1111-0000-0000-0000-000000000001',
        amount: 7499,
        planName: 'Quarterly Pro Transformation',
      },
    });
    assert(verifyRes.status === 200, 'Valid HMAC signature accepted with status 200');
    assert(verifyRes.body?.success === true, 'Payment successfully verified');
    assert(verifyRes.body?.payment?.paymentStatus === 'completed', 'Payment status marked as completed');

    // 5. Reject Invalid HMAC Payment Signature (400)
    console.log('\nTest 5: Reject Invalid / Tampered HMAC Payment Signature');
    const tamperedVerifyRes = await request('/api/payments/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'tampered_invalid_hex_digest_1234567890abcdef',
        memberId: 'cccc1111-0000-0000-0000-000000000001',
        amount: 7499,
      },
    });
    assert(tamperedVerifyRes.status === 400, 'Tampered HMAC signature rejected with HTTP 400');
    assert(tamperedVerifyRes.body?.error?.includes('Invalid HMAC signature'), 'Descriptive error returned');

    // 6. Process Webhook Events
    console.log('\nTest 6: Process Razorpay Webhook Event (payment.captured)');
    const webhookPayload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_hook_${Date.now()}`,
            amount: 299900,
            status: 'captured',
            notes: {
              gymId: GYM_1,
              memberId: 'cccc1111-0000-0000-0000-000000000006',
            },
          },
        },
      },
    });
    const webhookSignature = generateHmacSignature(webhookPayload, WEBHOOK_SECRET);

    const webhookRes = await request('/api/payments/razorpay/webhook', {
      method: 'POST',
      headers: {
        'X-Razorpay-Signature': webhookSignature,
      },
      body: webhookPayload,
    });
    assert(webhookRes.status === 200, 'Webhook accepted with HTTP 200');
    assert(webhookRes.body?.status === 'ok', 'Webhook status ok');

    // 7. Prevent Duplicate Webhook Processing (Idempotency)
    console.log('\nTest 7: Webhook Idempotency (Duplicate Ignored)');
    const dupWebhookRes = await request('/api/payments/razorpay/webhook', {
      method: 'POST',
      headers: {
        'X-Razorpay-Signature': webhookSignature,
      },
      body: webhookPayload,
    });
    assert(dupWebhookRes.status === 200, 'Duplicate webhook responded with 200 without reprocessing');
    assert(dupWebhookRes.body?.status === 'duplicate_ignored', 'Duplicate correctly flagged and ignored');

    // 8. Partial Payment & Reduced Outstanding Balance
    console.log('\nTest 8: Partial Payment & Outstanding Dues Reduction');
    // First check dues
    const duesRes = await request('/api/payments/dues', {
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
    });
    assert(duesRes.status === 200, 'Fetched pending dues');
    const memberWithDue = duesRes.body?.members?.find((m) => m.pendingDue > 0) || duesRes.body?.members?.[0];
    const initialDue = memberWithDue ? memberWithDue.pendingDue : 2999;
    const targetMemberId = memberWithDue ? memberWithDue.memberId : 'cccc1111-0000-0000-0000-000000000003';
    const paySlice = Math.min(1000, initialDue > 0 ? Math.ceil(initialDue / 2) : 500);

    // Record partial payment
    const partialRes = await request('/api/payments/record', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        memberId: targetMemberId,
        amount: paySlice,
        discount: 0,
        paymentMethod: 'cash',
        notes: 'Partial payment collection',
      },
    });
    assert(partialRes.status === 201, 'Partial payment recorded');
    assert(partialRes.body?.remainingDue === Math.max(0, initialDue - paySlice), 'Outstanding due reduced by partial payment amount');

    // 9. Payment Stats and 8 KPIs Calculation
    console.log('\nTest 9: Live Payment Stats & 8 Revenue KPIs');
    const statsRes = await request('/api/payments/stats', {
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
    });
    assert(statsRes.status === 200, 'Stats returned HTTP 200');
    assert(typeof statsRes.body?.stats?.totalRevenue === 'number', 'Total Revenue KPI present');
    assert(typeof statsRes.body?.stats?.todayRevenue === 'number', "Today's Revenue KPI present");
    assert(typeof statsRes.body?.stats?.monthlyRevenue === 'number', 'Monthly Revenue KPI present');
    assert(typeof statsRes.body?.stats?.pendingPayments === 'number', 'Pending Dues KPI present');
    assert(statsRes.body?.stats?.dailyRevenue?.length === 14, 'Daily revenue chart has 14 days series');
    assert(statsRes.body?.stats?.monthlyRevenueChart?.length === 12, 'Monthly revenue chart has 12 months series');

    // 10. Generate Structured Tax Invoice Receipt
    console.log('\nTest 10: Generate Structured Tax Invoice Receipt');
    const receiptRes = await request('/api/payments/receipt/dddd1111-0000-0000-0000-000000000001', {
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
    });
    assert(receiptRes.status === 200, 'Receipt fetched with HTTP 200');
    assert(receiptRes.body?.receipt?.receiptNumber === 'REC-2026-00001', 'Receipt number matches REC-2026-00001');
    assert(receiptRes.body?.receipt?.gym?.name === 'IronPulse Fitness Club', 'Gym name correctly embedded');
    assert(receiptRes.body?.receipt?.summary?.totalPaid === 21999, 'Total paid accurately reported');

    // 11. Refund Management & RBAC Protection
    console.log('\nTest 11: Refund Management & RBAC Security');
    const paymentToRefundId = cashRes.body?.payment?.id || 'dddd1111-0000-0000-0000-000000000001';

    // First: Member or Trainer attempts refund -> Must be rejected with 403 Forbidden!
    const unauthorizedRefund = await request('/api/payments/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TRAINER_TOKEN}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        paymentId: paymentToRefundId,
        refundReason: 'Trainer unauthorized refund attempt',
      },
    });
    assert(unauthorizedRefund.status === 403, 'Trainer blocked from processing refund with HTTP 403 Forbidden');

    // Authorized Owner initiates refund
    const authorizedRefund = await request('/api/payments/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        paymentId: paymentToRefundId,
        refundAmount: 2999,
        refundReason: 'Customer refund approved by gym owner',
      },
    });
    assert(authorizedRefund.status === 200, 'Owner successfully authorized refund');
    assert(authorizedRefund.body?.payment?.paymentStatus === 'refunded', 'Payment status updated to refunded');

    // 12. Prevent Cross-Gym Payment Access (Multi-Tenant Isolation)
    console.log('\nTest 12: Cross-Tenant Payment Isolation (Gym 1 Owner accessing Gym 2 Payment)');
    const crossTenantReceipt = await request('/api/payments/receipt/dddd2222-0000-0000-0000-000000000001', {
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
    });
    assert(crossTenantReceipt.status === 403, 'Cross-gym payment receipt access denied with HTTP 403 Forbidden');

    // 13. Verify Membership Activation Occurs Only After Payment
    console.log('\nTest 13: Membership Activation Tied to Payment');
    const renewalPayment = await request('/api/payments/record', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER_TOKEN_GYM1}`,
        'X-Gym-Id': GYM_1,
      },
      body: {
        memberId: 'cccc1111-0000-0000-0000-000000000004',
        amount: 2999,
        paymentMethod: 'credit_card',
        isRenewal: true,
        notes: 'Monthly renewal subscription',
      },
    });
    assert(renewalPayment.status === 201, 'Renewal payment recorded');
    assert(renewalPayment.body?.memberStatus === 'active', 'Member status automatically updated to active');
    assert(renewalPayment.body?.remainingDue === 0, 'Remaining dues cleared upon renewal');

    console.log('\n================================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  }
}

runPaymentSuite();
