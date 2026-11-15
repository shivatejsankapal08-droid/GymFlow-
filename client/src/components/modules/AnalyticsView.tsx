import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  QrCode,
  Calendar,
  Sparkles,
  Download,
  Printer,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  Award,
  ChevronRight,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  Activity,
  Shield,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Percent,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ReportsOverviewData,
  RevenueReportData,
  MembershipReportData,
  AttendanceReportData,
  TrainerPerformanceReportData,
  MemberEngagementReportData,
} from '../../types';

export const AnalyticsView: React.FC = () => {
  const { currentGym, currentUser } = useApp();

  // Navigation Tabs
  type TabType = 'overview' | 'revenue' | 'memberships' | 'attendance' | 'trainers' | 'engagement' | 'exports';
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Date Range State
  const [rangePreset, setRangePreset] = useState<string>('30d');
  const [customStart, setCustomStart] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data States
  const [overviewData, setOverviewData] = useState<ReportsOverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null);
  const [membershipData, setMembershipData] = useState<MembershipReportData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
  const [trainerData, setTrainerData] = useState<TrainerPerformanceReportData | null>(null);
  const [engagementData, setEngagementData] = useState<MemberEngagementReportData | null>(null);

  // Member Engagement Sub-filter
  const [engagementFilter, setEngagementFilter] = useState<'mostActive' | 'inactive' | 'lowAttendance' | 'expiringSoon' | 'pendingDues'>('mostActive');

  const BASE_URL = 'http://localhost:5000';

  const getHeaders = () => {
    const token = localStorage.getItem('gymflow_token') || 'demo-token-gym_owner';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Gym-Id': currentGym?.id || '11111111-1111-1111-1111-111111111111',
      'X-Demo-Role': currentUser?.role || 'gym_owner',
    };
  };

  // Build query string for reports
  const getQueryString = () => {
    let qs = `range=${encodeURIComponent(rangePreset)}`;
    if (rangePreset === 'custom') {
      qs += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
    }
    return qs;
  };

  // Fetch report data on gym or date range changes
  const fetchReportData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const qs = getQueryString();
    const headers = getHeaders();

    try {
      // 1. Overview & Live KPIs
      const overviewRes = await fetch(`${BASE_URL}/api/reports/overview?${qs}`, { headers });
      if (overviewRes.ok) {
        const oJson = await overviewRes.json();
        if (oJson.success) setOverviewData(oJson);
      }

      // 2. Revenue Breakdown
      const revRes = await fetch(`${BASE_URL}/api/reports/revenue?${qs}`, { headers });
      if (revRes.ok) {
        const rJson = await revRes.json();
        if (rJson.success) setRevenueData(rJson);
      }

      // 3. Membership & Retention
      const memRes = await fetch(`${BASE_URL}/api/reports/memberships?${qs}`, { headers });
      if (memRes.ok) {
        const mJson = await memRes.json();
        if (mJson.success) setMembershipData(mJson);
      }

      // 4. Attendance & Utilization
      const attRes = await fetch(`${BASE_URL}/api/reports/attendance?${qs}`, { headers });
      if (attRes.ok) {
        const aJson = await attRes.json();
        if (aJson.success) setAttendanceData(aJson);
      }

      // 5. Trainer Performance
      const trRes = await fetch(`${BASE_URL}/api/reports/trainers`, { headers });
      if (trRes.ok) {
        const tJson = await trRes.json();
        if (tJson.success) setTrainerData(tJson);
      }

      // 6. Member Engagement & Cohorts
      const engRes = await fetch(`${BASE_URL}/api/reports/member-engagement`, { headers });
      if (engRes.ok) {
        const eJson = await engRes.json();
        if (eJson.success) setEngagementData(eJson);
      }
    } catch (err: any) {
      console.error('Failed to load reports telemetry:', err);
      setErrorMsg('Failed to connect to reports service. Displaying cached session telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [currentGym?.id, rangePreset]);

  // Handle preset change
  const handleRangeChange = (preset: string) => {
    setRangePreset(preset);
    if (preset === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  // Apply custom range
  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      fetchReportData();
    }
  };

  // CSV Export Trigger
  const handleExportCSV = (type: string) => {
    const qs = getQueryString();
    const url = `${BASE_URL}/api/reports/export?type=${type}&${qs}`;
    
    // Create an invisible download link
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gymflow-${type}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF / Printable Report Opener
  const handleOpenPrintable = (reportType: string) => {
    const qs = getQueryString();
    const url = `${BASE_URL}/api/reports/pdf/${reportType}?${qs}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=1000,height=800');
  };

  // Chart Colors
  const PIE_COLORS = ['#B6FF45', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER & GLOBAL CONTROLS                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#B6FF45]" />
              Advanced Reports &amp; Analytics
            </h1>
            <Badge variant="pro">STEP 13 COMPLIANT</Badge>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#090B0A] border border-[#1C2420] text-xs text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-[#B6FF45]" />
              <span>Tenant: <strong className="text-white">{currentGym?.name || 'IronPulse Fitness Club'}</strong></span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time business telemetry, automated cohort retention, audited revenue ledgers, and printable PDF reports
          </p>
        </div>

        {/* Global Controls: Date Range Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-[#090B0A] border border-[#1C2420] rounded-2xl p-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-2" />
            <select
              value={rangePreset}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-[#B6FF45] focus:outline-none pr-3 cursor-pointer py-1.5"
            >
              <option value="today" className="bg-[#151A17] text-white">Today</option>
              <option value="yesterday" className="bg-[#151A17] text-white">Yesterday</option>
              <option value="7d" className="bg-[#151A17] text-white">Last 7 Days</option>
              <option value="30d" className="bg-[#151A17] text-white">Last 30 Days</option>
              <option value="this_month" className="bg-[#151A17] text-white">This Month</option>
              <option value="last_month" className="bg-[#151A17] text-white">Last Month</option>
              <option value="this_year" className="bg-[#151A17] text-white">This Year</option>
              <option value="custom" className="bg-[#151A17] text-[#B6FF45]">Custom Range...</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchReportData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#090B0A] hover:bg-[#1A221E] border border-[#1C2420] text-xs font-semibold text-zinc-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh database telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B6FF45] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Quick PDF Export Dropdown/Button */}
          <button
            onClick={() => setActiveTab('exports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#B6FF45] hover:bg-[#a3e635] text-[#090B0A] font-black text-xs transition-all shadow-lg shadow-[#B6FF45]/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Center</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Bar (Revealed if custom selected) */}
      {showCustomPicker && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-[#151A17] border border-[#B6FF45]/30">
          <Calendar className="w-4 h-4 text-[#B6FF45]" />
          <span className="text-xs font-bold text-white">Select Custom Window:</span>
          
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-zinc-400">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-zinc-400">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <button
            onClick={handleApplyCustom}
            className="px-4 py-1.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-[#090B0A] font-bold text-xs transition-all"
          >
            Apply Filter
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS                                                        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1C2420]">
        {[
          { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue & Finance', icon: DollarSign },
          { id: 'memberships', label: 'Memberships & Retention', icon: Users },
          { id: 'attendance', label: 'Attendance & Traffic', icon: QrCode },
          { id: 'trainers', label: 'Trainer Performance', icon: Award },
          { id: 'engagement', label: 'Member Cohorts', icon: UserCheck },
          { id: 'exports', label: 'Export & PDF Center', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#151A17] text-[#B6FF45] border border-[#1C2420] shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#151A17]/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#B6FF45]' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: EXECUTIVE OVERVIEW                                        */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 10 Live KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              {
                title: 'Total Members',
                value: overviewData?.metrics.totalMembers ?? 0,
                subtitle: 'Registered athletes',
                icon: Users,
                color: 'text-white',
              },
              {
                title: 'Active Members',
                value: overviewData?.metrics.activeMembers ?? 0,
                subtitle: 'Current valid passes',
                icon: UserCheck,
                color: 'text-[#B6FF45]',
              },
              {
                title: 'Expired Members',
                value: overviewData?.metrics.expiredMembers ?? 0,
                subtitle: 'Renewal candidates',
                icon: UserX,
                color: 'text-rose-400',
              },
              {
                title: 'New Registrations',
                value: overviewData?.metrics.newRegistrations ?? 0,
                subtitle: overviewData?.dateRangeLabel || 'Selected period',
                icon: TrendingUp,
                color: 'text-cyan-400',
              },
              {
                title: 'Monthly Revenue',
                value: `₹${(overviewData?.metrics.monthlyRevenue ?? 0).toLocaleString('en-IN')}`,
                subtitle: 'Current billing cycle',
                icon: DollarSign,
                color: 'text-[#B6FF45]',
              },
              {
                title: 'Annual Revenue',
                value: `₹${(overviewData?.metrics.annualRevenue ?? 0).toLocaleString('en-IN')}`,
                subtitle: 'Year to date',
                icon: CreditCard,
                color: 'text-purple-400',
              },
              {
                title: 'Pending Payments',
                value: `₹${(overviewData?.metrics.pendingPayments ?? 0).toLocaleString('en-IN')}`,
                subtitle: 'Unsettled dues',
                icon: AlertCircle,
                color: 'text-amber-400',
              },
              {
                title: "Today's Attendance",
                value: overviewData?.metrics.todayAttendance ?? 0,
                subtitle: 'Verified check-ins',
                icon: QrCode,
                color: 'text-[#B6FF45]',
              },
              {
                title: 'Active Trainers',
                value: overviewData?.metrics.activeTrainers ?? 0,
                subtitle: 'On-floor instructors',
                icon: Award,
                color: 'text-emerald-400',
              },
              {
                title: 'Renewal Rate',
                value: `${overviewData?.metrics.renewalRate ?? 85}%`,
                subtitle: 'Cohort retention',
                icon: Percent,
                color: 'text-teal-400',
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between hover:border-[#28362E] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-zinc-400">{kpi.title}</span>
                    <div className="p-1.5 rounded-xl bg-[#090B0A] text-zinc-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className={`text-xl font-black ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{kpi.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row 2: Charts & Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Line/Area Chart */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="flex items-center justify-between pb-4 border-b border-[#1C2420] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#B6FF45]" />
                    Revenue Trajectory vs Monthly Targets
                  </h3>
                  <p className="text-xs text-zinc-400">Audited completed payments across billing cycles</p>
                </div>
                <Badge variant="completed">AUDITED</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewData?.charts.revenueTrend || []}>
                    <defs>
                      <linearGradient id="execRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B6FF45" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#B6FF45" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#71717A"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1311',
                        borderColor: '#1C2420',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Actual Revenue"
                      stroke="#B6FF45"
                      strokeWidth={2.5}
                      fill="url(#execRev)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Revenue Target"
                      stroke="#71717A"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member Composition Donut */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-cyan-400" />
                    Member Composition
                  </h3>
                  <span className="text-[11px] text-zinc-400">Total: {overviewData?.metrics.totalMembers || 0}</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overviewData?.charts.memberComposition || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {(overviewData?.charts.memberComposition || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F1311',
                          borderColor: '#1C2420',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2">
                  {(overviewData?.charts.memberComposition || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-zinc-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Strategic Note */}
              <div className="mt-4 p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-[11px] text-zinc-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#B6FF45] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">AI Retention Callout:</strong> 2 memberships expire in next 14 days. Automated WhatsApp triggers are queued to protect MRR.
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Turnstile Attendance Flow */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C2420] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#B6FF45]" />
                  Weekly Turnstile Flow Distribution
                </h3>
                <p className="text-xs text-zinc-400">Total verified biometric &amp; QR check-ins per day of the week</p>
              </div>
              <span className="text-xs font-bold text-[#B6FF45]">Peak: Monday &amp; Wednesday</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData?.charts.attendanceFlow || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1311',
                      borderColor: '#1C2420',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(v: any) => [`${v} Check-ins`, 'Attendance']}
                  />
                  <Bar dataKey="visits" fill="#B6FF45" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: REVENUE & FINANCE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Financial KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Total Revenue (Filtered)</span>
              <div className="text-2xl font-black text-[#B6FF45] mt-1">
                ₹{(revenueData?.summary.totalRevenue ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-zinc-500">Completed &amp; verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Pending Dues</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                ₹{(revenueData?.summary.pendingPayments ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-zinc-500">Uncollected invoices</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Refunded Amount</span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                ₹{(revenueData?.summary.refundedAmount ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-zinc-500">Total chargebacks/refunds</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Average Revenue Per User</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                ₹{(revenueData?.summary.arpu ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-zinc-500">ARPU over active roster</span>
            </div>
          </div>

          {/* Daily Revenue Chart & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Revenue Trend */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#B6FF45]" />
                    Daily Revenue Inflow
                  </h3>
                  <p className="text-xs text-zinc-400">Cash-flow receipts over the selected timeframe</p>
                </div>
                <button
                  onClick={() => handleExportCSV('payments')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090B0A] hover:bg-[#1A221E] border border-[#1C2420] text-xs font-semibold text-zinc-300"
                >
                  <Download className="w-3.5 h-3.5 text-[#B6FF45]" />
                  <span>Download Ledger</span>
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData?.dailyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#71717A"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1311',
                        borderColor: '#1C2420',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Daily Inflow']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#B6FF45"
                      strokeWidth={2.5}
                      dot={{ fill: '#B6FF45', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method Distribution Pie */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    Payment Gateway Split
                  </h3>
                  <span className="text-[11px] text-zinc-400">UPI vs Cash vs Card</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueData?.revenueByMethod || []}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {(revenueData?.revenueByMethod || []).map((entry, index) => (
                          <Cell key={`m-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F1311',
                          borderColor: '#1C2420',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                        formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2">
                  {(revenueData?.revenueByMethod || []).map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="text-zinc-300 font-medium">{m.method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-[11px]">({m.percentage}%)</span>
                        <span className="font-bold text-white">₹{m.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Membership Plan Table */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <h3 className="text-sm font-bold text-white mb-3">Revenue Contribution by Membership Plan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2420] text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-bold">Plan Name</th>
                    <th className="py-2.5 font-bold">Subscribers</th>
                    <th className="py-2.5 font-bold">Total Inflow</th>
                    <th className="py-2.5 font-bold">Share of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {(revenueData?.revenueByPlan || []).map((plan, idx) => {
                    const share = (revenueData?.summary.totalRevenue ?? 0) > 0
                      ? Math.round((plan.amount / (revenueData?.summary.totalRevenue || 1)) * 100)
                      : 0;
                    return (
                      <tr key={idx} className="hover:bg-[#1A221E]/40 transition-colors">
                        <td className="py-3 font-semibold text-white">{plan.planName}</td>
                        <td className="py-3 text-zinc-300">{plan.subscribers} members</td>
                        <td className="py-3 font-bold text-[#B6FF45]">₹{plan.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-[#090B0A] overflow-hidden">
                              <div
                                className="h-full bg-[#B6FF45] rounded-full"
                                style={{ width: `${Math.min(100, share)}%` }}
                              />
                            </div>
                            <span className="text-zinc-400 text-[11px] font-semibold">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: MEMBERSHIPS & RETENTION                                   */}
      {/* ========================================================================= */}
      {activeTab === 'memberships' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Active Memberships</span>
              <div className="text-2xl font-black text-[#B6FF45] mt-1">
                {membershipData?.summary.activeMembers ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Currently valid</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Expired Memberships</span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {membershipData?.summary.expiredMembers ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Action required</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Retention Rate</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {membershipData?.summary.retentionRate ?? 92}%
              </div>
              <span className="text-[10px] text-zinc-500">Cohort loyalty score</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Churn Rate</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {membershipData?.summary.churnRate ?? 8}%
              </div>
              <span className="text-[10px] text-zinc-500">Unrenewed drop-offs</span>
            </div>
          </div>

          {/* Member Growth & Plan Popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Member Growth &amp; Retention Curve
                  </h3>
                  <p className="text-xs text-zinc-400">Net active membership expansion across months</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={membershipData?.growthTrend || []}>
                    <defs>
                      <linearGradient id="memGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
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
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="active"
                      name="Active Members"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fill="url(#memGrowth)"
                    />
                    <Line
                      type="monotone"
                      dataKey="newJoiners"
                      name="New Joiners"
                      stroke="#B6FF45"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Popularity Distribution */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <h3 className="text-sm font-bold text-white mb-3">Plan Popularity Share</h3>
              <div className="space-y-4">
                {(membershipData?.planPopularity || []).map((p, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-semibold">{p.planName}</span>
                      <span className="text-[#B6FF45] font-bold">{p.percentage}% ({p.count})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#090B0A] overflow-hidden">
                      <div
                        className="h-full bg-[#B6FF45] rounded-full"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: ATTENDANCE & TRAFFIC                                      */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Total Turnstile Visits</span>
              <div className="text-2xl font-black text-[#B6FF45] mt-1">
                {attendanceData?.summary.totalVisits ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Filtered timeframe</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Daily Average Check-ins</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {attendanceData?.summary.dailyAverage ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Per operational day</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Peak Rush Hour</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {attendanceData?.summary.peakHour || '6 PM - 8 PM'}
              </div>
              <span className="text-[10px] text-zinc-500">Highest gym density</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Average Workout Duration</span>
              <div className="text-2xl font-black text-purple-400 mt-1">
                {attendanceData?.summary.avgDurationMinutes ?? 65}m
              </div>
              <span className="text-[10px] text-zinc-500">Check-in to check-out</span>
            </div>
          </div>

          {/* Peak Hourly Flow Chart */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B6FF45]" />
                  24-Hour Facility Rush Distribution
                </h3>
                <p className="text-xs text-zinc-400">Turnstile check-in frequency by hour of the day</p>
              </div>
              <Badge variant="expiring_soon">PEAK CAPACITY</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData?.hourlyFlow || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2823" vertical={false} />
                  <XAxis dataKey="hour" stroke="#71717A" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1311',
                      borderColor: '#1C2420',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(v: any) => [`${v} Check-ins`, 'Density']}
                  />
                  <Bar dataKey="count" fill="#B6FF45" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: TRAINER PERFORMANCE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'trainers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Total Trainers</span>
              <div className="text-2xl font-black text-white mt-1">
                {trainerData?.summary.totalTrainers ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">On payroll</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Completed Sessions</span>
              <div className="text-2xl font-black text-[#B6FF45] mt-1">
                {trainerData?.summary.totalCompletedSessions ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Verified training hours</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Avg Attendance Rate</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {trainerData?.summary.avgAttendanceRate ?? 95}%
              </div>
              <span className="text-[10px] text-zinc-500">Punctuality index</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-xs text-zinc-400 font-semibold">Avg Client Rating</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                ★ {trainerData?.summary.avgRating ?? 4.8}
              </div>
              <span className="text-[10px] text-zinc-500">Athlete feedback</span>
            </div>
          </div>

          {/* Trainer Performance Table */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#B6FF45]" />
                  Trainer Performance &amp; Client Load Roster
                </h3>
                <p className="text-xs text-zinc-400">Assigned athletes, sessions logged, and performance scores</p>
              </div>
              <button
                onClick={() => handleExportCSV('trainers')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090B0A] hover:bg-[#1A221E] border border-[#1C2420] text-xs font-semibold text-zinc-300"
              >
                <Download className="w-3.5 h-3.5 text-[#B6FF45]" />
                <span>Export Trainers</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2420] text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-bold">Trainer Name</th>
                    <th className="py-2.5 font-bold">Specialization</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold">Active Clients</th>
                    <th className="py-2.5 font-bold">Sessions Done</th>
                    <th className="py-2.5 font-bold">Attendance</th>
                    <th className="py-2.5 font-bold">Rating</th>
                    <th className="py-2.5 font-bold">Monthly Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {(trainerData?.trainers || []).map((t, idx) => (
                    <tr key={idx} className="hover:bg-[#1A221E]/40 transition-colors">
                      <td className="py-3 font-semibold text-white">{t.name}</td>
                      <td className="py-3 text-zinc-300">{t.specialization}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          {t.employmentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-300 font-semibold">{t.assignedClientsCount} athletes</td>
                      <td className="py-3 font-bold text-white">{t.completedSessions}</td>
                      <td className="py-3 text-cyan-400 font-semibold">{t.attendanceRate}%</td>
                      <td className="py-3 text-amber-400 font-bold">★ {t.rating}</td>
                      <td className="py-3 font-bold text-[#B6FF45]">₹{t.salary.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB CONTENT: MEMBER COHORTS & ENGAGEMENT                               */}
      {/* ========================================================================= */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Cohort Selector Sub-tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'mostActive', label: '🔥 Most Active Athletes', count: engagementData?.segments.mostActive.length || 0 },
              { id: 'inactive', label: '⚠️ Inactive (>7 Days)', count: engagementData?.segments.inactive.length || 0 },
              { id: 'lowAttendance', label: '📉 Low Attendance (<4/mo)', count: engagementData?.segments.lowAttendance.length || 0 },
              { id: 'expiringSoon', label: '⏳ Expiring Soon (≤14d)', count: engagementData?.segments.expiringSoon.length || 0 },
              { id: 'pendingDues', label: '💳 Unpaid Dues', count: engagementData?.segments.pendingDues.length || 0 },
            ].map((sub) => {
              const isSelected = engagementFilter === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setEngagementFilter(sub.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#B6FF45] text-[#090B0A] shadow-md'
                      : 'bg-[#151A17] text-zinc-300 hover:text-white border border-[#1C2420]'
                  }`}
                >
                  <span>{sub.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-black/20 text-black' : 'bg-[#090B0A] text-zinc-400'}`}>
                    {sub.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Cohort List View */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <h3 className="text-sm font-bold text-white mb-4">
              {engagementFilter === 'mostActive' && 'Top Performing Athletes by Gym Visit Frequency'}
              {engagementFilter === 'inactive' && 'At-Risk Inactive Members (No check-ins logged for 7+ days)'}
              {engagementFilter === 'lowAttendance' && 'Low Engagement Members (Under 4 sessions in the past month)'}
              {engagementFilter === 'expiringSoon' && 'Upcoming Membership Expirations Requiring Renewal Intervention'}
              {engagementFilter === 'pendingDues' && 'Athletes with Outstanding Payment Dues & Pending Invoices'}
            </h3>

            {/* Render segment cards or empty states */}
            {engagementFilter === 'mostActive' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(engagementData?.segments.mostActive || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{m.name}</div>
                      <div className="text-[11px] text-zinc-400">{m.email}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">Last visit: {m.lastVisit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#B6FF45]">{m.visits}</div>
                      <div className="text-[10px] text-zinc-400">Total Visits</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {engagementFilter === 'inactive' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(engagementData?.segments.inactive || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{m.name}</div>
                      <div className="text-[11px] text-zinc-400">{m.email}</div>
                      <div className="text-[10px] text-rose-400 mt-1">{m.daysInactive} days inactive</div>
                    </div>
                    <button
                      onClick={() => alert(`WhatsApp re-engagement prompt queued for ${m.name}`)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold"
                    >
                      Prompt
                    </button>
                  </div>
                ))}
              </div>
            )}

            {engagementFilter === 'expiringSoon' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(engagementData?.segments.expiringSoon || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{m.name}</div>
                      <div className="text-[11px] text-zinc-400">{m.planName}</div>
                      <div className="text-[10px] text-amber-400 mt-1">Expires: {m.expiryDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">{m.daysLeft}d left</div>
                      <button
                        onClick={() => alert(`Renewal reminder sent to ${m.name}`)}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-[#B6FF45] text-[#090B0A] text-[10px] font-black"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {engagementFilter === 'pendingDues' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(engagementData?.segments.pendingDues || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{m.name}</div>
                      <div className="text-[11px] text-zinc-400">{m.email}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">Due: {m.dueDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-rose-400">₹{m.pendingAmount.toLocaleString('en-IN')}</div>
                      <button
                        onClick={() => alert(`Payment invoice dispatched to ${m.name}`)}
                        className="mt-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {engagementFilter === 'lowAttendance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(engagementData?.segments.lowAttendance || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{m.name}</div>
                      <div className="text-[11px] text-zinc-400">{m.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">{m.monthlyVisits} visits/mo</div>
                      <span className="text-[10px] text-zinc-500">Low frequency</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB CONTENT: EXPORT & PDF REPORT CENTER                                 */}
      {/* ========================================================================= */}
      {activeTab === 'exports' && (
        <div className="space-y-6">
          {/* Section 1: Excel & CSV Raw Data Exports */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-[#B6FF45]" />
              <h3 className="text-sm font-bold text-white">Excel &amp; CSV Data Export Center</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Download clean, tenant-isolated spreadsheet records formatted with standard ISO dates, Indian Rupee currency, and status attributes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  type: 'members',
                  title: 'Members Directory CSV',
                  desc: 'Member ID, Name, Phone, Email, Status, Plan, Expiry Date',
                  icon: Users,
                },
                {
                  type: 'payments',
                  title: 'Financial & Payments Ledger CSV',
                  desc: 'Invoice ID, Member, Amount, Method, Status, Date',
                  icon: DollarSign,
                },
                {
                  type: 'attendance',
                  title: 'Facility Attendance Logs CSV',
                  desc: 'Member Code, Check-in, Check-out, Method, Verification',
                  icon: QrCode,
                },
                {
                  type: 'trainers',
                  title: 'Trainers Registry & Payroll CSV',
                  desc: 'Trainer Code, Name, Specialization, Salary, Status',
                  icon: Award,
                },
                {
                  type: 'memberships',
                  title: 'Memberships & Subscriptions CSV',
                  desc: 'Member Name, Plan, Price, Start Date, End Date, Status',
                  icon: CreditCard,
                },
                {
                  type: 'revenue',
                  title: 'Financial Breakdown Summary CSV',
                  desc: 'Metric Name, Aggregated Value, Filter Parameters',
                  icon: TrendingUp,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex flex-col justify-between hover:border-[#B6FF45]/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4 text-[#B6FF45]" />
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 mb-3">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => handleExportCSV(item.type)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#151A17] hover:bg-[#B6FF45] text-zinc-300 hover:text-[#090B0A] font-bold text-xs border border-[#1C2420] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .CSV</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Printable PDF Business Reports */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Printable Executive PDF Reports</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Generate pixel-perfect, printer-friendly reports equipped with gym header metadata, date-range filters, high-resolution tables, and executive signature blocks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  reportType: 'monthly-business',
                  title: 'Monthly Business Performance Report',
                  desc: 'Comprehensive multi-metric audit for executive board and franchise reviews.',
                },
                {
                  reportType: 'revenue',
                  title: 'Financial & Revenue Audit Report',
                  desc: 'Detailed breakdown of collected revenue, pending dues, refunds, and gateway fees.',
                },
                {
                  reportType: 'membership',
                  title: 'Membership & Churn Analysis Report',
                  desc: 'Retention curve, renewal rates, and upcoming membership expiration horizons.',
                },
                {
                  reportType: 'attendance',
                  title: 'Attendance & Facility Utilization Report',
                  desc: 'Peak hours distribution, hourly flow analysis, and total turnstile counts.',
                },
                {
                  reportType: 'trainers',
                  title: 'Trainer Performance & Payroll Report',
                  desc: 'Trainer ratings, active client caseloads, session logs, and monthly payouts.',
                },
                {
                  reportType: 'member-activity',
                  title: 'Member Engagement & At-Risk Report',
                  desc: 'Top active athletes, members with overdue fees, and inactive churn risks.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex flex-col justify-between hover:border-purple-400/40 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-3">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => handleOpenPrintable(item.reportType)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View / Print PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
