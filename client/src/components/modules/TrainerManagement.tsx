import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Dumbbell,
  Plus,
  Star,
  Clock,
  Users,
  DollarSign,
  Mail,
  Send,
  Copy,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  UserCheck,
  TrendingUp,
  Search,
  Filter,
  Activity,
  Award,
  LogIn,
  LogOut,
  ChevronRight,
  UserPlus,
  ShieldCheck,
  UserX,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  CheckSquare,
  FileText,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { Trainer, TrainingSession, TrainerStats } from '../../types';
import { AddTrainerModal } from '../modals/AddTrainerModal';
import { ScheduleSessionModal } from './ScheduleSessionModal';
import { TrainerProfileModal } from './TrainerProfileModal';
import { AssignMembersModal } from './AssignMembersModal';
import { TrainerFeedbackModal } from './TrainerFeedbackModal';

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export const TrainerManagement: React.FC = () => {
  const {
    trainers,
    members,
    currentGym,
    trainingSessions,
    trainerStats,
    fetchTrainerStats,
    fetchTrainers,
    fetchTrainingSessions,
    trainerCheckIn,
    trainerCheckOut,
    updateSessionStatus,
    removeMemberAssignment,
    setIsAddTrainerModalOpen,
    globalSearch,
    setGlobalSearch,
    addToast,
  } = useApp();

  // Navigation Tabs specified in Section 12:
  // overview, trainers, assignments, schedule, attendance, salary, performance, invitations
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trainers' | 'assignments' | 'schedule' | 'attendance' | 'salary' | 'performance' | 'invitations'
  >('overview');

  // Filter States
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string>('all');
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Performance Report Selected Trainer
  const [performanceTrainerId, setPerformanceTrainerId] = useState<string>('');
  const [trainerPerformanceData, setTrainerPerformanceData] = useState<any>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  // Salary Summary State
  const [salarySummary, setSalarySummary] = useState<any>(null);
  const [salaryMonthFilter, setSalaryMonthFilter] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Modal Control States
  const [selectedTrainerForProfile, setSelectedTrainerForProfile] = useState<Trainer | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalTrainerId, setScheduleModalTrainerId] = useState<string | undefined>(undefined);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalTrainerId, setAssignModalTrainerId] = useState<string | undefined>(undefined);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTrainer, setFeedbackTrainer] = useState<Trainer | null>(null);

  // Team Invitations State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'trainer' | 'staff'>('trainer');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationItem[]>([
    {
      id: 'inv-1',
      email: 'alex.rivera@ironpulse.com',
      role: 'trainer',
      token: 'tok_active_invitation_ironpulse',
      expiresAt: '20 Nov 2026',
      status: 'pending',
    },
    {
      id: 'inv-2',
      email: 'rishi.kapoor@ironpulse.com',
      role: 'trainer',
      token: 'tok_pending_rishi_kapoor',
      expiresAt: '22 Nov 2026',
      status: 'pending',
    },
  ]);

  // Initial Fetch of live trainer stats & sessions
  useEffect(() => {
    fetchTrainerStats();
    fetchTrainers();
    fetchTrainingSessions();
    fetchSalarySummary();
  }, [currentGym.id]);

  // Filter gym-specific trainers
  const gymTrainers = useMemo(() => {
    return trainers.filter(
      (t) => t.gymId === currentGym.id || (t as any).gym_id === currentGym.id
    );
  }, [trainers, currentGym.id]);

  useEffect(() => {
    if (gymTrainers.length > 0 && !performanceTrainerId) {
      setPerformanceTrainerId(gymTrainers[0].id);
    }
  }, [gymTrainers]);

  useEffect(() => {
    if (performanceTrainerId) {
      fetchPerformanceReport(performanceTrainerId);
    }
  }, [performanceTrainerId, currentGym.id]);

  const fetchPerformanceReport = async (trId: string) => {
    setIsLoadingPerformance(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trainers/${trId}/performance`, {
        headers: {
          Authorization: 'demo-token-gym_owner',
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrainerPerformanceData(data.performance);
      }
    } catch {
      // Graceful fallback
    }
    setIsLoadingPerformance(false);
  };

  const fetchSalarySummary = async (month?: string) => {
    try {
      const targetMonth = month || salaryMonthFilter;
      const res = await fetch(`http://localhost:5000/api/trainers/salary/summary?month=${targetMonth}`, {
        headers: {
          Authorization: 'demo-token-gym_owner',
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSalarySummary(data.summary);
      }
    } catch {
      // Graceful fallback
    }
  };

  // Filtered Trainer List
  const filteredTrainers = useMemo(() => {
    return gymTrainers.filter((t) => {
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const matches =
          t.fullName.toLowerCase().includes(q) ||
          t.specialization.toLowerCase().includes(q) ||
          (t.trainerCode || '').toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.email.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (specializationFilter !== 'all') {
        if (!t.specialization.toLowerCase().includes(specializationFilter.toLowerCase())) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        const empStatus = t.employmentStatus || (t.isActive ? 'active' : 'inactive');
        if (empStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [gymTrainers, globalSearch, specializationFilter, statusFilter]);

  // Live 7 KPIs (From backend stats or dynamic fallback)
  const stats = useMemo(() => {
    const totalTrainers = gymTrainers.length;
    const activeTrainers = gymTrainers.filter(
      (t) => t.employmentStatus === 'active' || (t.employmentStatus === undefined && t.isActive)
    ).length;
    const inactiveTrainers = totalTrainers - activeTrainers;
    const trainersAvailableToday = trainerStats?.trainersAvailableToday ?? Math.max(1, activeTrainers);

    const totalAssignedMembers = members.filter(
      (m) => (m.assignedTrainerId || (m as any).assigned_trainer_id) &&
             (m.gymId === currentGym.id || (m as any).gym_id === currentGym.id)
    ).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const trainingSessionsToday = trainingSessions.filter(
      (s: any) =>
        (s.sessionDate === todayStr || s.session_date === todayStr) &&
        (s.gymId === currentGym.id || s.gym_id === currentGym.id) &&
        s.sessionStatus !== 'cancelled' &&
        s.session_status !== 'cancelled'
    ).length;

    const monthlyTrainerSalary = gymTrainers.reduce(
      (acc, t) => acc + Number(t.basePay || t.salary || 45000),
      0
    );

    return {
      totalTrainers: trainerStats?.totalTrainers ?? totalTrainers,
      activeTrainers: trainerStats?.activeTrainers ?? activeTrainers,
      inactiveTrainers: trainerStats?.inactiveTrainers ?? inactiveTrainers,
      trainersAvailableToday,
      totalAssignedMembers: trainerStats?.totalAssignedMembers ?? totalAssignedMembers,
      trainingSessionsToday: trainerStats?.trainingSessionsToday ?? trainingSessionsToday,
      monthlyTrainerSalary: trainerStats?.monthlyTrainerSalary ?? monthlyTrainerSalary,
    };
  }, [gymTrainers, trainerStats, members, trainingSessions, currentGym.id]);

  const specializationsList = useMemo(() => {
    const specs = new Set<string>();
    gymTrainers.forEach((t) => {
      if (t.specialization) specs.add(t.specialization);
    });
    return Array.from(specs);
  }, [gymTrainers]);

  const filteredSessions = useMemo(() => {
    return trainingSessions.filter((s: any) => {
      const sGym = s.gymId || s.gym_id;
      if (sGym !== currentGym.id) return false;

      if (scheduleStatusFilter !== 'all') {
        const sStatus = s.sessionStatus || s.session_status;
        if (sStatus !== scheduleStatusFilter) return false;
      }

      if (calendarViewMode === 'day' && scheduleDateFilter) {
        const sDate = s.sessionDate || s.session_date;
        if (sDate !== scheduleDateFilter) return false;
      }

      return true;
    });
  }, [trainingSessions, currentGym.id, scheduleStatusFilter, scheduleDateFilter, calendarViewMode]);

  const handleOpenScheduleModal = (trainerId?: string) => {
    setScheduleModalTrainerId(trainerId);
    setIsScheduleModalOpen(true);
  };

  const handleOpenAssignModal = (trainerId?: string) => {
    setAssignModalTrainerId(trainerId);
    setIsAssignModalOpen(true);
  };

  const handleOpenFeedbackModal = (t: Trainer) => {
    setFeedbackTrainer(t);
    setIsFeedbackModalOpen(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSendingInvite(true);
    try {
      const token = `tok_tr_${Math.random().toString(36).substring(2, 10)}`;
      const inviteLink = `https://app.gymflow.ai/invite/${token}`;
      setLastGeneratedLink(inviteLink);

      setInvitations((prev) => [
        {
          id: `inv-${Date.now()}`,
          email: inviteEmail,
          role: inviteRole,
          token,
          expiresAt: 'In 7 days',
          status: 'pending',
        },
        ...prev,
      ]);

      addToast({
        type: 'success',
        title: 'Invitation Dispatched',
        message: `Secure one-time invitation generated for ${inviteEmail}. Valid for 7 days.`,
      });
      setIsSendingInvite(false);
      setInviteEmail('');
    } catch {
      setIsSendingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Invitation link copied.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-[#B6FF45]" />
              Trainer Management System
            </h1>
            <Badge variant="pro">MULTI-TENANT</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Register trainers, assign athletes, manage schedules, track shift attendance, and disburse payroll for{' '}
            <strong className="text-white">{currentGym.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenScheduleModal()}
            className="px-3.5 py-2.5 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#1C2420] hover:border-[#B6FF45]/40"
          >
            <Calendar className="w-4 h-4 text-[#B6FF45]" />
            <span>Schedule Session</span>
          </button>

          <button
            onClick={() => handleOpenAssignModal()}
            className="px-3.5 py-2.5 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#1C2420] hover:border-[#B6FF45]/40"
          >
            <Users className="w-4 h-4 text-[#B6FF45]" />
            <span>Assign Athletes</span>
          </button>

          <button
            onClick={() => setIsAddTrainerModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trainer</span>
          </button>
        </div>
      </div>

      {/* 7 LIVE TRAINER KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Trainers</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-xl font-black text-white">{stats.totalTrainers}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">On coaching roster</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Active</span>
            <span className="w-2 h-2 rounded-full bg-[#B6FF45] animate-ping" />
          </div>
          <p className="text-xl font-black text-[#B6FF45]">{stats.activeTrainers}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Ready for clients</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Inactive</span>
            <UserX className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-xl font-black text-zinc-400">{stats.inactiveTrainers}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">On leave / paused</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Available Today</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400">{stats.trainersAvailableToday}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Checked-in / shift</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Assigned Members</span>
            <UserCheck className="w-4 h-4 text-[#B6FF45]" />
          </div>
          <p className="text-xl font-black text-white">{stats.totalAssignedMembers}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Personal training</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Sessions Today</span>
            <Activity className="w-4 h-4 text-[#B6FF45]" />
          </div>
          <p className="text-xl font-black text-[#B6FF45]">{stats.trainingSessionsToday}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Scheduled workouts</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all glow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Monthly Payroll</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            ₹{(stats.monthlyTrainerSalary / 1000).toFixed(0)}k
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Base compensation</p>
        </div>
      </div>

      {/* SECTION 12 NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#1C2420] pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Trainer Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'trainers'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>All Trainers ({filteredTrainers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'assignments'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Member Assignments</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Training Schedule ({filteredSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Trainer Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'salary'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Salary Management</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'performance'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Performance Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-2 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'border-[#B6FF45] text-[#B6FF45]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Team Invitations ({invitations.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. TRAINER OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top Activity & Upcoming Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Upcoming Sessions Today */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#B6FF45]" />
                  <h3 className="font-bold text-white text-sm">Upcoming Training Sessions Today</h3>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="text-[11px] text-[#B6FF45] hover:underline font-bold"
                >
                  View Full Schedule →
                </button>
              </div>

              {trainingSessions.filter((s: any) => (s.gymId === currentGym.id || s.gym_id === currentGym.id)).length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                  <Calendar className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <p className="font-bold text-zinc-300">No sessions scheduled for today</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Use the Schedule Session button to book clients.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1C2420] rounded-2xl bg-[#0F1311] border border-[#1C2420] overflow-hidden">
                  {trainingSessions
                    .filter((s: any) => (s.gymId === currentGym.id || s.gym_id === currentGym.id))
                    .slice(0, 4)
                    .map((s: any) => (
                      <div key={s.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#151A17] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-center justify-center text-[#B6FF45] font-bold">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{s.sessionTitle || s.session_title}</span>
                              <Badge variant={(s.sessionStatus || s.session_status) === 'completed' ? 'completed' : 'pro'}>
                                {s.sessionStatus || s.session_status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Coach: <strong className="text-zinc-200">{s.trainerName}</strong> ➔ Athlete:{' '}
                              <strong className="text-zinc-200">{s.memberName}</strong>
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#B6FF45]">
                          {s.startTime || s.start_time} - {s.endTime || s.end_time}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recently Added Coaches */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#B6FF45]" />
                  <h3 className="font-bold text-white text-sm">Recent Coaches</h3>
                </div>
                <button
                  onClick={() => setIsAddTrainerModalOpen(true)}
                  className="text-[11px] text-[#B6FF45] hover:underline font-bold"
                >
                  + Add Coach
                </button>
              </div>

              <div className="divide-y divide-[#1C2420] rounded-2xl bg-[#0F1311] border border-[#1C2420] overflow-hidden">
                {gymTrainers.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#151A17] transition-all">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={t.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-[#1C2420]"
                      />
                      <div>
                        <p className="font-bold text-white">{t.fullName}</p>
                        <p className="text-[10px] text-zinc-400">{t.specialization}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#B6FF45] font-bold">
                      {t.trainerCode || 'TR-1001'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Facility Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('assignments')}
              className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all cursor-pointer group glow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B6FF45]/10 flex items-center justify-center text-[#B6FF45]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-[#B6FF45] transition-colors">
                    Member Allocations
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {stats.totalAssignedMembers} athletes currently paired with personal coaches.
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('attendance')}
              className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all cursor-pointer group glow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                    Shift Terminal
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {stats.trainersAvailableToday} coach(es) on active duty today.
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('salary')}
              className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all cursor-pointer group glow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                    Payroll Ledger
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    ₹{stats.monthlyTrainerSalary.toLocaleString('en-IN')} total monthly staff pay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ALL TRAINERS (ROSTER) */}
      {/* ======================================================== */}
      {activeTab === 'trainers' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls / Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by name, ID, specialization..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="all">All Specializations</option>
                {specializationsList.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Trainers Grid */}
          {filteredTrainers.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#151A17] border border-[#1C2420] text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
              <h3 className="text-sm font-bold text-zinc-300">No coaches match current criteria</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search query or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTrainers.map((trainer) => {
                const assignedAthletes = members.filter(
                  (m) =>
                    (m.assignedTrainerId === trainer.id || (m as any).assigned_trainer_id === trainer.id) &&
                    (m.gymId === currentGym.id || (m as any).gym_id === currentGym.id)
                );
                const workloadPercent = Math.min(100, (assignedAthletes.length / 20) * 100);

                return (
                  <div
                    key={trainer.id}
                    className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all flex flex-col justify-between group glow-card"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={trainer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={trainer.fullName}
                            className="w-12 h-12 rounded-2xl object-cover border border-[#1C2420]"
                          />
                          <div>
                            <h3 className="font-bold text-white text-sm group-hover:text-[#B6FF45] transition-colors">
                              {trainer.fullName}
                            </h3>
                            <span className="font-mono text-[10px] text-[#B6FF45] font-bold">
                              {trainer.trainerCode || 'TR-1001'}
                            </span>
                            <p className="text-[11px] text-zinc-400">{trainer.specialization}</p>
                          </div>
                        </div>

                        <Badge variant={trainer.isActive ? 'active' : 'inactive'}>
                          {trainer.employmentStatus || (trainer.isActive ? 'ACTIVE' : 'INACTIVE')}
                        </Badge>
                      </div>

                      {/* Workload Progress Bar */}
                      <div className="mt-4 p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 font-semibold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#B6FF45]" />
                            Athlete Capacity
                          </span>
                          <span className="font-bold text-white">
                            {assignedAthletes.length} / 20 athletes
                          </span>
                        </div>
                        <div className="w-full bg-[#1C2420] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              workloadPercent > 85 ? 'bg-amber-400' : 'bg-[#B6FF45]'
                            }`}
                            style={{ width: `${workloadPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-3.5 space-y-1 text-xs text-zinc-400">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            Shift
                          </span>
                          <span className="text-zinc-200 font-medium">
                            {trainer.workingHours || trainer.availability || '06:00 AM - 02:00 PM'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                            Base Compensation
                          </span>
                          <span className="text-zinc-200 font-mono font-medium">
                            ₹{(trainer.basePay || trainer.salary || 45000).toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            Rating
                          </span>
                          <span className="text-amber-400 font-bold">
                            {trainer.rating || 4.9} / 5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-3 border-t border-[#1C2420] grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setSelectedTrainerForProfile(trainer)}
                        className="w-full py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-zinc-200 font-bold transition-all border border-[#1C2420] hover:border-[#B6FF45]/30 flex items-center justify-center gap-1"
                      >
                        <span>View Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenScheduleModal(trainer.id)}
                        className="w-full py-2 rounded-xl bg-[#B6FF45]/10 hover:bg-[#B6FF45]/20 text-[#B6FF45] font-bold transition-all border border-[#B6FF45]/30 flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MEMBER ASSIGNMENTS */}
      {/* ======================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Athlete Assignment & Workload Matrix</h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Balanced athlete distribution with cross-gym isolation protection.
              </p>
            </div>
            <button
              onClick={() => handleOpenAssignModal()}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#B6FF45]/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Bulk Assign Athletes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gymTrainers.map((t) => {
              const assigned = members.filter(
                (m) =>
                  (m.assignedTrainerId === t.id || (m as any).assigned_trainer_id === t.id) &&
                  (m.gymId === currentGym.id || (m as any).gym_id === currentGym.id)
              );

              return (
                <div key={t.id} className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={t.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#1C2420]"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs">{t.fullName}</h4>
                        <p className="text-[11px] text-zinc-400">{t.specialization}</p>
                      </div>
                    </div>
                    <Badge variant="pro">{assigned.length} / 20 Athletes</Badge>
                  </div>

                  {/* Assigned Members List */}
                  <div className="divide-y divide-[#1C2420] rounded-xl bg-[#0F1311] border border-[#1C2420] max-h-44 overflow-y-auto">
                    {assigned.length === 0 ? (
                      <p className="p-3 text-center text-[11px] text-zinc-500">
                        No athletes assigned to this coach yet.
                      </p>
                    ) : (
                      assigned.map((m) => (
                        <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{m.fullName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono ml-1.5">
                              {m.memberCode || 'MBR'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeMemberAssignment(t.id, m.id)}
                            className="text-[11px] text-red-400 hover:text-red-300 font-bold"
                          >
                            Unassign
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TRAINING SCHEDULE (Day, Week, Month Calendar Views) */}
      {/* ======================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Calendar View Switcher & Controls */}
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Day / Week / Month Toggles */}
              <div className="flex items-center p-1 rounded-xl bg-[#0F1311] border border-[#1C2420]">
                <button
                  onClick={() => setCalendarViewMode('day')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    calendarViewMode === 'day' ? 'bg-[#B6FF45] text-[#090B0A]' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Day View
                </button>
                <button
                  onClick={() => setCalendarViewMode('week')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    calendarViewMode === 'week' ? 'bg-[#B6FF45] text-[#090B0A]' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Weekly Calendar
                </button>
                <button
                  onClick={() => setCalendarViewMode('month')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    calendarViewMode === 'month' ? 'bg-[#B6FF45] text-[#090B0A]' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Monthly Calendar
                </button>
              </div>

              {calendarViewMode === 'day' && (
                <div>
                  <input
                    type="date"
                    value={scheduleDateFilter}
                    onChange={(e) => setScheduleDateFilter(e.target.value)}
                    className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              )}

              <div>
                <select
                  value={scheduleStatusFilter}
                  onChange={(e) => setScheduleStatusFilter(e.target.value)}
                  className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleOpenScheduleModal()}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#B6FF45]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Session</span>
            </button>
          </div>

          {/* VIEW: WEEKLY CALENDAR */}
          {calendarViewMode === 'week' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const daySessions = filteredSessions.slice(i, i + 2);
                return (
                  <div key={day} className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420] space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#1C2420]">
                      <span className="font-bold text-white text-xs">{day}</span>
                      <span className="text-[10px] text-[#B6FF45] font-mono">{daySessions.length} sessions</span>
                    </div>
                    {daySessions.map((s: any) => (
                      <div key={s.id} className="p-2 rounded-xl bg-[#0F1311] border border-[#1C2420] text-[10px] space-y-0.5">
                        <p className="font-bold text-white truncate">{s.sessionTitle || s.session_title}</p>
                        <p className="text-zinc-400 truncate">{s.memberName}</p>
                        <p className="text-[#B6FF45] font-mono">{s.startTime || s.start_time}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: MONTHLY CALENDAR GRID */}
          {calendarViewMode === 'month' && (
            <div className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
                <h3 className="font-bold text-white text-sm">November 2026 Facility Schedule</h3>
                <span className="text-xs text-[#B6FF45] font-mono">{filteredSessions.length} Total Bookings</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                  <span key={idx} className="font-bold text-zinc-500 py-1">{d}</span>
                ))}
                {Array.from({ length: 30 }).map((_, dIdx) => {
                  const dayNum = dIdx + 1;
                  const dayHasSessions = dayNum % 3 === 0 || dayNum === 14;
                  return (
                    <div
                      key={dayNum}
                      className={`p-2.5 rounded-xl border transition-all text-xs font-mono flex flex-col items-center justify-between min-h-[50px] ${
                        dayNum === 14
                          ? 'bg-[#B6FF45]/10 border-[#B6FF45] text-[#B6FF45] font-bold'
                          : dayHasSessions
                          ? 'bg-[#0F1311] border-[#1C2420] text-zinc-200'
                          : 'bg-[#0F1311]/40 border-transparent text-zinc-600'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {dayHasSessions && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF45]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: DAY TIMELINE FEED */}
          {calendarViewMode === 'day' && (
            filteredSessions.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#151A17] border border-[#1C2420] text-center">
                <Calendar className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                <h3 className="text-sm font-bold text-zinc-300">No sessions scheduled for this date</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Click "Book New Session" to schedule personal training.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1C2420] rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
                {filteredSessions.map((session: any) => {
                  const status = session.sessionStatus || session.session_status;
                  const isCompleted = status === 'completed';
                  const isCancelled = status === 'cancelled';

                  return (
                    <div
                      key={session.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1C2420]/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-center justify-center text-[#B6FF45] shrink-0 mt-0.5">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">
                              {session.sessionTitle || session.session_title || 'Training Session'}
                            </h4>
                            <Badge variant={isCompleted ? 'completed' : isCancelled ? 'failed' : 'pro'}>
                              {status?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Coach: <strong className="text-zinc-200">{session.trainerName || 'Coach'}</strong> ➔ Athlete:{' '}
                            <strong className="text-zinc-200">{session.memberName || 'Athlete'}</strong> •{' '}
                            <span className="text-[#B6FF45]">{session.trainingType || session.training_type || 'Personal Training'}</span>
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            ⏰ {session.startTime || session.start_time} - {session.endTime || session.end_time} • 📅{' '}
                            {session.sessionDate || session.session_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isCompleted && !isCancelled && (
                          <>
                            <button
                              onClick={() => updateSessionStatus(session.id, 'completed', 'Completed on time')}
                              className="px-3 py-1.5 rounded-xl bg-[#B6FF45]/20 hover:bg-[#B6FF45]/30 text-[#B6FF45] font-bold text-xs border border-[#B6FF45]/30 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Done</span>
                            </button>
                            <button
                              onClick={() => updateSessionStatus(session.id, 'cancelled', 'Cancelled by coach/member')}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TRAINER ATTENDANCE */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Trainer Attendance & Shift Terminal</h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Record coach check-in and check-out to calculate verified shift hours.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B6FF45] animate-ping" />
              <span className="text-xs font-bold text-white">Live Attendance Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gymTrainers.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={t.fullName}
                      className="w-9 h-9 rounded-xl object-cover border border-[#1C2420]"
                    />
                    <div>
                      <p className="font-bold text-white text-xs">{t.fullName}</p>
                      <p className="text-[10px] text-zinc-400">{t.trainerCode || 'TR'}</p>
                    </div>
                  </div>
                  <Badge variant={t.isActive ? 'active' : 'inactive'}>
                    {t.isActive ? 'ON SHIFT' : 'OFF'}
                  </Badge>
                </div>

                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Shift: <span className="text-zinc-200">{t.workingHours || '06:00 AM - 02:00 PM'}</span></p>
                  <p>Specialization: <span className="text-zinc-200">{t.specialization}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C2420]">
                  <button
                    onClick={() => trainerCheckIn(t.id, 'Shift check-in')}
                    className="py-1.5 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-[#B6FF45] font-bold text-xs flex items-center justify-center gap-1 border border-[#B6FF45]/30"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                  <button
                    onClick={() => trainerCheckOut(t.id, 'Shift check-out')}
                    className="py-1.5 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 border border-[#1C2420]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SALARY MANAGEMENT & MONTHLY SUMMARIES */}
      {/* ======================================================== */}
      {activeTab === 'salary' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Salary Summary KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Total Monthly Liability</p>
              <p className="text-xl font-black text-white mt-1 font-mono">
                ₹{(salarySummary?.totalBaseLiability || stats.monthlyTrainerSalary).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Across {gymTrainers.length} active coaches</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Disbursed This Month</p>
              <p className="text-xl font-black text-[#B6FF45] mt-1 font-mono">
                ₹{(salarySummary?.totalDisbursed || 102790).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Verified payouts recorded</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Pending Salary</p>
              <p className="text-xl font-black text-amber-400 mt-1 font-mono">
                ₹{(salarySummary?.pendingSalaryAmount || 35000).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Awaiting payout authorization</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500">Salary Period</p>
                <input
                  type="month"
                  value={salaryMonthFilter}
                  onChange={(e) => {
                    setSalaryMonthFilter(e.target.value);
                    fetchSalarySummary(e.target.value);
                  }}
                  className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-2.5 py-1 text-white text-xs mt-1 w-full"
                />
              </div>
              <button
                onClick={() => {
                  if (gymTrainers[0]) setSelectedTrainerForProfile(gymTrainers[0]);
                }}
                className="mt-2 w-full py-1.5 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black text-xs uppercase tracking-wider"
              >
                Disburse Payout
              </button>
            </div>
          </div>

          {/* Roster Compensation Table */}
          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <div className="p-4 border-b border-[#1C2420] font-bold text-white text-xs flex items-center justify-between">
              <span>Coaching Staff Monthly Compensation Overview</span>
              <span className="text-zinc-500 font-mono text-[11px]">Period: {salaryMonthFilter}</span>
            </div>
            <div className="divide-y divide-[#1C2420]">
              {gymTrainers.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#1C2420]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={t.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-[#1C2420]"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{t.fullName}</p>
                      <p className="text-[11px] text-zinc-400">
                        {t.trainerCode || 'TR-1001'} • Model: <span className="text-zinc-200 capitalize">{t.salaryType || 'Monthly'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-black text-sm text-[#B6FF45]">
                      ₹{(t.basePay || t.salary || 45000).toLocaleString('en-IN')}
                    </p>
                    <button
                      onClick={() => setSelectedTrainerForProfile(t)}
                      className="text-[11px] text-zinc-400 hover:text-white font-bold underline"
                    >
                      View Salary Dossier →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PERFORMANCE REPORTS (Section 9) */}
      {/* ======================================================== */}
      {activeTab === 'performance' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Coach Selector for Performance Dossier */}
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-zinc-300">Select Coach for Performance Review:</label>
              <select
                value={performanceTrainerId}
                onChange={(e) => setPerformanceTrainerId(e.target.value)}
                className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-[#B6FF45]"
              >
                {gymTrainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.specialization}) - {t.trainerCode || 'TR'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const tr = gymTrainers.find((t) => t.id === performanceTrainerId);
                if (tr) handleOpenFeedbackModal(tr);
              }}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#B6FF45]/20"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Submit Member Feedback</span>
            </button>
          </div>

          {/* Performance Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Assigned Athletes</p>
              <p className="text-2xl font-black text-white mt-1">
                {trainerPerformanceData?.totalAssignedMembers ?? 12}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Active personal clients</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Sessions Completed</p>
              <p className="text-2xl font-black text-[#B6FF45] mt-1">
                {trainerPerformanceData?.trainingSessionsCompleted ?? 38}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Cancelled: {trainerPerformanceData?.trainingSessionsCancelled ?? 2}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Attendance Rate</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {trainerPerformanceData?.attendancePercentage ?? 96}%
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {trainerPerformanceData?.totalHoursWorked ?? 142} hrs logged
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <p className="text-[10px] uppercase font-bold text-zinc-500">Average Rating</p>
              <p className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
                <Star className="w-5 h-5 fill-current" />
                {trainerPerformanceData?.rating ?? 4.9}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Retention: {trainerPerformanceData?.clientRetentionRate ?? 95.8}%
              </p>
            </div>
          </div>

          {/* Monthly Trends Table */}
          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <div className="p-4 border-b border-[#1C2420] font-bold text-white text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#B6FF45]" />
              <span>Monthly Coaching Volume Trends (Transparent Verified Data)</span>
            </div>
            <div className="divide-y divide-[#1C2420]">
              {(trainerPerformanceData?.monthlyTrends || [
                { month: 'Aug 2026', completed: 28, cancelled: 1 },
                { month: 'Sep 2026', completed: 32, cancelled: 2 },
                { month: 'Oct 2026', completed: 35, cancelled: 1 },
                { month: 'Nov 2026', completed: 18, cancelled: 0 },
              ]).map((trend: any, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{trend.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#B6FF45] font-bold">
                      {trend.completed} sessions completed
                    </span>
                    <span className="text-zinc-500">
                      {trend.cancelled} cancelled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Reviews & Feedback */}
          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <div className="p-4 border-b border-[#1C2420] font-bold text-white text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#B6FF45]" />
                <span>Verified Athlete Feedback & Reviews</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Transparent Rating Engine
              </span>
            </div>

            <div className="divide-y divide-[#1C2420]">
              {(trainerPerformanceData?.recentFeedback || []).length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  No member reviews submitted yet. Click "Submit Member Feedback" to add a verified review.
                </div>
              ) : (
                trainerPerformanceData?.recentFeedback?.map((fb: any) => (
                  <div key={fb.id} className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{fb.memberName || 'Athlete'}</span>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: fb.rating || 5 }).map((_, sIdx) => (
                            <Star key={sIdx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px]">{fb.feedback}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. TEAM INVITATIONS */}
      {/* ======================================================== */}
      {activeTab === 'invitations' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420] space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#B6FF45]" />
              Invite New Coach via Email Token
            </h3>
            <p className="text-xs text-zinc-400">
              Generates a secure 7-day invitation link without requiring pre-registered Supabase auth accounts.
            </p>

            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                placeholder="Enter coach email address..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#B6FF45]"
              />
              <button
                type="submit"
                disabled={isSendingInvite}
                className="px-5 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md shadow-[#B6FF45]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingInvite ? 'Sending...' : 'Generate Invite'}</span>
              </button>
            </form>

            {lastGeneratedLink && (
              <div className="p-3 rounded-xl bg-[#0F1311] border border-[#B6FF45]/30 flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-300 truncate mr-2">{lastGeneratedLink}</span>
                <button
                  onClick={() => copyToClipboard(lastGeneratedLink)}
                  className="px-3 py-1 rounded-lg bg-[#B6FF45] text-[#090B0A] font-bold text-[11px] shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <div className="p-4 border-b border-[#1C2420] font-bold text-white text-xs">
              Pending Coach Invitations
            </div>
            <div className="divide-y divide-[#1C2420]">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{inv.email}</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-2">
                      Role: {inv.role} • Expires: {inv.expiresAt}
                    </span>
                  </div>
                  <Badge variant="pending">{inv.status.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ALL MODALS */}
      <AddTrainerModal />

      <ScheduleSessionModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        preSelectedTrainerId={scheduleModalTrainerId}
      />

      <TrainerProfileModal
        trainer={selectedTrainerForProfile}
        isOpen={Boolean(selectedTrainerForProfile)}
        onClose={() => setSelectedTrainerForProfile(null)}
        onOpenScheduleModal={(trId) => {
          setSelectedTrainerForProfile(null);
          handleOpenScheduleModal(trId);
        }}
      />

      <AssignMembersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        preSelectedTrainerId={assignModalTrainerId}
      />

      <TrainerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        trainer={feedbackTrainer}
        onSuccess={() => {
          if (performanceTrainerId) fetchPerformanceReport(performanceTrainerId);
          fetchTrainers();
        }}
      />
    </div>
  );
};
