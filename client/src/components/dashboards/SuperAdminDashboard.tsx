import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Building2,
  Users,
  CreditCard,
  Server,
  ShieldCheck,
  Search,
  ExternalLink,
  Plus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Ban,
  Play,
  FileText,
  Clock,
  Sparkles,
  Check,
  ShieldAlert,
  DollarSign,
  Activity,
  Headphones,
  Megaphone,
  RefreshCw,
  Download,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Filter,
  Tag,
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  Lock,
  Unlock,
  Settings,
  Calendar,
  Layers,
  CheckCircle,
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
  SuperAdminDashboardStatsData,
  SuperAdminGymDetail,
  PlatformUserRecord,
  SaaSPlanRecord,
  SaaSSubscriptionDetail,
  PlatformTransactionRecord,
  SupportTicketRecord,
  PlatformAnnouncementRecord,
  SystemHealthData,
} from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const { allGyms, switchGym, switchRole, updateGymStatus, addToast, activePage, setActivePage, currentUser } = useApp();

  // Determine active tab - syncs with Sidebar activePage navigation or defaults to overview
  const validTabs = [
    'overview',
    'all-gyms',
    'users',
    'saas-plans',
    'subscriptions',
    'platform-revenue',
    'transactions',
    'support-tickets',
    'announcements',
    'system-health',
    'audit-logs',
    'settings',
  ];
  
  const currentTab = validTabs.includes(activePage) ? activePage : 'overview';

  // State: Data containers
  const [stats, setStats] = useState<SuperAdminDashboardStatsData | null>(null);
  const [gyms, setGyms] = useState<SuperAdminGymDetail[]>([]);
  const [users, setUsers] = useState<PlatformUserRecord[]>([]);
  const [plans, setPlans] = useState<SaaSPlanRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SaaSSubscriptionDetail[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransactionRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncementRecord[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // State: Loading & Filters
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals state
  const [isNewGymModalOpen, setIsNewGymModalOpen] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [newGymState, setNewGymState] = useState('');
  const [newGymOwnerEmail, setNewGymOwnerEmail] = useState('');
  const [newGymPlan, setNewGymPlan] = useState<'trial' | 'starter' | 'pro' | 'enterprise'>('pro');

  const [selectedGym, setSelectedGym] = useState<SuperAdminGymDetail | null>(null);
  const [isGymDetailModalOpen, setIsGymDetailModalOpen] = useState(false);

  const [gymToSuspend, setGymToSuspend] = useState<SuperAdminGymDetail | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [newPlanCode, setNewPlanCode] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanMonthlyPrice, setNewPlanMonthlyPrice] = useState(4999);
  const [newPlanAnnualPrice, setNewPlanAnnualPrice] = useState(49990);
  const [newPlanMemberLimit, setNewPlanMemberLimit] = useState(300);
  const [newPlanTrainerLimit, setNewPlanTrainerLimit] = useState(15);
  const [newPlanFeatures, setNewPlanFeatures] = useState('Core Management, Attendance QR, Invoicing, Basic Analytics');

  const [editingPlan, setEditingPlan] = useState<SaaSPlanRecord | null>(null);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);

  const [selectedSubscription, setSelectedSubscription] = useState<SaaSSubscriptionDetail | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState(1);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);
  const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [ticketResolutionNotes, setTicketResolutionNotes] = useState('');

  const [isNewAnnouncementModalOpen, setIsNewAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState<'all' | 'gym_owners' | 'trainers' | 'members'>('all');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'important' | 'critical'>('normal');

  const [refundingTx, setRefundingTx] = useState<PlatformTransactionRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const BASE_URL = 'http://localhost:5000';

  const getHeaders = () => {
    const token = localStorage.getItem('gymflow_token') || 'demo-token-super_admin';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Demo-Role': 'super_admin',
    };
  };

  // Fetch data from backend
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const headers = getHeaders();

      // 1. Fetch Stats
      const resStats = await fetch(`${BASE_URL}/api/admin/stats`, { headers });
      if (resStats.ok) {
        const data = await resStats.json();
        if (data.success) setStats(data);
      }

      // 2. Fetch Gyms
      const resGyms = await fetch(`${BASE_URL}/api/admin/gyms`, { headers });
      if (resGyms.ok) {
        const data = await resGyms.json();
        if (data.success) setGyms(data.gyms || []);
      }

      // 3. Fetch Users
      const resUsers = await fetch(`${BASE_URL}/api/admin/users`, { headers });
      if (resUsers.ok) {
        const data = await resUsers.json();
        if (data.success) setUsers(data.users || []);
      }

      // 4. Fetch Plans
      const resPlans = await fetch(`${BASE_URL}/api/admin/plans`, { headers });
      if (resPlans.ok) {
        const data = await resPlans.json();
        if (data.success) setPlans(data.plans || []);
      }

      // 5. Fetch Subscriptions
      const resSubs = await fetch(`${BASE_URL}/api/admin/subscriptions`, { headers });
      if (resSubs.ok) {
        const data = await resSubs.json();
        if (data.success) setSubscriptions(data.subscriptions || []);
      }

      // 6. Fetch Transactions
      const resTx = await fetch(`${BASE_URL}/api/admin/transactions`, { headers });
      if (resTx.ok) {
        const data = await resTx.json();
        if (data.success) setTransactions(data.transactions || []);
      }

      // 7. Fetch Support Tickets
      const resTickets = await fetch(`${BASE_URL}/api/admin/support/tickets`, { headers });
      if (resTickets.ok) {
        const data = await resTickets.json();
        if (data.success) setTickets(data.tickets || []);
      }

      // 8. Fetch Announcements
      const resAnn = await fetch(`${BASE_URL}/api/admin/announcements`, { headers });
      if (resAnn.ok) {
        const data = await resAnn.json();
        if (data.success) setAnnouncements(data.announcements || []);
      }

      // 9. Fetch System Health
      const resHealth = await fetch(`${BASE_URL}/api/admin/system/health`, { headers });
      if (resHealth.ok) {
        const data = await resHealth.json();
        if (data.success) setSystemHealth(data);
      }

      // 10. Fetch Audit Logs
      const resLogs = await fetch(`${BASE_URL}/api/admin/audit-logs`, { headers });
      if (resLogs.ok) {
        const data = await resLogs.json();
        if (data.success) setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load Super Admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentTab]);

  // Handle Gym Status (Activate / Suspend / Reactivate)
  const handleUpdateGymStatus = async (gymId: string, newStatus: string, reason?: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/gyms/${gymId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus, reason: reason || 'Super Admin action' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: `Gym ${newStatus.toUpperCase()}`,
          message: data.message || `Gym status updated to ${newStatus}. All historical member and payment data is preserved.`,
        });
        fetchAllData();
      } else {
        addToast({ type: 'error', title: 'Update Failed', message: data.error || 'Unable to update status' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
    }
  };

  // Handle User Status toggle (Active / Suspended)
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus, reason: 'Super Admin policy action' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'User Status Updated',
          message: `User is now ${newStatus}. Platform role and tenant ownership assignments remain intact.`,
        });
        fetchAllData();
      } else {
        addToast({ type: 'error', title: 'Failed', message: data.error });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Impersonate Gym Owner
  const handleImpersonate = async (gymId: string) => {
    await switchGym(gymId);
    switchRole('gym_owner');
    addToast({
      type: 'info',
      title: 'Tenant Console Opened',
      message: 'Now viewing tenant dashboard as Gym Owner. Switch back via the top role switcher at any time.',
    });
  };

  // Provision New Gym Tenant
  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addToast({
        type: 'success',
        title: 'Gym Tenant Provisioned',
        message: `${newGymName} in ${newGymCity} successfully deployed with isolated schema on ${newGymPlan.toUpperCase()} tier.`,
      });
      setIsNewGymModalOpen(false);
      setNewGymName('');
      setNewGymCity('');
      setNewGymState('');
      setNewGymOwnerEmail('');
      fetchAllData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Create SaaS Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featureArray = newPlanFeatures.split(',').map((f) => f.trim()).filter(Boolean);
      const res = await fetch(`${BASE_URL}/api/admin/plans`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          plan_code: newPlanCode.toLowerCase().replace(/\s+/g, '-'),
          name: newPlanName,
          plan_name: newPlanName,
          price_monthly: Number(newPlanMonthlyPrice),
          price_annual: Number(newPlanAnnualPrice),
          max_members: Number(newPlanMemberLimit),
          max_trainers: Number(newPlanTrainerLimit),
          features: featureArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Plan Created',
          message: `Tier '${newPlanName}' published with ₹${newPlanMonthlyPrice}/mo pricing and ${newPlanMemberLimit} athlete limit.`,
        });
        setIsNewPlanModalOpen(false);
        setNewPlanCode('');
        setNewPlanName('');
        fetchAllData();
      } else {
        addToast({ type: 'error', title: 'Plan Creation Failed', message: data.error });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Edit SaaS Plan
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          price_monthly: Number(editingPlan.price_monthly),
          price_annual: Number(editingPlan.price_annual),
          max_members: Number(editingPlan.max_members),
          max_trainers: Number(editingPlan.max_trainers),
          features: editingPlan.features,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Plan Updated',
          message: `Tier '${editingPlan.name}' successfully modified.`,
        });
        setIsEditPlanModalOpen(false);
        setEditingPlan(null);
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Renew Subscription
  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${selectedSubscription.id}/renew`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ months: renewalMonths }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Subscription Renewed',
          message: `Subscription for ${selectedSubscription.gymName} extended by ${renewalMonths} month(s). New renewal date: ${data.renewalDate}`,
        });
        setIsRenewModalOpen(false);
        setSelectedSubscription(null);
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Process Platform Refund
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingTx) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/transactions/refund`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          transactionId: refundingTx.transactionId,
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Refund Processed',
          message: `Transaction ${refundingTx.transactionId} marked as refunded. Reason: ${refundReason}`,
        });
        setIsRefundModalOpen(false);
        setRefundingTx(null);
        setRefundReason('');
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Reply to Support Ticket
  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: replyMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: 'success', title: 'Reply Sent', message: 'Message posted to ticket conversation thread.' });
        setSelectedTicket(data.ticket);
        setReplyMessage('');
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Update Ticket Status & Resolution
  const handleUpdateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/support/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status,
          resolutionNotes: ticketResolutionNotes || selectedTicket.resolution_notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Ticket Updated',
          message: `Ticket status set to ${status.replace('_', ' ').toUpperCase()}`,
        });
        setSelectedTicket(data.ticket);
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: announcementTitle,
          message: announcementMessage,
          target_audience: announcementAudience,
          priority: announcementPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Announcement Published',
          message: `Broadcast sent to ${announcementAudience.toUpperCase()} recipients.`,
        });
        setIsNewAnnouncementModalOpen(false);
        setAnnouncementTitle('');
        setAnnouncementMessage('');
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: 'info', title: 'Announcement Archived', message: 'Broadcast deactivated.' });
        fetchAllData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // CSV Export for Transactions
  const exportTransactionsCSV = () => {
    if (!transactions.length) return;
    const headers = ['Transaction ID', 'Gym Name', 'Amount', 'Currency', 'Status', 'Method', 'Date', 'Notes'];
    const rows = transactions.map((t) => [
      t.transactionId,
      `"${t.gymName.replace(/"/g, '""')}"`,
      t.amount,
      t.currency,
      t.paymentStatus,
      t.paymentMethod,
      t.paymentDate,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gymflow_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: 'success', title: 'Export Generated', message: 'CSV transaction ledger downloaded.' });
  };

  // Chart Palette
  const CHART_COLORS = ['#B6FF45', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B', '#10B981'];

  // Filtered Gyms
  const filteredGyms = gyms.filter((g) => {
    const matchesSearch =
      g.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.gymStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.associatedGymName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.ticket_status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.gym_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.creator_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Platform Branding Ribbon */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#090B0A] via-[#151A17] to-[#090B0A] border border-[#A855F7]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-purple-950/20">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Super Admin Control Panel</h1>
            <Badge variant="enterprise">PLATFORM LEVEL RBAC: SUPER_ADMIN</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Unified SaaS Operations, Tenant Governance & Security Isolation. All multi-tenant queries isolated via PostgreSQL RLS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchAllData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-[#151A17] hover:bg-zinc-800 text-zinc-300 border border-[#1C2420] text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Refresh platform telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#B6FF45]' : ''}`} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={() => setIsNewAnnouncementModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#D8B4FE] border border-[#A855F7]/40 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Broadcast</span>
          </button>

          <button
            onClick={() => setIsNewGymModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#B6FF45]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Gym</span>
          </button>
        </div>
      </div>

      {/* Internal Subtab Bar (Quick switcher matching Sidebar navigation) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#1C2420] scrollbar-none text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
          { id: 'all-gyms', label: `All Gyms (${gyms.length})`, icon: Building2 },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'saas-plans', label: `SaaS Plans (${plans.length})`, icon: Tag },
          { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})`, icon: ShieldCheck },
          { id: 'platform-revenue', label: 'Revenue & MRR', icon: DollarSign },
          { id: 'transactions', label: `Transactions (${transactions.length})`, icon: CreditCard },
          { id: 'support-tickets', label: `Helpdesk (${tickets.filter((t) => t.ticket_status !== 'resolved' && t.ticket_status !== 'closed').length})`, icon: Headphones },
          { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
          { id: 'system-health', label: 'System Health', icon: Activity },
          { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#A855F7]/20 text-[#D8B4FE] border border-[#A855F7]/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW TAB: 11 PLATFORM KPIS & 5 RECHARTS */}
      {/* ========================================================================= */}
      {currentTab === 'overview' && stats && (() => {
        const kpis = stats.kpis || stats.metrics;
        return (
        <div className="space-y-6">
          {/* 11 Platform KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              title="Registered Gyms"
              value={(kpis as any).totalRegisteredGyms || (kpis as any).totalGyms || 0}
              change={`${kpis.activeGyms} Active · ${kpis.suspendedGyms} Suspended`}
              isPositive={kpis.suspendedGyms === 0}
              icon={Building2}
              accentColor="purple"
            />
            <MetricCard
              title="Active Gyms"
              value={kpis.activeGyms}
              change="Operational"
              isPositive={true}
              icon={Play}
              accentColor="emerald"
            />
            <MetricCard
              title="Suspended Gyms"
              value={kpis.suspendedGyms}
              change="Data Preserved"
              isPositive={kpis.suspendedGyms === 0}
              icon={Ban}
              accentColor={kpis.suspendedGyms > 0 ? 'rose' : 'emerald'}
            />
            <MetricCard
              title="Platform Users"
              value={kpis.totalRegisteredUsers}
              change="Owners, Coaches, Members"
              isPositive={true}
              icon={Users}
              accentColor="cyan"
            />
            <MetricCard
              title="Total Gym Members"
              value={kpis.totalGymMembersAcrossPlatform}
              change="Active Athletes"
              isPositive={true}
              icon={CheckCircle2}
              accentColor="emerald"
            />
            <MetricCard
              title="Trial Accounts"
              value={kpis.trialAccounts}
              change="14-Day Trials"
              isPositive={true}
              icon={Clock}
              accentColor="amber"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard
              title="Active SaaS Subs"
              value={kpis.activeSubscriptions}
              change="Paid Active"
              isPositive={true}
              icon={ShieldCheck}
              accentColor="emerald"
            />
            <MetricCard
              title="Expired Subs"
              value={kpis.expiredSubscriptions}
              change="Renewal Pending"
              isPositive={kpis.expiredSubscriptions === 0}
              icon={AlertCircle}
              accentColor="rose"
            />
            <MetricCard
              title="MRR (Run-Rate)"
              value={`₹${(kpis.monthlyRecurringRevenue).toLocaleString('en-IN')}`}
              change="Monthly Recurring"
              isPositive={true}
              icon={TrendingUp}
              accentColor="emerald"
            />
            <MetricCard
              title="ARR (Annual Run-Rate)"
              value={`₹${(kpis.annualRecurringRevenue / 100000).toFixed(2)} L`}
              change="12x Annualized"
              isPositive={true}
              icon={BarChart3}
              accentColor="purple"
            />
            <MetricCard
              title="Total Platform GMV"
              value={`₹${(kpis.totalPlatformRevenue / 100000).toFixed(2)} L`}
              change="Collected Platform Sum"
              isPositive={true}
              icon={DollarSign}
              accentColor="emerald"
            />
          </div>

          {/* 5 Recharts Telemetry Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Gym Registration Growth */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#A855F7]" />
                    Gym Registration Growth
                  </h3>
                  <p className="text-[11px] text-zinc-400">Cumulative tenant gym onboarding trajectory</p>
                </div>
                <Badge variant="pro">MONTHLY SIGNUPS</Badge>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.charts.gymRegistrationGrowth}>
                    <defs>
                      <linearGradient id="gymGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232B26" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090B0A', borderColor: '#232B26', borderRadius: '12px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="gyms" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#gymGrowthGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Monthly Platform Revenue (Collected vs Projected) */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#B6FF45]" />
                    Monthly Platform Revenue
                  </h3>
                  <p className="text-[11px] text-zinc-400">Collected transaction sum vs Projected SaaS MRR</p>
                </div>
                <Badge variant="active">RECURRING + COLLECTED</Badge>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts.monthlyPlatformRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232B26" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090B0A', borderColor: '#232B26', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="collected" fill="#B6FF45" name="Collected Revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projected" fill="#3B82F6" name="Projected MRR" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart 3: Subscription Distribution */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#B6FF45]" />
                Subscription Tier Share
              </h3>
              <p className="text-[11px] text-zinc-400">Gym count by active plan tier</p>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.charts.subscriptionDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {stats.charts.subscriptionDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090B0A', borderColor: '#232B26', borderRadius: '12px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                {stats.charts.subscriptionDistribution.map((item, idx) => (
                  <div key={item.planCode} className="flex items-center justify-between text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.count} gyms ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Active vs Suspended Gyms */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Active vs Suspended Tenants
              </h3>
              <p className="text-[11px] text-zinc-400">Tenant operational status enforcement</p>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.charts.activeVsSuspendedGyms}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {stats.charts.activeVsSuspendedGyms.map((entry, index) => (
                        <Cell key={`status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090B0A', borderColor: '#232B26', borderRadius: '12px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                {stats.charts.activeVsSuspendedGyms.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-bold text-white">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 5: Monthly Subscription Growth */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Subscription Growth & Churn
              </h3>
              <p className="text-[11px] text-zinc-400">Active renewals vs churned tenants</p>

              <div className="h-52 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.charts.monthlySubscriptionGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232B26" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090B0A', borderColor: '#232B26', borderRadius: '12px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={2} name="Active" dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="churned" stroke="#EF4444" strokeWidth={2} name="Churned" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Curve</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Zero Churn Trajectory</span>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2. ALL GYMS TAB: TENANT MANAGEMENT DIRECTORY */}
      {/* ========================================================================= */}
      {currentTab === 'all-gyms' && (
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2420]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#A855F7]" />
                Tenant Gyms Directory & Governance Controls
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage gym access, activate/suspend gyms, view member quotas, and enforce PostgreSQL RLS policies
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
                <option value="trialing">Trialing</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search gym, owner, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Gym Tenant</th>
                  <th className="py-3 px-3">Gym Owner</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Registration Date</th>
                  <th className="py-3 px-3">Subscription</th>
                  <th className="py-3 px-3">Capacity Limits</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420]">
                {filteredGyms.map((gym) => {
                  const isSuspended = gym.gymStatus === 'suspended';
                  return (
                    <tr key={gym.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          {gym.gymName}
                          {isSuspended && <span className="w-2 h-2 rounded-full bg-red-400" title="Suspended" />}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">id: {gym.id.slice(0, 13)}...</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-200">{gym.ownerName}</div>
                        <div className="text-[10px] text-zinc-400">{gym.email}</div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300">
                        {gym.city}, {gym.country}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        {new Date(gym.registrationDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={gym.planCode as any} size="sm">
                          {gym.subscriptionPlan}
                        </Badge>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Renews: {gym.renewalDate ? new Date(gym.renewalDate).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-bold text-[#B6FF45]">{gym.memberCount}</span>
                          <span className="text-zinc-500">/ {gym.memberLimit} athletes</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">{gym.trainerCount} coaches</div>
                      </td>
                      <td className="py-3 px-3">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <Ban className="w-3 h-3" />
                            SUSPENDED
                          </span>
                        ) : gym.gymStatus === 'trialing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            TRIALING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedGym(gym);
                              setIsGymDetailModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-[#090B0A] hover:bg-zinc-800 text-zinc-300 border border-[#1C2420] text-[11px] font-medium"
                            title="View Gym Details & Quota Limits"
                          >
                            Details
                          </button>

                          {/* Impersonate */}
                          <button
                            onClick={() => handleImpersonate(gym.id)}
                            className="px-2 py-1 rounded-lg bg-[#A855F7]/10 hover:bg-[#A855F7]/20 text-[#D8B4FE] border border-[#A855F7]/30 text-[11px] font-semibold inline-flex items-center gap-1"
                            title="Open Tenant Dashboard as Owner"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Activate / Suspend Toggle */}
                          {isSuspended ? (
                            <button
                              onClick={() => handleUpdateGymStatus(gym.id, 'active', 'Reactivated by Super Admin')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Reactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setGymToSuspend(gym);
                                setIsSuspendModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-600/40 text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Suspend</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PLATFORM USERS TAB: USER DIRECTORY & ACCESS GOVERNANCE */}
      {/* ========================================================================= */}
      {currentTab === 'users' && (
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2420]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#A855F7]" />
                Platform User Directory & Role-Based Access Control
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Platform-wide directory across all tenants with administrative account locking (protecting user role & gym assignment)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins</option>
                <option value="gym_owner">Gym Owners</option>
                <option value="trainer">Trainers</option>
                <option value="member">Members</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">User Profile</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Associated Gym Tenant</th>
                  <th className="py-3 px-3">Registration Date</th>
                  <th className="py-3 px-3">Last Login</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-3 text-right">Access Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420]">
                {filteredUsers.map((user) => {
                  const isSuspended = user.accountStatus === 'suspended';
                  const isSuperAdmin = user.role === 'super_admin';
                  return (
                    <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm">{user.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{user.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            user.role === 'super_admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : user.role === 'gym_owner'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : user.role === 'trainer'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-200">{user.associatedGymName}</div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        {new Date(user.registrationDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        {new Date(user.lastLogin).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <Lock className="w-3 h-3" />
                            LOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Unlock className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.accountStatus)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                              isSuspended
                                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-600/40'
                                : 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-600/40'
                            }`}
                          >
                            {isSuspended ? 'Unlock User' : 'Suspend Access'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SAAS PLANS TAB: TIER CATALOG & PRICING CONTROLS */}
      {/* ========================================================================= */}
      {currentTab === 'saas-plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#A855F7]" />
                SaaS Subscription Plans & Pricing Catalog
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure membership tiers, pricing, athlete and coach capacity quotas, and feature toggles
              </p>
            </div>

            <button
              onClick={() => setIsNewPlanModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Tier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const activeCount = subscriptions.filter(
                (s) => s.planCode === p.plan_code && s.status === 'active'
              ).length;
              return (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between hover:border-[#A855F7]/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={p.plan_code as any} size="sm">
                        {p.name || p.plan_name}
                      </Badge>
                      <span className="text-[10px] font-mono text-zinc-400 bg-[#090B0A] px-2 py-0.5 rounded border border-[#1C2420]">
                        {activeCount} Subscribed
                      </span>
                    </div>

                    <div className="text-2xl font-black text-white">
                      {p.price_monthly === 0 ? 'Free' : `₹${p.price_monthly.toLocaleString('en-IN')}`}
                      <span className="text-xs text-zinc-500 font-normal"> / month</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Annual: {p.price_annual === 0 ? 'Free' : `₹${p.price_annual.toLocaleString('en-IN')} / yr`}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1C2420] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Athlete Limit:</span>
                        <span className="font-bold text-white">{p.max_members || p.member_limit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Coach Limit:</span>
                        <span className="font-bold text-white">{p.max_trainers || p.trainer_limit}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-[11px] text-zinc-300">
                      {p.features?.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#B6FF45] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#1C2420] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">code: {p.plan_code}</span>
                    <button
                      onClick={() => {
                        setEditingPlan(p);
                        setIsEditPlanModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#090B0A] hover:bg-zinc-800 text-zinc-300 border border-[#1C2420] text-[11px] font-bold transition-all"
                    >
                      Edit Tier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUBSCRIPTIONS TAB: TENANT RENEWALS & EXPIRY MANAGEMENT */}
      {/* ========================================================================= */}
      {currentTab === 'subscriptions' && (
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2420]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A855F7]" />
                Tenant SaaS Subscriptions & Renewals
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Monitor recurring subscription cycles, automated renewal schedules, and handle manual renewal overrides
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">
                Total Subscriptions: <span className="font-bold text-white">{subscriptions.length}</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Gym Tenant</th>
                  <th className="py-3 px-3">Owner Contact</th>
                  <th className="py-3 px-3">Subscription Tier</th>
                  <th className="py-3 px-3">Cycle</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">Renewal Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420]">
                {subscriptions.map((sub) => {
                  const isExpired = sub.status === 'expired' || sub.status === 'cancelled';
                  return (
                    <tr key={sub.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{sub.gymName}</td>
                      <td className="py-3 px-3">
                        <div className="text-zinc-200">{sub.ownerName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{sub.ownerEmail}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={sub.planCode as any} size="sm">
                          {sub.planName}
                        </Badge>
                        <div className="text-[10px] text-zinc-400 mt-0.5">₹{sub.priceMonthly}/mo</div>
                      </td>
                      <td className="py-3 px-3 uppercase text-zinc-400 font-semibold text-[11px]">{sub.billingCycle}</td>
                      <td className="py-3 px-3 text-zinc-400">
                        {new Date(sub.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">
                          {new Date(sub.renewalDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertCircle className="w-3 h-3" />
                            {sub.status.toUpperCase()}
                          </span>
                        ) : sub.status === 'trialing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            TRIALING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setIsRenewModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#D8B4FE] border border-[#A855F7]/40 text-[11px] font-bold transition-all"
                        >
                          Extend / Renew
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PLATFORM REVENUE & 7. TRANSACTIONS TAB */}
      {/* ========================================================================= */}
      {(currentTab === 'platform-revenue' || currentTab === 'transactions') && (() => {
        const revKpis = stats?.kpis || stats?.metrics;
        return (
        <div className="space-y-6">
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Collected Platform Revenue"
              value={`₹${(revKpis?.totalPlatformRevenue || 0).toLocaleString('en-IN')}`}
              change="Verified completed transactions"
              isPositive={true}
              icon={DollarSign}
              accentColor="emerald"
            />
            <MetricCard
              title="Monthly Recurring (MRR)"
              value={`₹${(revKpis?.monthlyRecurringRevenue || 0).toLocaleString('en-IN')}`}
              change="Active subscriptions run-rate"
              isPositive={true}
              icon={TrendingUp}
              accentColor="purple"
            />
            <MetricCard
              title="Annual Recurring (ARR)"
              value={`₹${((revKpis?.annualRecurringRevenue || 0) / 100000).toFixed(2)} L`}
              change="Annualized 12-month run-rate"
              isPositive={true}
              icon={BarChart3}
              accentColor="cyan"
            />
            <MetricCard
              title="Refunded Volume"
              value={`₹${(revKpis?.refundedRevenue || 0).toLocaleString('en-IN')}`}
              change="Disputed / refunded amount"
              isPositive={(revKpis?.refundedRevenue || 0) === 0}
              icon={AlertTriangle}
              accentColor="rose"
            />
          </div>

          {/* Transactions Ledger */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2420]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#A855F7]" />
                  Platform Transaction Ledger
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete audit log of all SaaS subscription and gateway payments across tenants
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportTransactionsCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-[#090B0A] hover:bg-zinc-800 text-zinc-300 border border-[#1C2420] text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-[#B6FF45]" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Transaction ID</th>
                    <th className="py-3 px-3">Gym Tenant</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Notes</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2420]">
                  {transactions.map((tx) => {
                    const isRefunded = tx.paymentStatus === 'refunded';
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-zinc-300">{tx.transactionId}</td>
                        <td className="py-3 px-3 font-bold text-white">{tx.gymName}</td>
                        <td className="py-3 px-3 font-extrabold text-white">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] text-zinc-400 font-mono font-bold">
                          {tx.paymentMethod}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          {new Date(tx.paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          {isRefunded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              REFUNDED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              COMPLETED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 max-w-[200px] truncate">{tx.notes || 'N/A'}</td>
                        <td className="py-3 px-3 text-right">
                          {!isRefunded && (
                            <button
                              onClick={() => {
                                setRefundingTx(tx);
                                setIsRefundModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-600/40 text-[11px] font-bold"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 8. SUPPORT TICKETS TAB: CUSTOMER HELPDESK & RESOLUTION */}
      {/* ========================================================================= */}
      {currentTab === 'support-tickets' && (
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2420]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#A855F7]" />
                Tenant Support & Incident Management Helpdesk
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Respond to gym owner inquiries, manage priority incident queues, and record resolution notes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_response">Waiting for Response</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2420] text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Ticket #</th>
                  <th className="py-3 px-3">Gym Tenant</th>
                  <th className="py-3 px-3">Creator</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420]">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#A855F7]">{ticket.ticket_number}</td>
                    <td className="py-3 px-3 font-bold text-white">{ticket.gym_name}</td>
                    <td className="py-3 px-3 text-zinc-300">{ticket.creator_name}</td>
                    <td className="py-3 px-3 text-white font-medium max-w-[240px] truncate">{ticket.subject}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ticket.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                            : ticket.priority === 'high'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                            : ticket.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ticket.ticket_status === 'resolved' || ticket.ticket_status === 'closed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticket.ticket_status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {ticket.ticket_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketResolutionNotes(ticket.resolution_notes || '');
                          setIsTicketDetailModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#D8B4FE] border border-[#A855F7]/40 text-[11px] font-bold transition-all"
                      >
                        Open Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. ANNOUNCEMENTS TAB: BROADCAST MANAGEMENT */}
      {/* ========================================================================= */}
      {currentTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#A855F7]" />
                Platform Announcements & System Broadcasts
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Publish targeted banner alerts across tenants, gym owners, coaches, or athletes
              </p>
            </div>

            <button
              onClick={() => setIsNewAnnouncementModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ann.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : ann.priority === 'important'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {ann.priority}
                    </span>

                    <span className="text-[10px] text-zinc-500">
                      Audience:{' '}
                      <strong className="text-zinc-300 font-mono uppercase">{ann.target_audience}</strong>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2">{ann.title}</h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{ann.message}</p>
                </div>

                <div className="pt-3 border-t border-[#1C2420] flex items-center justify-between text-[11px] text-zinc-500">
                  <span>
                    Published by {ann.published_by} •{' '}
                    {new Date(ann.published_at || ann.created_at).toLocaleDateString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SYSTEM HEALTH TAB: INFRASTRUCTURE & ZERO-EXPOSURE MONITORING */}
      {/* ========================================================================= */}
      {currentTab === 'system-health' && systemHealth && (
        <div className="space-y-6">
          {/* Security & Health Banner */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">All Platform Core Services Fully Operational</h3>
                <Badge variant="active">100% HEALTHY</Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{systemHealth.securityNotice}</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-zinc-500">Last Telemetry Probe:</span>
              <div className="text-xs font-mono text-zinc-300">
                {new Date(systemHealth.timestamp).toLocaleTimeString('en-IN')}
              </div>
            </div>
          </div>

          {/* 7 Core Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.services.map((srv) => (
              <div
                key={srv.service}
                className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#A855F7]" />
                    {srv.service}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    {srv.status}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#1C2420] text-xs">
                  {Object.entries(srv)
                    .filter(([key]) => key !== 'service' && key !== 'status')
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-semibold text-zinc-200 font-mono text-[11px]">{String(val)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. AUDIT LOGS TAB: IMMUTABLE AUDIT TRAIL */}
      {/* ========================================================================= */}
      {currentTab === 'audit-logs' && (
        <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
          <div className="pb-3 border-b border-[#1C2420]">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#A855F7]" />
              Immutable Platform Security & Governance Audit Trail
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict audit logs capturing administrative status updates, plan modifications, renewals, and refunds
            </p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#A855F7] bg-[#A855F7]/10 px-2 py-0.5 rounded border border-[#A855F7]/20">
                      {log.action}
                    </span>
                    <span className="font-bold text-white">{log.gym}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] mt-1">{log.details}</p>
                </div>

                <div className="flex items-center gap-3 text-zinc-500 text-[11px] shrink-0">
                  <span className="text-zinc-400 font-medium">{log.user}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROVISION NEW GYM TENANT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewGymModalOpen}
        onClose={() => setIsNewGymModalOpen(false)}
        title="Provision New Gym Tenant"
        subtitle="Deploys isolated multi-tenant schema with automated webhooks and tenant credentials"
        maxWidth="md"
      >
        <form onSubmit={handleCreateGym} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Gym Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex High Performance Arena"
              value={newGymName}
              onChange={(e) => setNewGymName(e.target.value)}
              className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Hyderabad"
                value={newGymCity}
                onChange={(e) => setNewGymCity(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">State</label>
              <input
                type="text"
                required
                placeholder="e.g. Telangana"
                value={newGymState}
                onChange={(e) => setNewGymState(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Gym Owner Email</label>
            <input
              type="email"
              required
              placeholder="owner@apexarena.com"
              value={newGymOwnerEmail}
              onChange={(e) => setNewGymOwnerEmail(e.target.value)}
              className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Initial SaaS Subscription Tier</label>
            <select
              value={newGymPlan}
              onChange={(e) => setNewGymPlan(e.target.value as any)}
              className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
            >
              <option value="trial">14-Day Pro Trial (₹0 - 50 athletes)</option>
              <option value="starter">Starter Tier (₹2,499/mo - 100 athletes)</option>
              <option value="pro">Professional Tier (₹5,999/mo - 500 athletes + AI)</option>
              <option value="enterprise">Enterprise Tier (₹14,999/mo - 2500 athletes)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-500/20"
          >
            Deploy Tenant Schema & Issue Keys
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW GYM DETAILS */}
      {/* ========================================================================= */}
      {selectedGym && (
        <Modal
          isOpen={isGymDetailModalOpen}
          onClose={() => setIsGymDetailModalOpen(false)}
          title={selectedGym.gymName}
          subtitle={`Tenant ID: ${selectedGym.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
              <div>
                <span className="text-zinc-500 block">Owner</span>
                <span className="font-bold text-white">{selectedGym.ownerName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Email</span>
                <span className="font-semibold text-zinc-300 truncate block">{selectedGym.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Phone</span>
                <span className="font-semibold text-zinc-300">{selectedGym.phone}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Location</span>
                <span className="font-semibold text-zinc-300">{selectedGym.city}, {selectedGym.country}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
              <div>
                <span className="text-zinc-500 block">Subscription</span>
                <Badge variant={selectedGym.planCode as any} size="sm">{selectedGym.subscriptionPlan}</Badge>
              </div>
              <div>
                <span className="text-zinc-500 block">Status</span>
                <span className="font-bold text-emerald-400 capitalize">{selectedGym.gymStatus}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Athletes</span>
                <span className="font-bold text-[#B6FF45]">{selectedGym.memberCount} / {selectedGym.memberLimit}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Coaches</span>
                <span className="font-bold text-cyan-400">{selectedGym.trainerCount} / {selectedGym.trainerLimit}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
              <span className="text-zinc-500 block mb-1">Total Lifetime Check-ins</span>
              <span className="text-lg font-black text-white">{selectedGym.totalCheckins.toLocaleString('en-IN')} check-ins</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGymDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SUSPEND GYM WITH DATA PRESERVATION NOTICE */}
      {/* ========================================================================= */}
      {gymToSuspend && (
        <Modal
          isOpen={isSuspendModalOpen}
          onClose={() => setIsSuspendModalOpen(false)}
          title="Suspend Gym Tenant"
          subtitle="Non-destructive operational lock"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Data Preservation Policy
              </div>
              <p className="text-[11px] leading-relaxed">
                Suspending <strong>{gymToSuspend.gymName}</strong> will temporarily hold tenant access.
                <strong> All member profiles, workout plans, attendance logs, and financial records remain permanently preserved in Supabase.</strong>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Reason for Suspension</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Subscription payment overdue by 14 days"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateGymStatus(gymToSuspend.id, 'suspended', suspensionReason);
                  setIsSuspendModalOpen(false);
                  setGymToSuspend(null);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE SAAS PLAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewPlanModalOpen}
        onClose={() => setIsNewPlanModalOpen(false)}
        title="Create New SaaS Subscription Plan"
        subtitle="Publish a new pricing tier to the platform catalog"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Plan Code</label>
              <input
                type="text"
                required
                placeholder="e.g. enterprise-plus"
                value={newPlanCode}
                onChange={(e) => setNewPlanCode(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Plus"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Monthly Price (₹)</label>
              <input
                type="number"
                required
                value={newPlanMonthlyPrice}
                onChange={(e) => setNewPlanMonthlyPrice(Number(e.target.value))}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Annual Price (₹)</label>
              <input
                type="number"
                required
                value={newPlanAnnualPrice}
                onChange={(e) => setNewPlanAnnualPrice(Number(e.target.value))}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Athlete Limit</label>
              <input
                type="number"
                required
                value={newPlanMemberLimit}
                onChange={(e) => setNewPlanMemberLimit(Number(e.target.value))}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Coach Limit</label>
              <input
                type="number"
                required
                value={newPlanTrainerLimit}
                onChange={(e) => setNewPlanTrainerLimit(Number(e.target.value))}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Features (comma separated)</label>
            <textarea
              rows={2}
              value={newPlanFeatures}
              onChange={(e) => setNewPlanFeatures(e.target.value)}
              className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold uppercase tracking-wider text-xs"
          >
            Publish Plan
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT SAAS PLAN */}
      {/* ========================================================================= */}
      {editingPlan && (
        <Modal
          isOpen={isEditPlanModalOpen}
          onClose={() => setIsEditPlanModalOpen(false)}
          title={`Edit Tier: ${editingPlan.name || editingPlan.plan_name}`}
          subtitle="Modify pricing and athlete/coach capacity quotas"
          maxWidth="md"
        >
          <form onSubmit={handleUpdatePlan} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Monthly Price (₹)</label>
                <input
                  type="number"
                  value={editingPlan.price_monthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: Number(e.target.value) })}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Annual Price (₹)</label>
                <input
                  type="number"
                  value={editingPlan.price_annual}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price_annual: Number(e.target.value) })}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Athlete Limit</label>
                <input
                  type="number"
                  value={editingPlan.max_members}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_members: Number(e.target.value) })}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Coach Limit</label>
                <input
                  type="number"
                  value={editingPlan.max_trainers}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_trainers: Number(e.target.value) })}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold uppercase tracking-wider text-xs"
            >
              Save Tier Changes
            </button>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EXTEND / RENEW SUBSCRIPTION */}
      {/* ========================================================================= */}
      {selectedSubscription && (
        <Modal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          title={`Renew Subscription: ${selectedSubscription.gymName}`}
          subtitle={`Current Plan: ${selectedSubscription.planName}`}
          maxWidth="sm"
        >
          <form onSubmit={handleRenewSubscription} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Renewal Extension Duration</label>
              <select
                value={renewalMonths}
                onChange={(e) => setRenewalMonths(Number(e.target.value))}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
              >
                <option value={1}>1 Month Extension</option>
                <option value={3}>3 Months Extension</option>
                <option value={6}>6 Months Extension</option>
                <option value={12}>1 Year Extension</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-zinc-400">
              <div className="flex justify-between">
                <span>Monthly Rate:</span>
                <span className="font-bold text-white">₹{selectedSubscription.priceMonthly}</span>
              </div>
              <div className="flex justify-between mt-1 text-emerald-400 font-bold">
                <span>Total Extension Fee:</span>
                <span>₹{(selectedSubscription.priceMonthly * renewalMonths).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#B6FF45] text-[#090B0A] font-extrabold uppercase tracking-wider text-xs"
            >
              Confirm Subscription Extension
            </button>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: SUPPORT TICKET CONVERSATION & RESOLUTION */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <Modal
          isOpen={isTicketDetailModalOpen}
          onClose={() => setIsTicketDetailModalOpen(false)}
          title={`Ticket ${selectedTicket.ticket_number}: ${selectedTicket.subject}`}
          subtitle={`From ${selectedTicket.gym_name} (${selectedTicket.creator_name})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Status Ribbon */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Status:</span>
                <span className="font-bold text-white uppercase">{selectedTicket.ticket_status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateTicketStatus('in_progress')}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-600/40 font-semibold"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTicketStatus('waiting_for_response')}
                  className="px-2.5 py-1 rounded-lg bg-yellow-950/60 text-yellow-300 border border-yellow-600/40 font-semibold"
                >
                  Wait Reply
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTicketStatus('resolved')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 font-bold"
                >
                  Resolve
                </button>
              </div>
            </div>

            {/* Initial Description */}
            <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
              <span className="text-zinc-500 block mb-1 font-semibold">Incident Details:</span>
              <p className="text-zinc-200 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedTicket.conversation?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border ${
                    msg.sender_role === 'super_admin'
                      ? 'bg-[#A855F7]/10 border-[#A855F7]/30 ml-6'
                      : 'bg-[#090B0A] border-[#1C2420] mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                    <span className="font-bold text-white">
                      {msg.sender_name} ({msg.sender_role.toUpperCase()})
                    </span>
                    <span>{new Date(msg.created_at).toLocaleTimeString('en-IN')}</span>
                  </div>
                  <p className="text-zinc-200">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Post Reply */}
            <form onSubmit={handleReplyTicket} className="space-y-2 pt-2 border-t border-[#1C2420]">
              <textarea
                rows={2}
                placeholder="Type response to gym owner..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
              />
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Resolution notes (optional)..."
                  value={ticketResolutionNotes}
                  onChange={(e) => setTicketResolutionNotes(e.target.value)}
                  className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-white placeholder-zinc-500 text-xs w-2/3"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: CREATE ANNOUNCEMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewAnnouncementModalOpen}
        onClose={() => setIsNewAnnouncementModalOpen(false)}
        title="Publish Platform Announcement"
        subtitle="Broadcast announcements to tenant dashboards"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Maintenance Notice"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Message Content</label>
            <textarea
              required
              rows={3}
              placeholder="Detailed broadcast notice..."
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Target Audience</label>
              <select
                value={announcementAudience}
                onChange={(e) => setAnnouncementAudience(e.target.value as any)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
              >
                <option value="all">All Users (Tenants & Members)</option>
                <option value="gym_owners">Gym Owners Only</option>
                <option value="trainers">Coaches / Trainers Only</option>
                <option value="members">Athletes Only</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Priority</label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-white"
              >
                <option value="normal">Normal (Informational)</option>
                <option value="important">Important (Action Needed)</option>
                <option value="critical">Critical (System Alert)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold uppercase tracking-wider text-xs"
          >
            Publish Broadcast
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 9: PROCESS REFUND */}
      {/* ========================================================================= */}
      {refundingTx && (
        <Modal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          title="Process Subscription Refund"
          subtitle={`Transaction: ${refundingTx.transactionId}`}
          maxWidth="sm"
        >
          <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Gym:</span>
                <span className="font-bold text-white">{refundingTx.gymName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-zinc-500">Amount:</span>
                <span className="font-extrabold text-rose-400">₹{refundingTx.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Refund Reason</label>
              <textarea
                required
                rows={2}
                placeholder="Reason for approving refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs"
            >
              Confirm Refund
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Layout Dashboard Helper Icon
const LayoutDashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);
