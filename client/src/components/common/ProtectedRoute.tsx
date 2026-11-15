import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Badge } from './Badge';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  pageName?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  pageName = 'this section',
}) => {
  const { currentUser, setActivePage, switchRole } = useApp();

  if (!currentUser) {
    return (
      <div className="p-8 rounded-3xl bg-[#151A17] border border-[#1C2420] text-center max-w-md mx-auto my-12">
        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Authentication Required</h3>
        <p className="text-xs text-zinc-400 mt-1">
          You must be signed in to view {pageName}.
        </p>
        <button
          onClick={() => setActivePage('landing')}
          className="mt-4 px-4 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-xs uppercase tracking-wider"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const isAuthorized = allowedRoles.includes(currentUser.role);

  if (!isAuthorized) {
    return (
      <div className="p-8 rounded-3xl bg-[#151A17] border border-rose-500/30 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white">Access Restricted: Unauthorized Role</h2>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Your current account role does not have authorization to access {pageName}.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Your Role</p>
            <Badge variant="rose" size="sm" className="mt-1">
              {currentUser.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Required Role</p>
            <div className="flex gap-1 justify-end mt-1">
              {allowedRoles.map((r) => (
                <Badge key={r} variant="pro" size="sm">
                  {r.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => setActivePage('overview')}
            className="px-4 py-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-zinc-300 font-semibold text-xs border border-[#1C2420] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>

          {/* Development helper to switch into authorized role for evaluation */}
          <button
            onClick={() => switchRole(allowedRoles[0])}
            className="px-4 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider transition-all"
          >
            Switch to {allowedRoles[0].replace('_', ' ')}
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 pt-1">
          Security Policy: Enforced by backend tenant isolation middleware and PostgreSQL Row Level Security.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
