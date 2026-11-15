import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldAlert, Building2, Dumbbell, UserCheck, ChevronDown, Sparkles } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, currentGym, allGyms, switchRole, switchGym } = useApp();

  if (!currentUser) return null;

  const roles: { role: UserRole; label: string; icon: React.ElementType; color: string }[] = [
    { role: 'gym_owner', label: 'Gym Owner', icon: Building2, color: 'text-[#B6FF45]' },
    { role: 'super_admin', label: 'Super Admin', icon: ShieldAlert, color: 'text-purple-400' },
    { role: 'trainer', label: 'Trainer', icon: Dumbbell, color: 'text-cyan-400' },
    { role: 'member', label: 'Gym Member', icon: UserCheck, color: 'text-amber-400' },
  ];

  return (
    <div className="bg-[#090B0A] border-b border-[#1C2420] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#B6FF45]/15 text-[#B6FF45] font-black border border-[#B6FF45]/30">
          <Sparkles className="w-3.5 h-3.5" />
          Live Role Switcher:
        </span>
        <span className="text-zinc-400 hidden sm:inline">Instant multi-persona preview:</span>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Role buttons */}
        <div className="flex items-center bg-[#151A17] p-1 rounded-xl border border-[#1C2420]">
          {roles.map(({ role, label, icon: Icon, color }) => {
            const isActive = currentUser.role === role;
            return (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  isActive
                    ? 'bg-[#1C2420] text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1C2420]/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? color : 'text-zinc-500'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tenant Gym Selector */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'gym_owner') && (
          <div className="flex items-center gap-1.5 bg-[#151A17] px-2.5 py-1 rounded-xl border border-[#1C2420]">
            <span className="text-zinc-500 text-[11px]">Tenant:</span>
            <select
              value={currentGym.id}
              onChange={(e) => switchGym(e.target.value)}
              className="bg-transparent text-[#B6FF45] font-bold focus:outline-none cursor-pointer pr-1"
            >
              {allGyms.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#0F1311] text-white">
                  {g.name} ({g.city})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
        )}
      </div>
    </div>
  );
};
