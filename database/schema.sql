-- ==============================================================================
-- GYMFLOW AI - Multi-Tenant Supabase / PostgreSQL Database Schema
-- Tagline: Smart Gym Management. Powered by AI.
-- Complete 13-Table Architecture with RLS, ENUMs, Indexes, Triggers & Transactions
-- ==============================================================================

-- Enable UUID extension and cryptographic utilities
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. POSTGRESQL ENUMS & TYPES
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'gym_owner', 'trainer', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE gym_status AS ENUM ('active', 'trialing', 'past_due', 'suspended', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'expired', 'paused', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('active', 'expiring_soon', 'expired', 'frozen');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('completed', 'pending', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('razorpay', 'upi', 'cash', 'card', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('expiry_reminder', 'payment_receipt', 'welcome', 'system', 'alert', 'workout_assigned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'annual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 2. REUSABLE UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLE DEFINITIONS (All 13 Tables)
-- ==============================================================================

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. GYMS (Tenant entity)
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    logo_url TEXT,
    status gym_status NOT NULL DEFAULT 'trialing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Add optional gym_id reference back to profiles after gyms exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL;

-- 3. GYM_MEMBERSHIPS (Connects application users to gyms and stores their gym-specific roles)
CREATE TABLE IF NOT EXISTS public.gym_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    plan_name VARCHAR(100),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status membership_status DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_gym_user_membership UNIQUE (gym_id, user_id)
);

-- 4. GYM_INVITATIONS (Staff and trainer onboarding invitations)
CREATE TABLE IF NOT EXISTS public.gym_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'trainer',
    invitation_token_hash VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. MEMBERSHIP_PLANS (Tier configuration by gym owner)
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL CHECK (duration_months > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_gym_plan_name UNIQUE (gym_id, plan_name)
);

-- 6. TRAINERS (Coaching staff)
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    trainer_code VARCHAR(50),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    address TEXT,
    emergency_contact VARCHAR(100),
    specialization VARCHAR(150) NOT NULL,
    experience VARCHAR(100) DEFAULT '3+ years',
    certifications TEXT,
    skills TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
    employment_status VARCHAR(50) DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    salary_type VARCHAR(50) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly', 'commission', 'hybrid')),
    salary DECIMAL(10, 2) DEFAULT 35000.00,
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    commission_rate DECIMAL(5, 2) DEFAULT 0.00,
    payment_frequency VARCHAR(50) DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'bi_weekly', 'weekly')),
    availability VARCHAR(100) DEFAULT '06:00 AM - 02:00 PM',
    rating DECIMAL(3, 2) DEFAULT 4.90,
    max_clients INT DEFAULT 25,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 6b. TRAINER MEMBER ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.trainer_member_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'reassigned', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6c. TRAINING SESSIONS (Daily/Weekly/Monthly Schedule)
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    session_title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    training_type VARCHAR(100) NOT NULL DEFAULT 'Strength & Conditioning',
    session_status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_session_times CHECK (end_time > start_time)
);

-- 6d. TRAINER ATTENDANCE
CREATE TABLE IF NOT EXISTS public.trainer_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ,
    working_hours DECIMAL(5, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'present', 'half_day', 'late', 'absent')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6b. TRAINER SALARY RECORDS (Detailed Historical Ledger)
CREATE TABLE IF NOT EXISTS public.trainer_salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    salary_period VARCHAR(20) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'processing')),
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6c. TRAINER FEEDBACK & RATINGS (Athlete Evaluation & Reviews)
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6e. TRAINER SALARIES & PAYROLL
CREATE TABLE IF NOT EXISTS public.trainer_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    salary_month VARCHAR(20) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10, 2) DEFAULT 0.00,
    bonus_amount DECIMAL(10, 2) DEFAULT 0.00,
    deductions DECIMAL(10, 2) DEFAULT 0.00,
    net_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'processing')),
    paid_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6b. TRAINER SALARY RECORDS (Detailed Historical Ledger)
CREATE TABLE IF NOT EXISTS public.trainer_salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    salary_period VARCHAR(20) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'processing')),
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6c. TRAINER FEEDBACK & RATINGS (Athlete Evaluation & Reviews)
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. MEMBERS (Athletes registered at the gym)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    address TEXT,
    emergency_contact VARCHAR(100),
    membership_plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    assigned_trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
    member_code VARCHAR(50),
    qr_token VARCHAR(255),
    fitness_goal VARCHAR(255),
    medical_notes TEXT,
    avatar_url TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status member_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_gym_member_email UNIQUE (gym_id, email)
);

