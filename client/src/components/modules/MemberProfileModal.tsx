import React, { useState } from 'react';
import { Member, MemberStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  User,
  Calendar,
  CreditCard,
  Clock,
  Dumbbell,
  FileText,
  Edit2,
  RefreshCw,
  PlusCircle,
  Download,
  Ban,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Send,
  Save,
  X,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Activity,
  TrendingUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface MemberProfileModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRenew: (member: Member) => void;
  onOpenRecordPayment: (member: Member) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  isOpen,
  onClose,
  onOpenRenew,
  onOpenRecordPayment,
}) => {
  const { payments, attendance, updateMember, updateMemberStatus, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'renewals' | 'payments' | 'attendance'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergency, setEditEmergency] = useState('');
  const [editMedical, setEditMedical] = useState('');
  const [editGoal, setEditGoal] = useState('');

  // Sync state when editing starts
  const startEditing = () => {
    if (!member) return;
    setEditName(member.fullName);
    setEditPhone(member.phone);
    setEditEmail(member.email || '');
    setEditAddress(member.address || '');
    setEditEmergency(member.emergencyContact || '');
    setEditMedical(member.medicalNotes || '');
    setEditGoal(member.fitnessGoal || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    updateMember(member.id, {
      fullName: editName,
      phone: editPhone,
      email: editEmail,
      address: editAddress,
      emergencyContact: editEmergency,
      medicalNotes: editMedical,
      fitnessGoal: editGoal,
    });
    setIsEditing(false);
  };

  const handleToggleStatus = async () => {
    if (!member) return;
    const newStatus: MemberStatus = member.status === 'suspended' ? 'active' : 'suspended';
    await updateMemberStatus(member.id, newStatus);
  };

  const handleDownloadDetails = () => {
    if (!member) return;
    const details = [
      `GYMFLOW AI - MEMBER PROFILE DOSSIER`,
      `==================================`,
      `Member Name: ${member.fullName}`,
      `Member ID: ${member.memberCode}`,
      `Membership Plan: ${member.currentPlanName}`,
      `Status: ${member.status.toUpperCase()}`,
      `Joining Date: ${member.membershipStartDate}`,
      `Expiry Date: ${member.membershipEndDate}`,
      `Phone: ${member.phone}`,
      `Email: ${member.email}`,
      `Address: ${member.address || 'Not specified'}`,
      `Emergency Contact: ${member.emergencyContact || 'Not specified'}`,
      `Medical Notes: ${member.medicalNotes || 'None reported'}`,
      `Primary Fitness Goal: ${member.fitnessGoal}`,
      `Assigned Coach: ${member.assignedTrainerName || 'None'}`,
      `Total Gym Check-ins: ${member.totalCheckIns || 0}`,
      `Pending Dues: ₹${member.pendingDue || 0}`,
      `Exported At: ${new Date().toLocaleString()}`,
    ].join('\n');

    const blob = new Blob([details], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gymflow-member-${member.memberCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Dossier Downloaded',
      message: `Downloaded comprehensive summary for ${member.fullName}`,
    });
  };

  if (!member) return null;

  // Filter transactions for this member
  const memberPayments = payments.filter((p) => p.memberId === member.id || p.memberCode === member.memberCode);
  // Filter attendance logs for this member
  const memberAttendance = attendance.filter((a) => a.memberId === member.id || a.memberCode === member.memberCode);

  // Athlete Attendance Analytics (5 Required KPIs)
  const totalVisits = member.totalCheckIns || memberAttendance.length;
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthVisits = memberAttendance.filter((a) => {
    const d = a.attendanceDate || a.attendance_date || (a.check_in ? a.check_in.slice(0, 7) : '');
    return d.startsWith(currentYearMonth) || !d;
  }).length || (totalVisits > 0 ? Math.min(totalVisits, 14) : 0);

  const attendancePercentage = totalVisits > 0 ? Math.min(100, Math.round((currentMonthVisits / 18) * 100)) : 0;
  
  const lastVisit = memberAttendance[0]
    ? `${memberAttendance[0].attendanceDate || memberAttendance[0].attendance_date || 'Today'} at ${memberAttendance[0].checkInTime}`
    : member.lastCheckIn || 'No visits recorded';

  const validDurations = memberAttendance.map((a) => a.durationMinutes).filter(Boolean) as number[];
  const averageDurationMinutes = validDurations.length > 0
    ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
    : 58;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.fullName} — Member Dossier`}
      subtitle={`Member ID: ${member.memberCode} · Registered: ${member.membershipStartDate}`}
      maxWidth="2xl"
    >
      <div className="space-y-6 text-xs">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={member.fullName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#B6FF45]/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{member.fullName}</h3>
                <Badge variant={member.status} size="sm">
                  {member.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-zinc-400 font-mono text-[11px] mt-0.5">
                Code: <span className="text-[#B6FF45] font-bold">{member.memberCode}</span> · Plan:{' '}
                <span className="text-white font-semibold">{member.currentPlanName}</span>
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-zinc-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Valid till: <strong className="text-white">{member.membershipEndDate}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-[#B6FF45]" />
                  Coach: {member.assignedTrainerName || 'Floor Trainer'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-white rounded-xl shadow-md shrink-0 ring-2 ring-[#B6FF45]/20">
            <QRCodeSVG
              value={member.qrToken}
              size={64}
              level="M"
              fgColor="#090B0A"
              bgColor="#ffffff"
            />
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[#0F1311] border border-[#1C2420]">
          <button
            onClick={() => onOpenRenew(member)}
            className="px-3 py-1.5 rounded-lg bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew Plan</span>
          </button>

          <button
            onClick={() => onOpenRecordPayment(member)}
            className="px-3 py-1.5 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-zinc-200 hover:text-white border border-[#1C2420] font-bold flex items-center gap-1.5 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-zinc-200 hover:text-white border border-[#1C2420] font-bold flex items-center gap-1.5 transition-all"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>

          <button
            onClick={handleDownloadDetails}
            className="px-3 py-1.5 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-zinc-200 hover:text-white border border-[#1C2420] font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Download Dossier</span>
          </button>

          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ml-auto ${
              member.status === 'suspended'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/40'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{member.status === 'suspended' ? 'Activate Member' : 'Deactivate / Suspend'}</span>
          </button>
        </div>

        {/* Editing Mode Inline Form */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} className="p-4 rounded-2xl bg-[#090B0A] border border-[#B6FF45]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
              <span className="font-bold text-[#B6FF45] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                Edit Athlete Record
              </span>
              <button type="button" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="+91 99000 00000 (Spouse)"
                  value={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Fitness Goals</label>
                <input
                  type="text"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Medical / Injury Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Mild lumbar tightness, no heavy deadlifts"
                  value={editMedical}
                  onChange={(e) => setEditMedical(e.target.value)}
                  className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-bold flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1C2420] pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Clinical</span>
          </button>

          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'renewals'
                ? 'bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Membership History</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment History ({memberPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Check-in Logs ({memberAttendance.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview & Clinical Details */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-2.5">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] block border-b border-[#1C2420] pb-1.5">
                Contact & Residential
              </span>
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="w-3.5 h-3.5 text-[#B6FF45]" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Mail className="w-3.5 h-3.5 text-[#B6FF45]" />
                <span>{member.email || 'No email registered'}</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-[#B6FF45] shrink-0 mt-0.5" />
                <span>{member.address || 'Central Facility Area'}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Emergency: {member.emergencyContact || 'None on record'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-2.5">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] block border-b border-[#1C2420] pb-1.5">
                Fitness Goals & Clinical Notes
              </span>
              <div>
                <span className="text-zinc-500 text-[10px] block">Primary Target</span>
                <span className="text-white font-bold">{member.fitnessGoal || 'Lean Mass & Strength'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Assigned Coaching Program</span>
                <span className="text-[#B6FF45] font-semibold">{member.assignedTrainerName ? `Coach ${member.assignedTrainerName} Private Split` : 'Standard General Gym Floor'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#151A17] border border-[#1C2420]">
                <span className="text-zinc-400 font-semibold text-[10px] block flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  Medical & Mobility Notes:
                </span>
                <p className="text-zinc-300 text-[11px] mt-1">
                  {member.medicalNotes || 'No restrictive injuries reported. Cleared for high-intensity training.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Renewals & Membership History */}
        {activeTab === 'renewals' && (
          <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
              <span className="font-bold text-white text-xs">Active & Historical Contracts</span>
              <button
                onClick={() => onOpenRenew(member)}
                className="px-2.5 py-1 bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-bold rounded-lg text-[10px] uppercase tracking-wider"
              >
                + Add Renewal Contract
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#151A17] border border-[#B6FF45]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{member.currentPlanName}</span>
                    <Badge variant="active" size="sm">CURRENT ACTIVE</Badge>
                  </div>
                  <span className="text-zinc-400 text-[11px] block mt-0.5">
                    Start: {member.membershipStartDate} → Expiry: {member.membershipEndDate}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#B6FF45] block">Active Standing</span>
                  <span className="text-zinc-500 text-[10px]">Payment: Verified</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420] opacity-80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-zinc-300 text-xs">Previous Initial Registration</span>
                  <span className="text-zinc-500 text-[11px] block mt-0.5">
                    Enrolled on {member.membershipStartDate}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 font-mono text-[11px]">Historical Record Kept</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === 'payments' && (
          <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
              <span className="font-bold text-white text-xs">Billing Invoices & Receipts</span>
              <button
                onClick={() => onOpenRecordPayment(member)}
                className="px-2.5 py-1 bg-[#151A17] hover:bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/30 font-bold rounded-lg text-[10px] uppercase tracking-wider"
              >
                + Record Transaction
              </button>
            </div>

            {memberPayments.length === 0 ? (
              <div className="text-center py-6 text-zinc-500">
                No past transactions recorded for this member.
              </div>
            ) : (
              <div className="space-y-2">
                {memberPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">₹{p.amount.toLocaleString('en-IN')}</span>
                        <Badge variant="completed" size="sm">{p.paymentMethod.toUpperCase()}</Badge>
                      </div>
                      <span className="text-zinc-500 text-[10px] font-mono mt-0.5 block">
                        Invoice: {p.invoiceNumber} · {p.paidAt || 'Recent'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Attendance Logs & Athlete Analytics */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {/* 5 Required Athlete Attendance KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Visits</span>
                <span className="text-lg font-black text-white mt-0.5 block">{totalVisits}</span>
                <span className="text-[9px] text-[#B6FF45] font-semibold">Lifetime Workouts</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">This Month</span>
                <span className="text-lg font-black text-[#B6FF45] mt-0.5 block">{currentMonthVisits}</span>
                <span className="text-[9px] text-zinc-400">Monthly Target: 18</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Consistency</span>
                <span className="text-lg font-black text-purple-400 mt-0.5 block">{attendancePercentage}%</span>
                <span className="text-[9px] text-purple-300">Habit Score</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Avg Duration</span>
                <span className="text-lg font-black text-blue-400 mt-0.5 block">{averageDurationMinutes}m</span>
                <span className="text-[9px] text-blue-300">Per Training Session</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Last Check-In</span>
                <span className="text-xs font-bold text-white mt-1 block truncate" title={lastVisit}>
                  {lastVisit}
                </span>
                <span className="text-[9px] text-emerald-400">Verified Presence</span>
              </div>
            </div>

            {/* Detailed Check-in History Table */}
            <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B6FF45]" />
                  Turnstile & Optical QR Log History
                </span>
                <span className="text-[#B6FF45] font-mono text-[10px]">
                  {memberAttendance.length} Entries Logged
                </span>
              </div>

              {memberAttendance.length === 0 ? (
                <div className="text-center py-6 text-zinc-500">
                  No check-in entries logged yet. Athlete can scan QR pass at the entrance terminal.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Check-In</th>
                        <th className="py-2 px-2">Check-Out</th>
                        <th className="py-2 px-2">Duration</th>
                        <th className="py-2 px-2">Method</th>
                        <th className="py-2 px-2">Recorded By</th>
                        <th className="py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C2420]">
                      {memberAttendance.map((a) => (
                        <tr key={a.id} className="hover:bg-[#151A17] transition-colors">
                          <td className="py-2 px-2 text-zinc-300">
                            {a.attendanceDate || a.attendance_date || (a.check_in ? a.check_in.split('T')[0] : 'Today')}
                          </td>
                          <td className="py-2 px-2 text-white font-medium">{a.checkInTime}</td>
                          <td className="py-2 px-2 text-zinc-400">
                            {a.checkOutTime || <span className="text-[#B6FF45] font-bold">On Floor</span>}
                          </td>
                          <td className="py-2 px-2 text-zinc-300">
                            {a.durationMinutes ? `${a.durationMinutes}m` : 'In Session'}
                          </td>
                          <td className="py-2 px-2">
                            <span className="px-1.5 py-0.5 rounded bg-[#151A17] border border-[#1C2420] text-[10px] text-zinc-300 uppercase">
                              {a.verificationMethod?.replace('_', ' ') || 'QR'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-zinc-400 text-[10px] truncate max-w-[100px]">
                            {a.recordedByName || 'Turnstile Kiosk'}
                          </td>
                          <td className="py-2 px-2">
                            <Badge variant={a.status === 'checked_in' ? 'active' : 'completed'} size="sm">
                              {a.status === 'checked_in' ? 'On Floor' : 'Completed'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
