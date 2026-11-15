import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
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
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Database
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { 
    registerOwner, 
    setActivePage, 
    openAuthModal, 
    closeAuthModal,
    isSupabaseLive,
    setVerificationPendingEmail 
  } = useApp();

  const [fullName, setFullName] = useState('');
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!fullName.trim() || !gymName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const res = await registerOwner({
      fullName,
      gymName,
      email,
      phone,
      password,
      city,
      state,
      country,
      address,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
      return;
    }

    // If email verification is required
    if (res.requiresEmailVerification) {
      setVerificationPendingEmail(email);
      openAuthModal('verify_email');
    } else {
      closeAuthModal();
      setActivePage('overview');
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0A] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#B6FF45]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Website */}
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
      <div className="w-full max-w-xl bg-[#151A17] border border-[#1C2420] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 glow-card">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B6FF45]/10 text-[#B6FF45] border border-[#B6FF45]/20 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>14-Day Free Pro Trial • No Credit Card</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Register Your Gym</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Automate member passes, trainers, attendance and payments with GymFlow AI
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="mb-5 p-2.5 rounded-xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Provisioning System:</span>
          </div>
          <span className={`font-semibold flex items-center gap-1 ${isSupabaseLive ? 'text-[#B6FF45]' : 'text-amber-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseLive ? 'bg-[#B6FF45]' : 'bg-amber-400'}`} />
            {isSupabaseLive ? 'Supabase PostgreSQL RLS' : 'Sandbox Provisioner'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Gym Owner Full Name & Gym Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Owner Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Marcus Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Gym / Fitness Center Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="IronPulse Fitness Club"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Business Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="owner@ironpulse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">WhatsApp Contact Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>
          </div>

          {/* Location: City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Gym City *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">State *</label>
              <input
                type="text"
                required
                placeholder="Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>

          {/* Address & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Full Facility Address</label>
              <input
                type="text"
                placeholder="4th Floor, Platinum Towers, Bandra West"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Country *</label>
              <input
                type="text"
                required
                placeholder="India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Set Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-9 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Password Strength</span>
                <span className={passwordStrength >= 75 ? 'text-[#B6FF45]' : 'text-amber-400'}>
                  {passwordStrength >= 100 ? 'Strong' : passwordStrength >= 50 ? 'Medium' : 'Weak'}
                </span>
              </div>
              <div className="w-full bg-[#0F1311] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 75 ? 'bg-[#B6FF45]' : passwordStrength >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}

          {/* Terms & Conditions Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-zinc-400 hover:text-zinc-300">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#1C2420] text-[#B6FF45] focus:ring-[#B6FF45] bg-[#0F1311] w-4 h-4 accent-[#B6FF45]"
              />
              <span className="text-[11px] leading-relaxed">
                I agree to the <span className="text-[#B6FF45] underline">GymFlow AI Terms of Service</span>, Privacy Policy, and consent to receiving operational WhatsApp notifications.
              </span>
            </label>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-zinc-400 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B6FF45]" />
              Role Assigned:
            </span>
            <span className="text-[#B6FF45] font-semibold">
              Gym Owner (Isolated Tenant Schema & RLS)
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#B6FF45]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#090B0A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration & Activate Trial</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing Account Link */}
        <div className="mt-5 text-center text-xs text-zinc-400 border-t border-[#1C2420] pt-4">
          <span>Already registered? </span>
          <button
            onClick={() => openAuthModal('login')}
            className="text-[#B6FF45] font-bold hover:underline"
          >
            Sign in to existing gym
          </button>
        </div>
      </div>
    </div>
  );
};
