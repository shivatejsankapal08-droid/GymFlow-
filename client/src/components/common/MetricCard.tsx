import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  subtext?: string;
  accentColor?: 'neon' | 'cyan' | 'purple' | 'amber' | 'rose' | 'emerald';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  subtext,
  accentColor = 'neon',
  onClick,
}) => {
  const accentMap = {
    neon: {
      bg: 'bg-[#B6FF45]/10 text-[#B6FF45] border-[#B6FF45]/25',
      glow: 'hover:border-[#B6FF45]/50 hover:shadow-[0_0_20px_rgba(182,255,69,0.12)]',
      text: 'text-[#B6FF45]',
    },
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
      glow: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      text: 'text-cyan-400',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
      glow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      text: 'text-purple-400',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      glow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      text: 'text-amber-400',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      glow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      text: 'text-rose-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      text: 'text-emerald-400',
    },
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative group p-5 rounded-2xl bg-[#151A17] border border-[#1C2420] transition-all duration-300 backdrop-blur-sm ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${accentMap.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl border ${accentMap.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[#1C2420]">
        {change && (
          <div
            className={`flex items-center gap-1 font-bold ${
              isPositive ? 'text-[#B6FF45]' : 'text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
        {subtext && <span className="text-zinc-500 truncate ml-auto text-[11px] font-medium">{subtext}</span>}
      </div>

      {/* Decorative neon bottom bar on hover */}
      <div className="absolute bottom-0 left-6 right-6 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-[#B6FF45] to-transparent" />
    </div>
  );
};
