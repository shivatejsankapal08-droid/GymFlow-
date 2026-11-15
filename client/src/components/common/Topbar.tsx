import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Menu, 
  Search, 
  Bell, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  X,
  Sparkles,
  ShieldAlert,
  Dumbbell,
  UserCheck
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const { 
    currentUser, 
    currentGym, 
    allGyms,
    authorizedGyms,
    switchGym,
    switchRole,
    logout,
    setActivePage,
    setIsUserProfileModalOpen,
    globalSearch, 
    setGlobalSearch 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGymMenu, setShowGymMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const gymRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (gymRef.current && !gymRef.current.contains(e.target as Node)) {
        setShowGymMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Format today's date: "Friday, 13 Nov 2026"
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-[#090B0A]/95 backdrop-blur-md border-b border-[#1C2420] px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile hamburger & Current Gym + Date Display */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#151A17] border border-transparent hover:border-[#1C2420]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Gym Selector & Info */}
        <div className="relative" ref={gymRef}>
          <button
            onClick={() => setShowGymMenu(!showGymMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all text-xs font-semibold text-white"
          >
            <Building2 className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">{currentGym.name}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showGymMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-[#0F1311] border border-[#1C2420] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#1C2420] mb-1.5">
                <span>Switch Gym Tenant</span>
                <span className="text-[#B6FF45] font-mono text-[9px] bg-[#B6FF45]/10 px-1.5 py-0.5 rounded">
                  {authorizedGyms.length} Authorized
                </span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {authorizedGyms.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      switchGym(g.id);
                      setShowGymMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                      g.id === currentGym.id
                        ? 'bg-[#151A17] text-[#B6FF45] font-bold border border-[#B6FF45]/30'
                        : 'text-zinc-300 hover:bg-[#151A17] hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold">{g.name}</p>
                        {g.planStatus === 'suspended' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400">{g.city}, {g.country}</p>
                    </div>
                    {g.id === currentGym.id && (
                      <span className="w-2 h-2 rounded-full bg-[#B6FF45]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-zinc-400 font-medium pl-2 border-l border-[#1C2420]">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search members, phone, trainer or invoice..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#B6FF45] transition-colors"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Notifications & User Profile with Dropdown */}
      <div className="flex items-center gap-3">
        {/* Notification Icon & Panel */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-white bg-[#151A17] hover:bg-[#1C2420] border border-[#1C2420] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B6FF45] animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B6FF45]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0F1311] border border-[#1C2420] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2420]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Notifications
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B6FF45]/20 text-[#B6FF45]">
                    3 New
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Arjun Nair checked in</span>
                    <span className="text-[10px] text-zinc-400">5m ago</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-1">
                    IP-1005 • Scanned QR at Entrance Turnstile A
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#151A17] border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">Upcoming Expiry Alert</span>
                    <span className="text-[10px] text-zinc-400">1h ago</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-1">
                    Kabir Deshmukh expires in 5 days. WhatsApp renewal message queued.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#B6FF45]">₹7,499 Razorpay Payment</span>
                    <span className="text-[10px] text-zinc-400">2h ago</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-1">
                    Arjun Nair • Quarterly Pro Transformation renewed
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowNotifications(false);
                  setActivePage('automations');
                }}
                className="w-full mt-2 py-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] text-center text-xs font-bold text-[#B6FF45] border border-[#1C2420] transition-colors"
              >
                View Automation Logs
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Working Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all text-left"
          >
            <div className="hidden md:block">
              <p className="text-xs font-bold text-white truncate max-w-[120px]">
                {currentUser.fullName}
              </p>
              <p className="text-[10px] text-zinc-400 capitalize">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>

            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#B6FF45]/40"
            />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0F1311] border border-[#1C2420] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#1C2420] pb-3">
                <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
                <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] text-[10px] font-bold uppercase tracking-wider border border-[#B6FF45]/20">
                  <Sparkles className="w-3 h-3" />
                  <span>{currentUser.role.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Instant Role Switching options inside profile */}
              <div className="py-2 border-b border-[#1C2420]">
                <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Impersonate Perspective:
                </p>
                <div className="grid grid-cols-2 gap-1 px-1">
                  <button
                    onClick={() => {
                      switchRole('gym_owner');
                      setShowProfileMenu(false);
                    }}
                    className="p-1.5 rounded-lg text-[11px] text-left hover:bg-[#151A17] text-zinc-300 hover:text-[#B6FF45] flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3" /> Owner
                  </button>
                  <button
                    onClick={() => {
                      switchRole('super_admin');
                      setShowProfileMenu(false);
                    }}
                    className="p-1.5 rounded-lg text-[11px] text-left hover:bg-[#151A17] text-zinc-300 hover:text-purple-400 flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" /> Admin
                  </button>
                  <button
                    onClick={() => {
                      switchRole('trainer');
                      setShowProfileMenu(false);
                    }}
                    className="p-1.5 rounded-lg text-[11px] text-left hover:bg-[#151A17] text-zinc-300 hover:text-cyan-400 flex items-center gap-1"
                  >
                    <Dumbbell className="w-3 h-3" /> Trainer
                  </button>
                  <button
                    onClick={() => {
                      switchRole('member');
                      setShowProfileMenu(false);
                    }}
                    className="p-1.5 rounded-lg text-[11px] text-left hover:bg-[#151A17] text-zinc-300 hover:text-amber-400 flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" /> Member
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsUserProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#151A17] transition-colors"
                >
                  <User className="w-4 h-4 text-[#B6FF45]" />
                  <span>My Account & Security Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActivePage('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#151A17] transition-colors"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Gym Settings & API Keys</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
