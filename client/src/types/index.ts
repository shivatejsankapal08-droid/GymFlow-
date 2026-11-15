// ==============================================================================
// GYMFLOW AI - TypeScript Type Definitions
// ==============================================================================

export type UserRole = 'super_admin' | 'gym_owner' | 'trainer' | 'member';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  gymId?: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
  createdAt: string;
}

export type AuthScreenMode = 'login' | 'register' | 'forgot_password' | 'reset_password' | 'verify_email';

export interface UserSessionRecord {
  id: string;
  userId: string;
  gymId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
}

export interface GymInvitation {
  id: string;
  gymId: string;
  email: string;
  role: 'gym_owner' | 'trainer' | 'member';
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface GymTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  plan: PlanTier;
  planStatus: 'active' | 'trialing' | 'past_due' | 'suspended';
  memberLimit: number;
  trainerLimit: number;
  aiInsightsEnabled: boolean;
  activeMembersCount?: number;
  totalRevenueMonthly?: number;
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  durationMonths: number;
  price: number;
  description: string;
  features: string[];
  isActive: boolean;
  status?: 'active' | 'inactive';
  activeSubscribers?: number;
}

export type MemberStatus = 'active' | 'expiring_soon' | 'expired' | 'frozen' | 'suspended';

export interface MemberMembershipRecord {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  planName: string;
  durationMonths: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  startDate: string;
  endDate: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  paymentMethod: 'upi' | 'razorpay' | 'cash' | 'card' | 'bank_transfer';
  isRenewal: boolean;
  notes?: string;
  createdAt: string;
}

export interface MemberDocument {
  id: string;
  gymId: string;
  memberId: string;
  documentName: string;
  documentType: string;
  documentUrl: string;
  createdAt: string;
}

export interface Member {
  id: string;
  gymId: string;
  memberCode: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  status: MemberStatus;
  currentPlanId?: string;
  currentPlanName?: string;
  planName?: string;
  membershipStartDate: string;
  membershipEndDate: string;
  qrToken: string;
  assignedTrainerId?: string;
  assignedTrainerName?: string;
  fitnessGoal: string;
  medicalNotes?: string;
  avatarUrl?: string;
  lastCheckIn?: string;
  totalCheckIns?: number;
  pendingDue?: number;
  createdAt: string;
  membershipHistory?: MemberMembershipRecord[];
  documents?: MemberDocument[];
}

export interface Trainer {
  id: string;
  gymId: string;
  trainerCode?: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContact?: string;
  specialization: string;
  experience?: string;
  certifications?: string;
  skills?: string;
  bio?: string;
  joiningDate?: string;
  employmentType?: 'full_time' | 'part_time' | 'contract';
  employmentStatus?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  salaryType: 'monthly' | 'hourly' | 'commission' | 'hybrid' | 'per_session';
  basePay: number;
  salary?: number;
  hourlyRate?: number;
  commissionRate?: number;
  paymentFrequency?: 'monthly' | 'bi_weekly' | 'weekly';
  rating: number;
  workingHours: string;
  availability?: string;
  isActive: boolean;
  maxClients?: number;
  assignedMembersCount: number;
  notes?: string;
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  gymId: string;
  trainerId: string;
  trainerName?: string;
  memberId: string;
  memberName?: string;
  memberCode?: string;
  sessionTitle: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  trainingType: string;
  sessionStatus: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  notes?: string;
  createdAt?: string;
}

export interface TrainerAttendanceRecord {
  id: string;
  gymId: string;
  trainerId: string;
  trainerName?: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string | null;
  workingHours?: number | null;
  status: 'checked_in' | 'checked_out' | 'present' | 'half_day' | 'late' | 'absent';
  notes?: string;
  createdAt?: string;
}

