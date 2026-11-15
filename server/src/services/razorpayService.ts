import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/index.js';

export const isRazorpayLive = Boolean(
  config.razorpayKeyId &&
  !config.razorpayKeyId.includes('YourTestKeyId') &&
  config.razorpayKeySecret &&
  !config.razorpayKeySecret.includes('YourTestKeySecret')
);

export const razorpayClient = isRazorpayLive
  ? new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    })
  : null;

// In-memory cache for idempotency tracking of orders
const orderIdempotencyCache = new Map<string, any>();

/**
 * Creates a Razorpay Order with Idempotency Protection
 */
export const createRazorpayOrder = async (params: {
  amount: number; // in INR rupees
  currency?: string;
  receipt: string;
  idempotencyKey?: string;
  notes?: Record<string, string>;
}) => {
  // Check idempotency cache
  if (params.idempotencyKey && orderIdempotencyCache.has(params.idempotencyKey)) {
    return orderIdempotencyCache.get(params.idempotencyKey);
  }

  const amountInPaise = Math.round(params.amount * 100);

  let orderResult: any;

  if (isRazorpayLive && razorpayClient) {
    try {
      const order = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      });
      orderResult = {
        id: order.id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
        isSandbox: false,
      };
    } catch (err: any) {
      console.warn('[Razorpay API Warning] Fallback to sandbox:', err.message);
      const generatedId = `order_${crypto.randomBytes(8).toString('hex')}`;
      orderResult = {
        id: generatedId,
        orderId: generatedId,
        amount: amountInPaise,
        currency: params.currency || 'INR',
        status: 'created',
        receipt: params.receipt,
        isSandbox: true,
      };
    }
  } else {
    // Developer sandbox fallback when live keys aren't set
    const generatedId = `order_${crypto.randomBytes(8).toString('hex')}`;
    orderResult = {
      id: generatedId,
      orderId: generatedId,
      amount: amountInPaise,
      currency: params.currency || 'INR',
      status: 'created',
      receipt: params.receipt,
      isSandbox: true,
    };
  }

  if (params.idempotencyKey) {
    orderIdempotencyCache.set(params.idempotencyKey, orderResult);
  }

  return orderResult;
};

/**
 * Verifies Razorpay payment signature using HMAC SHA-256
 * Rejects invalid / tampered signatures.
 */
export const verifyPaymentSignature = (params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret?: string;
}): boolean => {
  if (!params.orderId || !params.paymentId || !params.signature) {
    return false;
  }

  const secret = params.keySecret || config.razorpayKeySecret || 'gymflow_rzp_test_secret_key_2026';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return expectedSignature === params.signature;
};

/**
 * Generates valid payment HMAC signature for testing
 */
export const generateTestPaymentSignature = (
  orderId: string,
  paymentId: string,
  secret?: string
): string => {
  const keySecret = secret || config.razorpayKeySecret || 'gymflow_rzp_test_secret_key_2026';
  return crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

/**
 * Verifies Razorpay webhook signature against raw request payload
 */
export const verifyWebhookSignature = (
  rawBody: string,
  signature: string,
  secret?: string
): boolean => {
  if (!signature) return false;
  const webhookSecret = secret || config.razorpayWebhookSecret || 'gymflow_webhook_secret_2026';
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Generates valid webhook HMAC signature for testing
 */
export const generateTestWebhookSignature = (
  rawBody: string,
  secret?: string
): string => {
  const webhookSecret = secret || config.razorpayWebhookSecret || 'gymflow_webhook_secret_2026';
  return crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
};
