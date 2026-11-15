-- ============================================================================
-- GYMFLOW AI: STEP 11 - WHATSAPP AUTOMATION & NOTIFICATION SYSTEM
-- Migration: 008_whatsapp_automation_system.sql
-- ============================================================================

-- 1. Notification Preferences (Per-Member WhatsApp & Channel Consent)
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

-- 2. Notification Audit Logs (Live delivery telemetry for all channels)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'expiry_reminder', 'payment_verified', 'payment_pending', 'payment_failed', 'birthday_wish', 'check_in', 'check_out', 'inactive_reminder', 'owner_daily_report', 'test_message'
    recipient VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(150),
    template_name VARCHAR(100),
    channel VARCHAR(30) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
    message_body TEXT,
    message_status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opted_out'
    provider_message_id VARCHAR(100), -- Meta WAMID or n8n execution id
    error_message TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Automation Settings (Tenant-level workflow toggles & triggers)
CREATE TABLE IF NOT EXISTS public.automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    workflow_name VARCHAR(100) NOT NULL, -- 'expiry_reminder', 'payment_confirmation', 'birthday_wishes', 'attendance_notifications', 'inactive_member_reminder', 'daily_owner_report'
    display_title VARCHAR(150) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'cron', -- 'cron', 'webhook', 'event'
    schedule_cron VARCHAR(50) DEFAULT '0 9 * * *',
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gym_automation_workflow UNIQUE (gym_id, workflow_name)
);

-- 4. WhatsApp Configuration (Per-Gym Meta Cloud API Credentials & Status)
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(100),
    business_account_id VARCHAR(100),
    webhook_verify_token VARCHAR(100),
    notification_phone VARCHAR(50), -- Gym owner phone number for daily reports
    is_live_enabled BOOLEAN NOT NULL DEFAULT false,
    connection_status VARCHAR(30) NOT NULL DEFAULT 'unconfigured', -- 'configured', 'sandbox', 'unconfigured'
    sender_name VARCHAR(100) DEFAULT 'GymFlow AI Assistant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gym_whatsapp_config UNIQUE (gym_id)
);

-- 5. Indexes for High-Speed Multi-Tenant Filtering & Telemetry
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

-- 6. Updated At Triggers
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

-- 7. Row Level Security (RLS) Policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

-- 7.1 notification_preferences Policies
DROP POLICY IF EXISTS "notification_preferences_tenant_isolation" ON public.notification_preferences;
CREATE POLICY "notification_preferences_tenant_isolation" ON public.notification_preferences
    FOR ALL
    USING (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer')) OR
        (member_id = auth.uid())
    )
    WITH CHECK (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer')) OR
        (member_id = auth.uid())
    );

-- 7.2 notification_logs Policies
DROP POLICY IF EXISTS "notification_logs_tenant_isolation" ON public.notification_logs;
CREATE POLICY "notification_logs_tenant_isolation" ON public.notification_logs
    FOR ALL
    USING (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer')) OR
        (member_id = auth.uid())
    )
    WITH CHECK (
        public.current_user_role() = 'super_admin' OR
        (gym_id = public.current_user_gym_id() AND public.current_user_role() IN ('gym_owner', 'trainer'))
    );

-- 7.3 automation_settings Policies
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

-- 7.4 whatsapp_configs Policies
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
