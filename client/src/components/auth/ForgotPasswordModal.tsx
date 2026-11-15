import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onBackToLogin }) => {
  const { sendPasswordReset, openAuthModal } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const res = await sendPasswordReset(email);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      setErrorMessage(res.error || 'Failed to dispatch reset link.');
    }
  };

  return (
    <div className="space-y-5 text-xs">
      <div className="text-center">
        <div className="w-11 h-11 rounded-2xl bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30 flex items-center justify-center mx-auto mb-3">
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-black text-white">Reset Account Password</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Enter your registered email address and we'll send a secure password reset link.
        </p>
      </div>

      {isSuccess ? (
        <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#B6FF45]/30 text-center space-y-3 animate-in fade-in">
          <CheckCircle2 className="w-10 h-10 text-[#B6FF45] mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-white">Reset Instructions Dispatched!</h4>
            <p className="text-xs text-zinc-400 mt-1">
              We've dispatched recovery credentials to <strong className="text-white">{email}</strong>.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => openAuthModal('reset_password')}
              className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider"
            >
              Enter New Password Now
            </button>
          </div>

          <button
            onClick={onBackToLogin}
            className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </button>
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
            <label className="block font-semibold text-zinc-300 mb-1.5">Registered Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="owner@ironpulse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
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
                <span>Send Password Reset Link</span>
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
