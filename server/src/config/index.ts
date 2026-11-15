import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',

  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || 'https://demo-gymflow.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'demo-anon-key',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // OpenAI Configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // Razorpay Configuration
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // n8n & Automations
  automationSecret: process.env.GYMFLOW_AUTOMATION_SECRET || 'gymflow_secret_key_2026',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/gymflow-alerts',

  // WhatsApp Cloud API
  whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
};
