import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { UserRole, AuthScreenMode } from '../../types';
import { 
  Building2, 
  ShieldAlert, 
  Dumbbell, 
  UserCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  Database
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { EmailVerificationNotice } from './EmailVerificationNotice';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    closeAuthModal, 
    login, 
    loginWithCredentials, 
    registerOwner, 
    isSupabaseLive,
    openAuthModal,
    setActivePage
  } = useApp();

  const [activeMode, setActiveMode] = useState<AuthScreenMode>(authModalMode);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [fullName, setFullName] = useState('');
  const [gymName, setGymName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Common States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync mode with context
  useEffect(() => {
    setActiveMode(authModalMode);
    setErrorMessage('');
  }, [authModalMode, isAuthModalOpen]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await loginWithCredentials(loginEmail, loginPassword);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid credentials');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('You must accept the Terms of Service & Privacy Policy to register.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const res = await registerOwner({
      fullName,
      gymName,
      email: regEmail,
      phone: regPhone,
      city: regCity,
      password: regPassword,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
      return;
    }

    if (res.requiresEmailVerification) {
      setActiveMode('verify_email');
    } else {
      closeAuthModal();
      setActivePage('overview');
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    login(role);
  };

  // Determine title and subtitle
  const getModalMeta = () => {
    switch (activeMode) {
      case 'register':
        return {
          title: 'Register Your Gym (14-Day Free Pro Trial)',
          subtitle: 'Create a multi-tenant gym account with AI copilot & WhatsApp automation',
          maxWidth: 'lg' as const,
        };
      case 'forgot_password':
        return {
          title: 'Recover Account Access',
          subtitle: 'Send password reset instructions to your registered email',
          maxWidth: 'md' as const,
        };
      case 'reset_password':
        return {
          title: 'Reset Account Password',
          subtitle: 'Create a new secure password for GymFlow AI',
          maxWidth: 'md' as const,
        };
      case 'verify_email':
        return {
          title: 'Account Verification Required',
          subtitle: 'Verify your business email address to finalize tenant provisioning',
          maxWidth: 'md' as const,
        };
      case 'login':
      default:
        return {
          title: 'Sign In to GymFlow AI',
          subtitle: 'Smart Gym Management. Powered by AI.',
          maxWidth: 'md' as const,
        };
    }
  };

  const meta = getModalMeta();

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={meta.title}
      subtitle={meta.subtitle}
      maxWidth={meta.maxWidth}
    >
      <div className="space-y-4">
        {/* Supabase Status Banner */}
        <div className="p-2.5 rounded-xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Auth Engine:</span>
          </div>
          <span className={`font-semibold flex items-center gap-1 ${isSupabaseLive ? 'text-[#B6FF45]' : 'text-amber-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseLive ? 'bg-[#B6FF45]' : 'bg-amber-400'}`} />
            {isSupabaseLive ? 'Supabase Live Auth' : 'Demo Mode Active'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1 font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {activeMode === 'login' && (
          <div className="space-y-4 text-xs">
            {/* Quick Demo 1-Click Login Toolbar */}
            <div className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B6FF45]" />
                  Instant Demo Logins:
                </span>
                <span className="text-[10px] text-zinc-400">No typing needed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('gym_owner')}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] border border-[#1C2420] hover:border-[#B6FF45]/40 text-left transition-all"
                >
                  <Building2 className="w-4 h-4 text-[#B6FF45] shrink-0" />
                  <div>
                    <p className="font-bold text-white">Gym Owner</p>
                    <p className="text-[10px] text-zinc-400">IronPulse Club</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('super_admin')}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] border border-[#1C2420] hover:border-purple-500/40 text-left transition-all"
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Super Admin</p>
                    <p className="text-[10px] text-zinc-400">Platform Ops</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('trainer')}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] border border-[#1C2420] hover:border-cyan-500/40 text-left transition-all"
                >
                  <Dumbbell className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Trainer</p>
                    <p className="text-[10px] text-zinc-400">Alex Rivera</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('member')}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] border border-[#1C2420] hover:border-amber-500/40 text-left transition-all"
                >
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Member Pass</p>
                    <p className="text-[10px] text-zinc-400">QR & Workout</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative text-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1C2420]" />
              </div>
              <span className="relative bg-[#151A17] px-3 text-[11px] text-zinc-400 font-medium">
                Or sign in with email credentials
              </span>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="owner@ironpulse.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-9 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#1C2420] text-[#B6FF45] bg-[#0F1311] accent-[#B6FF45]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setActiveMode('forgot_password')}
                  className="text-[#B6FF45] hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#B6FF45]/20 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#090B0A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 text-zinc-400">
              <span>Need a new gym account? </span>
              <button
                onClick={() => setActiveMode('register')}
                className="text-[#B6FF45] font-bold hover:underline"
              >
                Start 14-day Pro trial
              </button>
            </div>
          </div>
        )}

        {/* 2. REGISTER MODE */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Owner Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Marcus Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Gym Name *</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="IronPulse Fitness Club"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="owner@ironpulse.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">WhatsApp Phone *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">City / Region *</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Password (Min 8 chars) *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-8 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300 pt-1">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#1C2420] text-[#B6FF45] bg-[#0F1311] accent-[#B6FF45]"
              />
              <span className="text-[11px]">
                I agree to the GymFlow AI Terms of Service and Privacy Policy.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#B6FF45]/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#090B0A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Start Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-zinc-400">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setActiveMode('login')}
                className="text-[#B6FF45] font-bold hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {activeMode === 'forgot_password' && (
          <ForgotPasswordModal onBackToLogin={() => setActiveMode('login')} />
        )}

        {/* 4. RESET PASSWORD MODE */}
        {activeMode === 'reset_password' && (
          <ResetPasswordModal onBackToLogin={() => setActiveMode('login')} />
        )}

        {/* 5. EMAIL VERIFICATION MODE */}
        {activeMode === 'verify_email' && (
          <EmailVerificationNotice
            onProceed={() => {
              closeAuthModal();
              setActivePage('overview');
            }}
          />
        )}
      </div>
    </Modal>
  );
};