-- 7b. MEMBER_MEMBERSHIPS (Historical contracts & renewal tracking)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7c. MEMBER_DOCUMENTS (Waivers, ID Proofs, Medical Clearances)
CREATE TABLE IF NOT EXISTS public.member_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL DEFAULT 'id_proof',
    document_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PAYMENTS (Transactions, Razorpay, UPI, & cash reconciliations)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.member_memberships(id) ON DELETE SET NULL,
    receipt_number VARCHAR(100),
    transaction_id VARCHAR(150) NOT NULL,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'upi',
    payment_status payment_status NOT NULL DEFAULT 'completed',
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_gym_transaction UNIQUE (gym_id, transaction_id)
);

-- 8b. PAYMENT_REFUNDS (Refund requests & audit tracking)
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

-- 8c. PAYMENT_ALLOCATIONS (Partial payment allocation & invoice tracking)
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

-- 6b. TRAINER SALARY RECORDS (Detailed Historical Ledger)
CREATE TABLE IF NOT EXISTS public.trainer_salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    salary_period VARCHAR(20) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'processing')),
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6c. TRAINER FEEDBACK & RATINGS (Athlete Evaluation & Reviews)
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ATTENDANCE (Turnstile & QR scanner daily records)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out TIMESTAMPTZ,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    verification_method VARCHAR(50) NOT NULL DEFAULT 'qr_scanner',
    status VARCHAR(50) NOT NULL DEFAULT 'checked_in',
    duration_minutes INT,
    recorded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_by_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6b. TRAINER SALARY RECORDS (Detailed Historical Ledger)
CREATE TABLE IF NOT EXISTS public.trainer_salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    salary_period VARCHAR(20) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'processing')),
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6c. TRAINER FEEDBACK & RATINGS (Athlete Evaluation & Reviews)
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. WORKOUT_PLANS (Custom strength splits & exercise protocols)
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 11. NOTIFICATIONS (WhatsApp alerts, reminders, & receipts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. SAAS_PLANS & SAAS_SUBSCRIPTIONS (GymFlow AI SaaS Packages & Tenant Subscriptions)
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
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_gym_saas_subscription UNIQUE (gym_id)
);

