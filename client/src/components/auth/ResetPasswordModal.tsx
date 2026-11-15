import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  onBackToLogin: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onBackToLogin }) => {
  const { resetUserPassword } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const res = await resetUserPassword(newPassword);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      setErrorMessage(res.error || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-5 text-xs">
      <div className="text-center">
        <div className="w-11 h-11 rounded-2xl bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-black text-white">Create New Password</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Choose a secure password containing at least 8 characters.
        </p>
      </div>

      {isSuccess ? (
        <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#B6FF45]/30 text-center space-y-3 animate-in fade-in">
          <CheckCircle2 className="w-10 h-10 text-[#B6FF45] mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-white">Password Updated Successfully!</h4>
            <p className="text-xs text-zinc-400 mt-1">
              Your account credentials have been synchronized. You can now log in with your new password.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToLogin}
              className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">New Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">Confirm New Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#B6FF45]/20 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#090B0A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Set New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
