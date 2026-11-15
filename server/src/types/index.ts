export type UserRole = 'super_admin' | 'gym_owner' | 'trainer' | 'member';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  gymId?: string;
  fullName: string;
}

export interface GymTenant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  phone: string;
  email: string;
  address?: string;
  city: string;
  country: string;
  currency: string;
  plan: PlanTier;
  planStatus: 'active' | 'trialing' | 'past_due' | 'suspended';
  memberLimit: number;
  trainerLimit: number;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  whatsappPhoneId?: string;
  aiInsightsEnabled: boolean;
  createdAt: string;
}
