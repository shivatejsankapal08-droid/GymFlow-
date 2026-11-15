-- ==============================================================================
-- GYMFLOW AI - STEP 9: COMPLETE TRAINER MANAGEMENT SYSTEM MIGRATION
-- Migration 006: Enhanced Trainers, Member Assignments, Schedule & Attendance
-- ==============================================================================

-- 1. ENHANCE TRAINERS TABLE
ALTER TABLE IF EXISTS public.trainers
    ADD COLUMN IF NOT EXISTS trainer_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
    ADD COLUMN IF NOT EXISTS certifications TEXT,
    ADD COLUMN IF NOT EXISTS skills TEXT,
    ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
    ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    ADD COLUMN IF NOT EXISTS salary_type VARCHAR(50) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly', 'commission', 'hybrid')),
    ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(50) DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'bi_weekly', 'weekly')),
    ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 4.90,
    ADD COLUMN IF NOT EXISTS max_clients INT DEFAULT 25,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. CREATE TRAINER MEMBER ASSIGNMENTS TABLE
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

-- 3. CREATE TRAINING SESSIONS TABLE (Schedule & Bookings)
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

-- 4. CREATE TRAINER ATTENDANCE TABLE
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

-- 5. CREATE TRAINER SALARIES & PAYROLL TABLE
CREATE TABLE IF NOT EXISTS public.trainer_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    salary_month VARCHAR(20) NOT NULL, -- Format YYYY-MM
    base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'processing')),
    paid_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. INDEXES FOR HIGH-PERFORMANCE SEARCH & ISOLATION
CREATE INDEX IF NOT EXISTS idx_trainers_gym_status ON public.trainers(gym_id, employment_status);
CREATE INDEX IF NOT EXISTS idx_trainers_trainer_code ON public.trainers(gym_id, trainer_code);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_trainer ON public.trainer_member_assignments(gym_id, trainer_id, status);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_member ON public.trainer_member_assignments(gym_id, member_id, status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_date ON public.training_sessions(gym_id, trainer_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_member_date ON public.training_sessions(gym_id, member_id, session_date);
CREATE INDEX IF NOT EXISTS idx_trainer_attendance_date ON public.trainer_attendance(gym_id, trainer_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_trainer_salaries_month ON public.trainer_salaries(gym_id, trainer_id, salary_month);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.trainer_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_salaries ENABLE ROW LEVEL SECURITY;

-- trainer_member_assignments RLS
DROP POLICY IF EXISTS "assignments_tenant_isolation" ON public.trainer_member_assignments;
CREATE POLICY "assignments_tenant_isolation" ON public.trainer_member_assignments
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- training_sessions RLS
DROP POLICY IF EXISTS "sessions_tenant_isolation" ON public.training_sessions;
CREATE POLICY "sessions_tenant_isolation" ON public.training_sessions
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- trainer_attendance RLS
DROP POLICY IF EXISTS "trainer_attendance_tenant_isolation" ON public.trainer_attendance;
CREATE POLICY "trainer_attendance_tenant_isolation" ON public.trainer_attendance
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- trainer_salaries RLS
DROP POLICY IF EXISTS "trainer_salaries_tenant_isolation" ON public.trainer_salaries;
CREATE POLICY "trainer_salaries_tenant_isolation" ON public.trainer_salaries
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- 8. OVERLAPPING SESSION DETECTION FUNCTION
CREATE OR REPLACE FUNCTION public.check_trainer_session_overlap(
    p_gym_id UUID,
    p_trainer_id UUID,
    p_session_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_overlap_count INT;
BEGIN
    SELECT COUNT(*) INTO v_overlap_count
    FROM public.training_sessions
    WHERE gym_id = p_gym_id
      AND trainer_id = p_trainer_id
      AND session_date = p_session_date
      AND session_status NOT IN ('cancelled')
      AND (p_exclude_session_id IS NULL OR id != p_exclude_session_id)
      AND (
          (start_time < p_end_time AND end_time > p_start_time)
      );

    RETURN (v_overlap_count > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CREATE TRAINER FEEDBACK & RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainer_feedback_trainer ON public.trainer_feedback(gym_id, trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_member ON public.trainer_feedback(gym_id, member_id);

ALTER TABLE public.trainer_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trainer_feedback_tenant_isolation" ON public.trainer_feedback;
CREATE POLICY "trainer_feedback_tenant_isolation" ON public.trainer_feedback
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

-- 10. CREATE TRAINER SALARY RECORDS ALIAS / COMPATIBILITY VIEW
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

CREATE INDEX IF NOT EXISTS idx_trainer_salary_records_period ON public.trainer_salary_records(gym_id, trainer_id, salary_period);

ALTER TABLE public.trainer_salary_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trainer_salary_records_tenant_isolation" ON public.trainer_salary_records;
CREATE POLICY "trainer_salary_records_tenant_isolation" ON public.trainer_salary_records
    FOR ALL USING (
        current_user_role() = 'super_admin' OR gym_id = current_user_gym_id()
    );

