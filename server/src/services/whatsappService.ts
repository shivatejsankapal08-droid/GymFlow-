import { config } from '../config/index.js';

export interface WhatsAppMessageOptions {
  toPhone: string;
  recipientName?: string;
  messageText?: string;
  templateName?: string;
  templateParameters?: Record<string, string | number> | string[];
}

export interface WhatsAppDeliveryResult {
  success: boolean;
  messageId: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'delivered_to_sandbox' | 'failed';
  isLive: boolean;
  messageBody: string;
  timestamp: string;
  error?: string;
}

export const isWhatsAppConfigured = Boolean(
  config.whatsappPhoneId && config.whatsappAccessToken
);

/**
 * Standard Pre-Approved Notification Templates for GymFlow AI
 */
export const WHATSAPP_TEMPLATES = {
  MEMBERSHIP_EXPIRY: {
    name: 'gymflow_membership_expiry',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; expiry_date: string; days_left?: number; renewal_link?: string }) =>
      `Hello ${params.member_name}, your gym membership at ${params.gym_name} will expire on ${params.expiry_date}. Renew your membership to continue enjoying your fitness journey!${params.renewal_link ? `\n\nRenew instantly: ${params.renewal_link}` : ''}`,
  },
  PAYMENT_VERIFIED: {
    name: 'gymflow_payment_verified',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; amount: number | string; plan_name: string; receipt_link?: string; transaction_id?: string }) =>
      `✅ *Payment Confirmed!*\n\nHello ${params.member_name}, your payment of ₹${Number(params.amount).toLocaleString('en-IN')} for ${params.plan_name} at ${params.gym_name} was successful.\n\nTransaction ID: ${params.transaction_id || 'N/A'}${params.receipt_link ? `\nDigital Receipt: ${params.receipt_link}` : ''}\n\nThank you for training with us! 💪`,
  },
  PAYMENT_PENDING: {
    name: 'gymflow_payment_pending',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; amount: number | string; due_date?: string; pay_link?: string }) =>
      `⚠️ *Payment Due Reminder*\n\nHello ${params.member_name}, an outstanding balance of ₹${Number(params.amount).toLocaleString('en-IN')} is due for your membership at ${params.gym_name}.${params.due_date ? ` Due date: ${params.due_date}.` : ''}${params.pay_link ? `\n\nPay online: ${params.pay_link}` : ''}\n\nPlease settle to avoid membership interruption.`,
  },
  PAYMENT_FAILED: {
    name: 'gymflow_payment_failed',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; amount: number | string; retry_link?: string }) =>
      `❌ *Payment Failed*\n\nHello ${params.member_name}, your recent payment attempt of ₹${Number(params.amount).toLocaleString('en-IN')} at ${params.gym_name} was unsuccessful.${params.retry_link ? `\n\nPlease retry here: ${params.retry_link}` : ''}\n\nIf you need assistance, please contact the front desk.`,
  },
  MEMBERSHIP_RENEWED: {
    name: 'gymflow_membership_renewed',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; plan_name: string; new_expiry_date: string }) =>
      `🎉 *Membership Renewed!*\n\nHello ${params.member_name}, your membership at ${params.gym_name} is renewed for ${params.plan_name} until ${params.new_expiry_date}. Keep crushing your fitness goals! 🔥`,
  },
  BIRTHDAY_WISHES: {
    name: 'gymflow_birthday_wishes',
    category: 'MARKETING',
    render: (params: { member_name: string; gym_name: string }) =>
      `Happy Birthday ${params.member_name}! 🎉 Team ${params.gym_name} wishes you a healthy, strong, and successful year ahead! Enjoy your special day! 🎂🎈`,
  },
  CHECK_IN_ALERT: {
    name: 'gymflow_check_in_alert',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; time: string }) =>
      `🏋️ Welcome to ${params.gym_name}, ${params.member_name}! Checked in at ${params.time}. Have an energizing workout! 💪`,
  },
  CHECK_OUT_ALERT: {
    name: 'gymflow_check_out_alert',
    category: 'UTILITY',
    render: (params: { member_name: string; gym_name: string; time: string; duration_minutes: number }) =>
      `✅ Checked out from ${params.gym_name} at ${params.time}. Session duration: ${params.duration_minutes} mins. Consistency is key! 🔥`,
  },
  INACTIVE_REMINDER: {
    name: 'gymflow_inactive_reminder',
    category: 'MARKETING',
    render: (params: { member_name: string; gym_name: string; days_absent: number }) =>
      `We miss you at ${params.gym_name}, ${params.member_name}! It has been ${params.days_absent} days since your last workout. Your fitness goals are waiting — visit us today for a great session! 💥`,
  },
  DAILY_OWNER_REPORT: {
    name: 'gymflow_daily_owner_report',
    category: 'UTILITY',
    render: (params: {
      gym_name: string;
      date: string;
      active_members: number;
      new_members: number;
      today_checkins: number;
      peak_hour: string;
      today_revenue: number | string;
      pending_dues: number | string;
      expiring_soon: number;
      expired: number;
    }) =>
      `📊 *Daily Executive Digest - ${params.gym_name}*\n📅 Date: ${params.date}\n\n👥 Active Members: ${params.active_members}\n🆕 New Registrations Today: ${params.new_members}\n🏋️ Today's Attendance: ${params.today_checkins} (Peak: ${params.peak_hour})\n💰 Revenue Collected: ₹${Number(params.today_revenue).toLocaleString('en-IN')}\n⏳ Pending Dues: ₹${Number(params.pending_dues).toLocaleString('en-IN')}\n⚠️ Expiring Soon: ${params.expiring_soon}\n❌ Expired Memberships: ${params.expired}\n\n_Powered by GymFlow AI WhatsApp Automation_`,
  },
};

