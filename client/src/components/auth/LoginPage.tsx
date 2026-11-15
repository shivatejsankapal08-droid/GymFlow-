import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Building2, 
  ShieldAlert, 
  Dumbbell, 
  UserCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  Database,
  ArrowLeft
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { 
    loginWithCredentials, 
    login, 
    setActivePage, 
    openAuthModal,
    isSupabaseLive,
    closeAuthModal
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithCredentials(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    login(role);
  };

  return (
    <div className="min-h-screen bg-[#090B0A] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#B6FF45]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <button
        onClick={() => {
          closeAuthModal();
          setActivePage('landing');
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-[#B6FF45] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Website</span>
      </button>

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#151A17] border border-[#1C2420] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 glow-card">
        {/* Header with GymFlow AI Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#B6FF45] text-[#090B0A] font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#B6FF45]/20">
            G
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="font-extrabold tracking-tight text-white text-xl">GYMFLOW</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded font-black bg-[#B6FF45]/20 text-[#B6FF45] border border-[#B6FF45]/30">
              AI
            </span>
          </div>
          <p className="text-xs text-zinc-400">Smart Gym Management. Powered by AI.</p>
        </div>

        {/* Supabase Status Banner */}
        <div className="mb-5 p-2.5 rounded-xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Auth Engine:</span>
          </div>
          <span className={`font-semibold flex items-center gap-1 ${isSupabaseLive ? 'text-[#B6FF45]' : 'text-amber-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseLive ? 'bg-[#B6FF45]' : 'bg-amber-400'}`} />
            {isSupabaseLive ? 'Supabase Live Auth' : 'Demo Mode (Instant)'}
          </span>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">Business Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="owner@ironpulse.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">Account Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-zinc-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#1C2420] text-[#B6FF45] focus:ring-[#B6FF45] bg-[#0F1311] w-3.5 h-3.5 accent-[#B6FF45]"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => openAuthModal('forgot_password')}
              className="text-[#B6FF45] hover:underline font-semibold"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#B6FF45]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#090B0A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Create Account Link */}
        <div className="mt-5 text-center text-xs text-zinc-400 border-t border-[#1C2420] pt-4">
          <span>Don't have a gym account yet? </span>
          <button
            onClick={() => openAuthModal('register')}
            className="text-[#B6FF45] font-bold hover:underline"
          >
            Start 14-Day Pro Trial
          </button>
        </div>

        {/* Quick Demo 1-Click Persona Login */}
        <div className="mt-6 pt-5 border-t border-[#1C2420]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B6FF45]" />
              Quick Demo Personas:
            </span>
            <span className="text-[10px] text-zinc-400">1-click test</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('gym_owner')}
              className="p-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-[#B6FF45]/40 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#B6FF45] shrink-0" />
                <div>
                  <p className="font-bold text-white group-hover:text-[#B6FF45] transition-colors">Gym Owner</p>
                  <p className="text-[10px] text-zinc-400">IronPulse Club</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('super_admin')}
              className="p-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-purple-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="font-bold text-white group-hover:text-purple-300 transition-colors">Super Admin</p>
                  <p className="text-[10px] text-zinc-400">Platform Ops</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('trainer')}
              className="p-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">Trainer</p>
                  <p className="text-[10px] text-zinc-400">Alex Rivera</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('member')}
              className="p-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-amber-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-white group-hover:text-amber-300 transition-colors">Gym Member</p>
                  <p className="text-[10px] text-zinc-400">Vikram Malhotra</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
