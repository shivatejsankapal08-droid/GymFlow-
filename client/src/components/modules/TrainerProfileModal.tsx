import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  User,
  Dumbbell,
  Star,
  Clock,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Award,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  ShieldCheck,
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  LogIn
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Trainer, TrainingSession, TrainerAttendanceRecord, TrainerSalaryRecord } from '../../types';

interface TrainerProfileModalProps {
  trainer: Trainer | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleModal: (trainerId: string) => void;
}

export const TrainerProfileModal: React.FC<TrainerProfileModalProps> = ({
  trainer,
  isOpen,
  onClose,
  onOpenScheduleModal,
}) => {
  const {
    currentGym,
    members,
    trainingSessions,
    trainerCheckIn,
    trainerCheckOut,
    removeMemberAssignment,
    recordTrainerSalaryPayout,
    updateSessionStatus,
    fetchTrainerProfile,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'schedule' | 'attendance' | 'payroll'>('overview');
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Salary Payout Form State
  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [baseAmount, setBaseAmount] = useState('45000');
  const [commissionAmount, setCommissionAmount] = useState('5000');
  const [bonusAmount, setBonusAmount] = useState('2000');
  const [deductions, setDeductions] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('Monthly performance disbursement');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  useEffect(() => {
    if (trainer && isOpen) {
      loadProfile();
    }
  }, [trainer, isOpen]);

  const loadProfile = async () => {
    if (!trainer) return;
    setIsLoadingProfile(true);
    const data = await fetchTrainerProfile(trainer.id);
    if (data && data.success) {
      setProfileData(data);
      if (data.trainer?.baseSalary || data.trainer?.basePay || data.trainer?.salary) {
        setBaseAmount(String(data.trainer.baseSalary || data.trainer.basePay || data.trainer.salary));
      }
    }
    setIsLoadingProfile(false);
  };

  if (!trainer) return null;

  // Assigned members from local state or backend profile
  const assignedMembers = profileData?.assignedMembers || members.filter(
    (m) => (m.assignedTrainerId === trainer.id || (m as any).assigned_trainer_id === trainer.id) &&
           (m.gymId === currentGym.id || (m as any).gym_id === currentGym.id)
  );

  // Training sessions for this trainer
  const trainerSessions = profileData?.sessions || trainingSessions.filter(
    (s: any) => (s.trainerId === trainer.id || s.trainer_id === trainer.id) &&
                (s.gymId === currentGym.id || s.gym_id === currentGym.id)
  );

  // Attendance history
  const attendanceLogs: TrainerAttendanceRecord[] = profileData?.attendance || [];

  // Salary history
  const salaryLogs: TrainerSalaryRecord[] = profileData?.salaries || [];

  const handleCheckIn = async () => {
    const res = await trainerCheckIn(trainer.id, 'Trainer mobile terminal check-in');
    if (res.success) {
      loadProfile();
    }
  };

  const handleCheckOut = async () => {
    const res = await trainerCheckOut(trainer.id, 'Shift concluded on time');
    if (res.success) {
      loadProfile();
    }
  };

  const handleUnassignAthlete = async (memberId: string) => {
    const res = await removeMemberAssignment(trainer.id, memberId);
    if (res.success) {
      loadProfile();
    }
  };

  const handleDisburseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayout(true);
    const res = await recordTrainerSalaryPayout(trainer.id, {
      salaryMonth,
      baseAmount: Number(baseAmount) || 45000,
      commissionAmount: Number(commissionAmount) || 0,
      bonusAmount: Number(bonusAmount) || 0,
      deductions: Number(deductions) || 0,
      paymentMethod,
      notes: payoutNotes,
    });
    setIsSubmittingPayout(false);
    if (res.success) {
      setIsPayoutFormOpen(false);
      loadProfile();
    }
  };

  const netPayoutPreview = Math.max(
    0,
    (Number(baseAmount) || 0) + (Number(commissionAmount) || 0) + (Number(bonusAmount) || 0) - (Number(deductions) || 0)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trainer Profile & Performance Dossier"
      subtitle={`Verified coaching records for ${trainer.fullName} (${trainer.trainerCode || 'TR-1001'})`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Profile Header Card */}
        <div className="p-4 rounded-3xl bg-[#0F1311] border border-[#1C2420] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={
                  trainer.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={trainer.fullName}
                className="w-14 h-14 rounded-2xl object-cover border border-[#1C2420]"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#B6FF45] border-2 border-[#090B0A]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{trainer.fullName}</h2>
                <span className="px-2 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] font-mono text-[11px] font-bold border border-[#B6FF45]/30">
                  {trainer.trainerCode || 'TR-1001'}
                </span>
                <Badge variant={trainer.isActive ? 'active' : 'inactive'}>
                  {trainer.employmentStatus || (trainer.isActive ? 'ACTIVE' : 'INACTIVE')}
                </Badge>
              </div>

              <p className="text-xs text-zinc-400 mt-0.5">
                {trainer.specialization} • {trainer.experience || '4+ years exp'}
              </p>

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {trainer.rating || 4.9} / 5.0
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Users className="w-3.5 h-3.5 text-[#B6FF45]" />
                  {assignedMembers.length} Athletes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {trainer.workingHours || trainer.availability || '06:00 AM - 02:00 PM'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Terminal Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCheckIn}
              className="px-3 py-1.5 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-[#B6FF45] font-bold text-[11px] flex items-center gap-1.5 border border-[#B6FF45]/30 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Check In</span>
            </button>
            <button
              onClick={handleCheckOut}
              className="px-3 py-1.5 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 border border-[#1C2420] transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check Out</span>
            </button>
            <button
              onClick={() => onOpenScheduleModal(trainer.id)}
              className="px-3.5 py-1.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-[#B6FF45]/20"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Session</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1C2420] pb-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-1.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Overview & Info</span>
          </button>
          <button
            onClick={() => setActiveTab('athletes')}
            className={`pb-1.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'athletes'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Assigned Athletes ({assignedMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-1.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule ({trainerSessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-1.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance History</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`pb-1.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'payroll'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salary & Payroll</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Completed Sessions</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {profileData?.performance?.completedSessionsCount ?? 34}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Client Retention</p>
                <p className="text-lg font-black text-[#B6FF45] mt-0.5">
                  {profileData?.performance?.clientRetentionRate ?? '96.2'}%
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Hours Logged</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {profileData?.performance?.totalHoursWorked ?? 142} hrs
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Monthly Compensation</p>
                <p className="text-lg font-black text-white mt-0.5 font-mono">
                  ₹{(trainer.basePay || trainer.salary || 45000).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Qualifications & Certifications */}
            <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-2.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#B6FF45]" />
                Qualifications & Accreditations
              </h3>
              <p className="text-zinc-300">
                {trainer.certifications || 'ACE Certified Personal Trainer, CSCS, Crossfit Level 2'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(trainer.skills
                  ? trainer.skills.split(',').map((s) => s.trim())
                  : ['Barbell Mastery', 'Hypertrophy', 'Kettlebells', 'Mobility & Rehab']
                ).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#1C2420] text-zinc-300 text-[11px] font-semibold border border-[#1C2420]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact & Shift Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#B6FF45]" />
                  Contact Information
                </h3>
                <div className="space-y-1 text-zinc-300">
                  <p>Email: <span className="text-white font-mono">{trainer.email || 'coach@gymflow.ai'}</span></p>
                  <p>Phone: <span className="text-white font-mono">{trainer.phone || '+91 99000 00000'}</span></p>
                  <p>Shift: <span className="text-white">{trainer.workingHours || '06:00 AM - 02:00 PM'}</span></p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B6FF45]" />
                  Employment Status
                </h3>
                <div className="space-y-1 text-zinc-300">
                  <p>Facility: <span className="text-white font-semibold">{currentGym.name}</span></p>
                  <p>Employment: <span className="text-white capitalize">{trainer.employmentType || 'Full-time'}</span></p>
                  <p>Salary Model: <span className="text-white capitalize">{trainer.salaryType || 'Monthly'}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASSIGNED ATHLETES */}
        {activeTab === 'athletes' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Coaching {assignedMembers.length} athletes (Capacity limit: 20 athletes)
              </p>
              <div className="w-32 bg-[#1C2420] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#B6FF45] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (assignedMembers.length / 20) * 100)}%` }}
                />
              </div>
            </div>

            {assignedMembers.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <Users className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="font-bold text-zinc-300">No athletes assigned yet</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Assign athletes from the Member Assignments tab in the dashboard.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1C2420] rounded-2xl bg-[#0F1311] border border-[#1C2420] overflow-hidden">
                {assignedMembers.map((m: any) => (
                  <div key={m.id || m.memberId} className="p-3 flex items-center justify-between hover:bg-[#151A17] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1C2420] flex items-center justify-center text-white font-bold text-xs">
                        {(m.fullName || m.full_name || 'A').charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-xs">{m.fullName || m.full_name}</p>
                          <span className="text-[10px] font-mono text-zinc-500">{m.memberCode || m.member_code}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {m.planName || 'Standard Tier'} • Status: <span className="text-[#B6FF45] capitalize">{m.status || 'Active'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnassignAthlete(m.id || m.memberId)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[11px] flex items-center gap-1 border border-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Unassign</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRAINING SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Scheduled training sessions for {trainer.fullName}
              </p>
              <button
                onClick={() => onOpenScheduleModal(trainer.id)}
                className="px-3 py-1.5 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Book Session</span>
              </button>
            </div>

            {trainerSessions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <Calendar className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="font-bold text-zinc-300">No scheduled sessions</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Book a session using the "Book Session" button.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {trainerSessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between hover:border-[#B6FF45]/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {s.sessionTitle || s.session_title || 'Training Session'}
                        </span>
                        <Badge variant={(s.sessionStatus || s.session_status) === 'completed' ? 'completed' : 'pro'}>
                          {s.sessionStatus || s.session_status || 'scheduled'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Athlete: <strong className="text-zinc-200">{s.memberName || 'Athlete'}</strong> • {s.trainingType || s.training_type || 'Personal Training'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        📅 {s.sessionDate || s.session_date} | ⏰ {s.startTime || s.start_time} - {s.endTime || s.end_time}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(s.sessionStatus || s.session_status) === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateSessionStatus(s.id, 'completed', 'Completed successfully')}
                            className="px-2.5 py-1 rounded-lg bg-[#B6FF45]/20 hover:bg-[#B6FF45]/30 text-[#B6FF45] font-bold text-[10px] border border-[#B6FF45]/30"
                          >
                            Mark Done
                          </button>
                          <button
                            onClick={() => updateSessionStatus(s.id, 'cancelled', 'Cancelled by member')}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px]"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ATTENDANCE HISTORY */}
        {activeTab === 'attendance' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Verified check-in & working hour telemetry
              </p>
              <span className="text-[11px] text-[#B6FF45] font-bold">
                Live Status: {trainer.isActive ? 'Active Shift' : 'Off-duty'}
              </span>
            </div>

            {attendanceLogs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <Clock className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="font-bold text-zinc-300">No attendance logs found</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Use the Check In button above to register today's attendance.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1C2420] rounded-2xl bg-[#0F1311] border border-[#1C2420] overflow-hidden">
                {attendanceLogs.map((a: any) => (
                  <div key={a.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-xs">
                          {a.attendanceDate || a.attendance_date}
                        </span>
                        <Badge variant={a.status === 'checked_in' ? 'pro' : 'completed'}>
                          {a.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        In: <span className="font-mono text-zinc-300">{a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00 AM'}</span>
                        {a.checkOutTime && (
                          <> • Out: <span className="font-mono text-zinc-300">{new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-[#B6FF45]">
                        {a.workingHours || a.working_hours || 8.0} hrs
                      </span>
                      <p className="text-[10px] text-zinc-500">Working shift</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SALARY & PAYROLL */}
        {activeTab === 'payroll' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-xs">Monthly Payroll & Compensation</p>
                <p className="text-[11px] text-zinc-400">
                  Base: ₹{(trainer.basePay || trainer.salary || 45000).toLocaleString('en-IN')} / mo • Model: {trainer.salaryType || 'Monthly'}
                </p>
              </div>
              <button
                onClick={() => setIsPayoutFormOpen(!isPayoutFormOpen)}
                className="px-3.5 py-1.5 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-[11px] flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{isPayoutFormOpen ? 'Cancel' : 'Disburse Salary'}</span>
              </button>
            </div>

            {/* Disburse Salary Inline Form */}
            {isPayoutFormOpen && (
              <form onSubmit={handleDisburseSalary} className="p-4 rounded-2xl bg-[#090B0A] border border-[#B6FF45]/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
                  <span className="font-bold text-white text-xs">Record Salary Disbursement</span>
                  <span className="text-[11px] text-[#B6FF45] font-mono font-bold">
                    Net: ₹{netPayoutPreview.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Salary Month</label>
                    <input
                      type="month"
                      required
                      value={salaryMonth}
                      onChange={(e) => setSalaryMonth(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Base Salary (INR)</label>
                    <input
                      type="number"
                      required
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Commission (INR)</label>
                    <input
                      type="number"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Bonus (INR)</label>
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Deductions (INR)</label>
                    <input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    >
                      <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                      <option value="upi">UPI / Instant Pay</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold mb-1">Notes / Reference</label>
                    <input
                      type="text"
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      className="w-full bg-[#151A17] border border-[#1C2420] rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingPayout}
                    className="px-4 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-xs uppercase tracking-wider"
                  >
                    {isSubmittingPayout ? 'Disbursing...' : 'Confirm Payout'}
                  </button>
                </div>
              </form>
            )}

            {/* Salary History */}
            {salaryLogs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                <DollarSign className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="font-bold text-zinc-300">No salary disbursement records</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Record monthly payouts using the Disburse Salary button.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1C2420] rounded-2xl bg-[#0F1311] border border-[#1C2420] overflow-hidden">
                {salaryLogs.map((s: any) => (
                  <div key={s.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{s.salaryMonth}</span>
                        <Badge variant="completed">PAID</Badge>
                        <span className="text-[10px] text-zinc-500 capitalize">{s.paymentMethod?.replace('_', ' ')}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Base: ₹{s.baseAmount?.toLocaleString('en-IN')} • Commission: ₹{s.commissionAmount || 0} • Bonus: ₹{s.bonusAmount || 0}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm font-black text-[#B6FF45]">
                        ₹{(s.netPaid || s.baseAmount).toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-zinc-500">{s.paidDate || 'Paid'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