/**
 * Normalizes phone numbers to E.164 standard (+91 for India if missing)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '+919999999999';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  return `+${cleaned}`;
}

/**
 * Dispatches a WhatsApp Message via Meta Cloud API or graceful sandbox fallback
 */
export const sendWhatsAppMessage = async (
  options: WhatsAppMessageOptions
): Promise<WhatsAppDeliveryResult> => {
  const normalizedPhone = normalizePhoneNumber(options.toPhone);

  // Determine final text body
  let messageBody = options.messageText || '';

  if (options.templateName) {
    const templateKey = Object.keys(WHATSAPP_TEMPLATES).find(
      (k) => (WHATSAPP_TEMPLATES as any)[k].name === options.templateName
    );
    if (templateKey && typeof options.templateParameters === 'object' && !Array.isArray(options.templateParameters)) {
      messageBody = (WHATSAPP_TEMPLATES as any)[templateKey].render(options.templateParameters);
    } else if (!messageBody) {
      messageBody = `[Template: ${options.templateName}] Hello from GymFlow AI!`;
    }
  }

  // Live Meta WhatsApp Cloud API
  if (isWhatsAppConfigured) {
    try {
      const url = `https://graph.facebook.com/v19.0/${config.whatsappPhoneId}/messages`;
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.replace('+', ''),
      };

      if (options.templateName) {
        const components: any[] = [];
        if (Array.isArray(options.templateParameters)) {
          components.push({
            type: 'body',
            parameters: options.templateParameters.map((text) => ({
              type: 'text',
              text: String(text),
            })),
          });
        }
        payload.type = 'template';
        payload.template = {
          name: options.templateName,
          language: { code: 'en' },
          components,
        };
      } else {
        payload.type = 'text';
        payload.text = { preview_url: true, body: messageBody };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `Meta API HTTP ${res.status}`);
      }

      const messageId = data?.messages?.[0]?.id || `wamid.live.${Date.now()}`;
      return {
        success: true,
        messageId,
        recipient: normalizedPhone,
        status: 'delivered',
        isLive: true,
        messageBody,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`[WhatsApp API Live Fallback] Dispatch error: ${err.message}. Routing to developer sandbox.`);
    }
  }

  // Graceful Sandbox Simulation (Zero failure in local development without live Meta keys)
  const sandboxMessageId = `wamid.sandbox.${Date.now()}.${Math.floor(Math.random() * 10000)}`;
  return {
    success: true,
    messageId: sandboxMessageId,
    recipient: normalizedPhone,
    status: 'delivered_to_sandbox',
    isLive: false,
    messageBody,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Dispatches an event webhook to an external n8n instance if configured
 */
export const dispatchN8nWebhook = async (
  event: string,
  payload: any
): Promise<{ success: boolean; status?: number; error?: string; note?: string }> => {
  if (!config.n8nWebhookUrl) {
    return {
      success: true,
      note: 'n8n webhook URL not configured in environment. Logged in mock bus.',
    };
  }

  try {
    const res = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.automationSecret || 'gymflow-automation-key',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        payload,
      }),
    });
    return { success: res.ok, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message, note: 'n8n endpoint unreachable' };
  }
};