-- Legacy/alias table for backward compatibility
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'pro',
    price DECIMAL(10, 2) NOT NULL DEFAULT 4999.00,
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    status subscription_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. AUDIT_LOGS (System-wide action audit trail for compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. ATTACH UPDATED_AT TRIGGERS
-- ==============================================================================

DO $$ BEGIN
    DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
    CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_gyms_updated_at ON public.gyms;
    CREATE TRIGGER trigger_gyms_updated_at BEFORE UPDATE ON public.gyms FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_gym_memberships_updated_at ON public.gym_memberships;
    CREATE TRIGGER trigger_gym_memberships_updated_at BEFORE UPDATE ON public.gym_memberships FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_membership_plans_updated_at ON public.membership_plans;
    CREATE TRIGGER trigger_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_trainers_updated_at ON public.trainers;
    CREATE TRIGGER trigger_trainers_updated_at BEFORE UPDATE ON public.trainers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_members_updated_at ON public.members;
    CREATE TRIGGER trigger_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
    CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_workout_plans_updated_at ON public.workout_plans;
    CREATE TRIGGER trigger_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

    DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
    CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
END $$;

-- ==============================================================================
-- 5. PERFORMANCE INDEXES (High-Frequency Search Columns & Multi-Tenancy)
-- ==============================================================================

-- Profiles & Gyms
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_gym_id ON public.profiles(gym_id);
CREATE INDEX IF NOT EXISTS idx_gyms_owner_id ON public.gyms(owner_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON public.gyms(status);

-- Memberships & Invitations
CREATE INDEX IF NOT EXISTS idx_gym_memberships_gym_id ON public.gym_memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_invitations_gym_id ON public.gym_invitations(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_invitations_token ON public.gym_invitations(invitation_token_hash);

-- Plans, Trainers & Members
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON public.membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON public.trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON public.members(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_expiry_date ON public.members(expiry_date);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);

-- Payments & Attendance
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON public.payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_id ON public.attendance(gym_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);

-- Workouts, Notifications, Subscriptions & Audit
CREATE INDEX IF NOT EXISTS idx_workout_plans_gym_id ON public.workout_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_member_id ON public.workout_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_gym_id ON public.notifications(gym_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gym_id ON public.subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_id ON public.audit_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 6. MULTI-STEP DATABASE TRANSACTIONS & STORED PROCEDURES
-- ==============================================================================

-- Stored Procedure: Atomic Gym Owner + Gym Registration with SaaS Trial
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
    -- 1. Insert or update user profile
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

    -- 3. Associate gym_id back into owner profile
    UPDATE public.profiles SET gym_id = v_gym_id WHERE id = p_user_id;

    -- 4. Associate owner in gym_memberships table
    INSERT INTO public.gym_memberships (gym_id, user_id, role, is_active)
    VALUES (v_gym_id, p_user_id, 'gym_owner', true)
    ON CONFLICT (gym_id, user_id) DO UPDATE SET is_active = true, role = 'gym_owner';

    -- 5. Find SaaS plan
    SELECT id INTO v_plan_id FROM public.saas_plans WHERE plan_code = p_plan_code LIMIT 1;
    IF v_plan_id IS NULL THEN
        SELECT id INTO v_plan_id FROM public.saas_plans WHERE plan_code = 'trial' LIMIT 1;
    END IF;

    -- 6. Create 14-day SaaS trial subscription (payment marked pending until verified)
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

    -- 7. Legacy subscriptions mirror
    INSERT INTO public.subscriptions (gym_id, plan_name, price, billing_cycle, status, start_date, end_date)
    VALUES (v_gym_id, p_plan_code, 0.00, 'monthly', 'trialing', CURRENT_DATE, CURRENT_DATE + (v_trial_days || ' days')::INTERVAL);

    -- 8. Record audit log
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

-- ==============================================================================
-- STEP 14: SUPER ADMIN CONTROL PANEL (Migration 011)
-- ==============================================================================

-- 1. Platform Transactions Table (SaaS subscription billing)
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

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open',
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);


-- Stored Procedure: Atomic Accept Gym Team Invitation
CREATE OR REPLACE FUNCTION public.accept_gym_invitation(
    p_user_id UUID,
    p_token_hash VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT * INTO v_invitation
    FROM public.gym_invitations
    WHERE invitation_token_hash = p_token_hash
      AND accepted_at IS NULL
      AND expires_at > now()
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;

    -- Associate in gym_memberships
    INSERT INTO public.gym_memberships (gym_id, user_id, role, is_active)
    VALUES (v_invitation.gym_id, p_user_id, v_invitation.role, true)
    ON CONFLICT (gym_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true;

    -- Update user profile
    UPDATE public.profiles
    SET gym_id = v_invitation.gym_id,
        role = CASE WHEN role = 'member' THEN v_invitation.role ELSE role END
    WHERE id = p_user_id;

    -- Mark accepted
    UPDATE public.gym_invitations
    SET accepted_at = now()
    WHERE id = v_invitation.id;

    -- Audit log
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

-- ==============================================================================
-- STEP 14: SUPER ADMIN CONTROL PANEL (Migration 011)
-- ==============================================================================

-- 1. Platform Transactions Table (SaaS subscription billing)
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

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open',
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);


-- Stored Procedure: Atomic Member Payment & Renewal
CREATE OR REPLACE FUNCTION public.record_member_payment_transaction(
    p_gym_id UUID,
    p_member_id UUID,
    p_amount DECIMAL,
    p_payment_method payment_method,
    p_transaction_id VARCHAR,
    p_duration_months INT
)
RETURNS JSONB AS $$
DECLARE
    v_payment_id UUID;
    v_new_expiry DATE;
BEGIN
    -- 1. Insert payment record
    INSERT INTO public.payments (gym_id, member_id, amount, payment_method, transaction_id, payment_status, payment_date)
    VALUES (p_gym_id, p_member_id, p_amount, p_payment_method, p_transaction_id, 'completed', now())
    RETURNING id INTO v_payment_id;

    -- 2. Extend member expiry date
    UPDATE public.members
    SET 
        expiry_date = GREATEST(expiry_date, CURRENT_DATE) + (p_duration_months || ' months')::INTERVAL,
        status = 'active'
    WHERE id = p_member_id AND gym_id = p_gym_id
    RETURNING expiry_date INTO v_new_expiry;

    -- 3. Create in-app payment receipt notification
    INSERT INTO public.notifications (gym_id, member_id, title, message, notification_type)
    VALUES (
        p_gym_id,
        p_member_id,
        'Payment Confirmed (₹' || p_amount || ')',
        'Membership renewed successfully. New expiry date: ' || v_new_expiry,
        'payment_receipt'
    );

    -- 4. Record audit trail
    INSERT INTO public.audit_logs (gym_id, action, entity_type, entity_id)
    VALUES (p_gym_id, 'COLLECT_PAYMENT', 'payments', v_payment_id);

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'new_expiry_date', v_new_expiry
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- STEP 14: SUPER ADMIN CONTROL PANEL (Migration 011)
-- ==============================================================================

-- 1. Platform Transactions Table (SaaS subscription billing)
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

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open',
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);


-- Stored Procedure: Atomic Smart Attendance Check-in
CREATE OR REPLACE FUNCTION public.record_attendance_check_in(
  p_gym_id UUID,
  p_member_id UUID,
  p_method VARCHAR DEFAULT 'qr_scanner',
  p_staff_id UUID DEFAULT NULL,
  p_staff_name VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_member RECORD;
  v_active_log RECORD;
  v_attendance_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Verify Member belongs to this gym
  SELECT * INTO v_member FROM public.members WHERE id = p_member_id AND gym_id = p_gym_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'Member not found or not registered at this gym.');
  END IF;

  -- 2. Verify Member validity
  IF v_member.status = 'expired' OR v_member.expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'code', 'MEMBERSHIP_EXPIRED', 'error', 'Check-in Blocked: Membership expired. Please renew plan.');
  END IF;
  IF v_member.status = 'suspended' THEN
    RETURN jsonb_build_object('success', false, 'code', 'MEMBERSHIP_SUSPENDED', 'error', 'Check-in Blocked: Membership is suspended.');
  END IF;

  -- 3. Prevent Duplicate Check-in
  SELECT * INTO v_active_log FROM public.attendance
  WHERE gym_id = p_gym_id AND member_id = p_member_id AND status = 'checked_in' AND check_out IS NULL LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ALREADY_CHECKED_IN', 'error', 'Duplicate Check-in Blocked: Member is currently inside gym.');
  END IF;

  -- 4. Record Check-in
  INSERT INTO public.attendance (
    gym_id, member_id, check_in, attendance_date, verification_method, status, recorded_by_id, recorded_by_name, notes
  ) VALUES (
    p_gym_id, p_member_id, v_now, CURRENT_DATE, COALESCE(p_method, 'qr_scanner'), 'checked_in', p_staff_id, p_staff_name, p_notes
  ) RETURNING id INTO v_attendance_id;

  -- 5. Update Member Stats
  UPDATE public.members SET total_check_ins = COALESCE(total_check_ins, 0) + 1, last_check_in = v_now WHERE id = p_member_id;

  RETURN jsonb_build_object('success', true, 'action', 'check_in', 'attendance_id', v_attendance_id, 'check_in_time', v_now);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- STEP 14: SUPER ADMIN CONTROL PANEL (Migration 011)
-- ==============================================================================

-- 1. Platform Transactions Table (SaaS subscription billing)
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

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open',
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);


-- Stored Procedure: Atomic Smart Attendance Check-out
CREATE OR REPLACE FUNCTION public.record_attendance_check_out(
  p_gym_id UUID,
  p_member_id UUID,
  p_attendance_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL,
  p_staff_name VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_member RECORD;
  v_log RECORD;
  v_now TIMESTAMPTZ := now();
  v_duration_min INT;
BEGIN
  SELECT * INTO v_member FROM public.members WHERE id = p_member_id AND gym_id = p_gym_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'MEMBER_NOT_FOUND', 'error', 'Member not found.');
  END IF;

  IF p_attendance_id IS NOT NULL THEN
    SELECT * INTO v_log FROM public.attendance WHERE id = p_attendance_id AND gym_id = p_gym_id AND member_id = p_member_id FOR UPDATE;
  ELSE
    SELECT * INTO v_log FROM public.attendance WHERE gym_id = p_gym_id AND member_id = p_member_id AND status = 'checked_in' AND check_out IS NULL ORDER BY check_in DESC LIMIT 1 FOR UPDATE;
  END IF;

  IF NOT FOUND OR v_log.status = 'checked_out' THEN
    RETURN jsonb_build_object('success', false, 'code', 'NO_ACTIVE_CHECKIN', 'error', 'Check-out Blocked: No active check-in found for this member.');
  END IF;

  v_duration_min := GREATEST(1, ROUND(EXTRACT(EPOCH FROM (v_now - v_log.check_in)) / 60));

  UPDATE public.attendance
  SET check_out = v_now, duration_minutes = v_duration_min, status = 'checked_out', notes = COALESCE(p_notes, notes)
  WHERE id = v_log.id;

  RETURN jsonb_build_object('success', true, 'action', 'check_out', 'attendance_id', v_log.id, 'duration_minutes', v_duration_min);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- STEP 14: SUPER ADMIN CONTROL PANEL (Migration 011)
-- ==============================================================================

-- 1. Platform Transactions Table (SaaS subscription billing)
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

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open',
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);


