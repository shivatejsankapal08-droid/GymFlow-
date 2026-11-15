-- ==============================================================================
-- GYMFLOW AI: STEP 12 - AI GYM ASSISTANT MIGRATION
-- Migration: 009_ai_gym_assistant.sql
-- Description: AI conversations, messages, generated plan drafts, and usage telemetry
-- ==============================================================================

-- 1. ENUMS FOR AI PLANS & ROLES
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

-- 2. AI CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. AI MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. AI GENERATED PLANS TABLE
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

-- 5. AI USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model VARCHAR(100) NOT NULL,
  request_type public.ai_request_type NOT NULL,
  token_usage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INDEXES FOR PERFORMANCE & TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_ai_conversations_gym_user ON public.ai_conversations(gym_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_plans_gym_id ON public.ai_generated_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_plans_member_id ON public.ai_generated_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_plans_status ON public.ai_generated_plans(approval_status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_gym_date ON public.ai_usage_logs(gym_id, created_at);

-- 7. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trigger_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trigger_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_ai_generated_plans_updated_at ON public.ai_generated_plans;
CREATE TRIGGER trigger_ai_generated_plans_updated_at
  BEFORE UPDATE ON public.ai_generated_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- ai_conversations RLS
CREATE POLICY "Users can view and manage their own conversations within their gym"
  ON public.ai_conversations
  FOR ALL
  USING (
    gym_id = public.current_user_gym_id() AND
    (user_id = auth.uid() OR public.current_user_role() IN ('gym_owner', 'super_admin'))
  );

-- ai_messages RLS
CREATE POLICY "Users can access messages for their authorized conversations"
  ON public.ai_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id
      AND c.gym_id = public.current_user_gym_id()
      AND (c.user_id = auth.uid() OR public.current_user_role() IN ('gym_owner', 'super_admin'))
    )
  );

-- ai_generated_plans RLS
CREATE POLICY "Trainers and owners can manage generated plans in their gym"
  ON public.ai_generated_plans
  FOR ALL
  USING (
    gym_id = public.current_user_gym_id() AND
    (
      public.current_user_role() IN ('gym_owner', 'super_admin', 'trainer') OR
      (public.current_user_role() = 'member' AND approval_status = 'approved')
    )
  );

-- ai_usage_logs RLS
CREATE POLICY "Owners and admins can inspect AI usage logs for their gym"
  ON public.ai_usage_logs
  FOR ALL
  USING (
    gym_id = public.current_user_gym_id() AND
    public.current_user_role() IN ('gym_owner', 'super_admin')
  );
