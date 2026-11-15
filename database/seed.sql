-- ==============================================================================
-- GYMFLOW AI - Complete Multi-Tenant Seed Data for Supabase PostgreSQL
-- Tagline: Smart Gym Management. Powered by AI.
-- Populates all 13 Tables with production-grade sample data across 3 Gym Tenants
-- ==============================================================================

-- 0. Provision mock auth.users if Supabase auth schema is present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (id, email, raw_user_meta_data)
        VALUES 
            ('00000000-0000-0000-0000-000000000001', 'admin@gymflow.ai', '{"full_name":"Vikram Aditya","role":"super_admin"}'::jsonb),
            ('00000000-0000-0000-0000-000000000002', 'owner@ironpulse.com', '{"full_name":"Marcus Vance","role":"gym_owner"}'::jsonb),
            ('00000000-0000-0000-0000-000000000003', 'contact@titanforge.in', '{"full_name":"Devika Rao","role":"gym_owner"}'::jsonb),
            ('00000000-0000-0000-0000-000000000004', 'support@zenithathletic.com', '{"full_name":"Sameer Khan","role":"gym_owner"}'::jsonb),
            ('00000000-0000-0000-0000-000000000011', 'trainer.alex@ironpulse.com', '{"full_name":"Alex Rivera","role":"trainer"}'::jsonb),
            ('00000000-0000-0000-0000-000000000012', 'priya.sharma@ironpulse.com', '{"full_name":"Priya Sharma","role":"trainer"}'::jsonb),
            ('00000000-0000-0000-0000-000000000013', 'rohan.k@ironpulse.com', '{"full_name":"Rohan Kulkarni","role":"trainer"}'::jsonb),
            ('00000000-0000-0000-0000-000000000021', 'vikram.malhotra@gmail.com', '{"full_name":"Vikram Malhotra","role":"member"}'::jsonb),
            ('00000000-0000-0000-0000-000000000022', 'ananya.sen@outlook.com', '{"full_name":"Ananya Sen","role":"member"}'::jsonb),
            ('00000000-0000-0000-0000-000000000023', 'kabir.d@techcorp.in', '{"full_name":"Kabir Deshmukh","role":"member"}'::jsonb),
            ('00000000-0000-0000-0000-000000000024', 'sneha.kapoor@gmail.com', '{"full_name":"Sneha Kapoor","role":"member"}'::jsonb),
            ('00000000-0000-0000-0000-000000000025', 'arjun.nair@startup.io', '{"full_name":"Arjun Nair","role":"member"}'::jsonb)
        ON CONFLICT (id) DO NOTHING;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Super Admin, Gym Owners, Trainers, and Athletes)
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, email, phone, role)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Vikram Aditya', 'admin@gymflow.ai', '+91 90000 00001', 'super_admin'),
    ('00000000-0000-0000-0000-000000000002', 'Marcus Vance', 'owner@ironpulse.com', '+91 98765 43210', 'gym_owner'),
    ('00000000-0000-0000-0000-000000000003', 'Devika Rao', 'contact@titanforge.in', '+91 98111 22334', 'gym_owner'),
    ('00000000-0000-0000-0000-000000000004', 'Sameer Khan', 'support@zenithathletic.com', '+91 98450 99887', 'gym_owner'),
    ('00000000-0000-0000-0000-000000000011', 'Alex Rivera', 'trainer.alex@ironpulse.com', '+91 99887 76655', 'trainer'),
    ('00000000-0000-0000-0000-000000000012', 'Priya Sharma', 'priya.sharma@ironpulse.com', '+91 98223 34455', 'trainer'),
    ('00000000-0000-0000-0000-000000000013', 'Rohan Kulkarni', 'rohan.k@ironpulse.com', '+91 97654 32109', 'trainer'),
    ('00000000-0000-0000-0000-000000000021', 'Vikram Malhotra', 'vikram.malhotra@gmail.com', '+91 98201 12345', 'member'),
    ('00000000-0000-0000-0000-000000000022', 'Ananya Sen', 'ananya.sen@outlook.com', '+91 98202 23456', 'member'),
    ('00000000-0000-0000-0000-000000000023', 'Kabir Deshmukh', 'kabir.d@techcorp.in', '+91 98203 34567', 'member'),
    ('00000000-0000-0000-0000-000000000024', 'Sneha Kapoor', 'sneha.kapoor@gmail.com', '+91 98204 45678', 'member'),
    ('00000000-0000-0000-0000-000000000025', 'Arjun Nair', 'arjun.nair@startup.io', '+91 98205 56789', 'member')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