export interface TrainerSalaryRecord {
  id: string;
  gymId: string;
  trainerId: string;
  trainerName?: string;
  salaryMonth: string;
  baseAmount: number;
  commissionAmount: number;
  bonusAmount: number;
  deductions: number;
  netPaid: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending';
  paidDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface TrainerStats {
  totalTrainers: number;
  activeTrainers: number;
  inactiveTrainers: number;
  trainersAvailableToday: number;
  totalAssignedMembers: number;
  trainingSessionsToday: number;
  monthlyTrainerSalary: number;
  upcomingSessions: TrainingSession[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
    trainerName?: string;
  }>;
}

export interface MemberAssignmentItem {
  memberId: string;
  memberName: string;
  memberCode: string;
  planName: string;
  avatarUrl?: string;
  assignedTrainerId?: string;
  assignedTrainerName?: string;
  assignedDate?: string;
}

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  planName?: string;
  avatarUrl?: string;
  check_in?: string;
  checkInTime: string;
  check_out?: string | null;
  checkOutTime?: string | null;
  verificationMethod: 'qr_scanner' | 'manual' | 'rfid' | 'facial';
  status: 'checked_in' | 'checked_out';
  durationMinutes?: number | null;
  recordedById?: string | null;
  recordedByName?: string | null;
  notes?: string | null;
  attendanceDate?: string;
  attendance_date?: string;
  createdAt?: string;
}

export interface AttendanceStats {
  totalCheckInsToday: number;
  currentlyInside: number;
  totalPresent: number;
  absentToday: number;
  peakTime: string;
  weeklyAttendancePct: number;
  activeVisitsCount: number;
  totalMembersCount: number;
  hourlyFlow: {
    hour: string;
    label: string;
    count: number;
  }[];
}

export interface MemberAttendanceAnalytics {
  memberId: string;
  fullName: string;
  memberCode: string;
  planName: string;
  status: string;
  totalVisits: number;
  currentMonthVisits: number;
  attendancePercentage: number;
  lastVisit: string | null;
  averageDurationMinutes: number;
  history: AttendanceRecord[];
}

export interface PaymentTransaction {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  planId?: string;
  membershipPlanId?: string;
  planName?: string;
  amount: number;
  discount?: number;
  finalAmount?: number;
  currency: string;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'razorpay' | 'upi' | 'cash' | 'credit_card' | 'debit_card' | 'net_banking' | 'card' | 'bank_transfer';
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber?: string;
  invoiceNumber: string;
  notes?: string;
  recordedBy?: string;
  isRenewal?: boolean;
  paidAt?: string;
  paymentDate?: string;
  dueDate?: string;
  createdAt?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPaymentsCount: number;
  completedPaymentsAmount: number;
  failedPaymentsCount: number;
  failedPaymentsAmount: number;
  refundedPaymentsCount: number;
  refundedPaymentsAmount: number;
  membershipRenewalRevenue: number;
  dailyRevenue: Array<{ date: string; label: string; revenue: number; transactions: number }>;
  monthlyRevenueChart: Array<{ month: string; revenue: number; target: number }>;
  yearlyRevenue: Array<{ year: string; revenue: number }>;
  paymentMethodDistribution: Array<{ method: string; count: number; amount: number; percentage: number }>;
  revenueByPlan: Array<{ planName: string; revenue: number; memberCount: number }>;
}

export interface PaymentReceiptData {
  receiptNumber: string;
  transactionId: string;
  paymentDate: string;
  paymentStatus: string;
  paymentMethod: string;
  currency: string;
  gym: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    gstin?: string;
  };
  member: {
    id: string;
    name: string;
    code: string;
    phone: string;
    email: string;
    planName: string;
  };
  lineItems: Array<{
    description: string;
    basePrice: number;
    discount: number;
    tax: number;
    finalAmount: number;
  }>;
  summary: {
    subtotal: number;
    discountTotal: number;
    totalPaid: number;
    remainingDue: number;
  };
  recordedBy: string;
  notes: string;
  verificationSignature: string;
}

export interface PendingDueItem {
  memberId: string;
  memberName: string;
  memberCode: string;
  email: string;
  phone: string;
  planName: string;
  pendingDue: number;
  membershipEndDate?: string;
  status: string;
}