-- ==============================================================================
-- 7. MULTI-TENANT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 13 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions to extract role & gym context from caller session
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role::VARCHAR FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_gym_id()
RETURNS UUID AS $$
    SELECT gym_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_gym_access(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role::VARCHAR INTO v_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    IF v_role = 'super_admin' THEN
        RETURN true;
    END IF;

    IF EXISTS (SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()) THEN
        RETURN true;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.gym_memberships 
        WHERE gym_id = p_gym_id AND user_id = auth.uid() AND is_active = true
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RLS: PROFILES
DROP POLICY IF EXISTS "Profiles access rule" ON public.profiles;
CREATE POLICY "Profiles access rule" ON public.profiles FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR id = auth.uid()
    OR (gym_id IS NOT NULL AND public.user_has_gym_access(gym_id))
);

-- RLS: GYMS
DROP POLICY IF EXISTS "Gyms tenant isolation" ON public.gyms;
CREATE POLICY "Gyms tenant isolation" ON public.gyms FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR owner_id = auth.uid()
    OR public.user_has_gym_access(id)
);

-- RLS: GYM_MEMBERSHIPS
DROP POLICY IF EXISTS "Gym memberships isolation" ON public.gym_memberships;
CREATE POLICY "Gym memberships isolation" ON public.gym_memberships FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR user_id = auth.uid()
    OR public.user_has_gym_access(gym_id)
);

