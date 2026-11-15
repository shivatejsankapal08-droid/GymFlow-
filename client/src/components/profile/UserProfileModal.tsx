import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Key, 
  Lock, 
  CheckCircle2, 
  LogOut, 
  Save, 
  Smartphone, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { 
    currentUser, 
    currentGym, 
    isUserProfileModalOpen, 
    setIsUserProfileModalOpen, 
    updateUserProfile, 
    changeUserPassword, 
    activeSessions, 
    logout 
  } = useApp();

  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  
  // Profile form
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName,
      phone,
      avatarUrl,
    });
    setIsUserProfileModalOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await changeUserPassword(currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Failed to update password.');
    }
  };

  return (
    <Modal
      isOpen={isUserProfileModalOpen}
      onClose={() => setIsUserProfileModalOpen(false)}
      title="User Account & Security"
      subtitle="Manage your GymFlow AI identity, security credentials and active sessions"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1C2420] pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
            }`}
          >
            Profile & Gym
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
            }`}
          >
            Security & Password
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'sessions'
                ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
            }`}
          >
            Active Sessions ({activeSessions.length})
          </button>
        </div>

        {/* TAB 1: PROFILE & GYM DETAILS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                alt={currentUser.fullName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#B6FF45]/40"
              />
              <div className="flex-1">
                <p className="font-semibold text-white mb-1">Profile Photo</p>
                <p className="text-[11px] text-zinc-400 mb-2">Select a preset avatar or paste an image URL:</p>
                <div className="flex items-center gap-2">
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110 ${
                        avatarUrl === url ? 'border-[#B6FF45]' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>
            </div>

            {/* Email Address (Readonly with Verified Badge) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-zinc-300">Email Address</label>
                <span className="flex items-center gap-1 text-[11px] text-[#B6FF45] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Identity</span>
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-[#0F1311]/60 border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Role & Gym Association Card */}
            <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Assigned Platform Role:</span>
                <Badge variant={currentUser.role === 'super_admin' ? 'pro' : 'active'}>
                  {currentUser.role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#1C2420]">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#B6FF45]" />
                  Associated Gym Tenant:
                </span>
                <span className="text-white font-bold">{currentGym.name}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Location:</span>
                <span>{currentGym.city}, {currentGym.country}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1C2420]">
              <button
                type="button"
                onClick={() => setIsUserProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#151A17] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#B6FF45]/20 hover:scale-[1.01] transition-transform"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-start gap-2.5 text-xs text-[#B6FF45]">
                <CheckCircle2 className="w-4 h-4 text-[#B6FF45] shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter existing password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">New Password (Min 8 chars)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide passwords' : 'Show passwords'}</span>
            </button>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#B6FF45]/20 hover:scale-[1.01] transition-transform disabled:opacity-50"
            >
              {isUpdatingPassword ? (
                <div className="w-4 h-4 border-2 border-[#090B0A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Update Account Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: ACTIVE SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <p className="text-zinc-400 text-[11px]">
              Every device currently logged in with a valid JWT token. Sessions automatically expire after 30 days of inactivity.
            </p>

            <div className="space-y-2">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#151A17] text-[#B6FF45] border border-[#1C2420]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{s.userAgent}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{s.ipAddress}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-[#B6FF45] bg-[#B6FF45]/10 px-2 py-0.5 rounded-md border border-[#B6FF45]/20">
                      Active
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">{s.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout Bottom Row */}
        <div className="pt-3 border-t border-[#1C2420] flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Security Rule: PostgreSQL RLS Active</span>
          <button
            onClick={() => {
              setIsUserProfileModalOpen(false);
              logout();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