-- ------------------------------------------------------------------------------
-- 2. GYMS (3 Distinct Tenant Gyms)
-- ------------------------------------------------------------------------------
INSERT INTO public.gyms (id, gym_name, owner_id, email, phone, address, logo_url, status)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'IronPulse Fitness Club',
        '00000000-0000-0000-0000-000000000002',
        'owner@ironpulse.com',
        '+91 98765 43210',
        '4th Floor, Platinum Towers, Linking Road, Bandra West, Mumbai, MH 400050',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80',
        'active'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Titan Forge CrossFit & Gym',
        '00000000-0000-0000-0000-000000000003',
        'contact@titanforge.in',
        '+91 98111 22334',
        '12 Indiranagar 100 Feet Road, HAL 2nd Stage, Bengaluru, KA 560038',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80',
        'active'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Zenith Athletic Club',
        '00000000-0000-0000-0000-000000000004',
        'support@zenithathletic.com',
        '+91 98450 99887',
        'Plot 42, Sector 29, Golf Course Extension Road, Gurugram, HR 122002',
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&auto=format&fit=crop&q=80',
        'trialing'
    )
ON CONFLICT (id) DO UPDATE SET
    gym_name = EXCLUDED.gym_name,
    owner_id = EXCLUDED.owner_id,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    status = EXCLUDED.status;

-- Link gym association into profiles
UPDATE public.profiles SET gym_id = '11111111-1111-1111-1111-111111111111' 
WHERE id IN (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000025'
);

UPDATE public.profiles SET gym_id = '22222222-2222-2222-2222-222222222222' 
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE public.profiles SET gym_id = '33333333-3333-3333-3333-333333333333' 
WHERE id = '00000000-0000-0000-0000-000000000004';

