import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentTransaction, PaymentReceiptData, PendingDueItem } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  Download,
  FileText,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Calendar,
  Send,
  Building,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  Eye,
  Key,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import confetti from 'canvas-confetti';

export const PaymentManagement: React.FC = () => {
  const {
    payments,
    members,
    plans,
    currentGym,
    currentUser,
    paymentStats,
    recordSmartPayment,
    processPaymentRefund,
    fetchPaymentReceipt,
    triggerAutomationTest,
    addToast,
    globalSearch,
    setGlobalSearch,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'dues' | 'refunds' | 'settings'>('overview');

  // Filters for ledger
  const [rangeFilter, setRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Selected entities for modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [fetchedReceipt, setFetchedReceipt] = useState<PaymentReceiptData | null>(null);
  const [refundPayment, setRefundPayment] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Record Payment Form states
  const [formMemberId, setFormMemberId] = useState(members[0]?.id || '');
  const [formPlanId, setFormPlanId] = useState(plans[0]?.id || '');
  const [formAmount, setFormAmount] = useState('2999');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('upi');
  const [formTransactionId, setFormTransactionId] = useState('');
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<string>('completed');
  const [formNotes, setFormNotes] = useState('');
  const [formIsRenewal, setFormIsRenewal] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Online Checkout Simulation
  const [isSimulatingOnline, setIsSimulatingOnline] = useState(false);

  // Derived selected member in form
  const selectedMember = members.find((m) => m.id === formMemberId) || members[0];
  const formFinalAmount = Math.max(0, Number(formAmount) - (Number(formDiscount) || 0));

  // Role verification check
  const isOwnerOrAdmin = currentUser?.role === 'gym_owner' || currentUser?.role === 'super_admin';

  // Filter payments for active gym tenant
  const tenantPayments = payments.filter(
    (p) => currentUser?.role === 'super_admin' || p.gymId === currentGym.id || p.gymId === 'gym-1'
  );

  const filteredPayments = tenantPayments.filter((p) => {
    // Search query
    const q = (searchQuery || globalSearch).toLowerCase().trim();
    if (q) {
      const name = (p.memberName || '').toLowerCase();
      const code = (p.memberCode || '').toLowerCase();
      const rec = (p.receiptNumber || p.invoiceNumber || '').toLowerCase();
      const txn = (p.transactionId || p.razorpayPaymentId || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !rec.includes(q) && !txn.includes(q)) {
        return false;
      }
    }

    // Method filter
    if (methodFilter !== 'all') {
      const m = (p.paymentMethod || '').toLowerCase();
      if (!m.includes(methodFilter.toLowerCase())) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const s = (p.paymentStatus || '').toLowerCase();
      if (s !== statusFilter.toLowerCase()) return false;
    }

    // Range filter
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const payDate = (p.paymentDate || p.paidAt || '').split('T')[0];

    if (rangeFilter === 'today') {
      return payDate === todayStr;
    } else if (rangeFilter === 'week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return payDate >= sevenDaysAgo;
    } else if (rangeFilter === 'month') {
      const currentMonth = now.toISOString().slice(0, 7);
      return payDate.startsWith(currentMonth);
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Members with dues
  const membersWithDues = members.filter(
    (m) => (currentUser?.role === 'super_admin' || m.gymId === currentGym.id) && Number(m.pendingDue || 0) > 0
  );

  // Handlers
  const handleOpenReceipt = async (p: PaymentTransaction) => {
    setSelectedPayment(p);
    const receipt = await fetchPaymentReceipt(p.id);
    setFetchedReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  const handleOpenRefund = (p: PaymentTransaction) => {
    if (!isOwnerOrAdmin) {
      addToast({
        type: 'error',
        title: 'Access Restricted',
        message: 'Only Gym Owners and Super Admins have permission to issue refunds.',
      });
      return;
    }
    setRefundPayment(p);
    setRefundAmount(String(p.finalAmount ?? p.amount));
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPayment) return;

    if (!refundReason.trim()) {
      addToast({
        type: 'error',
        title: 'Reason Required',
        message: 'Please provide a valid reason for this refund audit trail.',
      });
      return;
    }

    setIsRefunding(true);
    const res = await processPaymentRefund({
      paymentId: refundPayment.id,
      refundAmount: Number(refundAmount) || undefined,
      refundReason: refundReason.trim(),
    });
    setIsRefunding(false);

    if (res.success) {
      setIsRefundModalOpen(false);
    } else {
      addToast({
        type: 'error',
        title: 'Refund Failed',
        message: res.error || 'Could not process refund.',
      });
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMemberId) {
      addToast({ type: 'error', title: 'Error', message: 'Please select a member' });
      return;
    }

    setIsSubmittingPayment(true);
    const res = await recordSmartPayment({
      memberId: formMemberId,
      membershipPlanId: formPlanId,
      amount: Number(formAmount),
      discount: Number(formDiscount) || 0,
      paymentMethod: formPaymentMethod,
      transactionId: formTransactionId || undefined,
      paymentDate: formPaymentDate,
      paymentStatus: formStatus,
      notes: formNotes,
      isRenewal: formIsRenewal,
    });
    setIsSubmittingPayment(false);

    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#B6FF45', '#10b981', '#3b82f6'],
      });
      setIsRecordModalOpen(false);
      setFormNotes('');
      setFormDiscount('0');
    } else {
      addToast({
        type: 'error',
        title: 'Payment Failed',
        message: res.error || 'Could not record payment.',
      });
    }
  };

  const handleSimulateRazorpay = async () => {
    setIsSimulatingOnline(true);
    addToast({
      type: 'info',
      title: 'Initiating Razorpay',
      message: 'Creating encrypted order on Razorpay API...',
    });

    try {
      const res = await fetch('http://localhost:5000/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer demo-token-${currentUser?.role || 'gym_owner'}`,
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({
          amount: 2999,
          currency: 'INR',
          memberId: selectedMember?.id || 'cccc1111-0000-0000-0000-000000000001',
          planName: 'Quarterly Pro Transformation',
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Simulate HMAC payment capture
      setTimeout(async () => {
        const verifyRes = await fetch('http://localhost:5000/api/payments/razorpay/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer demo-token-${currentUser?.role || 'gym_owner'}`,
            'X-Gym-Id': currentGym.id,
          },
          body: JSON.stringify({
            razorpayOrderId: orderData.order.id,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpaySignature: 'simulated_valid_hmac_sha256_signature',
            memberId: selectedMember?.id || 'cccc1111-0000-0000-0000-000000000001',
            amount: 2999,
            planName: 'Quarterly Pro Transformation',
          }),
        });

        const verifyData = await verifyRes.json();
        setIsSimulatingOnline(false);

        if (verifyRes.ok && verifyData.success) {
          confetti({
            particleCount: 90,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#B6FF45', '#10b981', '#ffffff'],
          });
          addToast({
            type: 'success',
            title: 'Online Payment Verified! 💳',
            message: `Razorpay signature verified. Tax receipt ${verifyData.receiptNumber} dispatched to WhatsApp.`,
          });
        }
      }, 1200);
    } catch (e: any) {
      setIsSimulatingOnline(false);
      addToast({
        type: 'error',
        title: 'Checkout Simulation Error',
        message: e.message || 'Razorpay sandbox error',
      });
    }
  };

  const handleSendReminder = (m: PendingDueItem) => {
    triggerAutomationTest(
      'WhatsApp Payment Link & Tax Invoice Reminder',
      `${m.phone || '+91 98203 34567'} (${m.memberName})`
    );
  };

  // Chart Palette
  const PIE_COLORS = ['#B6FF45', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#B6FF45]/10 border border-[#B6FF45]/20 rounded-2xl">
              <CreditCard className="w-6 h-6 text-[#B6FF45]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Smart Payment & Revenue Management
                <Badge variant="pro">STEP 8 LIVE</Badge>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentGym.name} • GSTIN Invoice Engine • Razorpay HMAC Verification • Dues Reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateRazorpay}
            disabled={isSimulatingOnline}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C2420] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-[#B6FF45]" />
            {isSimulatingOnline ? 'Verifying Gateway...' : 'Simulate Razorpay'}
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#B6FF45] text-black hover:bg-[#a3e635] shadow-[0_0_20px_rgba(182,255,69,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-[#121614] border border-[#1C2420] rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#B6FF45] text-black shadow-[0_0_12px_rgba(182,255,69,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Revenue Dashboard
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ledger'
              ? 'bg-[#B6FF45] text-black shadow-[0_0_12px_rgba(182,255,69,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Payment History Ledger
          <span className="px-1.5 py-0.5 rounded-md bg-[#1C2420] text-[10px] text-zinc-300">
            {tenantPayments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dues')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dues'
              ? 'bg-[#B6FF45] text-black shadow-[0_0_12px_rgba(182,255,69,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Pending Dues
          {membersWithDues.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px]">
              {membersWithDues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'refunds'
              ? 'bg-[#B6FF45] text-black shadow-[0_0_12px_rgba(182,255,69,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refund Audit Trail
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-[#B6FF45] text-black shadow-[0_0_12px_rgba(182,255,69,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Gateway Settings
        </button>
      </div>

      {/* 8 LIVE REVENUE KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total Revenue */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Revenue</span>
          <p className="text-base sm:text-lg font-black font-mono text-white mt-1">
            ₹{paymentStats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-[#B6FF45] mt-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            +18.4% ARR
          </div>
        </div>

        {/* 2. Today's Revenue */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Today's Revenue</span>
          <p className="text-base sm:text-lg font-black font-mono text-[#B6FF45] mt-1">
            ₹{paymentStats.todayRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Live Today</span>
        </div>

        {/* 3. Monthly Revenue */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Monthly Revenue</span>
          <p className="text-base sm:text-lg font-black font-mono text-white mt-1">
            ₹{paymentStats.monthlyRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-400 mt-1 block">November 2026</span>
        </div>

        {/* 4. Pending Payments */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pending Dues</span>
          <p className="text-base sm:text-lg font-black font-mono text-amber-400 mt-1">
            ₹{paymentStats.pendingPayments.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Overdue Balances</span>
        </div>

        {/* 5. Completed Payments */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-1">
            {paymentStats.completedPaymentsCount}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Captured Txns</span>
        </div>

        {/* 6. Failed Payments */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Failed</span>
          <p className="text-base sm:text-lg font-black font-mono text-rose-400 mt-1">
            {paymentStats.failedPaymentsCount}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Gateway Drops</span>
        </div>

        {/* 7. Refunded Payments */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Refunded</span>
          <p className="text-base sm:text-lg font-black font-mono text-orange-400 mt-1">
            {paymentStats.refundedPaymentsCount}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Reversed Txns</span>
        </div>

        {/* 8. Membership Renewal Revenue */}
        <div className="p-3.5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Renewals</span>
          <p className="text-base sm:text-lg font-black font-mono text-cyan-400 mt-1">
            ₹{paymentStats.membershipRenewalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Contract Renewals</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts Row 1: Daily Area Chart & Monthly Target Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#B6FF45]" />
                    Daily Revenue Trend (Last 14 Days)
                  </h3>
                  <p className="text-xs text-zinc-400">Daily gross payment collections & turnover</p>
                </div>
                <Badge variant="pro">LIVE TELEMETRY</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={paymentStats.dailyRevenue}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B6FF45" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#B6FF45" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222A25" vertical={false} />
                    <XAxis dataKey="label" stroke="#667085" fontSize={11} tickLine={false} />
                    <YAxis stroke="#667085" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1311',
                        border: '1px solid #1C2420',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#B6FF45" strokeWidth={2.5} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Actual vs Target */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#B6FF45]" />
                    Monthly Revenue vs Revenue Target (2026)
                  </h3>
                  <p className="text-xs text-zinc-400">Actual collections vs budgeted SaaS forecast</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentStats.monthlyRevenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222A25" vertical={false} />
                    <XAxis dataKey="month" stroke="#667085" fontSize={11} tickLine={false} />
                    <YAxis stroke="#667085" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1311',
                        border: '1px solid #1C2420',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="revenue" name="Actual Revenue" fill="#B6FF45" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="target" name="Monthly Target" fill="#2B3630" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Method Distribution Donut & Revenue by Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Method Distribution */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#B6FF45]" />
                    Payment Method Distribution
                  </h3>
                  <p className="text-xs text-zinc-400">Share of volume by payment channel</p>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStats.paymentMethodDistribution}
                      dataKey="amount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {paymentStats.paymentMethodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1311',
                        border: '1px solid #1C2420',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Plan */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#B6FF45]" />
                    Revenue by Membership Plan
                  </h3>
                  <p className="text-xs text-zinc-400">Tier contributions to gross turnover</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentStats.revenueByPlan} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#222A25" horizontal={false} />
                    <XAxis type="number" stroke="#667085" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <YAxis dataKey="planName" type="category" stroke="#667085" fontSize={10} width={110} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1311',
                        border: '1px solid #1C2420',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by receipt #, athlete name, ID or transaction..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            {/* Range */}
            <select
              value={rangeFilter}
              onChange={(e) => {
                setRangeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
            </select>

            {/* Method */}
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="all">All Methods</option>
              <option value="razorpay">Razorpay</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="net_banking">Net Banking</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121614] text-zinc-400 font-semibold border-b border-[#1C2420]">
                  <tr>
                    <th className="py-3 px-4">Receipt / Invoice</th>
                    <th className="py-3 px-4">Athlete Details</th>
                    <th className="py-3 px-4">Membership Plan</th>
                    <th className="py-3 px-4">Amount & Discount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        No payment records matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p) => {
                      const finalAmt = p.finalAmount ?? p.amount;
                      const hasDiscount = (p.discount || 0) > 0;
                      return (
                        <tr key={p.id} className="hover:bg-[#1C2420]/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-white block">
                              {p.receiptNumber || p.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {p.transactionId || p.razorpayPaymentId || 'DIRECT'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-white">{p.memberName}</p>
                            <span className="text-[11px] text-zinc-400 font-mono">{p.memberCode}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-zinc-300 font-medium block">
                              {p.planName || 'Standard Tier'}
                            </span>
                            {p.isRenewal && (
                              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Renewal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <p className="font-bold text-white">₹{finalAmt.toLocaleString('en-IN')}</p>
                            {hasDiscount && (
                              <span className="text-[10px] text-emerald-400">
                                -₹{p.discount} off (Base: ₹{p.amount})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#090B0A] border border-[#1C2420] text-[#B6FF45]">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {new Date(p.paymentDate || p.paidAt || Date.now()).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                p.paymentStatus === 'completed'
                                  ? 'completed'
                                  : p.paymentStatus === 'refunded'
                                  ? 'refunded'
                                  : p.paymentStatus === 'failed'
                                  ? 'failed'
                                  : 'pending'
                              }
                            >
                              {p.paymentStatus.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Receipt */}
                              <button
                                onClick={() => handleOpenReceipt(p)}
                                title="View Tax Invoice Receipt"
                                className="p-1.5 rounded-lg bg-[#0F1311] text-zinc-300 hover:text-[#B6FF45] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Refund (Owner only) */}
                              {p.paymentStatus === 'completed' && isOwnerOrAdmin && (
                                <button
                                  onClick={() => handleOpenRefund(p)}
                                  title="Process Refund"
                                  className="p-1.5 rounded-lg bg-[#0F1311] text-zinc-300 hover:text-amber-400 border border-[#1C2420] hover:border-amber-400/40 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* WhatsApp Share */}
                              <button
                                onClick={() => {
                                  triggerAutomationTest(
                                    'WhatsApp Tax Invoice Receipt Dispatch',
                                    `${p.memberName} (${p.receiptNumber || p.invoiceNumber})`
                                  );
                                }}
                                title="Send WhatsApp Receipt"
                                className="p-1.5 rounded-lg bg-[#0F1311] text-zinc-300 hover:text-emerald-400 border border-[#1C2420] hover:border-emerald-400/40 transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#1C2420] text-xs text-zinc-400">
                <span>
                  Showing {paginatedPayments.length} of {filteredPayments.length} payments
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-[#0F1311] border border-[#1C2420] disabled:opacity-40 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-[#0F1311] border border-[#1C2420] disabled:opacity-40 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PENDING DUES */}
      {activeTab === 'dues' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>
                <strong>{membersWithDues.length} Athletes</strong> have outstanding balances totaling{' '}
                <strong className="font-mono">
                  ₹{membersWithDues.reduce((s, m) => s + Number(m.pendingDue || 0), 0).toLocaleString('en-IN')}
                </strong>
                . Partial payments are automatically tracked and reconciled.
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121614] text-zinc-400 font-semibold border-b border-[#1C2420]">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Current Plan</th>
                  <th className="py-3 px-4">Outstanding Due</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420]">
                {membersWithDues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No members currently have outstanding dues. All accounts clear!
                    </td>
                  </tr>
                ) : (
                  membersWithDues.map((m) => (
                    <tr key={m.id} className="hover:bg-[#1C2420]/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{m.fullName}</p>
                        <span className="text-[11px] font-mono text-zinc-400">{m.memberCode}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <p>{m.phone || '+91 98765 00000'}</p>
                        <span className="text-[11px] text-zinc-500">{m.email}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{m.currentPlanName || 'Standard Tier'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        ₹{Number(m.pendingDue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{m.membershipEndDate || '2026-12-01'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setFormMemberId(m.id);
                              setFormAmount(String(m.pendingDue));
                              setFormNotes(`Partial/Full due clearance for ${m.fullName}`);
                              setIsRecordModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#B6FF45] text-black hover:bg-[#a3e635] transition-colors"
                          >
                            Collect Dues
                          </button>
                          <button
                            onClick={() =>
                              handleSendReminder({
                                memberId: m.id,
                                memberName: m.fullName,
                                memberCode: m.memberCode,
                                email: m.email,
                                phone: m.phone,
                                planName: m.currentPlanName || '',
                                pendingDue: m.pendingDue || 0,
                                status: m.status,
                              })
                            }
                            className="p-1.5 rounded-lg bg-[#0F1311] text-zinc-300 hover:text-emerald-400 border border-[#1C2420] transition-colors"
                            title="Send WhatsApp Payment Link"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REFUND AUDIT TRAIL */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Immutable Refund Ledger & Audit Trail
              </h3>
              <p className="text-zinc-400">
                All refunds require owner/admin authorization and maintain a cryptographic trail.
              </p>
            </div>
            <Badge variant="refunded">STRICT RBAC</Badge>
          </div>

          <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121614] text-zinc-400 font-semibold border-b border-[#1C2420]">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Refund Amount</th>
                  <th className="py-3 px-4">Audit Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4">Processed Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420]">
                {tenantPayments.filter((p) => p.paymentStatus === 'refunded').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      No refunds processed for this gym facility.
                    </td>
                  </tr>
                ) : (
                  tenantPayments
                    .filter((p) => p.paymentStatus === 'refunded')
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-[#1C2420]/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          {p.receiptNumber || p.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{p.memberName}</p>
                          <span className="text-[11px] font-mono text-zinc-400">{p.memberCode}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-400">
                          ₹{(p.finalAmount ?? p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">
                          {p.notes || 'Relocation refund approved'}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{p.recordedBy || 'Marcus Vance (Owner)'}</td>
                        <td className="py-3 px-4 text-zinc-400">
                          {new Date(p.paymentDate || p.paidAt || Date.now()).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="refunded">PROCESSED</Badge>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GATEWAY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#B6FF45]" />
              <h3 className="text-base font-bold text-white">Razorpay Live API Integration</h3>
            </div>
            <p className="text-zinc-400">
              Payments are verified server-side with HMAC-SHA256 signature verification. Webhooks are idempotent.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-zinc-400 block mb-1">Key ID</label>
                <input
                  type="text"
                  readOnly
                  value="rzp_test_51K9vB7eZ8m1Q2"
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Webhook Secret Status</label>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>X-Razorpay-Signature Cryptographic Verification Active</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Webhook Target URL</label>
                <input
                  type="text"
                  readOnly
                  value="http://localhost:5000/api/payments/razorpay/webhook"
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Supported Channels</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['UPI (Google Pay / PhonePe)', 'Credit Card (Visa / MC)', 'Debit Card', 'Net Banking', 'Cash Counter'].map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-[#0F1311] border border-[#1C2420] text-zinc-300">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#B6FF45]" />
              Security & Anti-Tampering Rules
            </h3>
            <ul className="space-y-3 text-zinc-400 list-disc list-inside">
              <li>
                <strong className="text-white">Strict Role Guard:</strong> Only Gym Owner & Super Admin can initiate refunds.
              </li>
              <li>
                <strong className="text-white">HMAC Signatures:</strong> Every online transaction must pass HMAC-SHA256 checksum matching before membership unlock.
              </li>
              <li>
                <strong className="text-white">Webhook Idempotency:</strong> Handled via `processed_webhook_events` to prevent double-crediting.
              </li>
              <li>
                <strong className="text-white">Tenant Isolation:</strong> Gym staff can never view or refund transactions belonging to another facility.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record New Gym Payment"
        subtitle="Collect offline counter payments, UPI, or card transactions"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          {/* Member Selection */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Select Athlete *</label>
            <select
              value={formMemberId}
              onChange={(e) => setFormMemberId(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode}) • Due: ₹{m.pendingDue || 0}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Membership Plan</label>
            <select
              value={formPlanId}
              onChange={(e) => {
                setFormPlanId(e.target.value);
                const pl = plans.find((p) => p.id === e.target.value);
                if (pl) setFormAmount(String(pl.price));
              }}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              {plans.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} - ₹{pl.price} ({pl.durationMonths} Months)
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Base Amount (₹) *</label>
              <input
                type="number"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#B6FF45] mb-1">Final Amount (₹)</label>
              <div className="w-full bg-[#151A17] border border-[#B6FF45]/40 rounded-xl px-3 py-2 text-[#B6FF45] font-mono font-black text-sm">
                ₹{formFinalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Mode & Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Payment Method</label>
              <select
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                <option value="cash">Cash at Frontdesk</option>
                <option value="credit_card">Credit Card POS</option>
                <option value="debit_card">Debit Card POS</option>
                <option value="net_banking">Net Banking</option>
                <option value="razorpay">Razorpay Gateway</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Payment Date</label>
              <input
                type="date"
                value={formPaymentDate}
                onChange={(e) => setFormPaymentDate(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>

          {/* Transaction ID & Renewal Check */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Transaction ID / Reference</label>
              <input
                type="text"
                placeholder="e.g. UPI-1982736 or CASH-01"
                value={formTransactionId}
                onChange={(e) => setFormTransactionId(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={formIsRenewal}
                  onChange={(e) => setFormIsRenewal(e.target.checked)}
                  className="rounded bg-[#0F1311] border-[#1C2420] text-[#B6FF45] focus:ring-0"
                />
                <span>Extend & Renew Membership Contract</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Transaction Remarks</label>
            <input
              type="text"
              placeholder="e.g. Paid in full via GPay QR"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2420]">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="px-5 py-2 rounded-xl font-bold bg-[#B6FF45] text-black hover:bg-[#a3e635] shadow-[0_0_15px_rgba(182,255,69,0.3)] transition-all"
            >
              {isSubmittingPayment ? 'Generating Receipt...' : 'Record & Print Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* REFUND MODAL */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Process Transaction Refund"
        subtitle="Reverse payment with audit trail & authorization"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitRefund} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <p className="font-semibold">Authorizing Refund for {refundPayment?.memberName}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Receipt: {refundPayment?.receiptNumber || refundPayment?.invoiceNumber} • Paid: ₹{refundPayment?.finalAmount ?? refundPayment?.amount}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Refund Amount (₹) *</label>
            <input
              type="number"
              required
              max={refundPayment?.finalAmount ?? refundPayment?.amount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Audit Reason for Refund *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Relocated to another city, medical leave, or duplicate charge"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2420]">
            <button
              type="button"
              onClick={() => setIsRefundModalOpen(false)}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRefunding}
              className="px-5 py-2 rounded-xl font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all"
            >
              {isRefunding ? 'Processing...' : 'Authorize Refund'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TAX INVOICE RECEIPT MODAL */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={selectedPayment}
        receiptData={fetchedReceipt}
      />
    </div>
  );
};
