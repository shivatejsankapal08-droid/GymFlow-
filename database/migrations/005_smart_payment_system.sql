-- ==============================================================================
-- GYMFLOW AI - STEP 8: SMART PAYMENT MANAGEMENT SYSTEM MIGRATION
-- Migration 005: Enhanced Payments, Refunds, Allocations & Razorpay Integration
-- ==============================================================================

-- 1. ENHANCE PAYMENTS TABLE
ALTER TABLE IF EXISTS public.payments
    ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES public.member_memberships(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
    ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. CREATE PAYMENT_REFUNDS TABLE
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    refund_amount DECIMAL(10, 2) NOT NULL CHECK (refund_amount > 0),
    refund_reason TEXT NOT NULL,
    refund_status VARCHAR(50) NOT NULL DEFAULT 'processed',
    razorpay_refund_id VARCHAR(100),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CREATE PAYMENT_ALLOCATIONS TABLE (For partial payments and invoice reconciliation)
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.member_memberships(id) ON DELETE SET NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL CHECK (allocated_amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CREATE PROCESSED_WEBHOOK_EVENTS TABLE (Idempotency Protection)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    event_id VARCHAR(150) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload_summary TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PERFORMANCE & AUDIT INDEXES
CREATE INDEX IF NOT EXISTS idx_payments_gym_date ON public.payments(gym_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gym_member ON public.payments(gym_id, member_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON public.payments(gym_id, receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_gym ON public.payment_refunds(gym_id, payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_gym ON public.payment_allocations(gym_id, member_id);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- payment_refunds policies
DROP POLICY IF EXISTS "payment_refunds_tenant_isolation" ON public.payment_refunds;
CREATE POLICY "payment_refunds_tenant_isolation" ON public.payment_refunds
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- payment_allocations policies
DROP POLICY IF EXISTS "payment_allocations_tenant_isolation" ON public.payment_allocations;
CREATE POLICY "payment_allocations_tenant_isolation" ON public.payment_allocations
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- 7. ATOMIC TRANSACTION STORED PROCEDURE: RECORD SMART PAYMENT
CREATE OR REPLACE FUNCTION public.record_smart_payment(
    p_gym_id UUID,
    p_member_id UUID,
    p_amount DECIMAL,
    p_discount DECIMAL,
    p_payment_method VARCHAR,
    p_transaction_id VARCHAR,
    p_receipt_number VARCHAR,
    p_notes TEXT,
    p_recorded_by UUID,
    p_membership_id UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    payment_id UUID,
    final_amount DECIMAL,
    remaining_due DECIMAL,
    error_message TEXT
) AS $$
DECLARE
    v_payment_id UUID;
    v_final_amount DECIMAL;
    v_current_due DECIMAL;
    v_new_due DECIMAL;
    v_member_gym UUID;
BEGIN
    -- Multi-tenant verification
    SELECT gym_id, COALESCE(pending_due, 0) INTO v_member_gym, v_current_due
    FROM public.members
    WHERE id = p_member_id;

    IF v_member_gym IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 0::DECIMAL, 'Member record not found.'::TEXT;
        RETURN;
    END IF;

    IF v_member_gym != p_gym_id THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 0::DECIMAL, 'Cross-gym payment denied: Member belongs to another gym facility.'::TEXT;
        RETURN;
    END IF;

    -- Calculate final amount
    v_final_amount := GREATEST(0, p_amount - COALESCE(p_discount, 0));
    v_new_due := GREATEST(0, v_current_due - v_final_amount);

    -- Insert payment record
    INSERT INTO public.payments (
        gym_id,
        member_id,
        membership_id,
        receipt_number,
        transaction_id,
        amount,
        discount,
        final_amount,
        payment_method,
        payment_status,
        recorded_by,
        notes,
        payment_date
    ) VALUES (
        p_gym_id,
        p_member_id,
        p_membership_id,
        p_receipt_number,
        p_transaction_id,
        p_amount,
        COALESCE(p_discount, 0),
        v_final_amount,
        p_payment_method::payment_method,
        'completed',
        p_recorded_by,
        p_notes,
        now()
    ) RETURNING id INTO v_payment_id;

    -- Record allocation
    INSERT INTO public.payment_allocations (
        gym_id,
        payment_id,
        member_id,
        membership_id,
        allocated_amount,
        notes
    ) VALUES (
        p_gym_id,
        v_payment_id,
        p_member_id,
        p_membership_id,
        v_final_amount,
        p_notes
    );

    -- Update member pending due
    UPDATE public.members
    SET pending_due = v_new_due,
        status = CASE WHEN v_new_due = 0 AND status = 'expired' THEN 'active' ELSE status END,
        updated_at = now()
    WHERE id = p_member_id;

    RETURN QUERY SELECT TRUE, v_payment_id, v_final_amount, v_new_due, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ATOMIC REFUND PROCEDURE
CREATE OR REPLACE FUNCTION public.process_payment_refund(
    p_gym_id UUID,
    p_payment_id UUID,
    p_refund_amount DECIMAL,
    p_refund_reason TEXT,
    p_approved_by UUID,
    p_razorpay_refund_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    refund_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_refund_id UUID;
    v_pay_status payment_status;
    v_pay_gym UUID;
    v_pay_amount DECIMAL;
BEGIN
    -- Verify payment exists and belongs to gym
    SELECT gym_id, payment_status, final_amount INTO v_pay_gym, v_pay_status, v_pay_amount
    FROM public.payments
    WHERE id = p_payment_id;

    IF v_pay_gym IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Payment record not found.'::TEXT;
        RETURN;
    END IF;

    IF v_pay_gym != p_gym_id THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Cross-gym access denied: Payment belongs to another gym facility.'::TEXT;
        RETURN;
    END IF;

    IF v_pay_status != 'completed' THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Cannot refund non-completed transaction.'::TEXT;
        RETURN;
    END IF;

    IF p_refund_amount > v_pay_amount THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Refund amount cannot exceed final payment amount.'::TEXT;
        RETURN;
    END IF;

    -- Insert into payment_refunds
    INSERT INTO public.payment_refunds (
        gym_id,
        payment_id,
        refund_amount,
        refund_reason,
        refund_status,
        razorpay_refund_id,
        approved_by
    ) VALUES (
        p_gym_id,
        p_payment_id,
        p_refund_amount,
        p_refund_reason,
        'processed',
        p_razorpay_refund_id,
        p_approved_by
    ) RETURNING id INTO v_refund_id;

    -- Update payment status to refunded
    UPDATE public.payments
    SET payment_status = 'refunded',
        updated_at = now()
    WHERE id = p_payment_id;

    RETURN QUERY SELECT TRUE, v_refund_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
