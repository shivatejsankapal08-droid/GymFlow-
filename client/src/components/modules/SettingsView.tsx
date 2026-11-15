import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Settings,
  Building2,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Save,
  CheckCircle2,
  Key,
  Database,
  Lock,
  Headphones,
  Send,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentGym, updateGymSettings, addToast, currentUser } = useApp();

  const [gymName, setGymName] = useState(currentGym.name);
  const [tagline, setTagline] = useState(currentGym.tagline);
  const [phone, setPhone] = useState(currentGym.phone);
  const [email, setEmail] = useState(currentGym.email);
  const [address, setAddress] = useState(currentGym.address);
  const [city, setCity] = useState(currentGym.city);
  const [state, setState] = useState((currentGym as any).state || 'Maharashtra');
  const [country, setCountry] = useState(currentGym.country || 'India');
  const [logoUrl, setLogoUrl] = useState(currentGym.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('rzp_test_YourTestKeyId');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('109823487192837');

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  const BASE_URL = 'http://localhost:5000';

  const fetchMyTickets = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/support/tickets?gymId=${currentGym.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gymflow_token') || 'demo-token'}`,
          'X-Gym-Id': currentGym.id,
          'X-Demo-Role': currentUser?.role || 'gym_owner',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tickets) {
          setMyTickets(data.tickets.filter((t: any) => t.gym_id === currentGym.id));
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setGymName(currentGym.name);
    setTagline(currentGym.tagline);
    setPhone(currentGym.phone);
    setEmail(currentGym.email);
    setAddress(currentGym.address);
    setCity(currentGym.city);
    setState((currentGym as any).state || 'Maharashtra');
    setCountry(currentGym.country || 'India');
    setLogoUrl(currentGym.logoUrl || '');
    fetchMyTickets();
  }, [currentGym]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateGymSettings(currentGym.id, {
      name: gymName,
      tagline,
      phone,
      email,
      address,
      city,
      country,
      logoUrl,
      ...({ state } as any),
    });
    setIsSaving(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;
    setIsSubmittingTicket(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gymflow_token') || 'demo-token'}`,
          'X-Gym-Id': currentGym.id,
          'X-Demo-Role': currentUser?.role || 'gym_owner',
        },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
          priority: ticketPriority,
          gymId: currentGym.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Support Ticket Submitted',
          message: `Ticket #${data.ticket.ticket_number} created and assigned to GymFlow Support engineers.`,
        });
        setTicketSubject('');
        setTicketDescription('');
        fetchMyTickets();
      } else {
        addToast({ type: 'error', title: 'Submission Failed', message: data.error });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#B6FF45]" />
              Gym Settings & Integrations
            </h1>
            <Badge variant="pro">MULTI-TENANT</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure tenant credentials, Razorpay webhooks and Meta WhatsApp Cloud API credentials
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* Gym Profile Form */}
        <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-[#1C2420]">
            <Building2 className="w-4 h-4 text-[#B6FF45]" />
            Gym Identity & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Gym Name</label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Official WhatsApp Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Billing Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-zinc-300 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">State / Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Brand Logo URL (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>
        </div>

        {/* Razorpay Gateway Keys */}
        <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#B6FF45]" />
              Razorpay Payment Gateway Integration
            </h3>
            <span className="text-[11px] font-bold text-[#B6FF45] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B6FF45] animate-ping" />
              Verified Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Razorpay Secret Key</label>
              <input
                type="password"
                value="••••••••••••••••••••••••"
                readOnly
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-zinc-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API & n8n Automation */}
        <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2420] mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#B6FF45]" />
              Meta WhatsApp Cloud API & n8n Webhook
            </h3>
            <Badge variant="active" size="sm">
              n8n CONNECTED
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">WhatsApp Phone Number ID</label>
              <input
                type="text"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">n8n Inbound Webhook Endpoint</label>
              <input
                type="text"
                value="http://localhost:5678/webhook/gymflow-alerts"
                readOnly
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-zinc-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Supabase PostgreSQL RLS Status */}
        <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#B6FF45]" />
            PostgreSQL Database & Row Level Security (RLS)
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            GymFlow AI automatically binds all member, payment and attendance queries to{' '}
            <code className="text-[#B6FF45] font-mono">gym_id = '{currentGym.id}'</code>. Strict RLS ensures total tenant isolation.
          </p>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420]">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tenant ID</span>
              <span className="font-mono text-white text-[11px] truncate block mt-0.5">
                {currentGym.id}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420]">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Plan Limit</span>
              <span className="font-bold text-[#B6FF45] block mt-0.5">
                {currentGym.memberLimit} Athletes
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420]">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">RLS Isolation</span>
              <span className="font-bold text-emerald-400 block mt-0.5">Enforced (Active)</span>
            </div>
          </div>
        </div>

        {/* Tenant Helpdesk & Support Desk */}
        <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2420]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#B6FF45]" />
                GymFlow Platform Helpdesk & Support
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Submit an urgent issue, technical ticket, or feature request directly to Super Admin engineers
              </p>
            </div>
            <Badge variant="pro" size="sm">
              SLA: &lt; 2 HOURS
            </Badge>
          </div>

          {/* Ticket Submission Form */}
          <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-300 mb-1">Issue Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding Razorpay webhook delivery"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as any)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="low">Low (General Query)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="high">High (Feature Impact)</option>
                  <option value="urgent">Urgent (Service Interruption)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Detailed Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe the issue, steps to reproduce, or assistance needed..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingTicket}
                className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#B6FF45]/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingTicket ? 'Submitting...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </form>

          {/* Past Submitted Tickets */}
          {myTickets.length > 0 && (
            <div className="pt-4 border-t border-[#1C2420] space-y-2">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Your Submitted Support Tickets</h4>
              <div className="space-y-2">
                {myTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#B6FF45] bg-[#B6FF45]/10 px-2 py-0.5 rounded">
                          {t.ticket_number}
                        </span>
                        <span className="font-bold text-white">{t.subject}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 max-w-md truncate">{t.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.ticket_status === 'resolved' || t.ticket_status === 'closed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {t.ticket_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