export interface PaymentRefundItem {
  id: string;
  gymId: string;
  paymentId: string;
  refundAmount: number;
  refundReason: string;
  refundStatus: string;
  approvedBy?: string;
  approvedByName?: string;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  message: string;
  timestamp: string;
  category?: 'workout' | 'nutrition' | 'membership' | 'business_insight' | 'general';
}

export interface AutomationLog {
  id: string;
  gymId: string;
  workflowName: string;
  triggerEvent: string;
  targetRecipient: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'webhook';
  payloadSummary?: string;
  status: 'success' | 'failed' | 'pending';
  executionTimeMs: number;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  gym_id: string;
  member_id: string;
  whatsapp_consent: boolean;
  expiry_reminders: boolean;
  payment_notifications: boolean;
  attendance_notifications: boolean;
  birthday_messages: boolean;
  marketing_updates: boolean;
  preferred_language: string;
  opted_out_at?: string | null;
  opt_out_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  gym_id: string;
  member_id?: string | null;
  notification_type:
    | 'expiry_reminder'
    | 'payment_verified'
    | 'payment_pending'
    | 'payment_failed'
    | 'membership_renewed'
    | 'birthday_wish'
    | 'check_in'
    | 'check_out'
    | 'inactive_reminder'
    | 'owner_daily_report'
    | 'test_message'
    | string;
  recipient: string;
  recipient_name?: string;
  template_name?: string;
  channel: 'whatsapp' | 'email' | 'sms';
  message_body: string;
  message_status: 'sent' | 'delivered' | 'delivered_to_sandbox' | 'failed' | 'pending' | 'opted_out';
  provider_message_id?: string | null;
  error_message?: string | null;
  payload?: any;
  sent_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export interface AutomationSetting {
  id: string;
  gym_id: string;
  workflow_name: string;
  display_title: string;
  enabled: boolean;
  trigger_type: 'cron' | 'webhook' | 'event';
  schedule_cron?: string | null;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConfig {
  id: string;
  gym_id: string;
  phone_number_id?: string;
  business_account_id?: string;
  webhook_verify_token?: string;
  notification_phone?: string;
  is_live_enabled: boolean;
  connection_status: 'configured' | 'sandbox' | 'unconfigured';
  sender_name?: string;
  isMetaApiConnected?: boolean;
  liveTokenConfigured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationStats {
  totalSent: number;
  messagesDelivered: number;
  failedMessages: number;
  pendingMessages: number;
  optedOutMessages: number;
  activeWorkflows: number;
  membershipExpiryAlerts: number;
  paymentNotifications: number;
  attendanceNotifications: number;
  birthdayGreetings: number;
  deliveryRate: number;
  dailyStats: Array<{
    date: string;
    day: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
  recentLogs: NotificationLog[];
}

export interface AIBusinessInsight {
  id: string;
  type: 'churn_risk' | 'revenue_opportunity' | 'capacity_alert' | 'retention_tip';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  actionableStep: string;
  metricImpact?: string;
}

export interface Exercise {
  id: string;
  gymId?: string | null;
  exerciseName: string;
  name?: string;
  muscleGroup: 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Legs' | 'Abs' | 'Cardio' | 'Full Body';
  category: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  safetyNotes?: string;
  recommendedSets: number;
  recommendedReps: string;
  restSeconds: number;
  restDurationSeconds?: number;
  mediaUrl?: string;
  createdAt?: string;
}

export interface WorkoutPlanExercise {
  id: string;
  gymId: string;
  workoutPlanId: string;
  exerciseId: string;
  exerciseName?: string;
  dayOfWeek: string;
  sets: number;
  repetitions: string;
  restSeconds: number;
  displayOrder?: number;
  notes?: string;
  exercise?: Exercise;
}

export interface WorkoutPlan {
  id: string;
  gymId: string;
  gym_id?: string;
  memberId?: string;
  member_id?: string;
  assignedMemberId?: string;
  memberName?: string;
  trainerId?: string;
  trainer_id?: string;
  trainerName?: string;
  planName?: string;
  plan_name?: string;
  title: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks?: number;
  daysPerWeek?: number;
  category?: 'Hypertrophy' | 'Strength' | 'Fat Loss' | 'Functional';
  fitnessGoal?: 'Weight Loss' | 'Muscle Building' | 'Strength' | 'Endurance' | 'General Fitness';
  fitness_goal?: string;
  targetAudience?: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived' | 'paused';
  planStatus?: 'active' | 'completed' | 'archived' | 'paused';
  plan_status?: string;
  trainerNotes?: string;
  trainer_notes?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  exercisesCount?: number;
  exercises?: {
    day: string;
    items: {
      name: string;
      sets: string;
      reps: string;
      rest: string;
    }[];
  }[];
  weeklySchedule?: WorkoutPlanExercise[];
  createdAt?: string;
}

export interface WorkoutLog {
  id: string;
  gymId: string;
  memberId: string;
  memberName?: string;
  workoutPlanId?: string;
  exerciseId?: string;
  exerciseName?: string;
  dayOfWeek?: string;
  completionStatus: 'completed' | 'skipped' | 'partial';
  completedAt: string;
  weightsUsed?: number[];
  repsAchieved?: number[];
  notes?: string;
}

export interface DietPlanMeal {
  id: string;
  dietPlanId: string;
  mealName: 'Early Morning' | 'Breakfast' | 'Mid-Morning' | 'Lunch' | 'Evening Snack' | 'Dinner';
  foodName: string;
  portionSize: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  notes?: string;
  displayOrder?: number;
}

export interface DietPlan {
  id: string;
  gymId: string;
  memberId: string;
  memberName?: string;
  trainerId?: string;
  trainerName?: string;
  planName: string;
  dietaryPreference: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Custom' | 'Keto' | 'High Protein';
  fitnessGoal: string;
  startDate: string;
  endDate: string;
  instructions?: string;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  status: 'active' | 'completed' | 'archived' | 'paused';
  meals?: DietPlanMeal[];
  createdAt?: string;
}

export interface MemberProgressRecord {
  id: string;
  gymId: string;
  memberId: string;
  recordedBy?: string;
  weight: number;
  previousWeight?: number;
  targetWeight?: number;
  bodyMeasurements?: {
    chest?: number;
    waist?: number;
    arms?: number;
    thighs?: number;
    hips?: number;
    bodyFatPct?: number;
  };
  progressNotes?: string;
  photoUrls?: string[];
  recordedAt: string;
}

export interface WorkoutStats {
  totalWorkoutPlans: number;
  activeWorkoutPlans: number;
  totalAssignedMembers: number;
  completedWorkoutsToday: number;
  upcomingTrainingSessions: number;
  membersRequiringProgressReviews: number;
  recentActivity?: any[];
  membersNeedingReview?: {
    memberId: string;
    memberName: string;
    memberCode: string;
    avatarUrl?: string;
    daysSinceLastReview: number | null;
    status: string;
  }[];
}

export interface RecentActivity {
  id: string;
  type: 'registration' | 'payment' | 'renewal' | 'check_in';
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: number;
  memberName: string;
  memberCode: string;
  avatarUrl: string;
  planName?: string;
}


// ==============================================================================
// STEP 12: AI GYM ASSISTANT TYPES
// ==============================================================================

export interface AIConversation {
  id: string;
  gymId?: string;
  gym_id?: string;
  userId?: string;
  user_id?: string;
  title: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  messages?: AIMessageRecord[];
}

export interface AIMessageRecord {
  id: string;
  conversationId?: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  created_at?: string;
}

export interface AIGeneratedPlan {
  id: string;
  gymId?: string;
  gym_id?: string;
  memberId?: string | null;
  member_id?: string | null;
  createdBy?: string;
  created_by?: string;
  planType?: 'workout' | 'diet';
  plan_type?: 'workout' | 'diet';
  title: string;
  generatedContent?: any;
  generated_content?: any;
  approvalStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
  approval_status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  approvedBy?: string | null;
  approved_by?: string | null;
  approvedAt?: string | null;
  approved_at?: string | null;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  todayRequests: number;
  dailyLimit: number;
  remainingToday: number;
  subscriptionTier: string;
  byType: Record<string, number>;
  byModel: Record<string, number>;
  recentLogs: Array<{
    id: string;
    model: string;
    requestType?: string;
    request_type?: string;
    tokenUsage?: number;
    token_usage?: number;
    createdAt?: string;
    created_at?: string;
  }>;
}

export interface AIBusinessInsightsData {
  gymName: string;
  analyzedAt: string;
  databaseMetrics: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    expiringMemberships: number;
    expiredMemberships: number;
    monthlyRevenue: string;
    todayRevenue: string;
    pendingPayments: string;
    todayCheckins: number;
    peakHours: string;
  };
  strategicAnalysis: {
    membershipGrowth: string;
    revenueTrends: string;
    attendanceTrends: string;
    expiryForecast: string;
    operationalRecommendations: string[];
  };
}

// ==============================================================================
// STEP 13: ADVANCED REPORTS & ANALYTICS INTERFACES
// ==============================================================================

export interface ReportsOverviewData {
  gymName: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  metrics: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    newRegistrations: number;
    monthlyRevenue: number;
    annualRevenue: number;
    pendingPayments: number;
    todayAttendance: number;
    activeTrainers: number;
    renewalRate: number;
  };
  charts: {
    revenueTrend: Array<{ month: string; revenue: number; target: number }>;
    attendanceFlow: Array<{ day: string; visits: number }>;
    memberComposition: Array<{ name: string; value: number; color: string }>;
  };
}

export interface RevenueReportData {
  gymName: string;
  dateRangeLabel: string;
  summary: {
    totalRevenue: number;
    collectedPayments: number;
    pendingPayments: number;
    refundedAmount: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    arpu: number;
    totalTransactions: number;
  };
  revenueByMethod: Array<{ method: string; amount: number; percentage: number }>;
  revenueByPlan: Array<{ planName: string; amount: number; subscribers: number }>;
  dailyRevenue: Array<{ date: string; amount: number }>;
  monthlyRevenueHistory: Array<{ month: string; revenue: number; target: number }>;
  transactions: Array<{
    id: string;
    memberName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    date: string;
  }>;
}

export interface MembershipReportData {
  gymName: string;
  dateRangeLabel: string;
  summary: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    newMembers: number;
    renewedMembers: number;
    cancellations: number;
    retentionRate: number;
    churnRate: number;
  };
  planPopularity: Array<{ planName: string; count: number; percentage: number }>;
  growthTrend: Array<{ month: string; active: number; newJoiners: number; churned: number }>;
  expiringTrends: Array<{ timeframe: string; count: number }>;
}

export interface AttendanceReportData {
  gymName: string;
  dateRangeLabel: string;
  summary: {
    totalVisits: number;
    dailyAverage: number;
    peakHour: string;
    mostActiveDay: string;
    leastActiveDay: string;
    avgDurationMinutes: number;
  };
  hourlyFlow: Array<{ hour: string; count: number }>;
  dailyAttendance: Array<{ date: string; visits: number }>;
  weekdayDistribution: Array<{ day: string; count: number }>;
}

export interface TrainerPerformanceReportData {
  gymName: string;
  summary: {
    totalTrainers: number;
    activeTrainers: number;
    totalCompletedSessions: number;
    totalCancelledSessions: number;
    avgAttendanceRate: number;
    avgRating: number;
  };
  trainers: Array<{
    id: string;
    name: string;
    specialization: string;
    employmentStatus: string;
    assignedClientsCount: number;
    completedSessions: number;
    cancelledSessions: number;
    attendanceRate: number;
    rating: number;
    salary: number;
  }>;
}

export interface MemberEngagementReportData {
  gymName: string;
  segments: {
    mostActive: Array<{ id: string; name: string; email: string; visits: number; lastVisit: string }>;
    inactive: Array<{ id: string; name: string; email: string; daysInactive: number; lastVisit: string }>;
    lowAttendance: Array<{ id: string; name: string; email: string; monthlyVisits: number }>;
    expiringSoon: Array<{ id: string; name: string; email: string; planName: string; expiryDate: string; daysLeft: number }>;
    pendingDues: Array<{ id: string; name: string; email: string; pendingAmount: number; dueDate: string }>;
  };
}

// ==============================================================================
// STEP 14: SUPER ADMIN CONTROL PANEL INTERFACES
// ==============================================================================

export interface SuperAdminDashboardStatsData {
  metrics: {
    totalGyms: number;
    totalRegisteredGyms?: number;
    activeGyms: number;
    suspendedGyms: number;
    trialAccounts: number;
    totalRegisteredUsers: number;
    totalGymMembersAcrossPlatform: number;
    totalTrainersAcrossPlatform: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    totalPlatformRevenue: number;
    pendingRevenue: number;
    refundedRevenue: number;
  };
  kpis?: {
    totalRegisteredGyms: number;
    activeGyms: number;
    suspendedGyms: number;
    trialAccounts: number;
    totalRegisteredUsers: number;
    totalGymMembersAcrossPlatform: number;
    totalTrainersAcrossPlatform: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    totalPlatformRevenue: number;
    pendingRevenue: number;
    refundedRevenue: number;
  };
  charts: {
    gymRegistrationGrowth: Array<{ month: string; gyms: number }>;
    monthlyPlatformRevenue: Array<{ month: string; collected: number; projected: number }>;
    subscriptionDistribution: Array<{ planCode: string; name: string; count: number; percentage: number }>;
    activeVsSuspendedGyms: Array<{ name: string; count: number; color: string }>;
    monthlySubscriptionGrowth: Array<{ month: string; active: number; churned: number }>;
  };
}

export interface SuperAdminGymDetail {
  id: string;
  gymName: string;
  slug: string;
  ownerId?: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  registrationDate: string;
  subscriptionPlan: string;
  planCode: string;
  subscriptionStatus: string;
  renewalDate: string;
  trialEndsAt?: string | null;
  gymStatus: string;
  memberCount: number;
  memberLimit: number;
  trainerCount: number;
  trainerLimit: number;
  totalCheckins: number;
}

export interface PlatformUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  associatedGymId?: string | null;
  associatedGymName: string;
  accountStatus: 'active' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  associatedMembershipsCount: number;
}

