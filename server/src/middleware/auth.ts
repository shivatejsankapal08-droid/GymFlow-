import { Request, Response, NextFunction } from 'express';
import { supabase, isSupabaseConfigured, inMemoryDB } from '../services/supabaseService.js';
import { AuthenticatedUser, UserRole } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  gymId?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const demoRoleHeader = req.headers['x-demo-role'] as string;
  const demoGymId = (req.headers['x-gym-id'] as string) || '11111111-1111-1111-1111-111111111111';

  // 1. If a demo role header is provided for evaluation / testing
  if (demoRoleHeader) {
    const targetUserId =
      demoRoleHeader === 'super_admin'
        ? '00000000-0000-0000-0000-000000000001'
        : demoRoleHeader === 'gym_owner'
        ? '00000000-0000-0000-0000-000000000002'
        : demoRoleHeader === 'trainer'
        ? '00000000-0000-0000-0000-000000000011'
        : '00000000-0000-0000-0000-000000000021';

    const profile = inMemoryDB.profiles.find((p) => p.id === targetUserId);
    req.user = {
      id: targetUserId,
      email: profile?.email || `${demoRoleHeader}@gymflow.ai`,
      role: demoRoleHeader as UserRole,
      gymId: demoRoleHeader === 'super_admin' ? undefined : profile?.gym_id || demoGymId,
      fullName: profile?.full_name || `Demo ${demoRoleHeader.toUpperCase()}`,
    };
    return next();
  }

  // 2. If a Bearer token is provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: 'Unauthorized: Invalid Supabase JWT' });
        return;
      }

      // Fetch user profile from Supabase profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      req.user = {
        id: data.user.id,
        email: data.user.email || '',
        role: (profile?.role as UserRole) || 'gym_owner',
        gymId: profile?.gym_id,
        fullName: profile?.full_name || 'GymFlow User',
      };
      return next();
    }

    // Developer demo token handler
    if (token.startsWith('demo-token-')) {
      if (token === 'demo-token-gym_owner_titan') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'contact@titanforge.in',
          role: 'gym_owner',
          gymId: '22222222-2222-2222-2222-222222222222',
          fullName: 'Devika Rao',
        };
        return next();
      }

      if (token === 'demo-token-trainer_vikram') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000099',
          email: 'vikram.rathore@ironpulse.com',
          role: 'trainer',
          gymId: '11111111-1111-1111-1111-111111111111',
          fullName: 'Vikramaditya Rathore',
        };
        return next();
      }

      const rolePart = token.replace('demo-token-', '') as UserRole;
      const targetUserId =
        rolePart === 'super_admin'
          ? '00000000-0000-0000-0000-000000000001'
          : rolePart === 'gym_owner'
          ? '00000000-0000-0000-0000-000000000002'
          : rolePart === 'trainer'
          ? '00000000-0000-0000-0000-000000000011'
          : '00000000-0000-0000-0000-000000000021';

      const profile = inMemoryDB.profiles.find((p) => p.id === targetUserId);
      req.user = {
        id: targetUserId,
        email: profile?.email || `${rolePart}@gymflow.ai`,
        role: rolePart,
        gymId: rolePart === 'super_admin' ? undefined : profile?.gym_id || demoGymId,
        fullName: profile?.full_name || 'GymFlow User',
      };
      return next();
    }
  }

  // Default to Marcus Vance (Gym Owner) for local development
  req.user = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'owner@ironpulse.com',
    role: 'gym_owner',
    gymId: demoGymId,
    fullName: 'Marcus Vance',
  };
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }
    next();
  };
};
