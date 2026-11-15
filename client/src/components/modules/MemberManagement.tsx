import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Member, MemberStatus } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { MemberProfileModal } from './MemberProfileModal';
import { RenewMembershipModal } from '../modals/RenewMembershipModal';
import {
  Users,
  Search,
  Filter,
  Plus,
  QrCode,
  Send,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Dumbbell,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const MemberManagement: React.FC = () => {
  const {
    members,
    plans,
    trainers,
    deleteMember,
    updateMemberStatus,
    triggerAutomationTest,
    globalSearch,
    setGlobalSearch,
    setIsAddMemberModalOpen,
    setIsRecordPaymentModalOpen,
    memberStats,
    currentGym,
    currentUser,
    addToast
  } = useApp();

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_7' | 'expiring_15' | 'expired' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'expiry_asc' | 'expiry_desc' | 'created_desc'>('expiry_asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modals state
  const [profileModalMember, setProfileModalMember] = useState<Member | null>(null);
  const [renewModalMember, setRenewModalMember] = useState<Member | null>(null);
  const [quickQRMember, setQuickQRMember] = useState<Member | null>(null);

  const effectiveSearch = globalSearch || searchTerm;

  // Multi-tenant scoped members
  const gymScopedMembers = useMemo(() => {
    return members.filter(
      (m) => currentUser?.role === 'super_admin' || m.gymId === currentGym.id
    );
  }, [members, currentGym.id, currentUser?.role]);

  // Filtering & Sorting
  const filteredAndSortedMembers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return gymScopedMembers
      .filter((member) => {
        // Search Filter
        const q = effectiveSearch.toLowerCase().trim();
        const matchesSearch =
          !q ||
          member.fullName.toLowerCase().includes(q) ||
          member.phone.includes(q) ||
          member.memberCode.toLowerCase().includes(q) ||
          (member.email && member.email.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        // Plan Filter
        if (planFilter !== 'all' && member.currentPlanId !== planFilter) {
          return false;
        }

        // Status & Expiry Window Filter
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return member.status === 'active';
        if (statusFilter === 'expired') return member.status === 'expired';
        if (statusFilter === 'suspended') return member.status === 'suspended';

        // Dynamic Expiry Calculation
        const expDate = new Date(member.membershipEndDate);
        expDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (statusFilter === 'expiring_7') {
          return daysDiff >= 0 && daysDiff <= 7;
        }
        if (statusFilter === 'expiring_15') {
          return daysDiff >= 0 && daysDiff <= 15;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.fullName.localeCompare(b.fullName);
        }
        if (sortBy === 'expiry_asc') {
          return new Date(a.membershipEndDate).getTime() - new Date(b.membershipEndDate).getTime();
        }
        if (sortBy === 'expiry_desc') {
          return new Date(b.membershipEndDate).getTime() - new Date(a.membershipEndDate).getTime();
        }
        if (sortBy === 'created_desc') {
          return (
            new Date(b.createdAt || b.membershipStartDate).getTime() -
            new Date(a.createdAt || a.membershipStartDate).getTime()
          );
        }
        return 0;
      });
  }, [gymScopedMembers, effectiveSearch, planFilter, statusFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMembers.length / itemsPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMembers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedMembers, currentPage, itemsPerPage]);

  const handleSendWhatsApp = (member: Member) => {
    triggerAutomationTest(
      'WhatsApp Member Portal Link & QR Pass',
      `${member.phone} (${member.fullName})`
    );
  };

  const handleToggleStatus = async (member: Member) => {
    const nextStatus: MemberStatus = member.status === 'suspended' ? 'active' : 'suspended';
    await updateMemberStatus(member.id, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B6FF45]" />
            Athlete Member Directory
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage profiles, renewals, biometric QR passes, payment status and multi-tenant member data
          </p>
        </div>

        <button
          onClick={() => setIsAddMemberModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Athlete</span>
        </button>
      </div>

      {/* 1. LIVE MEMBER DASHBOARD KPI CARDS (6 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Members */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Members</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-white">{memberStats.totalMembers}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Roster count</span>
        </div>

        {/* Active Members */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
            <UserCheck className="w-4 h-4 text-[#B6FF45]" />
          </div>
          <div className="text-2xl font-black text-[#B6FF45]">{memberStats.activeMembers}</div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            {memberStats.totalMembers > 0
              ? `${Math.round((memberStats.activeMembers / memberStats.totalMembers) * 100)}% utilization`
              : '0%'}
          </span>
        </div>

        {/* Expired Members */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expired</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{memberStats.expiredMembers}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Overdue renewal</span>
        </div>

        {/* Expiring Soon */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{memberStats.expiringSoonMembers}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Next 15 days</span>
        </div>

        {/* New This Month */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">New This Month</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{memberStats.newMembersThisMonth}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Fresh signups</span>
        </div>

        {/* Renewal Revenue */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Renewal Revenue</span>
            <CreditCard className="w-4 h-4 text-[#B6FF45]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#B6FF45]">
            ₹{memberStats.renewalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Total settled dues</span>
        </div>
      </div>

      {/* 2. SEARCH, MULTI-CRITERIA FILTERS & SORT BAR */}
      <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, phone, code or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          {/* Plan Dropdown & Sort Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="all">All Membership Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="expiry_asc">Expiry (Soonest First)</option>
              <option value="expiry_desc">Expiry (Latest First)</option>
              <option value="name_asc">Name (A to Z)</option>
              <option value="created_desc">Recently Registered</option>
            </select>
          </div>
        </div>

        {/* Expiry Window & Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Athletes' },
            { id: 'active', label: 'Active' },
            { id: 'expiring_7', label: 'Expiring in 7 Days' },
            { id: 'expiring_15', label: 'Expiring in 15 Days' },
            { id: 'expired', label: 'Expired' },
            { id: 'suspended', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1C2420]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MEMBERS TABLE */}
      <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1C2420] bg-[#0F1311] text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Athlete</th>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Coach</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2420]">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-10 h-10 text-zinc-600 mb-3" />
                      <p className="text-sm font-semibold text-zinc-300">No members found</p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                        {effectiveSearch
                          ? `No members match "${effectiveSearch}". Try adjusting your query.`
                          : 'No members found in this status category.'}
                      </p>
                      {effectiveSearch && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setGlobalSearch('');
                          }}
                          className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-[#B6FF45] font-semibold text-xs border border-[#1C2420]"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const expDate = new Date(member.membershipEndDate);
                  expDate.setHours(0, 0, 0, 0);
                  const daysRemaining = Math.ceil(
                    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[#0F1311]/70 transition-colors cursor-pointer group"
                      onClick={() => setProfileModalMember(member)}
                    >
                      {/* Athlete Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatarUrl}
                            alt={member.fullName}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-zinc-700 group-hover:ring-[#B6FF45]/50 transition-all"
                          />
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {member.fullName}
                            </span>
                            <span className="text-[11px] text-zinc-400">{member.fitnessGoal}</span>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-[#B6FF45]">
                        {member.memberCode}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-zinc-300">
                        <div>{member.phone}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                          {member.email}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-4 font-bold text-white">{member.currentPlanName}</td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge variant={member.status} size="sm">
                          {member.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-4 text-zinc-300">
                        <span className="text-xs font-mono font-bold text-white block">
                          {member.membershipEndDate}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            daysRemaining < 0
                              ? 'text-rose-400'
                              : daysRemaining <= 7
                              ? 'text-amber-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          {daysRemaining < 0
                            ? `Expired ${Math.abs(daysRemaining)}d ago`
                            : daysRemaining === 0
                            ? 'Expires today!'
                            : `${daysRemaining} days left`}
                        </span>
                      </td>

                      {/* Coach */}
                      <td className="py-3 px-4 text-zinc-300">
                        {member.assignedTrainerName || (
                          <span className="text-zinc-500 text-[11px]">General Floor</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Renew Membership Button */}
                          <button
                            onClick={() => setRenewModalMember(member)}
                            title="Renew Membership"
                            className="p-1.5 rounded-lg bg-[#B6FF45]/15 hover:bg-[#B6FF45]/25 text-[#B6FF45] border border-[#B6FF45]/30 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick QR Card */}
                          <button
                            onClick={() => setQuickQRMember(member)}
                            title="View Digital QR Pass"
                            className="p-1.5 rounded-lg bg-[#0F1311] hover:bg-[#1C2420] text-zinc-300 hover:text-white transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#B6FF45]" />
                          </button>

                          {/* WhatsApp Dispatch */}
                          <button
                            onClick={() => handleSendWhatsApp(member)}
                            title="Dispatch WhatsApp Notification"
                            className="p-1.5 rounded-lg bg-[#0F1311] hover:bg-[#1C2420] text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* View Profile */}
                          <button
                            onClick={() => setProfileModalMember(member)}
                            title="Open Athlete Dossier"
                            className="p-1.5 rounded-lg bg-[#0F1311] hover:bg-[#1C2420] text-zinc-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteMember(member.id)}
                            title="Delete Athlete Record"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION CONTROLS */}
        {filteredAndSortedMembers.length > 0 && (
          <div className="p-4 border-t border-[#1C2420] flex items-center justify-between text-xs text-zinc-400 bg-[#0F1311]">
            <div>
              Showing{' '}
              <span className="font-bold text-white">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-white">
                {Math.min(currentPage * itemsPerPage, filteredAndSortedMembers.length)}
              </span>{' '}
              of <span className="font-bold text-white">{filteredAndSortedMembers.length}</span>{' '}
              athletes
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 rounded-lg bg-[#151A17] text-white font-mono font-bold">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMPONENT MODALS */}
      {/* 1. Athlete Full Dossier Profile Modal */}
      <MemberProfileModal
        member={profileModalMember}
        isOpen={!!profileModalMember}
        onClose={() => setProfileModalMember(null)}
        onOpenRenew={(mem) => {
          setProfileModalMember(null);
          setRenewModalMember(mem);
        }}
        onOpenRecordPayment={(mem) => {
          setProfileModalMember(null);
          setIsRecordPaymentModalOpen(true);
        }}
      />

      {/* 2. Dedicated Renewal Modal */}
      <RenewMembershipModal
        isOpen={!!renewModalMember}
        onClose={() => setRenewModalMember(null)}
        member={renewModalMember}
      />

      {/* 3. Quick QR Pass Modal */}
      {quickQRMember && (
        <Modal
          isOpen={!!quickQRMember}
          onClose={() => setQuickQRMember(null)}
          title="Digital Biometric QR Pass"
          subtitle={`Member ID: ${quickQRMember.memberCode} • ${quickQRMember.fullName}`}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-white rounded-3xl shadow-xl ring-4 ring-[#B6FF45]/30">
              <QRCodeSVG
                value={quickQRMember.qrToken}
                size={180}
                level="H"
                fgColor="#090B0A"
                bgColor="#ffffff"
              />
            </div>

            <div className="w-full p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan:</span>
                <span className="text-white font-bold">{quickQRMember.currentPlanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Valid Until:</span>
                <span className="text-[#B6FF45] font-mono font-bold">
                  {quickQRMember.membershipEndDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Status:</span>
                <Badge variant={quickQRMember.status} size="sm">
                  {quickQRMember.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <button
              onClick={() => {
                handleSendWhatsApp(quickQRMember);
                setQuickQRMember(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#B6FF45]/20"
            >
              <Send className="w-4 h-4" />
              <span>Send QR Pass via WhatsApp</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
