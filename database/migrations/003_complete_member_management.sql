-- ==============================================================================
-- GYMFLOW AI: MIGRATION 003 - COMPLETE MEMBER MANAGEMENT SYSTEM
-- Tables: member_memberships (History & Renewals), member_documents
-- Updates: members (medical_notes, avatar_url), membership_plans (benefits)
-- Stored Procedures: renew_member_membership
-- RLS Policies & Performance Indexes
-- ==============================================================================

-- 1. Ensure members table has all required clinical & demographic columns
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS medical_notes TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
    ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(255) DEFAULT 'General Fitness';

-- 2. Ensure membership_plans has benefits/features jsonb
ALTER TABLE public.membership_plans
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- 3. CUSTOMER MEMBERSHIPS & RENEWAL CONTRACTS HISTORY
-- Note: 'gym_memberships' stores application-user gym access.
-- 'member_memberships' stores customer/athlete subscription contracts and historical renewals.
CREATE TABLE IF NOT EXISTS public.member_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    plan_name VARCHAR(150) NOT NULL,
    duration_months INT NOT NULL CHECK (duration_months > 0),
    original_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'completed',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'upi',
    is_renewal BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. MEMBER DOCUMENTS (Waivers, ID Proofs, Medical Clearances)
CREATE TABLE IF NOT EXISTS public.member_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL DEFAULT 'id_proof',
    document_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. PERFORMANCE & SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_members_qr_token ON public.members(qr_token);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_code ON public.members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_gym_status ON public.members(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_members_expiry ON public.members(gym_id, expiry_date);

CREATE INDEX IF NOT EXISTS idx_member_memberships_gym_id ON public.member_memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_member_id ON public.member_memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_plan_id ON public.member_memberships(plan_id);

CREATE INDEX IF NOT EXISTS idx_member_documents_gym_id ON public.member_documents(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_documents_member_id ON public.member_documents(member_id);

-- 6. ATOMIC MEMBERSHIP RENEWAL STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.renew_member_membership(
    p_gym_id UUID,
    p_member_id UUID,
    p_plan_id UUID,
    p_discount DECIMAL DEFAULT 0.00,
    p_payment_method VARCHAR DEFAULT 'upi',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan RECORD;
    v_member RECORD;
    v_new_start_date DATE;
    v_new_end_date DATE;
    v_final_price DECIMAL(10, 2);
    v_contract_id UUID;
    v_payment_id UUID;
BEGIN
    -- Validate Plan
    SELECT * INTO v_plan FROM public.membership_plans
    WHERE id = p_plan_id AND gym_id = p_gym_id AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membership plan not found or is inactive for this gym.';
    END IF;

    -- Validate Member
    SELECT * INTO v_member FROM public.members
    WHERE id = p_member_id AND gym_id = p_gym_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member not found in this gym.';
    END IF;

    -- Calculate New Validity Dates
    -- If current expiry > today, extend from current expiry; otherwise start from today
    IF v_member.expiry_date >= CURRENT_DATE THEN
        v_new_start_date := v_member.expiry_date;
    ELSE
        v_new_start_date := CURRENT_DATE;
    END IF;

    v_new_end_date := v_new_start_date + (v_plan.duration_months || ' months')::interval;
    v_final_price := GREATEST(0.00, v_plan.price - COALESCE(p_discount, 0.00));

    -- Insert Membership Contract History Record
    INSERT INTO public.member_memberships (
        gym_id,
        member_id,
        plan_id,
        plan_name,
        duration_months,
        original_price,
        discount_amount,
        final_price,
        start_date,
        end_date,
        payment_status,
        payment_method,
        is_renewal,
        notes
    ) VALUES (
        p_gym_id,
        p_member_id,
        v_plan.id,
        v_plan.plan_name,
        v_plan.duration_months,
        v_plan.price,
        COALESCE(p_discount, 0.00),
        v_final_price,
        v_new_start_date,
        v_new_end_date,
        'completed',
        p_payment_method,
        true,
        p_notes
    ) RETURNING id INTO v_contract_id;

    -- Insert Payment Transaction Record
    INSERT INTO public.payments (
        gym_id,
        member_id,
        amount,
        payment_method,
        transaction_id,
        payment_status,
        payment_date
    ) VALUES (
        p_gym_id,
        p_member_id,
        v_final_price,
        p_payment_method::payment_method,
        'RNW-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8),
        'completed',
        now()
    ) RETURNING id INTO v_payment_id;

    -- Update Member Active Expiry Date and Status
    UPDATE public.members
    SET membership_plan_id = v_plan.id,
        expiry_date = v_new_end_date,
        status = 'active',
        updated_at = now()
    WHERE id = p_member_id;

    -- Log Audit Trail
    INSERT INTO public.audit_logs (
        gym_id,
        action,
        entity_type,
        entity_id,
        created_at
    ) VALUES (
        p_gym_id,
        'MEMBER_RENEWAL',
        'members',
        p_member_id,
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'member_id', p_member_id,
        'contract_id', v_contract_id,
        'payment_id', v_payment_id,
        'new_expiry_date', v_new_end_date,
        'plan_name', v_plan.plan_name,
        'amount_paid', v_final_price
    );
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.member_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Member Memberships Isolation" ON public.member_memberships;
CREATE POLICY "Tenant Member Memberships Isolation"
ON public.member_memberships
FOR ALL
USING (public.user_has_gym_access(gym_id))
WITH CHECK (public.user_has_gym_access(gym_id));

DROP POLICY IF EXISTS "Tenant Member Documents Isolation" ON public.member_documents;
CREATE POLICY "Tenant Member Documents Isolation"
ON public.member_documents
FOR ALL
USING (public.user_has_gym_access(gym_id))
WITH CHECK (public.user_has_gym_access(gym_id));