-- ------------------------------------------------------------------------------
-- 3. GYM_MEMBERSHIPS (Application Users Connected to Gyms with Gym-Specific Roles)
-- ------------------------------------------------------------------------------
INSERT INTO public.gym_memberships (id, gym_id, user_id, role, is_active)
VALUES
    ('1111aaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'gym_owner', true),
    ('2222aaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'gym_owner', true),
    ('3333aaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000004', 'gym_owner', true),
    -- Multi-Gym access persona: Marcus Vance also co-manages Zenith Athletic Club
    ('4444aaaa-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'gym_owner', true),
    -- Trainers attached to IronPulse
    ('5555aaaa-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000011', 'trainer', true),
    ('6666aaaa-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000012', 'trainer', true),
    -- Member attached to IronPulse
    ('7777aaaa-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000021', 'member', true)
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 3B. SAAS_PLANS & SAAS_SUBSCRIPTIONS (GymFlow AI SaaS Tier Catalog & Tenant Contracts)
-- ------------------------------------------------------------------------------
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

INSERT INTO public.saas_subscriptions (id, gym_id, plan_id, plan_code, status, billing_cycle, start_date, end_date, trial_ends_at, payment_status)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '10000000-0000-0000-0000-000000000003',
        'professional',
        'active',
        'monthly',
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE + INTERVAL '305 days',
        NULL,
        'pending'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '22222222-2222-2222-2222-222222222222',
        '10000000-0000-0000-0000-000000000004',
        'enterprise',
        'active',
        'monthly',
        CURRENT_DATE - INTERVAL '120 days',
        CURRENT_DATE + INTERVAL '245 days',
        NULL,
        'pending'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        '33333333-3333-3333-3333-333333333333',
        '10000000-0000-0000-0000-000000000001',
        'trial',
        'trialing',
        'monthly',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '14 days',
        CURRENT_DATE + INTERVAL '14 days',
        'pending'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    plan_code = EXCLUDED.plan_code;

-- ------------------------------------------------------------------------------
-- 4. GYM_INVITATIONS (Staff and Athlete Onboarding Invites)
-- ------------------------------------------------------------------------------
INSERT INTO public.gym_invitations (id, gym_id, email, role, invitation_token_hash, expires_at)
VALUES
    ('1111bbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'newcoach@ironpulse.com', 'trainer', 'tok_hash_coach_101', now() + INTERVAL '7 days'),
    ('1111bbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'vip.athlete@gmail.com', 'member', 'tok_hash_athlete_202', now() + INTERVAL '5 days'),
    ('2222bbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'headcoach@titanforge.in', 'trainer', 'tok_hash_headcoach_303', now() + INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. MEMBERSHIP_PLANS (Tier Configuration Defined by Gym Owner)
-- ------------------------------------------------------------------------------
INSERT INTO public.membership_plans (id, gym_id, plan_name, duration_months, price, description, status)
VALUES
    (
        'aaaa1111-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'Monthly Standard',
        1,
        2999.00,
        'Standard floor and cardio zone access with digital locker keys and shower access.',
        'active'
    ),
    (
        'aaaa1111-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'Quarterly Pro Transformation',
        3,
        7499.00,
        'Full gym access with 2 1-on-1 personal trainer sessions and InBody body composition scan.',
        'active'
    ),
    (
        'aaaa1111-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'Annual Elite VIP',
        12,
        21999.00,
        'VIP locker, unlimited sauna, 12 personal training sessions, nutrition planning & free merch.',
        'active'
    ),
    (
        'aaaa2222-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222',
        'CrossFit Unlimited Monthly',
        1,
        4999.00,
        'Unlimited WOD sessions, open gym, and Olympic lifting platforms.',
        'active'
    ),
    (
        'aaaa2222-0000-0000-0000-000000000002',
        '22222222-2222-2222-2222-222222222222',
        'CrossFit Annual Athlete',
        12,
        39999.00,
        'Full year unlimited access + competition preparation clinics.',
        'active'
    )
ON CONFLICT (id) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    duration_months = EXCLUDED.duration_months,
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 6. TRAINERS (Gym Coaching Staff)
-- ------------------------------------------------------------------------------
INSERT INTO public.trainers (id, gym_id, profile_id, specialization, experience, salary, availability)
VALUES
    (
        'bbbb1111-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000011',
        'Strength & Conditioning, Hypertrophy',
        '5+ years',
        45000.00,
        '06:00 AM - 02:00 PM'
    ),
    (
        'bbbb1111-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000012',
        'CrossFit & HIIT Fat Loss',
        '4+ years',
        40000.00,
        '01:00 PM - 09:00 PM'
    ),
    (
        'bbbb1111-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000013',
        'Rehabilitation, Mobility & Olympic Lifting',
        '6+ years',
        50000.00,
        '07:00 AM - 03:00 PM'
    )
ON CONFLICT (id) DO UPDATE SET
    specialization = EXCLUDED.specialization,
    experience = EXCLUDED.experience,
    salary = EXCLUDED.salary,
    availability = EXCLUDED.availability;

-- ------------------------------------------------------------------------------
-- 7. MEMBERS (Gym Athletes & Clients)
-- ------------------------------------------------------------------------------
INSERT INTO public.members (
    id, gym_id, full_name, email, phone, date_of_birth, gender, address, emergency_contact,
    membership_plan_id, joining_date, expiry_date, status
)
VALUES
    (
        'cccc1111-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'Vikram Malhotra',
        'vikram.malhotra@gmail.com',
        '+91 98201 12345',
        '1992-06-14',
        'Male',
        '702 Sea View Apartments, Bandra, Mumbai',
        '+91 98201 99999 (Father)',
        'aaaa1111-0000-0000-0000-000000000003',
        '2026-01-15',
        '2027-01-15',
        'active'
    ),
    (
        'cccc1111-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'Ananya Sen',
        'ananya.sen@outlook.com',
        '+91 98202 23456',
        '1995-11-20',
        'Female',
        '14 Palm Beach Enclave, Khar West, Mumbai',
        '+91 98202 88888 (Sister)',
        'aaaa1111-0000-0000-0000-000000000002',
        '2026-09-01',
        '2026-12-01',
        'active'
    ),
    (
        'cccc1111-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'Kabir Deshmukh',
        'kabir.d@techcorp.in',
        '+91 98203 34567',
        '1989-03-25',
        'Male',
        '404 Regency Court, Santacruz West, Mumbai',
        '+91 98203 77777 (Spouse)',
        'aaaa1111-0000-0000-0000-000000000001',
        '2026-10-18',
        '2026-11-18',
        'expiring_soon'
    ),
    (
        'cccc1111-0000-0000-0000-000000000004',
        '11111111-1111-1111-1111-111111111111',
        'Sneha Kapoor',
        'sneha.kapoor@gmail.com',
        '+91 98204 45678',
        '1997-08-10',
        'Female',
        '22 Hill Road, Bandra, Mumbai',
        '+91 98204 66666 (Mother)',
        'aaaa1111-0000-0000-0000-000000000001',
        '2026-09-10',
        '2026-10-10',
        'expired'
    ),
    (
        'cccc1111-0000-0000-0000-000000000005',
        '11111111-1111-1111-1111-111111111111',
        'Arjun Nair',
        'arjun.nair@startup.io',
        '+91 98205 56789',
        '1994-01-30',
        'Male',
        '101 Green Glen Heights, Juhu, Mumbai',
        '+91 98205 55555 (Brother)',
        'aaaa1111-0000-0000-0000-000000000002',
        '2026-10-01',
        '2027-01-01',
        'active'
    )
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    gender = EXCLUDED.gender,
    membership_plan_id = EXCLUDED.membership_plan_id,
    expiry_date = EXCLUDED.expiry_date,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 8. PAYMENTS (Transactions, Razorpay, UPI & Invoices)
-- ------------------------------------------------------------------------------
INSERT INTO public.payments (
    id, gym_id, member_id, amount, payment_method, transaction_id, payment_status, payment_date
)
VALUES
    (
        'dddd1111-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000001',
        21999.00,
        'razorpay',
        'pay_rzp_live_2026011501',
        'completed',
        '2026-01-15 10:30:00+00'
    ),
    (
        'dddd1111-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000002',
        7499.00,
        'upi',
        'upi_axis_2026090102',
        'completed',
        '2026-09-01 11:15:00+00'
    ),
    (
        'dddd1111-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000003',
        2999.00,
        'razorpay',
        'pay_rzp_live_pending_03',
        'pending',
        '2026-11-10 14:00:00+00'
    ),
    (
        'dddd1111-0000-0000-0000-000000000004',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000005',
        7499.00,
        'cash',
        'cash_rcpt_2026100104',
        'completed',
        '2026-10-01 16:45:00+00'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. ATTENDANCE (Turnstile & QR Scanner Daily Logs)
-- ------------------------------------------------------------------------------
INSERT INTO public.attendance (id, gym_id, member_id, check_in, check_out, attendance_date)
VALUES
    (
        'eeee1111-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000001',
        now() - INTERVAL '2 hours',
        now() - INTERVAL '30 minutes',
        CURRENT_DATE
    ),
    (
        'eeee1111-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000002',
        now() - INTERVAL '1 hour 15 minutes',
        NULL,
        CURRENT_DATE
    ),
    (
        'eeee1111-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000005',
        now() - INTERVAL '45 minutes',
        NULL,
        CURRENT_DATE
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. WORKOUT_PLANS (Custom Training Programs & Splits)
-- ------------------------------------------------------------------------------
INSERT INTO public.workout_plans (id, gym_id, member_id, trainer_id, title, description, start_date, end_date)
VALUES
    (
        'ffff1111-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000001',
        'bbbb1111-0000-0000-0000-000000000001',
        'Hypertrophy Push / Pull / Legs Split',
        '6-day advanced resistance cycle focusing on progressive overload and bench press peak.',
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '60 days'
    ),
    (
        'ffff1111-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000002',
        'bbbb1111-0000-0000-0000-000000000002',
        'Functional HIIT & Caloric Burn Protocol',
        'Metabolic conditioning with kettlebells, rowing sprints, and core stability circuits.',
        CURRENT_DATE - INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '45 days'
    ),
    (
        'ffff1111-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000005',
        'bbbb1111-0000-0000-0000-000000000003',
        'Olympic Weightlifting Clean & Jerk Technique Block',
        'Snatch balance drills, clean pulls, jerk recoveries, and spinal decompression.',
        CURRENT_DATE - INTERVAL '10 days',
        CURRENT_DATE + INTERVAL '50 days'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 11. NOTIFICATIONS (In-App & Multi-Channel Alerts)
-- ------------------------------------------------------------------------------
INSERT INTO public.notifications (id, gym_id, member_id, title, message, notification_type, is_read)
VALUES
    (
        '1111cccc-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000003',
        'Membership Expiring in 5 Days',
        'Your Monthly Standard membership will expire on 18 Nov 2026. Renew early to retain uninterrupted gym floor access.',
        'expiry_reminder',
        false
    ),
    (
        '1111cccc-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000001',
        'Payment Receipt (₹21,999)',
        'Payment confirmed for Annual Elite VIP plan. Tax invoice INV-2026-001 is ready for download.',
        'payment_receipt',
        true
    ),
    (
        '1111cccc-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'cccc1111-0000-0000-0000-000000000002',
        'New Workout Assigned by Priya Sharma',
        'Trainer Priya has assigned your Functional HIIT & Caloric Burn Protocol.',
        'workout_assigned',
        false
    ),
    (
        '1111cccc-0000-0000-0000-000000000004',
        '11111111-1111-1111-1111-111111111111',
        NULL,
        'Holiday Notice - Gym Floor Schedule',
        'IronPulse will operate special holiday hours (07:00 AM to 01:00 PM) this coming Sunday.',
        'alert',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 12. SUBSCRIPTIONS (Gym Tenant SaaS Subscription with GymFlow AI)
-- ------------------------------------------------------------------------------
INSERT INTO public.subscriptions (id, gym_id, plan_name, price, billing_cycle, status, start_date, end_date)
VALUES
    (
        '2222dddd-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'pro',
        4999.00,
        'monthly',
        'active',
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE + INTERVAL '305 days'
    ),
    (
        '2222dddd-0000-0000-0000-000000000002',
        '22222222-2222-2222-2222-222222222222',
        'enterprise',
        12999.00,
        'monthly',
        'active',
        CURRENT_DATE - INTERVAL '120 days',
        CURRENT_DATE + INTERVAL '245 days'
    ),
    (
        '2222dddd-0000-0000-0000-000000000003',
        '33333333-3333-3333-3333-333333333333',
        'starter',
        2499.00,
        'monthly',
        'trialing',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '14 days'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 13. AUDIT_LOGS (System-Wide Security & Event Trail)
-- ------------------------------------------------------------------------------
INSERT INTO public.audit_logs (id, gym_id, user_id, action, entity_type, entity_id)
VALUES
    (
        '3333eeee-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000002',
        'REGISTER_GYM',
        'gyms',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '3333eeee-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000002',
        'CREATE_MEMBERSHIP_PLAN',
        'membership_plans',
        'aaaa1111-0000-0000-0000-000000000003'
    ),
    (
        '3333eeee-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000002',
        'REGISTER_MEMBER',
        'members',
        'cccc1111-0000-0000-0000-000000000001'
    ),
    (
        '3333eeee-0000-0000-0000-000000000004',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000002',
        'COLLECT_PAYMENT',
        'payments',
        'dddd1111-0000-0000-0000-000000000001'
    ),
    (
        '3333eeee-0000-0000-0000-000000000005',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000011',
        'ASSIGN_WORKOUT',
        'workout_plans',
        'ffff1111-0000-0000-0000-000000000001'
    )
ON CONFLICT (id) DO NOTHING;