export interface SaaSPlanRecord {
  id: string;
  plan_code: string;
  name: string;
  plan_name: string;
  price: number;
  price_monthly: number;
  price_annual: number;
  billing_interval: string;
  max_gyms: number;
  member_limit: number;
  max_members: number;
  trainer_limit: number;
  max_trainers: number;
  features: string[];
  feature_limits: Record<string, any>;
  is_active: boolean;
  created_at?: string;
}

export interface SaaSSubscriptionDetail {
  id: string;
  gymId: string;
  gymName: string;
  ownerName: string;
  ownerEmail: string;
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  priceMonthly: number;
  priceAnnual: number;
  startDate: string;
  renewalDate: string;
  trialEndsAt?: string | null;
  paymentStatus: string;
  createdAt?: string;
}

export interface PlatformTransactionRecord {
  id: string;
  transactionId: string;
  gymId: string;
  gymName: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string;
  invoiceUrl?: string;
  notes?: string;
}

export interface SupportTicketRecord {
  id: string;
  ticket_number: string;
  gym_id: string;
  gym_name: string;
  created_by: string;
  creator_name: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ticket_status: 'open' | 'in_progress' | 'waiting_for_response' | 'resolved' | 'closed';
  assigned_admin?: string | null;
  assigned_admin_name?: string | null;
  conversation: Array<{
    sender_id: string;
    sender_name: string;
    sender_role: string;
    message: string;
    created_at: string;
  }>;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformAnnouncementRecord {
  id: string;
  title: string;
  message: string;
  target_audience: string;
  priority: 'normal' | 'important' | 'critical';
  published_by: string;
  published_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SystemServiceHealth {
  service: string;
  status: string;
  [key: string]: any;
}

export interface SystemHealthData {
  timestamp: string;
  overallStatus: string;
  services: SystemServiceHealth[];
  recentErrorsCount: number;
  securityNotice: string;
}
