-- ==============================================================================
-- GYMFLOW AI - Migration 002: Multi-Gym SaaS Architecture
-- Tagline: Smart Gym Management. Powered by AI.
-- Adds: saas_plans, saas_subscriptions, updates gym_memberships, gyms, gym_invitations,
-- multi-gym RLS policies, atomic registration & invitation acceptance procedures.
-- ==============================================================================

-- 1. Add city, state, country to gyms if missing
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';

-- 2. Enhance gym_memberships (Application-User access to gyms with gym-specific roles)
-- If gym_memberships was created with plan_name, make those nullable/safe and add user_id & role
ALTER TABLE public.gym_memberships ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.gym_memberships ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'member';
ALTER TABLE public.gym_memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add unique constraint on (gym_id, user_id)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_gym_user_membership'
    ) THEN
        ALTER TABLE public.gym_memberships ADD CONSTRAINT unique_gym_user_membership UNIQUE (gym_id, user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Create SAAS_PLANS Table (GymFlow AI subscription tiers for gyms)
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_annual DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    member_limit INT NOT NULL DEFAULT 50,
    trainer_limit INT NOT NULL DEFAULT 2,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create SAAS_SUBSCRIPTIONS Table (Each gym's SaaS contract with GymFlow AI)
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.saas_plans(id) ON DELETE SET NULL,
    plan_code VARCHAR(50) NOT NULL DEFAULT 'trial',
    status subscription_status NOT NULL DEFAULT 'trialing',
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    trial_ends_at DATE,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- Kept pending until configured and verified
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_gym_saas_subscription UNIQUE (gym_id)
);

-- 5. Enhance gym_invitations
ALTER TABLE public.gym_invitations ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. Attach updated_at triggers
DO $$ BEGIN
    DROP TRIGGER IF EXISTS trigger_saas_plans_updated_at ON public.saas_plans;
    CREATE TRIGGER trigger_saas_plans_updated_at BEFORE UPDATE ON public.saas_plans FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_saas_subscriptions_updated_at ON public.saas_subscriptions;
    CREATE TRIGGER trigger_saas_subscriptions_updated_at BEFORE UPDATE ON public.saas_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
END $$;

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gym_memberships_user_id ON public.gym_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_role ON public.gym_memberships(role);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_gym_id ON public.saas_subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_status ON public.saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_saas_plans_code ON public.saas_plans(plan_code);

-- 8. Seed standard SaaS Plans
INSERT INTO public.saas_plans (id, plan_code, name, price_monthly, price_annual, member_limit, trainer_limit, features)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'trial',
        'Free Trial (14 Days)',
        0.00,
        0.00,
        50,
        2,
        '["Full Dashboard Access", "QR Code Attendance", "Up to 50 Members", "2 Trainer Accounts", "WhatsApp Reminders (Demo)"]'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'basic',
        'Basic',
        1999.00,
        19990.00,
        150,
        5,
        '["Full Member Management", "QR Attendance", "Razorpay Integration", "WhatsApp Notifications", "Basic Financial Reports"]'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'professional',
        'Professional',
        4999.00,
        49990.00,
        500,
        20,
        '["Everything in Basic", "AI Fitness Assistant", "AI Business Insights", "n8n Automated Workflows", "Trainer Commission Tracking", "Advanced Analytics"]'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'enterprise',
        'Enterprise',
        12999.00,
        129990.00,
        5000,
        100,
        '["Multi-branch Management", "Dedicated Support", "Unlimited AI Inquiries", "Custom WhatsApp Templates", "Priority Server SLA", "Custom Integrations"]'::jsonb
    )
ON CONFLICT (plan_code) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_annual = EXCLUDED.price_annual,
    member_limit = EXCLUDED.member_limit,
    trainer_limit = EXCLUDED.trainer_limit,
    features = EXCLUDED.features;

