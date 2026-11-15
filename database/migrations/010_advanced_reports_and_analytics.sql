-- ==============================================================================
-- GYMFLOW AI: STEP 13 - ADVANCED REPORTS & ANALYTICS INDEXES & VIEWS
-- Migration: 010_advanced_reports_and_analytics.sql
-- Description: Composite reporting indexes and aggregated reporting functions
-- ==============================================================================

-- 1. COMPOSITE INDEXES FOR HIGH-PERFORMANCE ANALYTICS QUERIES
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

-- 2. REPORTING AGGREGATION STORED FUNCTION FOR REVENUE
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