-- RLS: SAAS_PLANS & SAAS_SUBSCRIPTIONS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SaaS plans view" ON public.saas_plans;
CREATE POLICY "SaaS plans view" ON public.saas_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "SaaS plans manage" ON public.saas_plans;
CREATE POLICY "SaaS plans manage" ON public.saas_plans FOR ALL
USING (public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "SaaS subscriptions access" ON public.saas_subscriptions;
CREATE POLICY "SaaS subscriptions access" ON public.saas_subscriptions FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR public.user_has_gym_access(gym_id)
);

-- RLS: GYM_INVITATIONS
DROP POLICY IF EXISTS "Gym invitations isolation" ON public.gym_invitations;
CREATE POLICY "Gym invitations isolation" ON public.gym_invitations FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

-- RLS: MEMBERSHIP_PLANS
DROP POLICY IF EXISTS "Plans tenant isolation" ON public.membership_plans;
CREATE POLICY "Plans tenant isolation" ON public.membership_plans FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (gym_id = public.current_user_gym_id() AND deleted_at IS NULL)
);

-- RLS: TRAINERS
DROP POLICY IF EXISTS "Trainers tenant isolation" ON public.trainers;
CREATE POLICY "Trainers tenant isolation" ON public.trainers FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (gym_id = public.current_user_gym_id() AND deleted_at IS NULL)
);

-- RLS: MEMBERS
DROP POLICY IF EXISTS "Members tenant isolation" ON public.members;
CREATE POLICY "Members tenant isolation" ON public.members FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (gym_id = public.current_user_gym_id() AND deleted_at IS NULL)
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- RLS: PAYMENTS
DROP POLICY IF EXISTS "Payments tenant isolation" ON public.payments;
CREATE POLICY "Payments tenant isolation" ON public.payments FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
    OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

-- RLS: ATTENDANCE
DROP POLICY IF EXISTS "Attendance tenant isolation" ON public.attendance;
CREATE POLICY "Attendance tenant isolation" ON public.attendance FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
    OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

-- RLS: WORKOUT_PLANS
DROP POLICY IF EXISTS "Workout plans tenant isolation" ON public.workout_plans;
CREATE POLICY "Workout plans tenant isolation" ON public.workout_plans FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (gym_id = public.current_user_gym_id() AND deleted_at IS NULL)
    OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

-- RLS: NOTIFICATIONS
DROP POLICY IF EXISTS "Notifications isolation" ON public.notifications;
CREATE POLICY "Notifications isolation" ON public.notifications FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
    OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

-- RLS: SUBSCRIPTIONS
DROP POLICY IF EXISTS "Subscriptions tenant isolation" ON public.subscriptions;
CREATE POLICY "Subscriptions tenant isolation" ON public.subscriptions FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

-- RLS: AUDIT_LOGS
DROP POLICY IF EXISTS "Audit logs isolation" ON public.audit_logs;
CREATE POLICY "Audit logs isolation" ON public.audit_logs FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (public.current_user_role() = 'gym_owner' AND gym_id = public.current_user_gym_id())
);

-- RLS: MEMBER_MEMBERSHIPS (Customer Contract & Renewal History)
ALTER TABLE public.member_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Member memberships isolation" ON public.member_memberships;
CREATE POLICY "Member memberships isolation" ON public.member_memberships FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR public.user_has_gym_access(gym_id)
);

