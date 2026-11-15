import { Router } from 'express';
import {
  supabase,
  isSupabaseConfigured,
  inMemoryDB,
  getUserAuthorizedGyms,
  validateGymAccess,
} from '../services/supabaseService.js';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/gyms/my-gyms - Returns gyms the logged-in user belongs to (for Gym Switcher)
router.get('/my-gyms', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const gyms = getUserAuthorizedGyms(req.user.id, req.user.role);
  return res.json({ gyms });
});

// POST /api/gyms/switch - Validate and switch active gym context
router.post('/switch', authMiddleware, async (req: AuthRequest, res): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { gymId } = req.body;
  if (!gymId) {
    return res.status(400).json({ error: 'Target gymId is required' });
  }

  const isAuthorized = validateGymAccess(req.user.id, req.user.role, gymId);
  if (!isAuthorized) {
    return res.status(403).json({
      error: 'Access Denied: You do not belong to this gym.',
    });
  }

  const targetGym = inMemoryDB.gyms.find((g) => g.id === gymId);
  if (!targetGym) {
    return res.status(404).json({ error: 'Gym not found' });
  }

  // Update caller active gym in profile
  const profile = inMemoryDB.profiles.find((p) => p.id === req.user?.id);
  if (profile) {
    profile.gym_id = gymId;
  }

  return res.json({
    success: true,
    message: `Active gym switched to ${targetGym.gym_name || targetGym.name}`,
    activeGym: targetGym,
  });
});

// GET /api/gyms (Super Admin lists all; Gym Owner/Staff gets their authorized gyms)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user?.role === 'super_admin') {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ gyms: data });
    }
    return res.json({ gyms: inMemoryDB.gyms });
  }

  const userGyms = getUserAuthorizedGyms(req.user?.id || '', req.user?.role);
  return res.json({ gyms: userGyms });
});

// GET /api/gyms/:id - Gym details
router.get('/:id', authMiddleware, async (req: AuthRequest, res): Promise<any> => {
  const targetGymId = String(req.params.id);
  const isAuthorized = validateGymAccess(req.user?.id || '', req.user?.role || '', targetGymId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized to view this gym' });
  }

  const gym = inMemoryDB.gyms.find((g) => g.id === targetGymId);
  if (!gym) return res.status(404).json({ error: 'Gym not found' });
  return res.json({ gym });
});

// PUT /api/gyms/:id - Update Gym Settings (Owner or Super Admin only)
router.put('/:id', authMiddleware, async (req: AuthRequest, res): Promise<any> => {
  const targetGymId = String(req.params.id);
  const isOwner = req.user?.gymId === targetGymId && req.user?.role === 'gym_owner';
  const isSuperAdmin = req.user?.role === 'super_admin';

  if (!isOwner && !isSuperAdmin) {
    return res.status(403).json({ error: 'Only gym owners or super admins can modify gym settings' });
  }

  const gym = inMemoryDB.gyms.find((g) => g.id === targetGymId);
  if (!gym) return res.status(404).json({ error: 'Gym not found' });

  const { gymName, phone, email, address, city, state, country, logoUrl } = req.body;
  if (gymName) {
    gym.gym_name = gymName;
    gym.name = gymName;
  }
  if (phone) gym.phone = phone;
  if (email) gym.email = email;
  if (address) gym.address = address;
  if (city) gym.city = city;
  if (state) (gym as any).state = state;
  if (country) (gym as any).country = country;
  if (logoUrl) (gym as any).logo_url = logoUrl;

  return res.json({ success: true, gym, message: 'Gym profile updated successfully' });
});

// POST /api/gyms (Super Admin only)
router.post('/', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { name, gymName, city, state, country, plan, phone, email, memberLimit, address } = req.body;
  const targetGymName = gymName || name || 'New Gym Tenant';

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('gyms')
      .insert({
        gym_name: targetGymName,
        owner_id: req.user?.id || null,
        address: address || city || 'Standard Facility Location',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        country: country || 'India',
        phone: phone || '+91 99000 00000',
        email: email || 'contact@gym.com',
        status: 'active',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ success: true, gym: data });
  }

  const newGym = {
    id: `gym-${Date.now()}`,
    gym_name: targetGymName,
    name: targetGymName,
    slug: targetGymName.toLowerCase().replace(/\s+/g, '-'),
    city: city || 'Mumbai',
    state: state || 'Maharashtra',
    country: country || 'India',
    currency: 'INR',
    phone: phone || '+91 99000 00000',
    email: email || 'contact@gym.com',
    plan: plan || 'trial',
    planStatus: 'active',
    status: 'active',
    memberLimit: memberLimit || 50,
    trainerLimit: 2,
    activeMembersCount: 0,
    totalRevenueMonthly: 0,
    created_at: new Date().toISOString(),
  };
  inMemoryDB.gyms.push(newGym as any);

  res.status(201).json({ success: true, gym: newGym });
});

// PUT /api/gyms/:id/status (Super Admin only: activate, suspend, deactivate)
router.put('/:id/status', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { status } = req.body;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('gyms')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, gym: data, message: `Gym status updated to ${status}` });
  }

  const gym = inMemoryDB.gyms.find((g) => g.id === req.params.id);
  if (gym) {
    gym.status = status;
    gym.planStatus = status;
  }

  inMemoryDB.audit_logs.push({
    id: `log-${Date.now()}`,
    gym_id: req.params.id,
    user_id: req.user?.id || null,
    action: `UPDATE_GYM_STATUS_${status.toUpperCase()}`,
    entity_type: 'gyms',
    entity_id: req.params.id,
    created_at: new Date().toISOString(),
  } as any);

  res.json({ success: true, message: `Gym status updated to ${status}` });
});

export default router;
