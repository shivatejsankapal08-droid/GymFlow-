import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { validateGymAccess, checkGymSuspension, normalizeGymId } from '../services/supabaseService.js';

export const tenantIsolationMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: No authenticated user session' });
    return;
  }

  // Super Admin can access all tenants or switch via x-gym-id
  if (req.user.role === 'super_admin') {
    const rawGymId = (req.headers['x-gym-id'] as string) || req.user.gymId;
    req.gymId = normalizeGymId(rawGymId);
    return next();
  }

  // Identify requested gym
  const rawRequestedGymId =
    (req.headers['x-gym-id'] as string) ||
    req.body?.gymId ||
    req.params?.gymId ||
    req.user.gymId;

  if (!rawRequestedGymId) {
    res.status(403).json({ error: 'Tenant Error: User is not linked to any registered gym tenant' });
    return;
  }

  const requestedGymId = normalizeGymId(rawRequestedGymId);

  // Server-side authorization check: user MUST be authorized for requestedGymId
  const isAuthorized = validateGymAccess(req.user.id, req.user.role, requestedGymId);
  if (!isAuthorized) {
    res.status(403).json({
      error: 'Security Violation: Cross-tenant data access is strictly forbidden. You are not authorized for this gym.',
    });
    return;
  }

  // Check if gym is suspended
  const isSuspended = checkGymSuspension(requestedGymId);
  if (isSuspended) {
    // Only allow subscription / reactivation billing routes if suspended
    const isBillingPath = req.baseUrl?.includes('subscriptions') || req.path?.includes('billing');
    if (!isBillingPath) {
      res.status(403).json({
        error: 'Gym Suspended: This gym account has been suspended by platform administration. Please contact support or update billing.',
        isSuspended: true,
      });
      return;
    }
  }

  req.gymId = requestedGymId;
  next();
};
