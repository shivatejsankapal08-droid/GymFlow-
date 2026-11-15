import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import {
  Users,
  UserCheck,
  QrCode,
  CreditCard,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Send,
  Plus,
  Dumbbell,
  Tag,
  Flame,
  Calendar,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Filter,
  DollarSign,
  RefreshCw,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  REVENUE_CHART_DATA,
  MEMBER_GROWTH_DATA,
  WEEKLY_ATTENDANCE_DATA,
  MEMBERSHIP_DISTRIBUTION_DATA
} from '../../data/mockData';

export const GymOwnerDashboard: React.FC = () => {
  const {
    currentGym,
    members,
    attendance,
    payments,
    activities,
    globalSearch,
    setActivePage,
    triggerAutomationTest,
    setIsAddMemberModalOpen,
    setIsAddTrainerModalOpen,
    setIsRecordPaymentModalOpen,
    setIsGenerateQRModalOpen,
    setIsSendNotificationModalOpen,
    addToast
  } = useApp();

  const activeMembers = members.filter((m) => m.status === 'active');
  const expiredMembers = members.filter((m) => m.status === 'expired');
  const expiringMembers = members.filter((m) => m.status === 'expiring_soon');
  const pendingPayments = payments.filter((p) => p.paymentStatus === 'pending');
  const totalPendingAmount = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);

  // Filter expiring members by globalSearch if active
  const upcomingExpiryList = [...expiringMembers, ...expiredMembers].filter((m) => {
    if (!globalSearch) return true;
    return (
      m.fullName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      m.phone.includes(globalSearch) ||
      m.memberCode.toLowerCase().includes(globalSearch.toLowerCase())
    );
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        type: 'success',
        title: 'Metrics Synchronized',
        message: 'Live floor occupancy, attendance scans and billing metrics refreshed.',
      });
    }, 600);
  };

  const handleSendReminder = (memberName: string, phone: string, amount: number) => {
    triggerAutomationTest('WhatsApp Expiry & Payment Notice', `${phone} (${memberName})`);
  };

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
      {/* Demo Data Environment Notice */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#0F1311] border border-[#1C2420] text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#B6FF45]" />
          <span>
            <strong className="text-zinc-200">Demo Mode:</strong> Displaying realistic demo metrics. Ready to connect live Supabase PostgreSQL & RLS.
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-[#B6FF45] font-semibold text-[11px] border border-[#1C2420] transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white">{currentGym.name}</h1>
            <Badge variant="pro">{currentGym.plan.toUpperCase()}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Smart Gym Operating System • Real-time floor occupancy:{' '}
            <strong className="text-[#B6FF45] font-bold">
              {attendance.filter((a) => a.status === 'checked_in').length} Athletes on Floor
            </strong>
          </p>
        </div>

        {/* 7. QUICK ACTIONS BUTTONS */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>

          <button
            onClick={() => setIsAddTrainerModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302b] text-white font-bold text-xs border border-zinc-700/60 flex items-center gap-1.5 transition-all"
          >
            <Dumbbell className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Add Trainer</span>
          </button>

          <button
            onClick={() => setIsRecordPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302b] text-white font-bold text-xs border border-zinc-700/60 flex items-center gap-1.5 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsGenerateQRModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302b] text-white font-bold text-xs border border-zinc-700/60 flex items-center gap-1.5 transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Generate QR</span>
          </button>

          <button
            onClick={() => setIsSendNotificationModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302b] text-white font-bold text-xs border border-zinc-700/60 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Send Notification</span>
          </button>
        </div>
      </div>

      {/* 3. DASHBOARD ANALYTICS CARDS (Six cards with stats, icon, % comparison, small trend indicator) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Members */}
        <MetricCard
          title="Total Members"
          value="342"
          change="+12.4% MoM"
          isPositive={true}
          icon={Users}
          subtext="Cap: 300 tier limit"
          accentColor="neon"
          onClick={() => setActivePage('members')}
        />

        {/* Card 2: Active Members */}
        <MetricCard
          title="Active Members"
          value={activeMembers.length}
          change="+14.2% active"
          isPositive={true}
          icon={UserCheck}
          subtext="93% retention rate"
          accentColor="neon"
          onClick={() => setActivePage('members')}
        />

        {/* Card 3: Expired Memberships */}
        <MetricCard
          title="Expired Memberships"
          value={expiredMembers.length + expiringMembers.length}
          change="-2.1% this week"
          isPositive={false}
          icon={AlertCircle}
          subtext="Requires follow up"
          accentColor="rose"
          onClick={() => setActivePage('members')}
        />

        {/* Card 4: Today's Attendance */}
        <MetricCard
          title="Today's Attendance"
          value={attendance.length + 80}
          change="+18.5% vs yest"
          isPositive={true}
          icon={QrCode}
          subtext="Peak: 6:30 - 9 AM"
          accentColor="cyan"
          onClick={() => setActivePage('attendance')}
        />

        {/* Card 5: Monthly Revenue */}
        <MetricCard
          title="Monthly Revenue"
          value="₹4,85,000"
          change="+16.2% vs target"
          isPositive={true}
          icon={CreditCard}
          subtext="Razorpay & UPI"
          accentColor="purple"
          onClick={() => setActivePage('payments')}
        />

        {/* Card 6: Pending Payments */}
        <MetricCard
          title="Pending Payments"
          value={`₹${totalPendingAmount.toLocaleString('en-IN')}`}
          change="-8.4% dues recovered"
          isPositive={false}
          icon={AlertTriangle}
          subtext={`${pendingPayments.length} invoices due`}
          accentColor="amber"
          onClick={() => setActivePage('payments')}
        />
      </div>

      {/* 4. ANALYTICS CHARTS (Using Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Revenue Line Chart */}
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#B6FF45]" />
                Monthly Revenue Performance (INR)
              </h3>
              <p className="text-xs text-zinc-400">Actual collections vs Monthly Target budget</p>
            </div>
            <span className="text-xs font-black text-[#B6FF45] bg-[#B6FF45]/10 px-2.5 py-1 rounded-lg border border-[#B6FF45]/20">
              ₹4.85L Current
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1311',
                    borderColor: '#1C2420',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Collected Revenue"
                  stroke="#B6FF45"
                  strokeWidth={3}
                  dot={{ fill: '#B6FF45', r: 4 }}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Monthly Target"
                  stroke="#71717A"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Member Growth Area Chart */}
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Member Growth & Churn Trend
              </h3>
              <p className="text-xs text-zinc-400">Total active athlete trajectory (last 6 months)</p>
            </div>
            <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              318 Active
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MEMBER_GROWTH_DATA}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1311',
                    borderColor: '#1C2420',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Active Members"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#growthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly Attendance Bar Chart */}
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B6FF45]" />
                Weekly Attendance Flow (Mon - Sun)
              </h3>
              <p className="text-xs text-zinc-400">Daily QR scan volume and turnstile footfall</p>
            </div>
            <span className="text-xs font-bold text-zinc-400">Peak: Saturday (110)</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ATTENDANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                <XAxis dataKey="day" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1311',
                    borderColor: '#1C2420',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} Athletes`, 'Scanned In']}
                />
                <Bar dataKey="attendance" fill="#B6FF45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Membership Distribution Pie Chart */}
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  Membership Tier Distribution
                </h3>
                <p className="text-xs text-zinc-400">Active subscriber breakdown across tiers</p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MEMBERSHIP_DISTRIBUTION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {MEMBERSHIP_DISTRIBUTION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1311',
                      borderColor: '#1C2420',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [`${val} Members (${MEMBERSHIP_DISTRIBUTION_DATA.find(d => d.name === name)?.percentage})`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] text-xs flex items-center justify-between text-zinc-300">
            <span>Highest Tier:</span>
            <span className="font-bold text-[#B6FF45]">Annual VIP (46% of total revenue)</span>
          </div>
        </div>
      </div>

      {/* 5. RECENT ACTIVITIES & 6. UPCOMING MEMBERSHIP EXPIRY TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. RECENT ACTIVITIES FEED (1 Col) */}
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B6FF45]" />
                Recent Activities
              </h3>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Live Stream
              </span>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">
                  <Clock className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">No recent activity recorded</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Scans, payments and signups will stream here.</p>
                </div>
              ) : (
                activities.slice(0, 5).map((act) => {
                  let badgeClass = 'text-[#B6FF45] bg-[#B6FF45]/10 border-[#B6FF45]/20';
                  if (act.type === 'payment') badgeClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                  if (act.type === 'renewal') badgeClass = 'text-purple-400 bg-purple-500/10 border-purple-500/20';

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420] hover:border-zinc-700 transition-colors flex items-start gap-3"
                    >
                      <img
                        src={act.avatarUrl}
                        alt={act.memberName}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-zinc-700 shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{act.title}</h4>
                          <span className="text-[10px] text-zinc-400 shrink-0">{act.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{act.subtitle}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => setActivePage('automations')}
            className="w-full mt-4 py-2 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-center text-xs font-bold text-[#B6FF45] border border-[#1C2420] transition-colors"
          >
            View Full Automation Stream
          </button>
        </div>

        {/* 6. UPCOMING MEMBERSHIP EXPIRY TABLE (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Upcoming Membership Expiry & Dues ({upcomingExpiryList.length})
                </h3>
                <p className="text-xs text-zinc-400">
                  Members expiring within next 7 days or overdue for renewal
                </p>
              </div>

              <button
                onClick={() => setIsSendNotificationModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Blast Renewal WhatsApp</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Athlete</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Membership Plan</th>
                    <th className="py-3 px-3">Expiry Date</th>
                    <th className="py-3 px-3">Payment Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {upcomingExpiryList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-[#B6FF45]/60 mb-2" />
                          <p className="text-xs font-semibold text-zinc-300">
                            {globalSearch ? 'No expiring members match your search' : 'All athlete memberships are active & current'}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            {globalSearch ? 'Try a different search term or clear the filter.' : 'Zero memberships expiring within the next 7 days.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    upcomingExpiryList.map((m) => (
                      <tr key={m.id} className="hover:bg-[#0F1311]/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={m.avatarUrl}
                              alt={m.fullName}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-zinc-700"
                            />
                            <div>
                              <span className="font-bold text-white block">{m.fullName}</span>
                              <span className="text-[10px] text-zinc-400">{m.memberCode}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-300 font-medium">{m.phone}</td>
                        <td className="py-3 px-3 text-white font-medium">{m.currentPlanName}</td>
                        <td className="py-3 px-3 text-amber-300 font-bold font-mono">
                          {m.membershipEndDate}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={m.status === 'expiring_soon' ? 'expiring_soon' : 'expired'}
                            size="sm"
                          >
                            {m.pendingDue ? `₹${m.pendingDue} Due` : 'Expired'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleSendReminder(m.fullName, m.phone, m.pendingDue || 2999)}
                            title="Send WhatsApp Reminder with Razorpay link"
                            className="px-2.5 py-1.5 rounded-lg bg-[#B6FF45]/15 hover:bg-[#B6FF45]/25 text-[#B6FF45] font-bold text-[11px] border border-[#B6FF45]/30 inline-flex items-center gap-1.5 transition-all"
                          >
                            <Send className="w-3 h-3" />
                            <span>Remind</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1C2420] flex items-center justify-between text-xs text-zinc-400">
            <span>Automated 3-day and 1-day reminders configured in n8n</span>
            <button
              onClick={() => setActivePage('members')}
              className="text-[#B6FF45] font-bold hover:underline flex items-center gap-1"
            >
              <span>Manage all members</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
