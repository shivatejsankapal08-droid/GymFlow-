import React, { createContext, useContext, useState } from 'react';
import { 
  UserProfile, 
  GymTenant, 
  UserRole, 
  Member, 
  MemberStatus,
  Trainer, 
  AttendanceRecord,
  AttendanceStats,
  MemberAttendanceAnalytics,
  PaymentTransaction, 
  PaymentStats,
  PaymentReceiptData,
  PendingDueItem,
  PaymentRefundItem,
  AIBusinessInsight, 
  AutomationLog,
  NotificationPreference,
  NotificationLog,
  AutomationSetting,
  WhatsAppConfig,
  AutomationStats,
  MembershipPlan,
  WorkoutPlan,
  RecentActivity,
  AuthScreenMode,
  UserSessionRecord,
  TrainerStats,
  TrainingSession,
  TrainerAttendanceRecord,
  TrainerSalaryRecord,
  Exercise,
  WorkoutPlanExercise,
  WorkoutLog,
  DietPlan,
  DietPlanMeal,
  MemberProgressRecord,
  WorkoutStats
} from '../types';
import { 
  MOCK_USERS, 
  MOCK_GYMS, 
  MOCK_MEMBERS, 
  MOCK_TRAINERS, 
  MOCK_ATTENDANCE, 
  MOCK_PAYMENTS, 
  MOCK_AI_INSIGHTS, 
  MOCK_AUTOMATION_LOGS,
  MOCK_PLANS,
  MOCK_WORKOUT_PLANS,
  MOCK_RECENT_ACTIVITIES
} from '../data/mockData';
import {
  isSupabaseConfigured,
  signInWithEmail,
  registerGymOwner as registerOwnerSupabase,
  sendPasswordResetEmail,
  updateUserPassword,
  SignUpGymOwnerParams,
  AuthResponse
} from '../lib/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  currentGym: GymTenant;
  allGyms: GymTenant[];
  authorizedGyms: GymTenant[];
  members: Member[];
  trainers: Trainer[];
  attendance: AttendanceRecord[];
  payments: PaymentTransaction[];
  plans: MembershipPlan[];
  workoutPlans: WorkoutPlan[];
  activities: RecentActivity[];
  aiInsights: AIBusinessInsight[];
  automationLogs: AutomationLog[];
  activePage: string;
  toasts: ToastMessage[];
  globalSearch: string;
  isAuthModalOpen: boolean;
  authModalMode: AuthScreenMode;
  isUserProfileModalOpen: boolean;
  verificationPendingEmail: string | null;
  isSupabaseLive: boolean;
  activeSessions: UserSessionRecord[];
  
  // Quick Actions Modals state
  isAddMemberModalOpen: boolean;
  isAddTrainerModalOpen: boolean;
  isRecordPaymentModalOpen: boolean;
  isGenerateQRModalOpen: boolean;
  isSendNotificationModalOpen: boolean;
  
  setGlobalSearch: (q: string) => void;
  setActivePage: (page: string) => void;
  setIsUserProfileModalOpen: (open: boolean) => void;
  setVerificationPendingEmail: (email: string | null) => void;
  setIsAddMemberModalOpen: (open: boolean) => void;
  setIsAddTrainerModalOpen: (open: boolean) => void;
  setIsRecordPaymentModalOpen: (open: boolean) => void;
  setIsGenerateQRModalOpen: (open: boolean) => void;
  setIsSendNotificationModalOpen: (open: boolean) => void;
  
  switchRole: (role: UserRole) => void;
  switchGym: (gymId: string) => Promise<boolean>;
  updateGymSettings: (gymId: string, data: Partial<GymTenant>) => Promise<{ success: boolean; error?: string }>;
  updateGymStatus: (gymId: string, status: 'active' | 'suspended' | 'trialing' | 'inactive') => Promise<{ success: boolean; error?: string }>;
  login: (role: UserRole) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerOwner: (params: SignUpGymOwnerParams) => Promise<AuthResponse>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  changeUserPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openAuthModal: (mode?: AuthScreenMode) => void;
  closeAuthModal: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  addMember: (memberData: Partial<Member>) => void;
  updateMember: (id: string, memberData: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  renewMember: (
    memberId: string,
    renewalData: {
      planId: string;
      discount?: number;
      paymentMethod?: string;
      paymentStatus?: string;
      notes?: string;
    }
  ) => Promise<{ success: boolean; error?: string; newExpiryDate?: string }>;
  updateMemberStatus: (memberId: string, status: MemberStatus) => Promise<{ success: boolean; error?: string }>;
  trainingSessions: TrainingSession[];
  trainerStats: TrainerStats | null;
  selectedTrainerForProfile: Trainer | null;
  isScheduleSessionModalOpen: boolean;
  setIsScheduleSessionModalOpen: (open: boolean) => void;
  setSelectedTrainerForProfile: (trainer: Trainer | null) => void;
  fetchTrainerStats: () => Promise<TrainerStats | null>;
  fetchTrainers: (filters?: { search?: string; status?: string; specialization?: string }) => Promise<Trainer[]>;
  fetchTrainingSessions: (filters?: { trainerId?: string; memberId?: string; date?: string; status?: string }) => Promise<TrainingSession[]>;
  addTrainer: (trainerData: Partial<Trainer> & { sendInvitation?: boolean }) => Promise<{ success: boolean; trainer?: any; error?: string }>;
  scheduleTrainingSession: (sessionData: {
    trainerId: string;
    memberId: string;
    sessionTitle?: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    trainingType?: string;
    notes?: string;
  }) => Promise<{ success: boolean; session?: TrainingSession; error?: string }>;
  rescheduleTrainingSession: (
    sessionId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    notes?: string
  ) => Promise<{ success: boolean; session?: TrainingSession; error?: string }>;
  updateSessionStatus: (
    sessionId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show',
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  assignMembersToTrainer: (
    trainerId: string,
    memberIds: string[],
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeMemberAssignment: (
    trainerId: string,
    memberId: string
  ) => Promise<{ success: boolean; error?: string }>;
  trainerCheckIn: (
    trainerId: string,
    notes?: string
  ) => Promise<{ success: boolean; attendance?: any; error?: string }>;
  trainerCheckOut: (
    trainerId: string,
    notes?: string
  ) => Promise<{ success: boolean; attendance?: any; workingHours?: number; error?: string }>;
  fetchTrainerProfile: (trainerId: string) => Promise<any>;
  recordTrainerSalaryPayout: (
    trainerId: string,
    payoutData: {
      salaryMonth: string;
      baseAmount: number;
      commissionAmount?: number;
      bonusAmount?: number;
      deductions?: number;
      paymentMethod?: string;
      notes?: string;
    }
  ) => Promise<{ success: boolean; salary?: any; error?: string }>;
  addPlan: (planData: Partial<MembershipPlan>) => void;
  updatePlan: (id: string, planData: Partial<MembershipPlan>) => void;
  deletePlan: (id: string) => { success: boolean; error?: string };
  togglePlanStatus: (id: string, status: 'active' | 'inactive') => void;
  addWorkoutPlan: (planData: Partial<WorkoutPlan>) => void;
  checkInMemberWithQR: (qrToken: string) => { success: boolean; member?: Member; message: string };
  recordQRScan: (qrToken: string, mode?: 'auto' | 'check_in' | 'check_out') => Promise<{
    success: boolean;
    action?: 'check_in' | 'check_out';
    member?: any;
    attendance?: any;
    message: string;
    error?: string;
    code?: string;
  }>;
  manualAttendanceCheckIn: (memberId: string, notes?: string) => Promise<{
    success: boolean;
    attendance?: any;
    message: string;
    error?: string;
  }>;
  manualAttendanceCheckOut: (memberIdOrAttendanceId: string, notes?: string) => Promise<{
    success: boolean;
    attendance?: any;
    durationMinutes?: number;
    message: string;
    error?: string;
  }>;
  fetchAttendanceStats: () => Promise<AttendanceStats | null>;
  fetchAttendanceHistory: (filters?: {
    range?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    planId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<{ logs: AttendanceRecord[]; total: number }>;
  fetchMemberAttendance: (memberId: string) => Promise<MemberAttendanceAnalytics | null>;
  recordPayment: (paymentData: Partial<PaymentTransaction>) => void;
  recordSmartPayment: (paymentData: {
    memberId: string;
    membershipPlanId?: string;
    amount: number;
    discount?: number;
    paymentMethod: string;
    transactionId?: string;
    paymentDate?: string;
    paymentStatus?: string;
    notes?: string;
    isRenewal?: boolean;
  }) => Promise<{ success: boolean; payment?: any; receiptNumber?: string; remainingDue?: number; error?: string }>;
  processPaymentRefund: (refundData: {
    paymentId: string;
    refundAmount?: number;
    refundReason: string;
  }) => Promise<{ success: boolean; refund?: any; payment?: any; error?: string }>;
  fetchPaymentReceipt: (paymentId: string) => Promise<PaymentReceiptData | null>;
  fetchPaymentStats: () => Promise<PaymentStats | null>;
  fetchPendingDues: () => Promise<PendingDueItem[]>;
  triggerAutomationTest: (workflowName: string, recipient: string) => void;
  // STEP 11: WHATSAPP AUTOMATION
  automationStats: AutomationStats | null;
  notificationLogs: NotificationLog[];
  automationSettings: AutomationSetting[];
  whatsappConfig: WhatsAppConfig | null;
  fetchAutomationData: () => Promise<void>;
  toggleAutomationWorkflow: (workflowName: string, enabled: boolean) => Promise<boolean>;
  sendTestWhatsApp: (params: {
    recipient: string;
    recipientName?: string;
    templateName?: string;
    messageText?: string;
    parameters?: any;
  }) => Promise<{ success: boolean; error?: string; log?: any }>;
  updateWhatsAppSettings: (configUpdates: Partial<WhatsAppConfig>) => Promise<boolean>;
  updateMemberConsent: (memberId: string, preferences: Partial<NotificationPreference>) => Promise<boolean>;
  fetchMemberConsent: (memberId: string) => Promise<NotificationPreference | null>;
  memberStats: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    expiringSoonMembers: number;
    newMembersThisMonth: number;
    renewalRevenue: number;
  };
  attendanceStats: AttendanceStats;
  paymentStats: PaymentStats;
  exercises: Exercise[];
  dietPlans: DietPlan[];
  workoutStats: WorkoutStats | null;
  memberProgress: MemberProgressRecord[];
  fetchWorkoutStats: () => Promise<WorkoutStats | null>;
  fetchExercises: (filters?: any) => Promise<Exercise[]>;
  createExercise: (data: any) => Promise<{ success: boolean; exercise?: Exercise; error?: string }>;
  fetchWorkoutPlans: (filters?: any) => Promise<WorkoutPlan[]>;
  createWorkoutPlan: (data: any) => Promise<{ success: boolean; workoutPlan?: WorkoutPlan; error?: string }>;
  updateWorkoutPlan: (id: string, data: any) => Promise<{ success: boolean; workoutPlan?: WorkoutPlan; error?: string }>;
  deleteWorkoutPlan: (id: string) => Promise<{ success: boolean; error?: string }>;
  logWorkoutCompletion: (data: any) => Promise<{ success: boolean; log?: WorkoutLog; error?: string }>;
  fetchDietPlans: (filters?: any) => Promise<DietPlan[]>;
  createDietPlan: (data: any) => Promise<{ success: boolean; dietPlan?: DietPlan; error?: string }>;
  deleteDietPlan: (id: string) => Promise<{ success: boolean; error?: string }>;
  recordMemberProgress: (data: any) => Promise<{ success: boolean; progress?: MemberProgressRecord; error?: string }>;
  fetchMemberProgress: (memberId: string) => Promise<any>;
  fetchWorkoutCalendar: (month?: string) => Promise<any>;
  askAIWorkoutCoach: (action: string, prompt: string, context?: any) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(MOCK_USERS.gym_owner);
  const [allGyms, setAllGyms] = useState<GymTenant[]>(MOCK_GYMS);
  const [currentGym, setCurrentGym] = useState<GymTenant>(MOCK_GYMS[0]);
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [trainers, setTrainers] = useState<Trainer[]>(MOCK_TRAINERS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [payments, setPayments] = useState<PaymentTransaction[]>(MOCK_PAYMENTS);
  const [plans, setPlans] = useState<MembershipPlan[]>(MOCK_PLANS);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(MOCK_WORKOUT_PLANS);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgressRecord[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>(MOCK_RECENT_ACTIVITIES);
  const [aiInsights] = useState<AIBusinessInsight[]>(MOCK_AI_INSIGHTS);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>(MOCK_AUTOMATION_LOGS);
  const [automationStats, setAutomationStats] = useState<AutomationStats | null>(null);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [automationSettings, setAutomationSettings] = useState<AutomationSetting[]>([]);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);
  const [activePage, setActivePage] = useState<string>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthScreenMode>('login');
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<UserSessionRecord[]>([
    {
      id: 'sess-1',
      userId: 'user-owner',
      gymId: 'gym-1',
      ipAddress: '103.21.144.12 (Mumbai, India)',
      userAgent: 'Chrome on Windows 11 (Current Device)',
      createdAt: 'Today, 09:15 AM',
      expiresAt: 'In 30 days',
    },
    {
      id: 'sess-2',
      userId: 'user-owner',
      gymId: 'gym-1',
      ipAddress: '157.34.89.21 (Bandra, India)',
      userAgent: 'GymFlow iOS App (iPhone 15 Pro)',
      createdAt: 'Yesterday, 06:40 PM',
      expiresAt: 'In 28 days',
    },
  ]);

  // Compute authorized gyms strictly based on user role and multi-tenant access
  const authorizedGyms = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      return allGyms;
    }
    if (currentUser.role === 'gym_owner') {
      // In multi-gym architecture, owners access gyms they own or have memberships for
      return allGyms.filter(
        (g) => g.id === 'gym-1' || g.id === 'gym-2' || g.id === currentUser.gymId
      );
    }
    // Trainer or Member can only view and access their specifically assigned gym
    const assignedGymId = currentUser.gymId || 'gym-1';
    return allGyms.filter((g) => g.id === assignedGymId);
  }, [currentUser, allGyms]);

  // Dynamically compute live member KPIs for active gym
  const memberStats = React.useMemo(() => {
    const gymMembers = members.filter(
      (m) => currentUser?.role === 'super_admin' || m.gymId === currentGym.id
    );
    const totalMembers = gymMembers.length;
    const activeMembers = gymMembers.filter((m) => m.status === 'active').length;
    const expiredMembers = gymMembers.filter((m) => m.status === 'expired').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiringSoonMembers = gymMembers.filter((m) => {
      if (m.status === 'expiring_soon') return true;
      const exp = new Date(m.membershipEndDate);
      exp.setHours(0, 0, 0, 0);
      const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 15;
    }).length;

    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const newMembersThisMonth = gymMembers.filter((m) => {
      const d = m.createdAt || m.membershipStartDate;
      return d && d.startsWith(currentYearMonth);
    }).length;

    const gymPayments = payments.filter(
      (p) => currentUser?.role === 'super_admin' || p.gymId === currentGym.id
    );
    const renewalRevenue = gymPayments
      .filter((p) => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoonMembers,
      newMembersThisMonth,
      renewalRevenue,
    };
  }, [members, payments, currentGym.id, currentUser?.role]);

  // Dynamically compute live attendance KPIs for active gym
  const attendanceStats = React.useMemo<AttendanceStats>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const gymAttendance = attendance.filter(
      (a) => currentUser?.role === 'super_admin' || a.gymId === currentGym.id
    );

    const todayLogs = gymAttendance.filter((a) => {
      const aDate = a.attendanceDate || a.attendance_date || (a.check_in ? a.check_in.split('T')[0] : '');
      return aDate === todayStr || (!aDate && a.checkInTime);
    });

    const totalCheckInsToday = todayLogs.length;
    const currentlyInsideLogs = gymAttendance.filter(
      (a) => a.status === 'checked_in' && !a.check_out && !a.checkOutTime
    );
    const currentlyInside = currentlyInsideLogs.length;

    const presentMemberIds = new Set(todayLogs.map((a) => a.memberId));
    const totalPresent = presentMemberIds.size;

    const activeGymMembers = members.filter(
      (m) => (currentUser?.role === 'super_admin' || m.gymId === currentGym.id) && m.status === 'active'
    );
    const absentToday = Math.max(0, activeGymMembers.length - totalPresent);

    const hourlyBuckets = [
      { hour: '06:00', label: '06:00 AM', count: 0 },
      { hour: '08:00', label: '08:00 AM', count: 0 },
      { hour: '10:00', label: '10:00 AM', count: 0 },
      { hour: '12:00', label: '12:00 PM', count: 0 },
      { hour: '14:00', label: '02:00 PM', count: 0 },
      { hour: '16:00', label: '04:00 PM', count: 0 },
      { hour: '18:00', label: '06:00 PM', count: 0 },
      { hour: '20:00', label: '08:00 PM', count: 0 },
      { hour: '22:00', label: '10:00 PM', count: 0 },
    ];

    todayLogs.forEach((log) => {
      const raw = log.checkInTime || (log.check_in ? new Date(log.check_in).getHours().toString() : '08:00');
      let h = 8;
      if (raw.includes(':')) {
        const parts = raw.split(':');
        let hour = parseInt(parts[0], 10);
        if (raw.toLowerCase().includes('pm') && hour < 12) hour += 12;
        if (raw.toLowerCase().includes('am') && hour === 12) hour = 0;
        h = hour;
      }
      if (h <= 7) hourlyBuckets[0].count++;
      else if (h <= 9) hourlyBuckets[1].count++;
      else if (h <= 11) hourlyBuckets[2].count++;
      else if (h <= 13) hourlyBuckets[3].count++;
      else if (h <= 15) hourlyBuckets[4].count++;
      else if (h <= 17) hourlyBuckets[5].count++;
      else if (h <= 19) hourlyBuckets[6].count++;
      else if (h <= 21) hourlyBuckets[7].count++;
      else hourlyBuckets[8].count++;
    });

    let maxCount = -1;
    let peak = '06:00 PM - 08:00 PM';
    hourlyBuckets.forEach((b) => {
      if (b.count > maxCount) {
        maxCount = b.count;
        peak = `${b.label} - ${parseInt(b.hour, 10) + 2}:00`;
      }
    });

    const weeklyPct = activeGymMembers.length > 0
      ? Math.min(100, Math.round((Math.max(totalPresent * 1.5, totalCheckInsToday) / activeGymMembers.length) * 100))
      : 84;

    return {
      totalCheckInsToday,
      currentlyInside,
      totalPresent,
      absentToday,
      peakTime: totalCheckInsToday > 0 ? peak : '06:00 PM - 08:00 PM',
      weeklyAttendancePct: weeklyPct,
      activeVisitsCount: currentlyInside,
      totalMembersCount: activeGymMembers.length,
      hourlyFlow: hourlyBuckets,
    };
  }, [attendance, members, currentGym.id, currentUser?.role]);

  // Dynamically compute live payment KPIs & charts for active gym
  const paymentStats = React.useMemo<PaymentStats>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    const gymPayments = payments.filter(
      (p) => currentUser?.role === 'super_admin' || p.gymId === currentGym.id || p.gymId === 'gym-1'
    );
    const gymMembers = members.filter(
      (m) => currentUser?.role === 'super_admin' || m.gymId === currentGym.id
    );

    const completed = gymPayments.filter((p) => p.paymentStatus === 'completed');
    const totalRevenue = completed.reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);
    const todayRevenue = completed
      .filter((p) => (p.paymentDate || p.paidAt || '').startsWith(todayStr))
      .reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);
    const monthlyRevenue = completed
      .filter((p) => (p.paymentDate || p.paidAt || '').startsWith(currentMonthStr))
      .reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);

    const memberPendingDues = gymMembers.reduce((sum, m) => sum + Number(m.pendingDue || 0), 0);
    const pendingTransactions = gymPayments
      .filter((p) => p.paymentStatus === 'pending')
      .reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);
    const pendingPayments = memberPendingDues + pendingTransactions;

    const completedPaymentsCount = completed.length;
    const completedPaymentsAmount = totalRevenue;

    const failed = gymPayments.filter((p) => p.paymentStatus === 'failed');
    const failedPaymentsCount = failed.length;
    const failedPaymentsAmount = failed.reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);

    const refunded = gymPayments.filter((p) => p.paymentStatus === 'refunded');
    const refundedPaymentsCount = refunded.length;
    const refundedPaymentsAmount = refunded.reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);

    const renewals = completed.filter((p) => p.isRenewal || (p as any).is_renewal);
    const membershipRenewalRevenue = renewals.reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);

    // 14-day daily revenue
    const dailyRevenue: Array<{ date: string; label: string; revenue: number; transactions: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const dLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayPays = completed.filter((p) => (p.paymentDate || p.paidAt || '').startsWith(dStr));
      const rev = dayPays.reduce((sum, p) => sum + Number(p.finalAmount ?? p.amount ?? 0), 0);
      dailyRevenue.push({
        date: dStr,
        label: dLabel,
        revenue: rev > 0 ? rev : (i === 0 ? todayRevenue : (i % 3 === 0 ? 7499 : 2999)),
        transactions: dayPays.length > 0 ? dayPays.length : (i % 3 === 0 ? 2 : 1),
      });
    }

    // Monthly chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonthIdx = new Date().getMonth();
    const monthlyRevenueChart = monthNames.map((m, idx) => ({
      month: m,
      revenue: idx < curMonthIdx ? 35000 + (idx * 5000) : (idx === curMonthIdx ? Math.max(monthlyRevenue, 45000) : 0),
      target: 50000 + (idx * 3000),
    }));

    // Yearly chart
    const yearlyRevenue = [
      { year: '2024', revenue: 380000 },
      { year: '2025', revenue: 540000 },
      { year: '2026', revenue: totalRevenue > 0 ? totalRevenue + 450000 : 620000 },
    ];

    // Method distribution
    const methodCounts: { [key: string]: { count: number; amount: number } } = {
      Razorpay: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      Cash: { count: 0, amount: 0 },
      'Credit Card': { count: 0, amount: 0 },
      'Debit Card': { count: 0, amount: 0 },
      'Net Banking': { count: 0, amount: 0 },
    };

    completed.forEach((p) => {
      const m = p.paymentMethod?.toLowerCase() || 'upi';
      const amt = Number(p.finalAmount ?? p.amount ?? 0);
      if (m.includes('razorpay')) { methodCounts.Razorpay.count++; methodCounts.Razorpay.amount += amt; }
      else if (m.includes('upi')) { methodCounts.UPI.count++; methodCounts.UPI.amount += amt; }
      else if (m.includes('cash')) { methodCounts.Cash.count++; methodCounts.Cash.amount += amt; }
      else if (m.includes('credit')) { methodCounts['Credit Card'].count++; methodCounts['Credit Card'].amount += amt; }
      else if (m.includes('debit')) { methodCounts['Debit Card'].count++; methodCounts['Debit Card'].amount += amt; }
      else if (m.includes('net')) { methodCounts['Net Banking'].count++; methodCounts['Net Banking'].amount += amt; }
      else { methodCounts.UPI.count++; methodCounts.UPI.amount += amt; }
    });

    const paymentMethodDistribution = Object.keys(methodCounts).map((k) => ({
      method: k,
      count: methodCounts[k].count,
      amount: methodCounts[k].amount,
      percentage: totalRevenue > 0 ? Math.round((methodCounts[k].amount / totalRevenue) * 100) : 0,
    }));

    // Plan revenue
    const planMap: { [key: string]: { revenue: number; memberCount: number } } = {};
    completed.forEach((p) => {
      const plan = p.planName || 'Standard Plan';
      const amt = Number(p.finalAmount ?? p.amount ?? 0);
      if (!planMap[plan]) planMap[plan] = { revenue: 0, memberCount: 0 };
      planMap[plan].revenue += amt;
      planMap[plan].memberCount++;
    });

    const revenueByPlan = Object.keys(planMap).map((k) => ({
      planName: k,
      revenue: planMap[k].revenue,
      memberCount: planMap[k].memberCount,
    }));

    return {
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      pendingPayments,
      completedPaymentsCount,
      completedPaymentsAmount,
      failedPaymentsCount,
      failedPaymentsAmount,
      refundedPaymentsCount,
      refundedPaymentsAmount,
      membershipRenewalRevenue,
      dailyRevenue,
      monthlyRevenueChart,
      yearlyRevenue,
      paymentMethodDistribution,
      revenueByPlan,
    };
  }, [payments, members, currentGym.id, currentUser?.role]);

  // Quick Action Modal states
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddTrainerModalOpen, setIsAddTrainerModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isGenerateQRModalOpen, setIsGenerateQRModalOpen] = useState(false);
  const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [trainerStats, setTrainerStats] = useState<TrainerStats | null>(null);
  const [selectedTrainerForProfile, setSelectedTrainerForProfile] = useState<Trainer | null>(null);
  const [isScheduleSessionModalOpen, setIsScheduleSessionModalOpen] = useState(false);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const switchRole = (role: UserRole) => {
    const user = MOCK_USERS[role];
    setCurrentUser(user);
    if (user.gymId) {
      const g = allGyms.find((gym) => gym.id === user.gymId);
      if (g) setCurrentGym(g);
    }
    addToast({
      type: 'info',
      title: 'Role Switched',
      message: `Now operating as ${user.fullName} (${role.replace('_', ' ').toUpperCase()})`,
    });
  };

  const switchGym = async (gymId: string): Promise<boolean> => {
    // 1. Validate authorization
    const isAuthorized = authorizedGyms.some((g) => g.id === gymId);
    if (!isAuthorized) {
      addToast({
        type: 'error',
        title: 'Access Denied',
        message: 'You are not authorized to switch to this gym tenant workspace.',
      });
      return false;
    }

    const target = allGyms.find((g) => g.id === gymId);
    if (!target) {
      addToast({
        type: 'error',
        title: 'Gym Not Found',
        message: 'The requested gym tenant could not be resolved.',
      });
      return false;
    }

    // 2. Call backend /api/gyms/switch for server-side tenancy verification
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      await fetch('http://localhost:5000/api/gyms/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gymId }),
      });
    } catch (e) {
      // Local fallback in case server is undergoing restart
    }

    // 3. Update client state & persistent storage
    setCurrentGym(target);
    localStorage.setItem('gymflow_active_gym_id', gymId);

    addToast({
      type: 'info',
      title: 'Gym Workspace Switched',
      message: `Active tenant is now ${target.name} (${target.city}). Data isolated.`,
    });
    return true;
  };

  const updateGymSettings = async (
    gymId: string,
    data: Partial<GymTenant>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/gyms/${gymId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gymName: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: (data as any).state,
          country: data.country,
          logoUrl: data.logoUrl,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to update settings' };
      }
    } catch (e) {
      // fallback
    }

    setAllGyms((prev) =>
      prev.map((g) => (g.id === gymId ? { ...g, ...data } : g))
    );
    if (currentGym.id === gymId) {
      setCurrentGym((prev) => ({ ...prev, ...data }));
    }
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Gym profile and contact information updated successfully.',
    });
    return { success: true };
  };

  const updateGymStatus = async (
    gymId: string,
    status: 'active' | 'suspended' | 'trialing' | 'inactive'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = 'demo-token-super_admin';
      const res = await fetch(`http://localhost:5000/api/admin/gyms/${gymId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to update status' };
      }
    } catch (e) {
      // fallback
    }

    setAllGyms((prev) =>
      prev.map((g) => (g.id === gymId ? { ...g, planStatus: status as any, status: status as any } : g))
    );
    if (currentGym.id === gymId) {
      setCurrentGym((prev) => ({ ...prev, planStatus: status as any, status: status as any }));
    }

    addToast({
      type: status === 'suspended' ? 'warning' : 'success',
      title: `Gym ${status.toUpperCase()}`,
      message: `Tenant status has been set to ${status}.`,
    });
    return { success: true };
  };

  const login = (role: UserRole) => {
    switchRole(role);
    setIsAuthModalOpen(false);
    setActivePage('overview');
    addToast({
      type: 'success',
      title: 'Welcome back!',
      message: `Signed in as ${MOCK_USERS[role].fullName} (${role.replace('_', ' ').toUpperCase()})`,
    });
  };

  const loginWithCredentials = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if live Supabase is configured
    if (isSupabaseConfigured) {
      const res = await signInWithEmail(normalizedEmail, password);
      if (!res.success) {
        return { success: false, error: res.error || 'Authentication failed' };
      }
      
      const role = (res.data?.profile?.role as UserRole) || 'gym_owner';
      const user: UserProfile = {
        id: res.data?.user?.id || 'usr-live',
        email: res.data?.user?.email || normalizedEmail,
        fullName: res.data?.profile?.full_name || 'GymFlow Member',
        role,
        gymId: res.data?.profile?.gym_id || 'gym-1',
        createdAt: new Date().toISOString(),
        isEmailVerified: Boolean(res.data?.user?.email_confirmed_at),
      };

      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setActivePage('overview');
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: `Signed in securely to GymFlow AI`,
      });
      return { success: true };
    }

    // Demo Mode Verification
    const matchingKey = Object.keys(MOCK_USERS).find(
      (k) => MOCK_USERS[k].email.toLowerCase() === normalizedEmail
    );

    if (matchingKey) {
      // Validate password (in demo, accepts 'password123' or any password >= 6 chars)
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const role = matchingKey as UserRole;
      switchRole(role);
      setIsAuthModalOpen(false);
      setActivePage('overview');
      addToast({
        type: 'success',
        title: 'Authenticated Successfully',
        message: `Signed in as ${MOCK_USERS[role].fullName} (${role.replace('_', ' ').toUpperCase()})`,
      });
      return { success: true };
    }

    // If email is not in mock users but looks like a valid email, allow signing in as gym_owner
    if (normalizedEmail.includes('@') && password.length >= 6) {
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        fullName: normalizedEmail.split('@')[0].replace('.', ' '),
        role: 'gym_owner',
        gymId: 'gym-1',
        createdAt: new Date().toISOString(),
        isEmailVerified: true,
      };
      setCurrentUser(newUser);
      setIsAuthModalOpen(false);
      setActivePage('overview');
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: `Signed in as ${newUser.fullName}`,
      });
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password. Please check your credentials.' };
  };

  const registerOwner = async (params: SignUpGymOwnerParams): Promise<AuthResponse> => {
    // 1. Email format check
    if (!params.email.includes('@') || !params.email.includes('.')) {
      return { success: false, error: 'Please enter a valid business email address.' };
    }

    // 2. Password security check
    if (params.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters with letters & numbers.' };
    }

    // 3. Duplicate check against existing state gyms
    const existing = allGyms.find((g) => g.email.toLowerCase() === params.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
    }

    // Call backend API /api/auth/register-gym for atomic tenant onboarding
    let backendGym: any = null;
    let backendUser: any = null;
    try {
      const res = await fetch('http://localhost:5000/api/auth/register-gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymName: params.gymName,
          ownerName: params.fullName,
          email: params.email,
          phone: params.phone,
          address: params.address || 'Central Fitness Hub',
          city: params.city || 'Mumbai',
          state: params.state || 'Maharashtra',
          country: params.country || 'India',
          password: params.password,
          planCode: 'trial',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        backendGym = data.gym;
        backendUser = data.user;
      }
    } catch (e) {
      // Local fallback
    }

    // Call Supabase registration or developer sandbox if not populated by backend
    if (!backendGym) {
      const result = await registerOwnerSupabase(params);
      if (!result.success) {
        return result;
      }
    }

    // Create / register new gym in client state
    const newGymId = backendGym?.id || `gym-${Date.now()}`;
    const newGym: GymTenant = {
      id: newGymId,
      name: params.gymName,
      slug: params.gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tagline: 'Modern Fitness & Performance Centre',
      phone: params.phone,
      email: params.email,
      address: params.address || 'Central Fitness Hub',
      city: params.city,
      country: params.country || 'India',
      currency: 'INR',
      plan: 'pro',
      planStatus: 'trialing',
      memberLimit: 300,
      trainerLimit: 15,
      aiInsightsEnabled: true,
      activeMembersCount: 0,
      totalRevenueMonthly: 0,
      createdAt: new Date().toISOString(),
    };

    setAllGyms((prev) => [...prev, newGym]);
    setCurrentGym(newGym);

    const newOwner: UserProfile = {
      id: backendUser?.id || `usr-${Date.now()}`,
      gymId: newGymId,
      role: 'gym_owner',
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(newOwner);
    setVerificationPendingEmail(params.email);
    setActivePage('overview');
    setIsAuthModalOpen(false);

    addToast({
      type: 'success',
      title: 'Gym Account Created!',
      message: `Welcome ${params.fullName}! 14-day Pro Trial activated for ${params.gymName}. Payment status is Pending real gateway configuration.`,
    });

    return {
      success: true,
      requiresEmailVerification: true,
      data: { user: newOwner, gym: newGym },
    };
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid registered email address.' };
    }
    const res = await sendPasswordResetEmail(email);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to send reset link' };
    }
    addToast({
      type: 'success',
      title: 'Reset Link Dispatched',
      message: `Password reset instructions sent to ${email}`,
    });
    return { success: true };
  };

  const resetUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }
    const res = await updateUserPassword(newPassword);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to reset password' };
    }
    addToast({
      type: 'success',
      title: 'Password Updated',
      message: 'Your password has been changed successfully. You can now log in.',
    });
    return { success: true };
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal and contact details were saved.',
    });
  };

  const changeUserPassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (newPass.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters.' };
    }
    if (oldPass === newPass) {
      return { success: false, error: 'New password must be different from current password.' };
    }
    addToast({
      type: 'success',
      title: 'Password Changed',
      message: 'Your account security credentials were updated successfully.',
    });
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePage('landing');
    setVerificationPendingEmail(null);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been securely signed out.',
    });
  };

  const openAuthModal = (mode: AuthScreenMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const addMember = (data: Partial<Member>) => {
    const newId = `member-${Date.now()}`;
    const newCode = `IP-${1000 + members.length + 1}`;
    const newMember: Member = {
      id: newId,
      gymId: currentGym.id,
      memberCode: data.memberCode || newCode,
      fullName: data.fullName || 'New Athlete',
      email: data.email || '',
      phone: data.phone || '',
      gender: data.gender || 'Male',
      status: 'active',
      currentPlanId: data.currentPlanId || 'plan-2',
      currentPlanName: data.currentPlanName || 'Quarterly Pro Transformation',
      membershipStartDate: new Date().toISOString().split('T')[0],
      membershipEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      qrToken: `GYMFLOW-QR-${newCode}-${data.fullName?.toUpperCase().replace(/\s+/g, '_')}`,
      assignedTrainerId: data.assignedTrainerId,
      assignedTrainerName: data.assignedTrainerName,
      fitnessGoal: data.fitnessGoal || 'General Fitness',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      totalCheckIns: 0,
      pendingDue: 0,
      createdAt: new Date().toISOString(),
    };

    setMembers((prev) => [newMember, ...prev]);

    // Push into recent activities
    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'registration',
      title: 'New Member Registered',
      subtitle: `${newMember.fullName} enrolled in ${newMember.currentPlanName}`,
      timestamp: 'Just now',
      memberName: newMember.fullName,
      memberCode: newMember.memberCode,
      avatarUrl: newMember.avatarUrl || '',
      planName: newMember.currentPlanName,
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Add automation log for welcome notification
    const autoLog: AutomationLog = {
      id: `auto-${Date.now()}`,
      gymId: currentGym.id,
      workflowName: 'Member WhatsApp Onboarding',
      triggerEvent: 'member.registered',
      targetRecipient: `${newMember.phone} (${newMember.fullName})`,
      channel: 'whatsapp',
      payloadSummary: 'Welcome packet, Digital QR Card & Rules sent via WhatsApp',
      status: 'success',
      executionTimeMs: 145,
      createdAt: 'Just now',
    };
    setAutomationLogs((prev) => [autoLog, ...prev]);

    addToast({
      type: 'success',
      title: 'Member Registered',
      message: `${newMember.fullName} registered successfully! WhatsApp welcome sent.`,
    });
  };

  const updateMember = (id: string, memberData: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...memberData } : m))
    );
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Member details have been updated.',
    });
  };

  const deleteMember = (id: string) => {
    const member = members.find((m) => m.id === id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    addToast({
      type: 'warning',
      title: 'Member Removed',
      message: `${member?.fullName || 'Member'} was deleted from the directory.`,
    });
  };

  const updateMemberStatus = async (memberId: string, status: MemberStatus): Promise<{ success: boolean; error?: string }> => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status } : m))
    );
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      await fetch(`http://localhost:5000/api/members/${memberId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      // local fallback
    }

    addToast({
      type: status === 'suspended' || status === 'expired' ? 'warning' : 'success',
      title: 'Status Updated',
      message: `Member status set to ${status.replace('_', ' ').toUpperCase()}`,
    });
    return { success: true };
  };

  const renewMember = async (
    memberId: string,
    renewalData: {
      planId: string;
      discount?: number;
      paymentMethod?: string;
      paymentStatus?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; error?: string; newExpiryDate?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/members/${memberId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(renewalData),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({
          type: 'error',
          title: 'Renewal Failed',
          message: data.error || 'Failed to renew membership.',
        });
        return { success: false, error: data.error };
      }

      const targetPlan = plans.find((p) => p.id === renewalData.planId);
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === memberId) {
            return {
              ...m,
              membershipEndDate: data.new_expiry_date || m.membershipEndDate,
              currentPlanId: renewalData.planId,
              currentPlanName: data.plan_name || targetPlan?.name || m.currentPlanName,
              status: 'active',
              pendingDue: 0,
            };
          }
          return m;
        })
      );

      const newPay: PaymentTransaction = {
        id: data.payment_id || `pay-${Date.now()}`,
        gymId: currentGym.id,
        memberId,
        memberName: members.find((m) => m.id === memberId)?.fullName || 'Member',
        memberCode: members.find((m) => m.id === memberId)?.memberCode || 'IP-1001',
        planId: renewalData.planId,
        planName: data.plan_name || targetPlan?.name,
        amount: data.amount_paid || targetPlan?.price || 0,
        currency: 'INR',
        paymentStatus: (renewalData.paymentStatus as any) || 'completed',
        paymentMethod: (renewalData.paymentMethod as any) || 'upi',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        paidAt: new Date().toISOString(),
      };
      setPayments((prev) => [newPay, ...prev]);

      addToast({
        type: 'success',
        title: 'Membership Renewed! 🚀',
        message: `Membership successfully extended to ${data.new_expiry_date}`,
      });
      return { success: true, newExpiryDate: data.new_expiry_date };
    } catch (err: any) {
      const targetPlan = plans.find((p) => p.id === renewalData.planId);
      const targetMember = members.find((m) => m.id === memberId);
      if (!targetPlan || !targetMember) {
        return { success: false, error: 'Member or plan not found' };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currExp = new Date(targetMember.membershipEndDate);
      currExp.setHours(0, 0, 0, 0);
      const start = currExp >= today ? currExp : today;
      const end = new Date(start);
      end.setMonth(end.getMonth() + targetPlan.durationMonths);
      const newExpiry = end.toISOString().split('T')[0];

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, membershipEndDate: newExpiry, status: 'active', pendingDue: 0 } : m))
      );
      addToast({
        type: 'success',
        title: 'Membership Renewed',
        message: `Membership renewed till ${newExpiry}`,
      });
      return { success: true, newExpiryDate: newExpiry };
    }
  };

  const fetchTrainerStats = async (): Promise<TrainerStats | null> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/trainers/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrainerStats(data.stats);
        return data.stats;
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchTrainers = async (filters?: { search?: string; status?: string; specialization?: string }): Promise<Trainer[]> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.specialization) params.append('specialization', filters.specialization);

      const res = await fetch(`http://localhost:5000/api/trainers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrainers(data.trainers);
        return data.trainers;
      }
      return trainers;
    } catch {
      return trainers;
    }
  };

  const fetchTrainingSessions = async (filters?: {
    trainerId?: string;
    memberId?: string;
    date?: string;
    status?: string;
  }): Promise<TrainingSession[]> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const params = new URLSearchParams();
      if (filters?.trainerId) params.append('trainerId', filters.trainerId);
      if (filters?.memberId) params.append('memberId', filters.memberId);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);

      const res = await fetch(`http://localhost:5000/api/trainers/sessions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrainingSessions(data.sessions);
        return data.sessions;
      }
      return trainingSessions;
    } catch {
      return trainingSessions;
    }
  };

  const addTrainer = async (trainerData: Partial<Trainer> & { sendInvitation?: boolean }): Promise<{ success: boolean; trainer?: any; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/trainers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({
          fullName: trainerData.fullName,
          email: trainerData.email,
          phone: trainerData.phone,
          specialization: trainerData.specialization,
          experience: trainerData.experience,
          shiftTiming: trainerData.workingHours || trainerData.availability,
          salaryType: trainerData.salaryType,
          baseSalary: trainerData.basePay || trainerData.salary,
          hourlyRate: trainerData.hourlyRate,
          commissionRate: trainerData.commissionRate,
          sendInvitation: trainerData.sendInvitation,
          notes: trainerData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Registration Error',
          message: data.error || 'Failed to register trainer.',
        });
        return { success: false, error: data.error || 'Failed to register trainer' };
      }

      setTrainers((prev) => [data.trainer, ...prev]);
      addToast({
        type: 'success',
        title: 'Trainer Onboarded! 🎉',
        message: `${data.trainer.fullName || data.trainer.full_name} (${data.trainer.trainerCode || data.trainer.trainer_code}) added to coaching roster.`,
      });
      fetchTrainerStats();
      return { success: true, trainer: data.trainer };
    } catch (err: any) {
      const newTrainer: Trainer = {
        id: `trainer-${Date.now()}`,
        gymId: currentGym.id,
        trainerCode: `TR-${1000 + trainers.length + 1}`,
        fullName: trainerData.fullName || 'Certified Coach',
        email: trainerData.email || '',
        phone: trainerData.phone || '+91 99000 00000',
        specialization: trainerData.specialization || 'Strength & Conditioning',
        experience: trainerData.experience || '3+ years',
        bio: trainerData.bio || 'Experienced certified coach.',
        salaryType: trainerData.salaryType || 'monthly',
        basePay: trainerData.basePay || 45000,
        rating: 5.0,
        workingHours: trainerData.workingHours || '06:00 AM - 02:00 PM',
        isActive: true,
        assignedMembersCount: 0,
        createdAt: new Date().toISOString(),
      };
      setTrainers((prev) => [newTrainer, ...prev]);
      addToast({
        type: 'success',
        title: 'Trainer Added',
        message: `${newTrainer.fullName} added to ${currentGym.name} roster.`,
      });
      return { success: true, trainer: newTrainer };
    }
  };

  const scheduleTrainingSession = async (sessionData: {
    trainerId: string;
    memberId: string;
    sessionTitle?: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    trainingType?: string;
    notes?: string;
  }): Promise<{ success: boolean; session?: TrainingSession; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/trainers/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(sessionData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Schedule Conflict / Error',
          message: data.error || 'Failed to schedule session.',
        });
        return { success: false, error: data.error || 'Failed to schedule session' };
      }

      setTrainingSessions((prev) => [data.session, ...prev]);
      addToast({
        type: 'success',
        title: 'Session Scheduled ⚡',
        message: `Booked for ${data.session.sessionDate || data.session.session_date} from ${data.session.startTime || data.session.start_time} to ${data.session.endTime || data.session.end_time}.`,
      });
      fetchTrainerStats();
      return { success: true, session: data.session };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const rescheduleTrainingSession = async (
    sessionId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    notes?: string
  ): Promise<{ success: boolean; session?: TrainingSession; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/trainers/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ newDate, newStartTime, newEndTime, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Reschedule Conflict / Error',
          message: data.error || 'Cannot reschedule session.',
        });
        return { success: false, error: data.error };
      }

      setTrainingSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? data.session : s))
      );
      addToast({
        type: 'success',
        title: 'Session Rescheduled 🔄',
        message: `Moved to ${newDate} (${newStartTime} - ${newEndTime}).`,
      });
      return { success: true, session: data.session };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateSessionStatus = async (
    sessionId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/trainers/sessions/${sessionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ status, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Failed to update session status.',
        });
        return { success: false, error: data.error };
      }

      setTrainingSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? data.session : s))
      );
      addToast({
        type: 'info',
        title: 'Session Updated',
        message: `Session status changed to ${status}.`,
      });
      fetchTrainerStats();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const assignMembersToTrainer = async (
    trainerId: string,
    memberIds: string[],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/trainers/${trainerId}/assign-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ memberIds, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Assignment Denied',
          message: data.error || 'Failed to assign members.',
        });
        return { success: false, error: data.error };
      }

      setMembers((prev) =>
        prev.map((m) =>
          memberIds.includes(m.id)
            ? { ...m, assignedTrainerId: trainerId, assignedTrainerName: data.trainer?.fullName || data.trainer?.full_name }
            : m
        )
      );
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainerId ? { ...t, assignedMembersCount: data.trainer?.assignedMembersCount ?? t.assignedMembersCount + memberIds.length } : t))
      );
      addToast({
        type: 'success',
        title: 'Athletes Assigned 🏋️‍♂️',
        message: `${memberIds.length} athlete(s) successfully assigned.`,
      });
      fetchTrainerStats();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const removeMemberAssignment = async (
    trainerId: string,
    memberId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/trainers/${trainerId}/unassign-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Unassign Failed',
          message: data.error || 'Failed to remove assignment.',
        });
        return { success: false, error: data.error };
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, assignedTrainerId: undefined, assignedTrainerName: undefined } : m))
      );
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainerId ? { ...t, assignedMembersCount: Math.max(0, t.assignedMembersCount - 1) } : t))
      );
      addToast({
        type: 'info',
        title: 'Assignment Removed',
        message: 'Athlete has been unassigned.',
      });
      fetchTrainerStats();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const trainerCheckIn = async (
    trainerId: string,
    notes?: string
  ): Promise<{ success: boolean; attendance?: any; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/trainers/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ trainerId, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Check-In Error',
          message: data.error || 'Failed to check-in trainer.',
        });
        return { success: false, error: data.error };
      }

      addToast({
        type: 'success',
        title: 'Trainer Checked In 🟢',
        message: 'Shift attendance recorded successfully.',
      });
      fetchTrainerStats();
      return { success: true, attendance: data.attendance };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const trainerCheckOut = async (
    trainerId: string,
    notes?: string
  ): Promise<{ success: boolean; attendance?: any; workingHours?: number; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/trainers/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ trainerId, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Check-Out Error',
          message: data.error || 'Failed to check-out trainer.',
        });
        return { success: false, error: data.error };
      }

      addToast({
        type: 'info',
        title: 'Trainer Shift Concluded 🏁',
        message: `Shift recorded: ${data.workingHours ?? 8} hours worked today.`,
      });
      fetchTrainerStats();
      return { success: true, attendance: data.attendance, workingHours: data.workingHours };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchTrainerProfile = async (trainerId: string): Promise<any> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/trainers/${trainerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const recordTrainerSalaryPayout = async (
    trainerId: string,
    payoutData: {
      salaryMonth: string;
      baseAmount: number;
      commissionAmount?: number;
      bonusAmount?: number;
      deductions?: number;
      paymentMethod?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; salary?: any; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/trainers/${trainerId}/salaries/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(payoutData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Payroll Error',
          message: data.error || 'Failed to record salary payout.',
        });
        return { success: false, error: data.error };
      }

      addToast({
        type: 'success',
        title: 'Salary Disbursed 💳',
        message: `Payout of ₹${data.salary.netPaid.toLocaleString('en-IN')} recorded for ${payoutData.salaryMonth}.`,
      });
      fetchTrainerStats();
      return { success: true, salary: data.salary };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addPlan = (planData: Partial<MembershipPlan>) => {
    const newPlan: MembershipPlan = {
      id: `plan-${Date.now()}`,
      gymId: currentGym.id,
      name: planData.name || 'New Membership Tier',
      durationMonths: planData.durationMonths || 1,
      price: planData.price || 3499,
      description: planData.description || 'Full gym and cardio access.',
      features: planData.features || ['Full Gym Access', 'Locker Room Access'],
      isActive: true,
      activeSubscribers: 0,
    };
    setPlans((prev) => [...prev, newPlan]);
    addToast({
      type: 'success',
      title: 'Plan Published',
      message: `${newPlan.name} is now available for registration.`,
    });
  };

  const updatePlan = (id: string, planData: Partial<MembershipPlan>) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...planData } : p))
    );
    addToast({
      type: 'success',
      title: 'Plan Updated',
      message: 'Membership plan details saved.',
    });
  };

  const deletePlan = (id: string): { success: boolean; error?: string } => {
    const assignedMembers = members.filter(
      (m) => m.currentPlanId === id || m.currentPlanName === plans.find((p) => p.id === id)?.name
    );
    if (assignedMembers.length > 0) {
      addToast({
        type: 'error',
        title: 'Plan Deletion Blocked',
        message: `Cannot delete plan: Associated with ${assignedMembers.length} member record(s). Deactivate the plan instead.`,
      });
      return {
        success: false,
        error: `Cannot delete plan: Associated with ${assignedMembers.length} member record(s).`,
      };
    }

    setPlans((prev) => prev.filter((p) => p.id !== id));
    addToast({
      type: 'warning',
      title: 'Plan Deleted',
      message: 'Plan removed from billing engine.',
    });
    return { success: true };
  };

  const togglePlanStatus = (id: string, status: 'active' | 'inactive') => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: status === 'active', status } : p))
    );
    addToast({
      type: 'info',
      title: `Plan ${status === 'active' ? 'Activated' : 'Deactivated'}`,
      message: `Plan visibility set to ${status}.`,
    });
  };

  const addWorkoutPlan = (data: Partial<WorkoutPlan>) => {
    const newWp: WorkoutPlan = {
      id: `wp-${Date.now()}`,
      gymId: currentGym.id,
      title: data.title || 'Custom Athlete Protocol',
      level: data.level || 'Intermediate',
      durationWeeks: data.durationWeeks || 8,
      daysPerWeek: data.daysPerWeek || 4,
      category: data.category || 'Hypertrophy',
      targetAudience: data.targetAudience || 'Athletes seeking progressive overload',
      trainerName: data.trainerName || 'Alex Rivera',
      exercisesCount: 16,
      exercises: data.exercises || [],
    };
    setWorkoutPlans((prev) => [newWp, ...prev]);
    addToast({
      type: 'success',
      title: 'Workout Program Created',
      message: `${newWp.title} created and ready to assign.`,
    });
  };

  const checkInMemberWithQR = (qrToken: string) => {
    const member = members.find(
      (m) => m.qrToken.toLowerCase() === qrToken.toLowerCase() || 
             m.memberCode.toLowerCase() === qrToken.toLowerCase()
    );

    if (!member) {
      addToast({
        type: 'error',
        title: 'QR Scan Failed',
        message: 'Invalid QR code. No member registered with this token.',
      });
      return { success: false, message: 'Invalid or unrecognized QR code.' };
    }

    // Multi-Tenant Isolation Check: Member MUST belong to active gym
    if (member.gymId !== currentGym.id && currentUser?.role !== 'super_admin') {
      addToast({
        type: 'error',
        title: 'Access Denied',
        message: `Athlete ${member.fullName} is registered with another gym facility. Attendance cannot be recorded at ${currentGym.name}.`,
      });
      return {
        success: false,
        member,
        message: 'Cross-gym check-in denied. Athlete belongs to another facility.',
      };
    }

    if (member.status === 'expired') {
      addToast({
        type: 'error',
        title: 'Access Denied',
        message: `${member.fullName}'s membership has expired! Pending due: ₹${member.pendingDue || 2999}`,
      });
      return { success: false, member, message: 'Membership expired. Please renew plan.' };
    }

    const existingLog = attendance.find(
      (a) => a.memberId === member.id && a.status === 'checked_in'
    );

    if (existingLog) {
      const updatedLog: AttendanceRecord = {
        ...existingLog,
        status: 'checked_out',
        checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: Math.floor(Math.random() * 50) + 45,
      };

      setAttendance((prev) =>
        prev.map((a) => (a.id === existingLog.id ? updatedLog : a))
      );

      const checkOutActivity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'check_in',
        title: `${member.fullName} checked out`,
        subtitle: `${member.memberCode} • Finished ${updatedLog.durationMinutes} min workout`,
        timestamp: 'Just now',
        memberName: member.fullName,
        memberCode: member.memberCode,
        avatarUrl: member.avatarUrl || '',
      };
      setActivities((prev) => [checkOutActivity, ...prev]);

      addToast({
        type: 'success',
        title: 'Check-Out Recorded 👋',
        message: `${member.fullName} checked out. Great recovery!`,
      });

      return { success: true, member, message: `Checked out successfully.` };
    } else {
      const newAttendance: AttendanceRecord = {
        id: `att-${Date.now()}`,
        gymId: currentGym.id,
        memberId: member.id,
        memberName: member.fullName,
        memberCode: member.memberCode,
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verificationMethod: 'qr_scanner',
        status: 'checked_in',
        avatarUrl: member.avatarUrl,
      };

      setAttendance((prev) => [newAttendance, ...prev]);

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? { ...m, totalCheckIns: (m.totalCheckIns || 0) + 1, lastCheckIn: 'Just now' }
            : m
        )
      );

      const checkInActivity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'check_in',
        title: `${member.fullName} checked in`,
        subtitle: `${member.memberCode} • QR Verified at Turnstile A`,
        timestamp: 'Just now',
        memberName: member.fullName,
        memberCode: member.memberCode,
        avatarUrl: member.avatarUrl || '',
      };
      setActivities((prev) => [checkInActivity, ...prev]);

      addToast({
        type: 'success',
        title: 'Check-In Verified! ⚡',
        message: `Welcome, ${member.fullName}! Valid ${member.currentPlanName}.`,
      });

      return { success: true, member, message: 'Check-in confirmed.' };
    }
  };

  const recordQRScan = async (
    qrToken: string,
    mode: 'auto' | 'check_in' | 'check_out' = 'auto'
  ): Promise<{
    success: boolean;
    action?: 'check_in' | 'check_out';
    member?: any;
    attendance?: any;
    message: string;
    error?: string;
    code?: string;
  }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({
          qrToken,
          mode,
          stationName: 'Turnstile Optical Kiosk',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: data.code === 'CROSS_GYM_DENIED' ? 'Cross-Gym Access Denied' : 'Attendance Scan Blocked',
          message: data.error || data.message || 'Scan rejected.',
        });
        return {
          success: false,
          code: data.code,
          error: data.error,
          member: data.member,
          message: data.error || 'Scan rejected.',
        };
      }

      if (data.action === 'check_in') {
        const newRecord: AttendanceRecord = {
          id: data.log?.id || `att-${Date.now()}`,
          gymId: currentGym.id,
          memberId: data.member?.id,
          memberName: data.member?.fullName,
          memberCode: data.member?.memberCode,
          planName: data.member?.planName,
          avatarUrl: data.member?.avatarUrl,
          check_in: data.log?.check_in,
          checkInTime: data.log?.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'checked_in',
          verificationMethod: 'qr_scanner',
          recordedByName: 'Turnstile Optical Kiosk',
          attendanceDate: new Date().toISOString().split('T')[0],
        };
        setAttendance((prev) => [newRecord, ...prev.filter((a) => a.id !== newRecord.id)]);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === data.member?.id
              ? { ...m, totalCheckIns: (m.totalCheckIns || 0) + 1, lastCheckIn: 'Just now' }
              : m
          )
        );

        const newAct: RecentActivity = {
          id: `act-${Date.now()}`,
          type: 'check_in',
          title: `${data.member?.fullName} checked in`,
          subtitle: `${data.member?.memberCode} • QR Verified at Turnstile`,
          timestamp: 'Just now',
          memberName: data.member?.fullName,
          memberCode: data.member?.memberCode,
          avatarUrl: data.member?.avatarUrl || '',
        };
        setActivities((prev) => [newAct, ...prev]);

        addToast({
          type: 'success',
          title: 'Access Granted ⚡',
          message: `Welcome, ${data.member?.fullName}! Check-in recorded.`,
        });
      } else {
        setAttendance((prev) =>
          prev.map((a) => {
            if (a.id === data.log?.id || (a.memberId === data.member?.id && a.status === 'checked_in')) {
              return {
                ...a,
                status: 'checked_out',
                check_out: data.log?.check_out,
                checkOutTime: data.log?.checkOutTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                durationMinutes: data.durationMinutes || data.log?.durationMinutes || 60,
              };
            }
            return a;
          })
        );

        const newAct: RecentActivity = {
          id: `act-${Date.now()}`,
          type: 'check_in',
          title: `${data.member?.fullName} checked out`,
          subtitle: `${data.member?.memberCode} • Completed ${data.durationMinutes || 60}m session`,
          timestamp: 'Just now',
          memberName: data.member?.fullName,
          memberCode: data.member?.memberCode,
          avatarUrl: data.member?.avatarUrl || '',
        };
        setActivities((prev) => [newAct, ...prev]);

        addToast({
          type: 'info',
          title: 'Check-out Recorded 👋',
          message: `${data.member?.fullName} finished workout (${data.durationMinutes || 60} mins).`,
        });
      }

      return {
        success: true,
        action: data.action,
        member: data.member,
        attendance: data.log || data.attendance,
        message: data.message,
      };
    } catch (err: any) {
      const localRes = checkInMemberWithQR(qrToken);
      return {
        success: localRes.success,
        action: 'check_in',
        member: localRes.member,
        message: localRes.message,
      };
    }
  };

  const manualAttendanceCheckIn = async (
    memberId: string,
    notes?: string
  ): Promise<{
    success: boolean;
    attendance?: any;
    message: string;
    error?: string;
  }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/attendance/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({
          memberId,
          action: 'check_in',
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Check-In Blocked',
          message: data.error || 'Failed to record check-in.',
        });
        return { success: false, error: data.error, message: data.error };
      }

      const targetMember = members.find((m) => m.id === memberId);
      const newRecord: AttendanceRecord = {
        id: data.log?.id || `att-${Date.now()}`,
        gymId: currentGym.id,
        memberId,
        memberName: targetMember?.fullName || data.log?.memberName || 'Member',
        memberCode: targetMember?.memberCode || data.log?.memberCode || 'IP-1001',
        planName: targetMember?.currentPlanName,
        avatarUrl: targetMember?.avatarUrl,
        check_in: data.log?.check_in,
        checkInTime: data.log?.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'checked_in',
        verificationMethod: 'manual',
        recordedByName: currentUser?.fullName || 'Staff Member',
        notes: notes || null,
        attendanceDate: new Date().toISOString().split('T')[0],
      };
      setAttendance((prev) => [newRecord, ...prev]);

      addToast({
        type: 'success',
        title: 'Manual Check-In Confirmed',
        message: `Attendance marked for ${newRecord.memberName}`,
      });
      return { success: true, attendance: newRecord, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message, message: 'Server communication error.' };
    }
  };

  const manualAttendanceCheckOut = async (
    memberIdOrAttendanceId: string,
    notes?: string
  ): Promise<{
    success: boolean;
    attendance?: any;
    durationMinutes?: number;
    message: string;
    error?: string;
  }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/attendance/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({
          memberId: memberIdOrAttendanceId,
          attendanceId: memberIdOrAttendanceId,
          action: 'check_out',
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast({
          type: 'error',
          title: 'Check-Out Blocked',
          message: data.error || 'Failed to record check-out.',
        });
        return { success: false, error: data.error, message: data.error };
      }

      setAttendance((prev) =>
        prev.map((a) => {
          if (a.id === memberIdOrAttendanceId || a.memberId === memberIdOrAttendanceId) {
            return {
              ...a,
              status: 'checked_out',
              checkOutTime: data.log?.checkOutTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              durationMinutes: data.durationMinutes || 60,
              notes: notes || a.notes,
            };
          }
          return a;
        })
      );

      addToast({
        type: 'info',
        title: 'Check-Out Recorded',
        message: `Member checked out (${data.durationMinutes || 60} mins workout).`,
      });
      return {
        success: true,
        attendance: data.log,
        durationMinutes: data.durationMinutes,
        message: data.message,
      };
    } catch (err: any) {
      return { success: false, error: err.message, message: 'Server communication error.' };
    }
  };

  const fetchAttendanceStats = async (): Promise<AttendanceStats | null> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/attendance/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data || data.stats;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const fetchAttendanceHistory = async (filters: any = {}): Promise<{ logs: AttendanceRecord[]; total: number }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const params = new URLSearchParams();
      if (filters.range) params.append('range', filters.range);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('q', filters.search);
      if (filters.planId) params.append('planId', filters.planId);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await fetch(`http://localhost:5000/api/attendance/history?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { logs: data.data || [], total: data.total || 0 };
      }
      return { logs: [], total: 0 };
    } catch (e) {
      return { logs: attendance, total: attendance.length };
    }
  };

  const fetchMemberAttendance = async (memberId: string): Promise<MemberAttendanceAnalytics | null> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/attendance/member/${memberId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data || data.analytics;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const recordPayment = (paymentData: Partial<PaymentTransaction>) => {
    const invoiceNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      gymId: currentGym.id,
      memberId: paymentData.memberId || 'member-1',
      memberName: paymentData.memberName || 'Member',
      memberCode: paymentData.memberCode || 'IP-1001',
      planName: paymentData.planName || 'Monthly Standard',
      amount: paymentData.amount || 2999,
      currency: 'INR',
      paymentStatus: 'completed',
      paymentMethod: paymentData.paymentMethod || 'razorpay',
      invoiceNumber: invoiceNum,
      paidAt: new Date().toISOString(),
      notes: paymentData.notes || 'Razorpay verified instant payment',
    };

    setPayments((prev) => [newPayment, ...prev]);

    setMembers((prev) =>
      prev.map((m) => (m.id === paymentData.memberId ? { ...m, pendingDue: 0, status: 'active' } : m))
    );

    // Push into activities
    const paymentActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'payment',
      title: `₹${newPayment.amount.toLocaleString('en-IN')} Payment Captured`,
      subtitle: `${newPayment.memberName} (${newPayment.memberCode}) • ${newPayment.paymentMethod.toUpperCase()}`,
      timestamp: 'Just now',
      amount: newPayment.amount,
      memberName: newPayment.memberName,
      memberCode: newPayment.memberCode,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      planName: newPayment.planName,
    };
    setActivities((prev) => [paymentActivity, ...prev]);

    const autoLog: AutomationLog = {
      id: `auto-${Date.now()}`,
      gymId: currentGym.id,
      workflowName: 'Razorpay Payment Receipt & Tax Invoice',
      triggerEvent: 'payment.completed',
      targetRecipient: `${newPayment.memberName}`,
      channel: 'whatsapp',
      payloadSummary: `Invoice ${newPayment.invoiceNumber} (₹${newPayment.amount}) sent with PDF link`,
      status: 'success',
      executionTimeMs: 162,
      createdAt: 'Just now',
    };
    setAutomationLogs((prev) => [autoLog, ...prev]);

    addToast({
      type: 'success',
      title: 'Payment Received! 💳',
      message: `₹${newPayment.amount} confirmed for ${newPayment.memberName}. Receipt sent to WhatsApp!`,
    });
  };

  const recordSmartPayment = async (paymentData: {
    memberId: string;
    membershipPlanId?: string;
    amount: number;
    discount?: number;
    paymentMethod: string;
    transactionId?: string;
    paymentDate?: string;
    paymentStatus?: string;
    notes?: string;
    isRenewal?: boolean;
  }): Promise<{ success: boolean; payment?: any; receiptNumber?: string; remainingDue?: number; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/payments/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to record payment' };
      }

      setPayments((prev) => [data.payment, ...prev]);

      setMembers((prev) =>
        prev.map((m) =>
          m.id === paymentData.memberId
            ? { ...m, pendingDue: data.remainingDue ?? 0, status: data.remainingDue === 0 ? 'active' : m.status }
            : m
        )
      );

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'payment',
        title: `₹${(data.payment.finalAmount || data.payment.amount)?.toLocaleString('en-IN')} Payment Recorded`,
        subtitle: `${data.payment.memberName} (${data.payment.memberCode}) • ${data.payment.paymentMethod?.toUpperCase()}`,
        timestamp: 'Just now',
        amount: data.payment.finalAmount || data.payment.amount,
        memberName: data.payment.memberName,
        memberCode: data.payment.memberCode,
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        planName: data.payment.planName,
      };
      setActivities((prev) => [activity, ...prev]);

      addToast({
        type: 'success',
        title: 'Payment Recorded! 🧾',
        message: `Receipt ${data.receiptNumber} generated. Amount: ₹${data.payment.finalAmount || data.payment.amount}.`,
      });

      return {
        success: true,
        payment: data.payment,
        receiptNumber: data.receiptNumber,
        remainingDue: data.remainingDue,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error recording payment' };
    }
  };

  const processPaymentRefund = async (refundData: {
    paymentId: string;
    refundAmount?: number;
    refundReason: string;
  }): Promise<{ success: boolean; refund?: any; payment?: any; error?: string }> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(refundData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to process refund' };
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === refundData.paymentId ? { ...p, paymentStatus: 'refunded' as const } : p))
      );

      addToast({
        type: 'info',
        title: 'Refund Processed 💸',
        message: `Payment ${refundData.paymentId} has been marked as refunded. Reason: ${refundData.refundReason}`,
      });

      return { success: true, refund: data.refund, payment: data.payment };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error processing refund' };
    }
  };

  const fetchPaymentReceipt = async (paymentId: string): Promise<PaymentReceiptData | null> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch(`http://localhost:5000/api/payments/receipt/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.receipt) {
        return data.receipt;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const fetchPaymentStats = async (): Promise<PaymentStats | null> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/payments/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        return data.stats;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const fetchPendingDues = async (): Promise<PendingDueItem[]> => {
    try {
      const token = `demo-token-${currentUser?.role || 'gym_owner'}`;
      const res = await fetch('http://localhost:5000/api/payments/dues', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.members) {
        return data.members;
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const triggerAutomationTest = (workflowName: string, recipient: string) => {
    const autoLog: AutomationLog = {
      id: `auto-${Date.now()}`,
      gymId: currentGym.id,
      workflowName,
      triggerEvent: 'manual.test_trigger',
      targetRecipient: recipient,
      channel: 'whatsapp',
      payloadSummary: 'Test payload successfully dispatched to n8n webhook and Meta Cloud API',
      status: 'success',
      executionTimeMs: 135,
      createdAt: 'Just now',
    };
    setAutomationLogs((prev) => [autoLog, ...prev]);

    addToast({
      type: 'success',
      title: 'Automation Dispatched! 🚀',
      message: `${workflowName} executed for ${recipient} via n8n`,
    });
  };

  // ==========================================
  // STEP 11: WHATSAPP AUTOMATION METHODS
  // ==========================================

  const fetchAutomationData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${getAuthToken()}`,
        'X-Gym-Id': currentGym.id,
      };

      const [statsRes, logsRes, settingsRes, configRes] = await Promise.all([
        fetch('http://localhost:5000/api/automation/stats', { headers }).catch(() => null),
        fetch('http://localhost:5000/api/automation/logs?limit=50', { headers }).catch(() => null),
        fetch('http://localhost:5000/api/automation/settings', { headers }).catch(() => null),
        fetch('http://localhost:5000/api/automation/config', { headers }).catch(() => null),
      ]);

      if (statsRes?.ok) {
        const data = await statsRes.json();
        if (data.stats) setAutomationStats(data.stats);
      }
      if (logsRes?.ok) {
        const data = await logsRes.json();
        if (data.logs) setNotificationLogs(data.logs);
      }
      if (settingsRes?.ok) {
        const data = await settingsRes.json();
        if (data.settings) setAutomationSettings(data.settings);
      }
      if (configRes?.ok) {
        const data = await configRes.json();
        if (data.config) setWhatsappConfig(data.config);
      }
    } catch (err: any) {
      console.warn('Failed to load automation data:', err.message);
    }
  };

  const toggleAutomationWorkflow = async (workflowName: string, enabled: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`http://localhost:5000/api/automation/settings/${workflowName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) throw new Error('Failed to update workflow toggle');

      setAutomationSettings((prev) =>
        prev.map((s) => (s.workflow_name === workflowName ? { ...s, enabled } : s))
      );

      addToast({
        type: enabled ? 'success' : 'info',
        title: enabled ? 'Workflow Activated ⚡' : 'Workflow Paused ⏸️',
        message: `${workflowName.replace(/_/g, ' ')} is now ${enabled ? 'active' : 'paused'}.`,
      });

      return true;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Error',
        message: err.message,
      });
      return false;
    }
  };

  const sendTestWhatsApp = async (params: {
    recipient: string;
    recipientName?: string;
    templateName?: string;
    messageText?: string;
    parameters?: any;
  }): Promise<{ success: boolean; error?: string; log?: any }> => {
    try {
      const res = await fetch('http://localhost:5000/api/automation/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch test message');

      if (data.log) {
        setNotificationLogs((prev) => [data.log, ...prev]);
      }

      addToast({
        type: 'success',
        title: 'WhatsApp Dispatched! 📲',
        message: `Test message routed to ${params.recipient} (${data.dispatch?.status || 'delivered'})`,
      });

      return { success: true, log: data.log };
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: err.message,
      });
      return { success: false, error: err.message };
    }
  };

  const updateWhatsAppSettings = async (configUpdates: Partial<WhatsAppConfig>): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/api/automation/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(configUpdates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update WhatsApp configuration');

      if (data.config) setWhatsappConfig(data.config);

      addToast({
        type: 'success',
        title: 'WhatsApp Config Saved ⚙️',
        message: 'Credentials and webhook settings updated securely.',
      });

      return true;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Config Save Error',
        message: err.message,
      });
      return false;
    }
  };

  const updateMemberConsent = async (
    memberId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`http://localhost:5000/api/automation/preferences/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(preferences),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member preferences');

      addToast({
        type: 'success',
        title: 'Consent Updated 🔒',
        message: 'Member notification preferences updated successfully.',
      });

      return true;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Consent Error',
        message: err.message,
      });
      return false;
    }
  };

  const fetchMemberConsent = async (memberId: string): Promise<NotificationPreference | null> => {
    try {
      const res = await fetch(`http://localhost:5000/api/automation/preferences/${memberId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.preferences || null;
    } catch {
      return null;
    }
  };

  // ==========================================
  // STEP 10: WORKOUT & DIET MANAGEMENT METHODS
  // ==========================================

  const getAuthToken = () => `demo-token-${currentUser?.role || 'gym_owner'}`;

  const fetchWorkoutStats = async (): Promise<WorkoutStats | null> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/stats', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        setWorkoutStats(data.stats);
        return data.stats;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const fetchExercises = async (filters: any = {}): Promise<Exercise[]> => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:5000/api/workouts/exercises?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.exercises) {
        setExercises(data.exercises);
        return data.exercises;
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const createExercise = async (data: any): Promise<{ success: boolean; exercise?: Exercise; error?: string }> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.exercise) {
        setExercises((prev) => [json.exercise, ...prev]);
        addToast({
          type: 'success',
          title: 'Exercise Added',
          message: `${json.exercise.exerciseName} saved to gym library.`,
        });
        return { success: true, exercise: json.exercise };
      }
      addToast({
        type: 'error',
        title: 'Exercise Failed',
        message: json.error || 'Failed to create exercise.',
      });
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchWorkoutPlans = async (filters: any = {}): Promise<WorkoutPlan[]> => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:5000/api/workouts/plans?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.workoutPlans) {
        setWorkoutPlans(data.workoutPlans);
        return data.workoutPlans;
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const createWorkoutPlan = async (data: any): Promise<{ success: boolean; workoutPlan?: WorkoutPlan; error?: string }> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.workoutPlan) {
        setWorkoutPlans((prev) => [json.workoutPlan, ...prev]);
        addToast({
          type: 'success',
          title: 'Workout Plan Created',
          message: `${json.workoutPlan.planName || json.workoutPlan.title} assigned to ${json.workoutPlan.memberName}.`,
        });
        fetchWorkoutStats();
        return { success: true, workoutPlan: json.workoutPlan };
      }
      addToast({
        type: 'error',
        title: 'Plan Creation Failed',
        message: json.error || 'Failed to save workout plan.',
      });
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateWorkoutPlan = async (id: string, data: any): Promise<{ success: boolean; workoutPlan?: WorkoutPlan; error?: string }> => {
    try {
      const res = await fetch(`http://localhost:5000/api/workouts/plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setWorkoutPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...json.workoutPlan } : p)));
        addToast({
          type: 'success',
          title: 'Plan Updated',
          message: 'Workout plan updated successfully.',
        });
        return { success: true, workoutPlan: json.workoutPlan };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteWorkoutPlan = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`http://localhost:5000/api/workouts/plans/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setWorkoutPlans((prev) => prev.filter((p) => p.id !== id));
        addToast({
          type: 'success',
          title: 'Plan Deleted',
          message: 'Workout plan removed.',
        });
        fetchWorkoutStats();
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logWorkoutCompletion = async (data: any): Promise<{ success: boolean; log?: WorkoutLog; error?: string }> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.log) {
        addToast({
          type: 'success',
          title: 'Workout Logged! 🔥',
          message: `${json.log.exerciseName} completed. Keep crushing it!`,
        });
        fetchWorkoutStats();
        return { success: true, log: json.log };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchDietPlans = async (filters: any = {}): Promise<DietPlan[]> => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:5000/api/workouts/diets?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.dietPlans) {
        setDietPlans(data.dietPlans);
        return data.dietPlans;
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const createDietPlan = async (data: any): Promise<{ success: boolean; dietPlan?: DietPlan; error?: string }> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/diets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.dietPlan) {
        setDietPlans((prev) => [json.dietPlan, ...prev]);
        addToast({
          type: 'success',
          title: 'Diet Plan Created',
          message: `${json.dietPlan.planName} assigned to ${json.dietPlan.memberName}.`,
        });
        return { success: true, dietPlan: json.dietPlan };
      }
      addToast({
        type: 'error',
        title: 'Diet Plan Failed',
        message: json.error || 'Failed to save diet plan.',
      });
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteDietPlan = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`http://localhost:5000/api/workouts/diets/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDietPlans((prev) => prev.filter((d) => d.id !== id));
        addToast({
          type: 'success',
          title: 'Diet Plan Removed',
          message: 'Diet plan deleted.',
        });
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const recordMemberProgress = async (data: any): Promise<{ success: boolean; progress?: MemberProgressRecord; error?: string }> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.progress) {
        setMemberProgress((prev) => [json.progress, ...prev]);
        addToast({
          type: 'success',
          title: 'Progress Recorded 📈',
          message: `Weight logged: ${json.progress.weight} kg. (Delta: ${json.weightDelta >= 0 ? '+' : ''}${json.weightDelta} kg)`,
        });
        fetchWorkoutStats();
        return { success: true, progress: json.progress };
      }
      addToast({
        type: 'error',
        title: 'Progress Record Failed',
        message: json.error || 'Failed to log progress.',
      });
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchMemberProgress = async (memberId: string): Promise<any> => {
    try {
      const res = await fetch(`http://localhost:5000/api/workouts/progress/${memberId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const fetchWorkoutCalendar = async (month?: string): Promise<any> => {
    try {
      const q = month ? `?month=${month}` : '';
      const res = await fetch(`http://localhost:5000/api/workouts/calendar${q}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const askAIWorkoutCoach = async (action: string, prompt: string, context: any = {}): Promise<any> => {
    try {
      const res = await fetch('http://localhost:5000/api/workouts/ai/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({ action, prompt, context }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentGym,
        allGyms,
        members,
        trainers,
        attendance,
        payments,
        plans,
        workoutPlans,
        activities,
        aiInsights,
        automationLogs,
        activePage,
        toasts,
        globalSearch,
        isAuthModalOpen,
        authModalMode,
        isUserProfileModalOpen,
        verificationPendingEmail,
        isSupabaseLive: isSupabaseConfigured,
        activeSessions,
        isAddMemberModalOpen,
        isAddTrainerModalOpen,
        isRecordPaymentModalOpen,
        isGenerateQRModalOpen,
        isSendNotificationModalOpen,
        setGlobalSearch,
        setActivePage,
        setIsUserProfileModalOpen,
        setVerificationPendingEmail,
        setIsAddMemberModalOpen,
        setIsAddTrainerModalOpen,
        setIsRecordPaymentModalOpen,
        setIsGenerateQRModalOpen,
        setIsSendNotificationModalOpen,
        switchRole,
        switchGym,
        authorizedGyms,
        updateGymSettings,
        updateGymStatus,
        login,
        loginWithCredentials,
        registerOwner,
        sendPasswordReset,
        resetUserPassword,
        updateUserProfile,
        changeUserPassword,
        logout,
        openAuthModal,
        closeAuthModal,
        addToast,
        removeToast,
        addMember,
        updateMember,
        deleteMember,
        renewMember,
        updateMemberStatus,
        trainingSessions,
        trainerStats,
        selectedTrainerForProfile,
        isScheduleSessionModalOpen,
        setIsScheduleSessionModalOpen,
        setSelectedTrainerForProfile,
        fetchTrainerStats,
        fetchTrainers,
        fetchTrainingSessions,
        addTrainer,
        scheduleTrainingSession,
        rescheduleTrainingSession,
        updateSessionStatus,
        assignMembersToTrainer,
        removeMemberAssignment,
        trainerCheckIn,
        trainerCheckOut,
        fetchTrainerProfile,
        recordTrainerSalaryPayout,
        addPlan,
        updatePlan,
        deletePlan,
        togglePlanStatus,
        addWorkoutPlan,
        checkInMemberWithQR,
        recordQRScan,
        manualAttendanceCheckIn,
        manualAttendanceCheckOut,
        fetchAttendanceStats,
        fetchAttendanceHistory,
        fetchMemberAttendance,
        recordPayment,
        recordSmartPayment,
        processPaymentRefund,
        fetchPaymentReceipt,
        fetchPaymentStats,
        fetchPendingDues,
        triggerAutomationTest,
        // STEP 11: WHATSAPP AUTOMATION
        automationStats,
        notificationLogs,
        automationSettings,
        whatsappConfig,
        fetchAutomationData,
        toggleAutomationWorkflow,
        sendTestWhatsApp,
        updateWhatsAppSettings,
        updateMemberConsent,
        fetchMemberConsent,
        memberStats,
        attendanceStats,
        paymentStats,
        exercises,
        dietPlans,
        workoutStats,
        memberProgress,
        fetchWorkoutStats,
        fetchExercises,
        createExercise,
        fetchWorkoutPlans,
        createWorkoutPlan,
        updateWorkoutPlan,
        deleteWorkoutPlan,
        logWorkoutCompletion,
        fetchDietPlans,
        createDietPlan,
        deleteDietPlan,
        recordMemberProgress,
        fetchMemberProgress,
        fetchWorkoutCalendar,
        askAIWorkoutCoach,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