-- RLS: MEMBER_DOCUMENTS
ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Member documents isolation" ON public.member_documents;
CREATE POLICY "Member documents isolation" ON public.member_documents FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR public.user_has_gym_access(gym_id)
);

-- ==============================================================================
-- 10. STEP 10: WORKOUT & DIET MANAGEMENT SYSTEM (Exercises, Diets, Logs, Progress)
-- ==============================================================================

-- 10.1 EXERCISES LIBRARY
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    exercise_name VARCHAR(150) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL CHECK (muscle_group IN ('Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio', 'Full Body')),
    category VARCHAR(50) NOT NULL DEFAULT 'Strength',
    equipment VARCHAR(50) NOT NULL DEFAULT 'Barbell',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    instructions TEXT NOT NULL,
    safety_notes TEXT,
    recommended_sets INT NOT NULL DEFAULT 3,
    recommended_reps VARCHAR(50) NOT NULL DEFAULT '10-12',
    rest_seconds INT NOT NULL DEFAULT 60,
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10.2 ENHANCE WORKOUT_PLANS TABLE
ALTER TABLE IF EXISTS public.workout_plans
    ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(50) DEFAULT 'General Fitness',
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'intermediate',
    ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS trainer_notes TEXT;

-- 10.3 WORKOUT_PLAN_EXERCISES (Daily Weekly Schedule)
CREATE TABLE IF NOT EXISTS public.workout_plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    sets INT NOT NULL DEFAULT 3,
    repetitions VARCHAR(50) NOT NULL DEFAULT '10-12',
    rest_seconds INT NOT NULL DEFAULT 60,
    display_order INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10.4 WORKOUT_LOGS (Completed Exercise Telemetry & Logs)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
    day_of_week VARCHAR(15),
    completion_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (completion_status IN ('completed', 'skipped', 'partial')),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    weights_used JSONB DEFAULT '[]'::jsonb,
    reps_achieved JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10.5 DIET_PLANS (Personalized Nutrition Schedules)
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
    plan_name VARCHAR(255) NOT NULL,
    dietary_preference VARCHAR(50) NOT NULL DEFAULT 'Custom' CHECK (dietary_preference IN ('Vegetarian', 'Non-Vegetarian', 'Vegan', 'Custom', 'Keto', 'High Protein')),
    fitness_goal VARCHAR(50) NOT NULL DEFAULT 'General Fitness',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    instructions TEXT,
    total_calories INT,
    total_protein NUMERIC(6,1),
    total_carbs NUMERIC(6,1),
    total_fat NUMERIC(6,1),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10.6 DIET_PLAN_MEALS (Meal-by-Meal Schedule & Macros)
CREATE TABLE IF NOT EXISTS public.diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    diet_plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
    meal_name VARCHAR(50) NOT NULL CHECK (meal_name IN ('Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snack', 'Dinner')),
    food_name VARCHAR(200) NOT NULL,
    portion_size VARCHAR(100) NOT NULL,
    calories INT,
    protein NUMERIC(6,1),
    carbohydrates NUMERIC(6,1),
    fat NUMERIC(6,1),
    notes TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10.7 MEMBER_PROGRESS (Weight, Body Measurements, Progress Tracking)
CREATE TABLE IF NOT EXISTS public.member_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    weight NUMERIC(5,2) NOT NULL,
    previous_weight NUMERIC(5,2),
    target_weight NUMERIC(5,2),
    body_measurements JSONB DEFAULT '{}'::jsonb,
    progress_notes TEXT,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 10 Indexes
