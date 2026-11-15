import React from 'react';

interface BadgeProps {
  variant?: 'active' | 'expiring_soon' | 'expired' | 'frozen' | 'suspended' | 'inactive' | 'secondary' | 'completed' | 'pending' | 'failed' | 'refunded' | 'starter' | 'pro' | 'enterprise' | 'rose';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'active', children, className = '', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-[#151A17] text-zinc-300 border-[#1C2420]';

  switch (variant) {
    case 'active':
    case 'completed':
      colorClasses = 'bg-[#B6FF45]/15 text-[#B6FF45] border-[#B6FF45]/30 font-bold';
      break;
    case 'expiring_soon':
    case 'pending':
      colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-500/30 font-bold';
      break;
    case 'expired':
    case 'failed':
    case 'refunded':
    case 'rose':
      colorClasses = 'bg-rose-950/60 text-rose-400 border-rose-500/30 font-bold';
      break;
    case 'frozen':
      colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
      break;
    case 'suspended':
      colorClasses = 'bg-amber-950/50 text-amber-300 border-amber-500/30 font-semibold';
      break;
    case 'inactive':
    case 'secondary':
      colorClasses = 'bg-zinc-850 text-zinc-400 border-zinc-700';
      break;
    case 'pro':
      colorClasses = 'bg-[#B6FF45]/20 text-[#B6FF45] border-[#B6FF45]/40 font-black tracking-wider';
      break;
    case 'enterprise':
      colorClasses = 'bg-purple-950/70 text-purple-300 border-purple-400/40 font-bold';
      break;
    case 'starter':
      colorClasses = 'bg-zinc-800 text-zinc-300 border-zinc-700';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {children}
    </span>
  );
};
