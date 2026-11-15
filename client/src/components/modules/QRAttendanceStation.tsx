import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  QrCode,
  Scan,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Calendar,
  Search,
  Filter,
  AlertTriangle,
  LogOut,
  LogIn,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import confetti from 'canvas-confetti';
import { AttendanceRecord, Member } from '../../types';

type AttendanceTab = 'dashboard' | 'kiosk' | 'manual' | 'history';

export const QRAttendanceStation: React.FC = () => {
  const {
    currentGym,
    members,
    attendance,
    currentUser,
    attendanceStats,
    recordQRScan,
    manualAttendanceCheckIn,
    manualAttendanceCheckOut,
    addToast,
    globalSearch,
    setGlobalSearch
  } = useApp();

  const [activeTab, setActiveTab] = useState<AttendanceTab>('dashboard');
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [scanMode, setScanMode] = useState<'auto' | 'check_in' | 'check_out'>('auto');

  // Scanner state
  const [inputQrToken, setInputQrToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  // Manual Attendance state
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // History & Filters state
  const [historyRange, setHistoryRange] = useState<string>('all');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyPlanFilter, setHistoryPlanFilter] = useState<string>('all');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Active visits (members currently on floor in this gym)
  const activeVisits = useMemo(() => {
    return attendance.filter(
      (a) =>
        (currentUser?.role === 'super_admin' || a.gymId === currentGym.id) &&
        a.status === 'checked_in' &&
        !a.check_out &&
        !a.checkOutTime
    );
  }, [attendance, currentGym.id, currentUser?.role]);

  // Today's attendance logs
  const todayLogs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return attendance.filter((a) => {
      const matchGym = currentUser?.role === 'super_admin' || a.gymId === currentGym.id;
      if (!matchGym) return false;
      const aDate = a.attendanceDate || a.attendance_date || (a.check_in ? a.check_in.split('T')[0] : '');
      return aDate === todayStr || (!aDate && a.checkInTime);
    });
  }, [attendance, currentGym.id, currentUser?.role]);

  // Filtered History list
  const filteredHistory = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return attendance.filter((log) => {
      // Gym scope
      if (currentUser?.role !== 'super_admin' && log.gymId !== currentGym.id) return false;

      // Status filter
      if (historyStatusFilter !== 'all' && log.status !== historyStatusFilter) return false;

      // Plan filter
      if (historyPlanFilter !== 'all' && log.planName !== historyPlanFilter) return false;

      // Search
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const matches =
          log.memberName.toLowerCase().includes(q) ||
          log.memberCode.toLowerCase().includes(q) ||
          (log.notes && log.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Date range filter
      if (historyRange === 'today') {
        const logDateStr = log.attendanceDate || log.attendance_date || (log.check_in ? log.check_in.split('T')[0] : '');
        const todayStr = today.toISOString().split('T')[0];
        return logDateStr === todayStr || (!logDateStr && log.checkInTime);
      } else if (historyRange === 'yesterday') {
        const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const logDateStr = log.attendanceDate || log.attendance_date || (log.check_in ? log.check_in.split('T')[0] : '');
        return logDateStr === yest;
      } else if (historyRange === '7days') {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const logDateStr = log.attendanceDate || log.attendance_date || (log.check_in ? log.check_in.split('T')[0] : '');
        return logDateStr >= sevenDaysAgo;
      } else if (historyRange === '30days') {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const logDateStr = log.attendanceDate || log.attendance_date || (log.check_in ? log.check_in.split('T')[0] : '');
        return logDateStr >= thirtyDaysAgo;
      }

      return true;
    });
  }, [attendance, currentGym.id, currentUser?.role, historyRange, historySearch, historyStatusFilter, historyPlanFilter]);

  // Paginated History
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, historyPage]);

  // Members search list for manual terminal
  const manualMemberSuggestions = useMemo(() => {
    if (!manualSearchQuery.trim()) return [];
    const q = manualSearchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (currentUser?.role === 'super_admin' || m.gymId === currentGym.id) &&
        (m.fullName.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q) ||
          m.phone.includes(q))
    ).slice(0, 5);
  }, [members, manualSearchQuery, currentGym.id, currentUser?.role]);

  // Handle QR Scan Submission
  const handlePerformScan = async (tokenOrCode: string) => {
    if (!tokenOrCode.trim()) return;
    setIsScanning(true);
    setLastScanResult(null);

    const result = await recordQRScan(tokenOrCode.trim(), scanMode);
    setLastScanResult(result);
    setIsScanning(false);
    setInputQrToken('');

    if (result.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#B6FF45', '#10b981', '#34d399', '#ffffff'],
      });
    }
  };

  // Quick 1-click checkout for active visits
  const handleQuickCheckOut = async (memberId: string, memberName: string) => {
    await manualAttendanceCheckOut(memberId, 'Quick checkout from live floor roster');
  };

  // Manual Check-In
  const handleManualCheckIn = async () => {
    if (!selectedMember) return;
    setIsSubmittingManual(true);
    const res = await manualAttendanceCheckIn(selectedMember.id, manualNotes);
    setIsSubmittingManual(false);
    if (res.success) {
      setManualNotes('');
      setSelectedMember(null);
      setManualSearchQuery('');
    }
  };

  // Manual Check-Out
  const handleManualCheckOut = async () => {
    if (!selectedMember) return;
    setIsSubmittingManual(true);
    const res = await manualAttendanceCheckOut(selectedMember.id, manualNotes);
    setIsSubmittingManual(false);
    if (res.success) {
      setManualNotes('');
      setSelectedMember(null);
      setManualSearchQuery('');
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'Member Name',
      'Member ID',
      'Plan Name',
      'Date',
      'Check In Time',
      'Check Out Time',
      'Duration (Mins)',
      'Status',
      'Method',
      'Recorded By',
      'Notes'
    ];
    const rows = filteredHistory.map((a) => [
      `"${a.memberName}"`,
      `"${a.memberCode}"`,
      `"${a.planName || 'Standard'}"`,
      `"${a.attendanceDate || a.attendance_date || (a.check_in ? a.check_in.split('T')[0] : 'Today')}"`,
      `"${a.checkInTime}"`,
      `"${a.checkOutTime || 'On Floor'}"`,
      a.durationMinutes || (a.status === 'checked_in' ? 'Active' : '45'),
      `"${a.status === 'checked_in' ? 'On Floor' : 'Completed'}"`,
      `"${a.verificationMethod || 'qr_scanner'}"`,
      `"${a.recordedByName || 'Turnstile Kiosk'}"`,
      `"${a.notes || ''}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gymflow-attendance-${currentGym.id}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Attendance Report Exported',
      message: `Exported ${filteredHistory.length} attendance log entries.`,
    });
  };

  // Calculate if selected member in manual view is currently inside
  const isSelectedMemberInside = useMemo(() => {
    if (!selectedMember) return false;
    return activeVisits.some((a) => a.memberId === selectedMember.id);
  }, [selectedMember, activeVisits]);

  // Hourly flow chart data formatting
  const chartData = useMemo(() => {
    return attendanceStats.hourlyFlow.map((item) => ({
      ...item,
      shortLabel: item.label.replace(':00', ''),
    }));
  }, [attendanceStats.hourlyFlow]);

  return (
    <div className={`space-y-6 ${isKioskMode ? 'fixed inset-0 z-50 bg-[#090B0A] p-6 sm:p-10 overflow-y-auto' : ''}`}>
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B6FF45]/15 border border-[#B6FF45]/30 flex items-center justify-center text-[#B6FF45]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Smart Attendance Station
                </h1>
                <Badge variant="pro">STEP 7 ACTIVE</Badge>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C2420] text-zinc-300 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF45] animate-ping" />
                  {currentGym.name}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Contactless QR turnstile, live floor capacity, staff check-in, and multi-tenant audit logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Tab Buttons */}
          <div className="flex items-center p-1 bg-[#090B0A] rounded-2xl border border-[#1C2420]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('kiosk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'kiosk'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>QR Scanner Kiosk</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Manual Check-in</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Attendance History</span>
            </button>
          </div>

          {/* Fullscreen Kiosk Mode Toggle */}
          <button
            onClick={() => setIsKioskMode(!isKioskMode)}
            className="p-2.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-zinc-300 hover:text-white border border-[#1C2420] transition-colors"
            title={isKioskMode ? 'Exit Kiosk View' : 'Fullscreen Kiosk Mode'}
          >
            {isKioskMode ? <Minimize2 className="w-4 h-4 text-[#B6FF45]" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] text-[#B6FF45] font-bold text-xs border border-[#B6FF45]/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 6 LIVE ATTENDANCE KPI ANALYTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Total Check-ins Today */}
        <div className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Check-Ins</span>
            <div className="w-8 h-8 rounded-xl bg-[#B6FF45]/10 border border-[#B6FF45]/20 flex items-center justify-center text-[#B6FF45]">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {attendanceStats.totalCheckInsToday}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Today's visits logged</span>
            </span>
          </div>
        </div>

        {/* KPI 2: Currently Inside Gym */}
        <div className="p-4 rounded-3xl bg-[#151A17] border border-[#B6FF45]/30 bg-gradient-to-br from-[#151A17] to-[#B6FF45]/5 hover:border-[#B6FF45] transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B6FF45]">Inside Gym</span>
            <div className="w-8 h-8 rounded-xl bg-[#B6FF45]/20 border border-[#B6FF45]/40 flex items-center justify-center text-[#B6FF45]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>{attendanceStats.currentlyInside}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#B6FF45] animate-ping" />
            </div>
            <span className="text-[10px] text-[#B6FF45] font-semibold mt-0.5 block">
              Active Floor Capacity
            </span>
          </div>
        </div>

        {/* KPI 3: Total Members Present */}
        <div className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Members Present</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {attendanceStats.totalPresent}
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
              Distinct athletes today
            </span>
          </div>
        </div>

        {/* KPI 4: Members Absent Today */}
        <div className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent Today</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {attendanceStats.absentToday}
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
              Unvisited active members
            </span>
          </div>
        </div>

        {/* KPI 5: Peak Attendance Time */}
        <div className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peak Hour</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-[#B6FF45] truncate" title={attendanceStats.peakTime}>
              {attendanceStats.peakTime}
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
              Busiest floor interval
            </span>
          </div>
        </div>

        {/* KPI 6: Weekly Attendance Percentage */}
        <div className="p-4 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Weekly Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {attendanceStats.weeklyAttendancePct}%
            </div>
            <span className="text-[10px] text-purple-400 font-semibold mt-0.5 block">
              7-Day consistency score
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE DASHBOARD (Peak hours & Active Gym Floor)    */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Flow Recharts Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#B6FF45]" />
                    Peak Attendance & Hourly Traffic Flow
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time member check-in frequency distribution across operational hours
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#0F1311] border border-[#1C2420] text-[11px] font-mono text-[#B6FF45]">
                  Peak: {attendanceStats.peakTime}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="shortLabel"
                      stroke="#71717A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#27272A' }}
                    />
                    <YAxis
                      stroke="#71717A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#27272A' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#151A17] border border-[#B6FF45]/40 rounded-xl p-3 shadow-2xl">
                              <p className="text-xs font-bold text-white">{data.label}</p>
                              <p className="text-sm font-black text-[#B6FF45] mt-1">
                                {data.count} Check-in{data.count !== 1 ? 's' : ''}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                {data.count >= 8 ? '🔥 High Peak Period' : data.count >= 4 ? '⚡ Moderate Activity' : '🧘 Normal Flow'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.count >= 6 ? '#B6FF45' : entry.count >= 3 ? '#a3e635' : '#4ade80'}
                          opacity={entry.count > 0 ? 0.9 : 0.25}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Inside Gym Floor Roster */}
            <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B6FF45] animate-ping" />
                    <h3 className="text-sm font-bold text-white">Currently On Floor</h3>
                  </div>
                  <Badge variant="pro">{activeVisits.length} ACTIVE</Badge>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {activeVisits.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-400">Gym floor is currently clear.</p>
                      <p className="text-[11px] text-zinc-500">No active workout sessions in progress.</p>
                    </div>
                  ) : (
                    activeVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-3 rounded-2xl bg-[#0F1311] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={visit.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={visit.memberName}
                            className="w-8 h-8 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{visit.memberName}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              In: {visit.checkInTime} • {visit.memberCode}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleQuickCheckOut(visit.memberId, visit.memberName)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                          title="Record Check-out"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Exit</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1C2420] mt-3 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Facility: {currentGym.name}</span>
                <button
                  onClick={() => setActiveTab('manual')}
                  className="text-[#B6FF45] font-bold hover:underline"
                >
                  Manual Check-in →
                </button>
              </div>
            </div>
          </div>

          {/* Today's Live Attendance Stream Table */}
          <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B6FF45]" />
                  Today's Live Check-in Stream ({todayLogs.length} Records)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Chronological feed of athlete check-ins and check-outs today</p>
              </div>

              <button
                onClick={() => setActiveTab('kiosk')}
                className="px-3 py-1.5 rounded-xl bg-[#B6FF45] text-[#090B0A] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#B6FF45]/20"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Launch QR Kiosk</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Athlete</th>
                    <th className="py-3 px-3">Member ID</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Check-Out</th>
                    <th className="py-3 px-3">Workout Duration</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Recorded By</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {todayLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        No check-in entries logged yet today. Use the QR Kiosk or Manual terminal to record entries.
                      </td>
                    </tr>
                  ) : (
                    todayLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#0F1311]/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={log.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                              alt={log.memberName}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <span className="font-bold text-white block">{log.memberName}</span>
                              <span className="text-[10px] text-zinc-400">{log.planName || 'Standard Tier'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#B6FF45]">{log.memberCode}</td>
                        <td className="py-3 px-3 text-zinc-300">{log.checkInTime}</td>
                        <td className="py-3 px-3 text-zinc-400">
                          {log.checkOutTime || <span className="text-[#B6FF45] font-bold">On Floor</span>}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {log.durationMinutes ? `${log.durationMinutes} mins` : <Badge variant="active" size="sm">IN SESSION</Badge>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-[#0F1311] border border-[#1C2420] text-[10px] text-zinc-300 uppercase">
                            {log.verificationMethod?.replace('_', ' ') || 'QR'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px] truncate max-w-[120px]">
                          {log.recordedByName || 'Turnstile Kiosk'}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={log.status === 'checked_in' ? 'active' : 'completed'} size="sm">
                            {log.status === 'checked_in' ? 'Inside Gym' : 'Completed'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QR SCANNER KIOSK (Viewfinder & Member Pass Verif)  */}
      {/* ======================================================== */}
      {activeTab === 'kiosk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Viewfinder & Direct Pass Input */}
          <div className="space-y-4">
            {/* Viewfinder Frame */}
            <div className="p-8 rounded-3xl bg-[#151A17] border-2 border-dashed border-[#B6FF45]/40 relative overflow-hidden flex flex-col items-center justify-center text-center group min-h-[300px]">
              {/* Corner targeting brackets */}
              <div className="absolute top-4 left-4 w-7 h-7 border-t-3 border-l-3 border-[#B6FF45]" />
              <div className="absolute top-4 right-4 w-7 h-7 border-t-3 border-r-3 border-[#B6FF45]" />
              <div className="absolute bottom-4 left-4 w-7 h-7 border-b-3 border-l-3 border-[#B6FF45]" />
              <div className="absolute bottom-4 right-4 w-7 h-7 border-b-3 border-r-3 border-[#B6FF45]" />

              {/* Animated Laser Sweep Line */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] bg-[#B6FF45] shadow-[0_0_20px_#B6FF45] animate-pulse" />

              <Scan className="w-16 h-16 text-[#B6FF45] mb-3 group-hover:scale-105 transition-transform" />
              <h3 className="text-base font-black text-white">Turnstile Optical Lens Active</h3>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                Align athlete digital QR pass or smartwatch RFID card inside frame
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#B6FF45]/15 text-[#B6FF45] text-[11px] font-bold border border-[#B6FF45]/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B6FF45] animate-ping" />
                  <span>Kiosk Ready • {currentGym.name}</span>
                </span>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Scanning Workflow Mode:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setScanMode('auto')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center border transition-all ${
                    scanMode === 'auto'
                      ? 'bg-[#B6FF45] text-[#090B0A] border-[#B6FF45]'
                      : 'bg-[#0F1311] text-zinc-400 border-[#1C2420] hover:text-white'
                  }`}
                >
                  ⚡ Smart Auto
                </button>
                <button
                  onClick={() => setScanMode('check_in')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center border transition-all ${
                    scanMode === 'check_in'
                      ? 'bg-[#B6FF45] text-[#090B0A] border-[#B6FF45]'
                      : 'bg-[#0F1311] text-zinc-400 border-[#1C2420] hover:text-white'
                  }`}
                >
                  🟢 Check-in Only
                </button>
                <button
                  onClick={() => setScanMode('check_out')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center border transition-all ${
                    scanMode === 'check_out'
                      ? 'bg-[#B6FF45] text-[#090B0A] border-[#B6FF45]'
                      : 'bg-[#0F1311] text-zinc-400 border-[#1C2420] hover:text-white'
                  }`}
                >
                  🔴 Check-out Only
                </button>
              </div>
            </div>

            {/* Manual QR Token Input */}
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                Scan / Enter QR Identifier Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. GYMFLOW-QR-IP-1001-ALEX_RIVERA"
                  value={inputQrToken}
                  onChange={(e) => setInputQrToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePerformScan(inputQrToken)}
                  className="flex-1 bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B6FF45] font-mono"
                />
                <button
                  onClick={() => handlePerformScan(inputQrToken)}
                  disabled={!inputQrToken.trim() || isScanning}
                  className="px-4 py-2 bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs rounded-xl disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  {isScanning ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <Scan className="w-3.5 h-3.5" />
                      <span>Scan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Verification Result & Interactive Simulator */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live Scan Result Card */}
            {lastScanResult ? (
              <div
                className={`p-6 rounded-3xl border transition-all animate-in fade-in slide-in-from-top-2 ${
                  lastScanResult.success
                    ? 'bg-[#151A17] border-[#B6FF45] shadow-[0_0_30px_rgba(182,255,69,0.15)]'
                    : 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C2420]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        lastScanResult.success
                          ? 'bg-[#B6FF45]/20 text-[#B6FF45]'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {lastScanResult.success ? (
                        <CheckCircle2 className="w-7 h-7" />
                      ) : (
                        <AlertTriangle className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        {lastScanResult.success
                          ? lastScanResult.action === 'check_out'
                            ? 'Check-out Recorded 👋'
                            : 'Access Granted ⚡'
                          : 'Check-in Blocked / Rejected'}
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        {lastScanResult.message || lastScanResult.error}
                      </p>
                    </div>
                  </div>

                  <Badge variant={lastScanResult.success ? 'active' : 'suspended'}>
                    {lastScanResult.success
                      ? lastScanResult.action === 'check_out'
                        ? 'COMPLETED VISIT'
                        : 'VALID ENTRY'
                      : lastScanResult.code || 'BLOCKED'}
                  </Badge>
                </div>

                {/* Athlete Details if resolved */}
                {lastScanResult.member && (
                  <div className="mt-4 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          lastScanResult.member.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                        }
                        alt={lastScanResult.member.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#1C2420]"
                      />
                      <div>
                        <span className="text-sm font-black text-white block">
                          {lastScanResult.member.fullName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-[#B6FF45] font-bold">
                            {lastScanResult.member.memberCode}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-xs text-zinc-400">
                            {lastScanResult.member.planName || 'Pro Athlete Tier'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {lastScanResult.durationMinutes && (
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                        <span className="text-[10px] text-zinc-500 block uppercase">Workout Duration</span>
                        <span className="text-sm font-black text-[#B6FF45]">
                          {lastScanResult.durationMinutes} Minutes
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#151A17] border border-[#1C2420] text-center text-zinc-500">
                <QrCode className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-zinc-300">Ready to Scan Digital Passes</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  When an athlete scans their pass at the entrance terminal, real-time membership validation, duplicate check-in prevention, and photo verification will appear here.
                </p>
              </div>
            )}

            {/* Interactive Digital Pass Simulator */}
            <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B6FF45]" />
                  Instant Security & Multi-Tenant Test Simulator:
                </span>
                <span className="text-[11px] text-zinc-500">Click any card to simulate live scan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Active Member in this Gym (Alex Rivera) */}
                <button
                  onClick={() => handlePerformScan('GYMFLOW-QR-IP-1001-ALEX_RIVERA')}
                  className="p-3 rounded-2xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-[#B6FF45]/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-[#B6FF45]">
                      Alex Rivera (Active)
                    </span>
                    <Badge variant="active" size="sm">Active Pass</Badge>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                    IP-1001 • IronPulse Fitness
                  </span>
                  <span className="text-[10px] text-[#B6FF45] mt-1 block">
                    ⚡ Smart Check-in or Check-out
                  </span>
                </button>

                {/* 2. Expired Member in this Gym (Marcus Vance / Expired Member) */}
                <button
                  onClick={() => handlePerformScan('GYMFLOW-QR-IP-1004-EXPIRED')}
                  className="p-3 rounded-2xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-amber-500/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-400">
                      Rohan Sharma (Expired)
                    </span>
                    <Badge variant="expired" size="sm">Expired</Badge>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                    IP-1004 • Expired Yesterday
                  </span>
                  <span className="text-[10px] text-amber-400 mt-1 block">
                    ⚠️ Tests Expired Member Block (403)
                  </span>
                </button>

                {/* 3. Suspended Member in this Gym */}
                <button
                  onClick={() => handlePerformScan('GYMFLOW-QR-IP-1005-SUSPENDED')}
                  className="p-3 rounded-2xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-rose-500/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-rose-400">
                      Vikram Singh (Suspended)
                    </span>
                    <Badge variant="suspended" size="sm">Suspended</Badge>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                    IP-1005 • Policy Breach
                  </span>
                  <span className="text-[10px] text-rose-400 mt-1 block">
                    🚫 Tests Suspended Member Block (403)
                  </span>
                </button>

                {/* 4. Cross-Gym Athlete (Belongs to Titan Forge Gym) */}
                <button
                  onClick={() => handlePerformScan('GYMFLOW-QR-TF-2001-SAMANTHA')}
                  className="p-3 rounded-2xl bg-[#0F1311] hover:bg-[#1C2420] border border-[#1C2420] hover:border-rose-500/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-rose-400">
                      Samantha Bright (Cross-Gym)
                    </span>
                    <Badge variant="pro" size="sm">Other Gym</Badge>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                    TF-2001 • Titan Forge Gym Member
                  </span>
                  <span className="text-[10px] text-rose-400 mt-1 block">
                    🛡️ Tests Multi-Tenant Isolation (403)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MANUAL ATTENDANCE (Front Desk Reception Terminal) */}
      {/* ======================================================== */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Member Lookup & Selection */}
          <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[#B6FF45]" />
                Athlete Lookup
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Search member by full name, phone number, or Member ID
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Search name, e.g. Alex, IP-1001..."
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            {/* Suggestions list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {manualMemberSuggestions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedMember?.id === m.id
                      ? 'bg-[#B6FF45]/15 border-[#B6FF45] text-white'
                      : 'bg-[#0F1311] border-[#1C2420] hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={m.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={m.fullName}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold block">{m.fullName}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {m.memberCode} • {m.phone}
                      </span>
                    </div>
                  </div>
                  <Badge variant={m.status === 'active' ? 'active' : m.status === 'expired' ? 'expired' : 'suspended'} size="sm">
                    {m.status.toUpperCase()}
                  </Badge>
                </button>
              ))}

              {manualSearchQuery && manualMemberSuggestions.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">No matching members found in this gym.</p>
              )}
            </div>

            {/* Current Staff Attribution Badge */}
            <div className="p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#B6FF45] shrink-0" />
              <div className="text-[11px]">
                <span className="text-zinc-400 block">Authorized Staff Attribution:</span>
                <span className="text-white font-bold">
                  {currentUser?.fullName || 'Front Desk Staff'} ({currentUser?.role?.replace('_', ' ').toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Action Panel & Selected Athlete Dossier */}
          <div className="lg:col-span-2 space-y-4">
            {selectedMember ? (
              <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#1C2420]">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedMember.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={selectedMember.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#1C2420]"
                    />
                    <div>
                      <h4 className="text-base font-black text-white">{selectedMember.fullName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-[#B6FF45] font-bold">
                          {selectedMember.memberCode}
                        </span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-xs text-zinc-300">{selectedMember.currentPlanName}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Expires: {selectedMember.membershipEndDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={selectedMember.status === 'active' ? 'active' : 'suspended'}>
                      {selectedMember.status.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-zinc-400 block mt-1">
                      {isSelectedMemberInside ? '🟢 Currently Inside' : '⚪ Outside Gym'}
                    </span>
                  </div>
                </div>

                {/* Visit Notes */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Optional Reception Notes:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Forgot wristband, guest session authorized, personal training..."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleManualCheckIn}
                    disabled={isSubmittingManual || selectedMember.status === 'expired' || isSelectedMemberInside}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md shadow-[#B6FF45]/20"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Record Manual Check-In</span>
                  </button>

                  <button
                    onClick={handleManualCheckOut}
                    disabled={isSubmittingManual || !isSelectedMemberInside}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Record Manual Check-Out</span>
                  </button>
                </div>

                {selectedMember.status === 'expired' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Athlete membership expired on {selectedMember.membershipEndDate}. Please renew membership first.</span>
                  </div>
                )}

                {isSelectedMemberInside && (
                  <div className="p-3 rounded-xl bg-[#B6FF45]/10 border border-[#B6FF45]/20 text-[#B6FF45] text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Athlete is currently inside the gym. Duplicate check-in is blocked; use Check-Out when ready.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-[#151A17] border border-[#1C2420] text-center text-zinc-500">
                <User className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-zinc-300">Select an Athlete from the Directory</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  Type a member name or ID on the left to record front-desk manual attendance with staff attribution.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ATTENDANCE HISTORY (Audit Logs & Multi-Filters)   */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Quick Range Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Records' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setHistoryRange(r.id);
                      setHistoryPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      historyRange === r.id
                        ? 'bg-[#B6FF45] text-[#090B0A]'
                        : 'bg-[#0F1311] text-zinc-400 hover:text-white border border-[#1C2420]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Status and Plan Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={historyStatusFilter}
                  onChange={(e) => {
                    setHistoryStatusFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="bg-[#0F1311] border border-[#1C2420] text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="all">All Statuses</option>
                  <option value="checked_in">Currently Inside (On Floor)</option>
                  <option value="checked_out">Completed Visits</option>
                </select>

                <select
                  value={historyPlanFilter}
                  onChange={(e) => {
                    setHistoryPlanFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="bg-[#0F1311] border border-[#1C2420] text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="all">All Plans</option>
                  <option value="Monthly Standard Fitness">Monthly Standard</option>
                  <option value="Quarterly Pro Transformation">Quarterly Pro</option>
                  <option value="Annual Elite Athlete Pass">Annual Elite</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs by athlete name, member code, or notes..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              {(historySearch || historyRange !== 'all' || historyStatusFilter !== 'all' || historyPlanFilter !== 'all') && (
                <button
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryRange('all');
                    setHistoryStatusFilter('all');
                    setHistoryPlanFilter('all');
                    setHistoryPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-zinc-400 hover:text-white border border-[#1C2420] text-xs font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* History Log Table */}
          <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B6FF45]" />
                Audit Logs ({filteredHistory.length} Total Visits Found)
              </h3>
              <span className="text-xs text-zinc-400">
                Page {historyPage} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Athlete</th>
                    <th className="py-3 px-3">Member ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Check-Out</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Recorded By</th>
                    <th className="py-3 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        No attendance history records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-[#0F1311]/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={log.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                              alt={log.memberName}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <span className="font-bold text-white block">{log.memberName}</span>
                              <span className="text-[10px] text-zinc-400">{log.planName || 'Standard Tier'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#B6FF45]">{log.memberCode}</td>
                        <td className="py-3 px-3 text-zinc-300">
                          {log.attendanceDate || log.attendance_date || (log.check_in ? log.check_in.split('T')[0] : 'Today')}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">{log.checkInTime}</td>
                        <td className="py-3 px-3 text-zinc-400">
                          {log.checkOutTime || <span className="text-[#B6FF45] font-bold">On Floor</span>}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {log.durationMinutes ? `${log.durationMinutes} mins` : 'In Session'}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={log.status === 'checked_in' ? 'active' : 'completed'} size="sm">
                            {log.status === 'checked_in' ? 'On Floor' : 'Completed'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px] truncate max-w-[120px]">
                          {log.recordedByName || 'Turnstile Kiosk'}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px] italic truncate max-w-[150px]">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#1C2420] mt-4">
                <span className="text-xs text-zinc-400">
                  Showing {(historyPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(historyPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} records
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="p-1.5 rounded-lg bg-[#0F1311] text-zinc-400 hover:text-white disabled:opacity-30 border border-[#1C2420]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 rounded-lg bg-[#0F1311] border border-[#1C2420] text-xs font-bold text-white">
                    {historyPage}
                  </span>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                    disabled={historyPage === totalPages}
                    className="p-1.5 rounded-lg bg-[#0F1311] text-zinc-400 hover:text-white disabled:opacity-30 border border-[#1C2420]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