CREATE INDEX IF NOT EXISTS idx_exercises_gym_id ON public.exercises(gym_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON public.exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);
CREATE INDEX IF NOT EXISTS idx_workout_plan_exercises_plan_id ON public.workout_plan_exercises(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_plan_exercises_day ON public.workout_plan_exercises(day_of_week);
CREATE INDEX IF NOT EXISTS idx_workout_logs_gym_member ON public.workout_logs(gym_id, member_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_at ON public.workout_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_diet_plans_gym_id ON public.diet_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_member_id ON public.diet_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_plan_id ON public.diet_plan_meals(diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_meal_name ON public.diet_plan_meals(meal_name);
CREATE INDEX IF NOT EXISTS idx_member_progress_gym_member ON public.member_progress(gym_id, member_id);
CREATE INDEX IF NOT EXISTS idx_member_progress_recorded_at ON public.member_progress(recorded_at DESC);

-- Step 10 RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exercises tenant isolation" ON public.exercises;
CREATE POLICY "Exercises tenant isolation" ON public.exercises FOR ALL
USING (
    gym_id IS NULL 
    OR public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

DROP POLICY IF EXISTS "Workout plan exercises isolation" ON public.workout_plan_exercises;
CREATE POLICY "Workout plan exercises isolation" ON public.workout_plan_exercises FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

DROP POLICY IF EXISTS "Workout logs isolation" ON public.workout_logs;
CREATE POLICY "Workout logs isolation" ON public.workout_logs FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (
        gym_id = public.current_user_gym_id()
        AND (
            public.current_user_role() IN ('gym_owner', 'trainer')
            OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
        )
    )
);

DROP POLICY IF EXISTS "Diet plans isolation" ON public.diet_plans;
CREATE POLICY "Diet plans isolation" ON public.diet_plans FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (
        gym_id = public.current_user_gym_id()
        AND (
            public.current_user_role() IN ('gym_owner', 'trainer')
            OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
        )
    )
);

DROP POLICY IF EXISTS "Diet plan meals isolation" ON public.diet_plan_meals;
CREATE POLICY "Diet plan meals isolation" ON public.diet_plan_meals FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

DROP POLICY IF EXISTS "Member progress isolation" ON public.member_progress;
CREATE POLICY "Member progress isolation" ON public.member_progress FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR (
        gym_id = public.current_user_gym_id()
        AND (
            public.current_user_role() IN ('gym_owner', 'trainer')
            OR member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
        )
    )
);


-- ============================================================================
-- STEP 11: WHATSAPP AUTOMATION & NOTIFICATION SYSTEM SCHEMA
-- ============================================================================

-- 14. NOTIFICATION_PREFERENCES (Per-Member WhatsApp & Channel Consent)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    whatsapp_consent BOOLEAN NOT NULL DEFAULT true,
    expiry_reminders BOOLEAN NOT NULL DEFAULT true,
    payment_notifications BOOLEAN NOT NULL DEFAULT true,
    attendance_notifications BOOLEAN NOT NULL DEFAULT true,
    birthday_messages BOOLEAN NOT NULL DEFAULT true,
    marketing_updates BOOLEAN NOT NULL DEFAULT false,
    preferred_language VARCHAR(10) DEFAULT 'en',
    opted_out_at TIMESTAMPTZ,
    opt_out_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_member_notification_preferences UNIQUE (gym_id, member_id)
);

-- 15. NOTIFICATION_LOGS (Live delivery telemetry for all channels)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    recipient VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(150),
    template_name VARCHAR(100),
    channel VARCHAR(30) NOT NULL DEFAULT 'whatsapp',
    message_body TEXT,
    message_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    provider_message_id VARCHAR(100),
    error_message TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. AUTOMATION_SETTINGS (Tenant-level workflow toggles & triggers)
CREATE TABLE IF NOT EXISTS public.automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    workflow_name VARCHAR(100) NOT NULL,
    display_title VARCHAR(150) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'cron',
    schedule_cron VARCHAR(50) DEFAULT '0 9 * * *',
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gym_automation_workflow UNIQUE (gym_id, workflow_name)
);

-- 17. WHATSAPP_CONFIGS (Per-Gym Meta Cloud API Credentials & Status)
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(100),
    business_account_id VARCHAR(100),
    webhook_verify_token VARCHAR(100),
    notification_phone VARCHAR(50),
    is_live_enabled BOOLEAN NOT NULL DEFAULT false,
    connection_status VARCHAR(30) NOT NULL DEFAULT 'unconfigured',
    sender_name VARCHAR(100) DEFAULT 'GymFlow AI Assistant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gym_whatsapp_config UNIQUE (gym_id)
);

-- Automation Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_gym_id ON public.notification_preferences(gym_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_member_id ON public.notification_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_consent ON public.notification_preferences(whatsapp_consent);

CREATE INDEX IF NOT EXISTS idx_notification_logs_gym_id ON public.notification_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_member_id ON public.notification_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(message_status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON public.notification_logs(recipient);

CREATE INDEX IF NOT EXISTS idx_automation_settings_gym_id ON public.automation_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_automation_settings_workflow ON public.automation_settings(workflow_name);

CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_gym_id ON public.whatsapp_configs(gym_id);

-- Automation Triggers
DROP TRIGGER IF EXISTS trigger_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_automation_settings_updated_at ON public.automation_settings;
CREATE TRIGGER trigger_automation_settings_updated_at
    BEFORE UPDATE ON public.automation_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_whatsapp_configs_updated_at ON public.whatsapp_configs;
CREATE TRIGGER trigger_whatsapp_configs_updated_at
    BEFORE UPDATE ON public.whatsapp_configs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automation RLS Policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_tenant_isolation" ON public.notification_preferences;
CREATE POLICY "notification_preferences_tenant_isolation" ON public.notification_preferences
    FOR ALL
    USING (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer')) OR
        (member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())))
    )
    WITH CHECK (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer')) OR
        (member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())))
    );

