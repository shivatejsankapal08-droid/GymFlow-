-- ==============================================================================
-- GYMFLOW AI - MIGRATION 004: SMART ATTENDANCE MANAGEMENT SYSTEM
-- Adds verification methods, staff attribution, duration tracking,
-- duplicate check-in prevention, and atomic check-in/out stored procedures.
-- ==============================================================================

-- 1. Alter public.attendance table
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) NOT NULL DEFAULT 'qr_scanner',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'checked_in',
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS recorded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add performance & isolation indexes
CREATE INDEX IF NOT EXISTS idx_attendance_gym_date ON public.attendance(gym_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_member ON public.attendance(gym_id, member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_status ON public.attendance(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_active_visits ON public.attendance(gym_id, member_id, status) WHERE status = 'checked_in';

-- 3. Stored Procedure: Atomic Attendance Check-in with Duplicate & Expiry Prevention
CREATE OR REPLACE FUNCTION public.record_attendance_check_in(
  p_gym_id UUID,
  p_member_id UUID,
  p_method VARCHAR DEFAULT 'qr_scanner',
  p_staff_id UUID DEFAULT NULL,
  p_staff_name VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_active_log RECORD;
  v_attendance_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Verify Member exists and belongs to this gym
  SELECT * INTO v_member 
  FROM public.members 
  WHERE id = p_member_id AND gym_id = p_gym_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MEMBER_NOT_FOUND',
      'error', 'Member not found or does not belong to this gym facility.'
    );
  END IF;

  -- 2. Check Member validity (Must not be expired or suspended)
  IF v_member.status = 'expired' OR v_member.expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MEMBERSHIP_EXPIRED',
      'error', 'Check-in Blocked: Athlete membership has expired on ' || v_member.expiry_date || '. Please renew membership.',
      'member_id', v_member.id,
      'full_name', v_member.full_name,
      'expiry_date', v_member.expiry_date,
      'status', 'expired'
    );
  END IF;

  IF v_member.status = 'suspended' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MEMBERSHIP_SUSPENDED',
      'error', 'Check-in Blocked: Athlete membership account is currently suspended.',
      'member_id', v_member.id,
      'full_name', v_member.full_name,
      'status', 'suspended'
    );
  END IF;

  -- 3. Prevent Duplicate Check-in: Check if member is already checked in today without checking out
  SELECT * INTO v_active_log
  FROM public.attendance
  WHERE gym_id = p_gym_id 
    AND member_id = p_member_id 
    AND status = 'checked_in'
    AND check_out IS NULL
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CHECKED_IN',
      'error', 'Duplicate Check-in Blocked: Athlete is already checked in (Checked in at ' || to_char(v_active_log.check_in, 'HH12:MI AM') || '). Must check out first.',
      'active_attendance_id', v_active_log.id,
      'check_in_time', v_active_log.check_in
    );
  END IF;

  -- 4. Record Successful Check-in
  INSERT INTO public.attendance (
    gym_id,
    member_id,
    check_in,
    attendance_date,
    verification_method,
    status,
    recorded_by_id,
    recorded_by_name,
    notes
  ) VALUES (
    p_gym_id,
    p_member_id,
    v_now,
    CURRENT_DATE,
    COALESCE(p_method, 'qr_scanner'),
    'checked_in',
    p_staff_id,
    p_staff_name,
    p_notes
  ) RETURNING id INTO v_attendance_id;

  -- 5. Increment Member Check-in Counter & last check-in timestamp
  UPDATE public.members
  SET total_check_ins = COALESCE(total_check_ins, 0) + 1,
      last_check_in = v_now
  WHERE id = p_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'check_in',
    'attendance_id', v_attendance_id,
    'member_id', v_member.id,
    'member_code', v_member.member_code,
    'full_name', v_member.full_name,
    'check_in_time', v_now,
    'status', 'checked_in',
    'verification_method', COALESCE(p_method, 'qr_scanner'),
    'message', 'Welcome, ' || v_member.full_name || '! Check-in verified.'
  );
END;
$$;

-- 4. Stored Procedure: Atomic Attendance Check-out
CREATE OR REPLACE FUNCTION public.record_attendance_check_out(
  p_gym_id UUID,
  p_member_id UUID,
  p_attendance_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL,
  p_staff_name VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_log RECORD;
  v_now TIMESTAMPTZ := now();
  v_duration_min INT;
BEGIN
  -- 1. Verify Member
  SELECT * INTO v_member FROM public.members WHERE id = p_member_id AND gym_id = p_gym_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MEMBER_NOT_FOUND',
      'error', 'Member not found or does not belong to this gym.'
    );
  END IF;

  -- 2. Find Active Check-in Record
  IF p_attendance_id IS NOT NULL THEN
    SELECT * INTO v_log 
    FROM public.attendance 
    WHERE id = p_attendance_id AND gym_id = p_gym_id AND member_id = p_member_id
    FOR UPDATE;
  ELSE
    SELECT * INTO v_log 
    FROM public.attendance 
    WHERE gym_id = p_gym_id AND member_id = p_member_id AND status = 'checked_in' AND check_out IS NULL
    ORDER BY check_in DESC 
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND OR v_log.status = 'checked_out' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NO_ACTIVE_CHECKIN',
      'error', 'Check-out Blocked: Athlete does not have an active check-in session.'
    );
  END IF;

  -- 3. Calculate Duration in Minutes
  v_duration_min := GREATEST(1, ROUND(EXTRACT(EPOCH FROM (v_now - v_log.check_in)) / 60));

  -- 4. Update Attendance Log
  UPDATE public.attendance
  SET check_out = v_now,
      duration_minutes = v_duration_min,
      status = 'checked_out',
      notes = COALESCE(p_notes, notes)
  WHERE id = v_log.id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'check_out',
    'attendance_id', v_log.id,
    'member_id', v_member.id,
    'member_code', v_member.member_code,
    'full_name', v_member.full_name,
    'check_in_time', v_log.check_in,
    'check_out_time', v_now,
    'duration_minutes', v_duration_min,
    'status', 'checked_out',
    'message', 'Checked out ' || v_member.full_name || '. Workout duration: ' || v_duration_min || ' minutes.'
  );
END;
$$;
