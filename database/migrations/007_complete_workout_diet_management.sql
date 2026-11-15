-- ==============================================================================
-- GYMFLOW AI - STEP 10: WORKOUT & DIET MANAGEMENT SYSTEM MIGRATION
-- Migration 007: Exercises Library, Workout Plans, Diet Plans, Logs & Progress
-- ==============================================================================

-- 1. EXERCISES LIBRARY
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE, -- NULL indicates global/shared system exercise
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

-- 2. ENHANCE WORKOUT_PLANS TABLE
ALTER TABLE IF EXISTS public.workout_plans
    ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(50) DEFAULT 'General Fitness',
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'intermediate',
    ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS trainer_notes TEXT;

-- Update plan_name from title where plan_name is NULL
UPDATE public.workout_plans SET plan_name = title WHERE plan_name IS NULL AND title IS NOT NULL;

-- 3. WORKOUT_PLAN_EXERCISES (Daily Weekly Schedule)
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

-- 4. WORKOUT_LOGS (Completed Exercise Telemetry & Logs)
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

-- 5. DIET_PLANS (Personalized Nutrition Schedules)
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

-- 6. DIET_PLAN_MEALS (Meal-by-Meal Schedule & Macros)
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

-- 7. MEMBER_PROGRESS (Weight, Body Measurements, Progress Tracking)
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

-- ==============================================================================
-- 8. INDEXES FOR HIGH-FREQUENCY SEARCH & TENANT ISOLATION
-- ==============================================================================
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

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_progress ENABLE ROW LEVEL SECURITY;

-- Exercises RLS Policy: Shared library readable by all, gym-specific scoped to gym
DROP POLICY IF EXISTS "Exercises tenant isolation" ON public.exercises;
CREATE POLICY "Exercises tenant isolation" ON public.exercises FOR ALL
USING (
    gym_id IS NULL 
    OR public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

-- Workout Plan Exercises RLS Policy
DROP POLICY IF EXISTS "Workout plan exercises isolation" ON public.workout_plan_exercises;
CREATE POLICY "Workout plan exercises isolation" ON public.workout_plan_exercises FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

-- Workout Logs RLS Policy: Members can view & insert own logs, staff can view gym logs
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

-- Diet Plans RLS Policy
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

-- Diet Plan Meals RLS Policy
DROP POLICY IF EXISTS "Diet plan meals isolation" ON public.diet_plan_meals;
CREATE POLICY "Diet plan meals isolation" ON public.diet_plan_meals FOR ALL
USING (
    public.current_user_role() = 'super_admin'
    OR gym_id = public.current_user_gym_id()
);

-- Member Progress RLS Policy
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