DROP POLICY IF EXISTS "notification_logs_tenant_isolation" ON public.notification_logs;
CREATE POLICY "notification_logs_tenant_isolation" ON public.notification_logs
    FOR ALL
    USING (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer')) OR
        (member_id IN (SELECT id FROM public.members WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())))
    )
    WITH CHECK (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer'))
    );

DROP POLICY IF EXISTS "automation_settings_tenant_isolation" ON public.automation_settings;
CREATE POLICY "automation_settings_tenant_isolation" ON public.automation_settings
    FOR ALL
    USING (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() = 'gym_owner')
    )
    WITH CHECK (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() = 'gym_owner')
    );

DROP POLICY IF EXISTS "whatsapp_configs_tenant_isolation" ON public.whatsapp_configs;
CREATE POLICY "whatsapp_configs_tenant_isolation" ON public.whatsapp_configs
    FOR ALL
    USING (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() = 'gym_owner')
    )
    WITH CHECK (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() = 'gym_owner')
    );


-- ==============================================================================
-- STEP 12: AI GYM ASSISTANT SCHEMA
-- ==============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_plan_type') THEN
    CREATE TYPE public.ai_plan_type AS ENUM ('workout', 'diet');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_approval_status') THEN
    CREATE TYPE public.ai_approval_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_request_type') THEN
    CREATE TYPE public.ai_request_type AS ENUM ('chat', 'workout_plan', 'diet_plan', 'business_insights');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_generated_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type public.ai_plan_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  generated_content JSONB NOT NULL,
  approval_status public.ai_approval_status NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model VARCHAR(100) NOT NULL,
  request_type public.ai_request_type NOT NULL,
  token_usage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_gym_user ON public.ai_conversations(gym_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_plans_gym_id ON public.ai_generated_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_plans_member_id ON public.ai_generated_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_plans_status ON public.ai_generated_plans(approval_status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_gym_date ON public.ai_usage_logs(gym_id, created_at);

DROP TRIGGER IF EXISTS trigger_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trigger_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_ai_generated_plans_updated_at ON public.ai_generated_plans;
CREATE TRIGGER trigger_ai_generated_plans_updated_at
  BEFORE UPDATE ON public.ai_generated_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- STEP 13: ADVANCED REPORTS & ANALYTICS INDEXES & VIEWS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_gym_date_status 
  ON public.payments(gym_id, payment_date, payment_status);

CREATE INDEX IF NOT EXISTS idx_attendance_gym_checkin 
  ON public.attendance(gym_id, check_in_time);

CREATE INDEX IF NOT EXISTS idx_members_gym_created_status 
  ON public.members(gym_id, created_at, status);

CREATE INDEX IF NOT EXISTS idx_training_sessions_gym_date_status 
  ON public.training_sessions(gym_id, session_date, status);

CREATE INDEX IF NOT EXISTS idx_gym_memberships_gym_expiry 
  ON public.gym_memberships(gym_id, end_date, status);

CREATE OR REPLACE FUNCTION public.get_gym_revenue_summary(
  target_gym_id UUID,
  start_ts TIMESTAMPTZ DEFAULT timezone('utc'::text, now() - INTERVAL '30 days'),
  end_ts TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
)
RETURNS TABLE (
  total_revenue NUMERIC,
  collected_payments NUMERIC,
  pending_payments NUMERIC,
  refunded_payments NUMERIC,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) AS collected_payments,
    COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END), 0) AS pending_payments,
    COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN amount ELSE 0 END), 0) AS refunded_payments,
    COUNT(*) AS transaction_count
  FROM public.payments
  WHERE gym_id = target_gym_id
    AND created_at >= start_ts
    AND created_at <= end_ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ==============================================================================
-- STEP 14: SUPER ADMIN CONTROL PANEL (Migration 011)
-- ==============================================================================

-- 1. Platform Transactions Table (SaaS subscription billing)
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

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  ticket_status VARCHAR(30) NOT NULL DEFAULT 'open',
  assigned_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_admin_name VARCHAR(100),
  conversation JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_gym_status ON public.saas_subscriptions(gym_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_platform_tx_gym_date ON public.platform_transactions(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_gym_status ON public.support_tickets(gym_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.platform_announcements(target_audience, is_active);