-- 9. Helper Function: Check if user has active authorized access to a gym
CREATE OR REPLACE FUNCTION public.user_has_gym_access(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role::VARCHAR INTO v_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    
    -- Super Admin has access to all gyms
    IF v_role = 'super_admin' THEN
        RETURN true;
    END IF;

    -- Gym owner check
    IF EXISTS (SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()) THEN
        RETURN true;
    END IF;

    -- Active membership / staff check
    IF EXISTS (
        SELECT 1 FROM public.gym_memberships 
        WHERE gym_id = p_gym_id AND user_id = auth.uid() AND is_active = true
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10. Helper Function: Get user's role in a specific gym
CREATE OR REPLACE FUNCTION public.get_user_gym_role(p_gym_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_role VARCHAR;
    v_gym_role VARCHAR;
BEGIN
    SELECT role::VARCHAR INTO v_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    IF v_role = 'super_admin' THEN
        RETURN 'super_admin';
    END IF;

    IF EXISTS (SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()) THEN
        RETURN 'gym_owner';
    END IF;

    SELECT role::VARCHAR INTO v_gym_role 
    FROM public.gym_memberships 
    WHERE gym_id = p_gym_id AND user_id = auth.uid() AND is_active = true 
    LIMIT 1;

    RETURN COALESCE(v_gym_role, 'member');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 11. Atomic Stored Procedure: Register Gym with Owner & Trial Subscription
CREATE OR REPLACE FUNCTION public.register_gym_with_owner(
    p_user_id UUID,
    p_full_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_gym_name VARCHAR,
    p_address TEXT,
    p_city VARCHAR,
    p_state VARCHAR DEFAULT NULL,
    p_country VARCHAR DEFAULT 'India',
    p_plan_code VARCHAR DEFAULT 'trial'
)
RETURNS JSONB AS $$
DECLARE
    v_gym_id UUID;
    v_plan_id UUID;
    v_sub_id UUID;
    v_trial_days INT := 14;
BEGIN
    -- 1. Insert or update user profile with gym_owner role
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (p_user_id, p_full_name, p_email, p_phone, 'gym_owner')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        role = 'gym_owner';

    -- 2. Insert new gym record
    INSERT INTO public.gyms (gym_name, owner_id, email, phone, address, city, state, country, status)
    VALUES (p_gym_name, p_user_id, p_email, p_phone, p_address, p_city, p_state, p_country, 'active')
    RETURNING id INTO v_gym_id;

    -- 3. Associate owner in gym_memberships table
    INSERT INTO public.gym_memberships (gym_id, user_id, role, is_active)
    VALUES (v_gym_id, p_user_id, 'gym_owner', true)
    ON CONFLICT (gym_id, user_id) DO UPDATE SET is_active = true, role = 'gym_owner';

    -- 4. Update profile active gym reference
    UPDATE public.profiles SET gym_id = v_gym_id WHERE id = p_user_id;

    -- 5. Find SaaS plan
    SELECT id INTO v_plan_id FROM public.saas_plans WHERE plan_code = p_plan_code LIMIT 1;
    IF v_plan_id IS NULL THEN
        SELECT id INTO v_plan_id FROM public.saas_plans WHERE plan_code = 'trial' LIMIT 1;
    END IF;

    -- 6. Create 14-day SaaS subscription (status: trialing, payment_status: pending)
    INSERT INTO public.saas_subscriptions (
        gym_id, plan_id, plan_code, status, billing_cycle,
        start_date, end_date, trial_ends_at, payment_status
    )
    VALUES (
        v_gym_id,
        v_plan_id,
        p_plan_code,
        'trialing',
        'monthly',
        CURRENT_DATE,
        CURRENT_DATE + (v_trial_days || ' days')::INTERVAL,
        CURRENT_DATE + (v_trial_days || ' days')::INTERVAL,
        'pending'
    )
    RETURNING id INTO v_sub_id;

    -- 7. Write audit log
    INSERT INTO public.audit_logs (gym_id, user_id, action, entity_type, entity_id)
    VALUES (v_gym_id, p_user_id, 'REGISTER_GYM', 'gyms', v_gym_id);

    RETURN jsonb_build_object(
        'success', true,
        'gym_id', v_gym_id,
        'owner_id', p_user_id,
        'gym_name', p_gym_name,
        'subscription_id', v_sub_id,
        'trial_ends_at', CURRENT_DATE + (v_trial_days || ' days')::INTERVAL
    );
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Atomic Stored Procedure: Accept Gym Invitation
CREATE OR REPLACE FUNCTION public.accept_gym_invitation(
    p_user_id UUID,
    p_token_hash VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- 1. Validate invitation token
    SELECT * INTO v_invitation
    FROM public.gym_invitations
    WHERE invitation_token_hash = p_token_hash
      AND accepted_at IS NULL
      AND expires_at > now()
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;

    -- 2. Insert into gym_memberships
    INSERT INTO public.gym_memberships (gym_id, user_id, role, is_active)
    VALUES (v_invitation.gym_id, p_user_id, v_invitation.role, true)
    ON CONFLICT (gym_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true;

    -- 3. Set gym_id in profile if not already set
    UPDATE public.profiles
    SET gym_id = v_invitation.gym_id,
        role = CASE WHEN role = 'member' THEN v_invitation.role ELSE role END
    WHERE id = p_user_id;

    -- 4. Mark invitation as accepted
    UPDATE public.gym_invitations
    SET accepted_at = now()
    WHERE id = v_invitation.id;

    -- 5. Audit log
    INSERT INTO public.audit_logs (gym_id, user_id, action, entity_type, entity_id)
    VALUES (v_invitation.gym_id, p_user_id, 'ACCEPT_INVITATION', 'gym_invitations', v_invitation.id);

    RETURN jsonb_build_object(
        'success', true,
        'gym_id', v_invitation.gym_id,
        'role', v_invitation.role,
        'message', 'Successfully joined gym team'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Enable RLS on SAAS_PLANS & SAAS_SUBSCRIPTIONS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- SAAS_PLANS: Anyone authenticated can view plans; only super_admin can modify
DROP POLICY IF EXISTS "Anyone can view SaaS plans" ON public.saas_plans;
CREATE POLICY "Anyone can view SaaS plans" ON public.saas_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admin can modify SaaS plans" ON public.saas_plans;
CREATE POLICY "Super admin can modify SaaS plans" ON public.saas_plans FOR ALL
USING (public.current_user_role() = 'super_admin');

-- SAAS_SUBSCRIPTIONS: Super Admin has full access; gym owner has access to own gym's subscription
DROP POLICY IF EXISTS "SaaS subscriptions access" ON public.saas_subscriptions;
CREATE POLICY "SaaS subscriptions access" ON public.saas_subscriptions FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR public.user_has_gym_access(gym_id)
);
