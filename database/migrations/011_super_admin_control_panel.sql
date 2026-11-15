-- ==============================================================================
-- GYMFLOW AI - STEP 14: SUPER ADMIN CONTROL PANEL MIGRATION
-- Migration 011: Enterprise Super Admin tables, SaaS subscriptions, transactions,
-- support tickets, announcements, and audit logging
-- ==============================================================================

-- 1. SaaS Plans Table (Enterprise SaaS Catalog)
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_annual NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  billing_interval VARCHAR(20) DEFAULT 'monthly',
  max_gyms INT DEFAULT 1,
  max_members INT NOT NULL DEFAULT 50,
  max_trainers INT NOT NULL DEFAULT 2,
  feature_limits JSONB DEFAULT '{}'::jsonb,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SaaS Subscriptions Table (Gym Tenant Level Subscriptions)
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.saas_plans(id),
  plan_code VARCHAR(50) NOT NULL DEFAULT 'trial',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trial_end_date DATE,
  trial_ends_at TIMESTAMPTZ,
  renewal_date DATE,
  end_date DATE,
  cancellation_date DATE,
  payment_status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Transactions Table (SaaS subscription billing)
CREATE TABLE IF NOT EXISTS public.platform_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.saas_subscriptions(id) ON DELETE SET NULL,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'completed',
  payment_method VARCHAR(50) DEFAULT 'razorpay',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open', -- open, in_progress, waiting_for_response, resolved, closed
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all', -- all, gym_owners, trainers, members, trial_users
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal, important, critical
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite Indexes for High Performance Super Admin Telemetry
CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);
