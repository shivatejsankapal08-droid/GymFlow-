import { createClient } from '@supabase/supabase-js';

// Load Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

// Instantiate Supabase client (only if valid credentials, otherwise null)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Auth helper interfaces
export interface SignUpGymOwnerParams {
  fullName: string;
  gymName: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  planCode?: string;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requiresEmailVerification?: boolean;
}

/**
 * Register a new gym owner via Supabase Auth + Database Tables
 * Security Rule: Never allow users to select super_admin during public registration.
 */
export async function registerGymOwner(params: SignUpGymOwnerParams): Promise<AuthResponse> {
  if (!isSupabaseConfigured || !supabase) {
    // Return pending status for developer sandbox
    return {
      success: true,
      requiresEmailVerification: true,
      data: {
        id: `usr-${Date.now()}`,
        email: params.email,
        fullName: params.fullName,
        role: 'gym_owner',
        gymName: params.gymName,
      },
    };
  }

  try {
    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          phone: params.phone,
          role: 'gym_owner',
        },
      },
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create auth user' };
    }

    const userId = authData.user.id;
    const slug = params.gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // 2. Create Gym Tenant record
    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .insert({
        name: params.gymName,
        slug,
        phone: params.phone,
        email: params.email,
        city: params.city,
        address: params.address || '',
        plan: 'pro',
        plan_status: 'trialing',
      })
      .select()
      .single();

    if (gymError) {
      return { success: false, error: gymError.message };
    }

    // 3. Create Gym Owner Profile linked to that gym
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        gym_id: gymData.id,
        role: 'gym_owner',
        full_name: params.fullName,
        email: params.email,
        phone: params.phone,
      });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return {
      success: true,
      requiresEmailVerification: !authData.session,
      data: {
        user: authData.user,
        gym: gymData,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}

/**
 * Sign in using Supabase Auth
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      data: {
        id: 'user-owner',
        email,
        role: 'gym_owner',
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch profile to verify role and gym
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, gyms(*)')
      .eq('id', data.user.id)
      .single();

    return {
      success: true,
      data: {
        session: data.session,
        user: data.user,
        profile,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      data: { message: `Demo: Password reset email sent to ${email}` },
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Reset password request failed' };
  }
}

/**
 * Update password (used on reset password screen)
 */
export async function updateUserPassword(newPassword: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      data: { message: 'Password updated successfully in demo mode' },
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update password' };
  }
}
