import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

interface EmailVerificationNoticeProps {
  onProceed: () => void;
}

export const EmailVerificationNotice: React.FC<EmailVerificationNoticeProps> = ({ onProceed }) => {
  const { verificationPendingEmail, addToast } = useApp();
  const [isResending, setIsResending] = useState(false);

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      addToast({
        type: 'success',
        title: 'Verification Email Resent',
        message: `A fresh confirmation link was sent to ${verificationPendingEmail || 'your email'}`,
      });
    }, 800);
  };

  return (
    <div className="space-y-5 text-xs text-center py-2">
      <div className="w-14 h-14 rounded-3xl bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30 flex items-center justify-center mx-auto mb-2">
        <Mail className="w-7 h-7" />
      </div>

      <div>
        <h3 className="text-xl font-black text-white">Check Your Inbox</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
          We've dispatched an activation link to{' '}
          <strong className="text-white">{verificationPendingEmail || 'your registered business email'}</strong>.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] text-left space-y-2 text-[11px] text-zinc-400">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B6FF45] shrink-0 mt-0.5" />
          <span>Click the verification link to activate your GymFlow AI multi-tenant database.</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B6FF45] shrink-0 mt-0.5" />
          <span>Your 14-Day Pro Trial is reserved with full AI and WhatsApp access.</span>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <button
          onClick={onProceed}
          className="w-full py-3 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#B6FF45]/20 hover:scale-[1.01] transition-all"
        >
          <span>Continue to Gym Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleResend}
          disabled={isResending}
          className="w-full py-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-zinc-300 font-semibold flex items-center justify-center gap-2 border border-[#1C2420] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          <span>{isResending ? 'Dispatching...' : 'Resend Verification Email'}</span>
        </button>
      </div>
    </div>
  );
};
