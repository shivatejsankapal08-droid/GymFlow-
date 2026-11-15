import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Tag,
  QrCode,
  CreditCard,
  Flame,
  Bot,
  BarChart3,
  Zap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  DollarSign,
  Headphones,
  Megaphone,
  Activity,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { currentGym, currentUser, activePage, setActivePage, logout, members, payments } = useApp();

  const pendingPaymentsCount = payments.filter((p) => p.paymentStatus === 'pending').length;

  interface SidebarNavItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
    isAi?: boolean;
    alert?: boolean;
  }

  const gymOwnerNavItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users, badge: `${members.length}` },
    { id: 'trainers', label: 'Trainers', icon: Dumbbell },
    { id: 'plans', label: 'Membership Plans', icon: Tag },
    { id: 'attendance', label: 'Attendance', icon: QrCode },
    { id: 'payments', label: 'Payments', icon: CreditCard, alert: pendingPaymentsCount > 0 },
    { id: 'workouts', label: 'Workout & Diet Plans', icon: Flame },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, isAi: true },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'automations', label: 'Automation', icon: Zap },
    { id: 'subscription', label: 'SaaS Subscription', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const superAdminNavItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'all-gyms', label: 'All Gyms', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'saas-plans', label: 'SaaS Plans', icon: Tag },
    { id: 'subscriptions', label: 'Subscriptions', icon: ShieldCheck },
    { id: 'platform-revenue', label: 'Platform Revenue', icon: DollarSign },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'support-tickets', label: 'Support Tickets', icon: Headphones },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'system-health', label: 'System Health', icon: Activity },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = currentUser?.role === 'super_admin' ? superAdminNavItems : gymOwnerNavItems;

  return (
    <aside
      className={`relative flex flex-col bg-[#090B0A] border-r border-[#1C2420] transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1C2420] bg-[#090B0A]">
        {!isCollapsed ? (
          <div
            onClick={() => setActivePage('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-xl flex items-center justify-center shadow-lg shadow-[#B6FF45]/20 group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">GYMFLOW</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30">
                  {currentUser?.role === 'super_admin' ? 'ADMIN' : 'AI'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate max-w-[130px] font-medium">
                {currentUser?.role === 'super_admin' ? 'SaaS Platform Control' : currentGym.name}
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setActivePage('overview')}
            className="w-10 h-10 mx-auto rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-xl flex items-center justify-center shadow-lg shadow-[#B6FF45]/20 cursor-pointer"
          >
            G
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-zinc-400 hover:text-white hover:bg-[#151A17] border border-transparent hover:border-[#1C2420] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            activePage === item.id || (item.id === 'overview' && activePage === 'dashboard');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/40 shadow-sm shadow-[#B6FF45]/10'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#151A17]/60 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-[#B6FF45]' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!isCollapsed && item.isAi && (
                <Sparkles className="w-3.5 h-3.5 text-[#B6FF45] shrink-0" />
              )}

              {!isCollapsed && item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1C2420] text-zinc-300 border border-zinc-700">
                  {item.badge}
                </span>
              )}

              {!isCollapsed && item.alert && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
              )}

              {/* Neon Green Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#B6FF45] shadow-[0_0_10px_#B6FF45]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Logout Action */}
      <div className="p-3 border-t border-[#1C2420] bg-[#090B0A]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
