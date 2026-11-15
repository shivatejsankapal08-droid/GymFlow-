import { Router, Response } from 'express';
import {
  supabase,
  isSupabaseConfigured,
  inMemoryDB,
  getUserAuthorizedGyms,
  executeRegisterGymTransaction,
} from '../services/supabaseService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res): Promise<any> => {
  const { email, password, role } = req.body;

  if (!email && !role) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userRole = profile?.role || 'gym_owner';
    const authorizedGyms = getUserAuthorizedGyms(data.user.id, userRole);

    return res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        gymId: profile?.gym_id || (authorizedGyms[0]?.id ?? null),
        fullName: profile?.full_name || 'GymFlow User',
      },
      authorizedGyms,
    });
  }

  // Developer fallback
  const targetRole = role || 'gym_owner';
  // Locate existing profile by email first
  const existingProfile = email ? inMemoryDB.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) : null;

  const targetUserId =
    existingProfile?.id ||
    (targetRole === 'super_admin'
      ? '00000000-0000-0000-0000-000000000001'
      : targetRole === 'gym_owner'
      ? '00000000-0000-0000-0000-000000000002'
      : targetRole === 'trainer'
      ? '00000000-0000-0000-0000-000000000011'
      : '00000000-0000-0000-0000-000000000021');

  const userProfile = existingProfile || inMemoryDB.profiles.find((p) => p.id === targetUserId);
  const authorizedGyms = getUserAuthorizedGyms(targetUserId, (userProfile?.role as string) || targetRole);

  let token = `demo-token-${targetRole}`;
  if (targetUserId === '00000000-0000-0000-0000-000000000003') {
    token = 'demo-token-gym_owner_titan';
  }

  return res.json({
    token,
    user: {
      id: targetUserId,
      email: email || userProfile?.email || `${targetRole}@gymflow.ai`,
      role: (userProfile?.role as string) || targetRole,
      gymId: userProfile?.gym_id || authorizedGyms[0]?.id || '11111111-1111-1111-1111-111111111111',
      fullName: userProfile?.full_name || (targetRole === 'super_admin' ? 'Vikram Aditya' : 'Marcus Vance'),
    },
    authorizedGyms,
  });
});

// POST /api/auth/register-gym (and /api/auth/register-gym-owner)
// Complete Gym Onboarding:
// Fields: gymName, ownerName (or fullName), email, phone, address, city, state, country, password, planCode
router.post(['/register-gym', '/register-gym-owner'], async (req, res): Promise<any> => {
  const gymName = req.body.gymName;
  const ownerName = req.body.ownerName || req.body.fullName;
  const {
    email,
    password,
    phone,
    address,
    city,
    state,
    country,
    planCode,
  } = req.body;

  if (!gymName || !ownerName || !email || !password) {
    return res.status(400).json({
      error: 'Missing required registration parameters (gymName, ownerName/fullName, email, password).',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    let userId = `user-owner-${Date.now()}`;

    if (isSupabaseConfigured && supabase) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: ownerName,
            phone: phone || '',
            role: 'gym_owner',
          },
        },
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Auth registration failed' });
      }
      userId = authData.user.id;
    }

    // Atomic stored procedure / transaction execution
    const registrationResult = await executeRegisterGymTransaction({
      userId,
      fullName: ownerName,
      email,
      phone: phone || '+91 98000 00000',
      gymName,
      address: address || 'Main Facility',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      country: country || 'India',
      planCode: planCode || 'trial',
    });

    const authorizedGyms = getUserAuthorizedGyms(userId, 'gym_owner');

    return res.status(201).json({
      success: true,
      message: 'Gym and Owner account provisioned with 14-day Free Trial. Welcome to GymFlow AI!',
      gym: {
        id: registrationResult.gym_id,
        gym_name: gymName,
        name: gymName,
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        country: country || 'India',
        status: 'active',
      },
      user: {
        id: userId,
        email,
        role: 'gym_owner',
        gymId: registrationResult.gym_id,
        fullName: ownerName,
      },
      authorizedGyms,
      subscription: {
        id: registrationResult.subscription_id,
        planCode: planCode || 'trial',
        status: 'trialing',
        paymentStatus: 'pending',
        trialEndsAt: registrationResult.trial_ends_at,
      },
      redirectUrl: '/overview',
      requiresEmailVerification: false,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res): Promise<any> => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.json({
    success: true,
    message: `Password reset instructions sent to ${email}`,
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res): Promise<any> => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.json({
    success: true,
    message: 'Password successfully updated.',
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res): any => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const authorizedGyms = getUserAuthorizedGyms(req.user.id, req.user.role);
  return res.json({ user: req.user, authorizedGyms });
});

// GET /api/auth/sessions
router.get('/sessions', authMiddleware, (req: AuthRequest, res): any => {
  const sessions = [
    {
      id: 'sess-1',
      userId: req.user?.id,
      gymId: req.user?.gymId,
      ipAddress: '103.21.144.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GymFlow Web App',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  return res.json({ sessions });
});

export default router;
