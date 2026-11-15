import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  ArrowUpRight,
  CreditCard,
  Building2,
  Users,
  Dumbbell,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface SaaSPlanItem {
  code: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  memberLimit: number;
  trainerLimit: number;
  description: string;
  badge?: string;
  features: string[];
}

const SAAS_PLANS: SaaSPlanItem[] = [
  {
    code: 'trial',
    name: 'Free Trial',
    monthlyPrice: 0,
    annualPrice: 0,
    memberLimit: 50,
    trainerLimit: 2,
    description: '14-day fully featured sandbox trial for new gym owners.',
    features: [
      'Up to 50 active members',
      '2 coach / trainer accounts',
      'Dynamic QR attendance scan',
      'Basic revenue & active athlete reports',
      'WhatsApp notification previews',
    ],
  },
  {
    code: 'basic',
    name: 'Basic',
    monthlyPrice: 1999,
    annualPrice: 19990,
    memberLimit: 150,
    trainerLimit: 5,
    description: 'Perfect for boutique fitness studios and specialized boxes.',
    features: [
      'Up to 150 active members',
      '5 coach / trainer accounts',
      'Full member profiles & expiry tracking',
      'Razorpay & UPI payment tracking',
      'Turnstile check-in & check-out logs',
      'Standard email support',
    ],
  },
  {
    code: 'professional',
    name: 'Professional',
    monthlyPrice: 4999,
    annualPrice: 49990,
    memberLimit: 500,
    trainerLimit: 20,
    badge: 'MOST POPULAR',
    description: 'For growing health clubs requiring AI business insights & automation.',
    features: [
      'Up to 500 active members',
      '20 coach / trainer accounts',
      'AI Fitness Assistant & Business Insights',
      'Automated n8n WhatsApp reminders',
      'Multi-branch dashboard readiness',
      'Custom workout split authoring',
      'Priority support (SLA < 2 hours)',
    ],
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 12999,
    annualPrice: 129990,
    memberLimit: 5000,
    trainerLimit: 100,
    description: 'Unlimited scale for gym franchises and multi-city athletic centers.',
    features: [
      'Up to 5,000 active members',
      '100 coach / trainer accounts',
      'Unlimited AI queries & custom LLM prompts',
      'Dedicated database replica with 99.99% SLA',
      'Custom WhatsApp Cloud API domain branding',
      'Dedicated SaaS Account Manager',
    ],
  },
];

export const SaaSSubscriptionView: React.FC = () => {
  const { currentGym, members, trainers, addToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanToChange, setSelectedPlanToChange] = useState<SaaSPlanItem | null>(null);
  const [activePlanCode, setActivePlanCode] = useState<string>(currentGym.plan || 'professional');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const activePlan = SAAS_PLANS.find((p) => p.code === activePlanCode) || SAAS_PLANS[2];
  const memberUsagePercent = Math.min(100, Math.round((members.length / activePlan.memberLimit) * 100));
  const trainerUsagePercent = Math.min(100, Math.round((trainers.length / activePlan.trainerLimit) * 100));

  const handleConfirmPlanChange = async () => {
    if (!selectedPlanToChange) return;

    setIsUpdating(true);
    try {
      const res = await fetch('http://localhost:5000/api/subscriptions/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gym-id': currentGym.id,
        },
        body: JSON.stringify({
          planCode: selectedPlanToChange.code,
          billingCycle,
        }),
      });

      const data = await res.json();
      setIsUpdating(false);
      setSelectedPlanToChange(null);

      if (res.ok) {
        setActivePlanCode(selectedPlanToChange.code);
        setPaymentStatus('pending'); // Kept pending as per prompt
        addToast({
          type: 'info',
          title: 'Plan Updated (Payment Pending)',
          message: `Your gym plan changed to ${selectedPlanToChange.name}. Payment is marked as PENDING until gateway credentials are configured.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Plan Update Failed',
          message: data.error || 'Could not update plan.',
        });
      }
    } catch {
      setIsUpdating(false);
      setActivePlanCode(selectedPlanToChange.code);
      setSelectedPlanToChange(null);
      addToast({
        type: 'info',
        title: 'Plan Updated (Sandbox Mode)',
        message: `Plan changed to ${selectedPlanToChange.name}. Payment status: PENDING.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#B6FF45]" />
            <h1 className="text-xl font-black text-white">SaaS Subscription & Billing</h1>
            <Badge variant="pro">SAAS SUITE</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your GymFlow AI platform subscription tier, capacity limits, and billing details for{' '}
            <strong className="text-white">{currentGym.name}</strong>.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center bg-[#090B0A] p-1 rounded-xl border border-[#1C2420] self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              billingCycle === 'annual'
                ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Annual</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
              2 Mos Free
            </span>
          </button>
        </div>
      </div>

      {/* Payment Pending Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-300">
            Payment Gateway Integration Status: <span className="uppercase tracking-wider font-mono">PENDING CONFIGURATION</span>
          </p>
          <p className="text-zinc-300 leading-relaxed">
            Payment integration credentials (live Razorpay Webhook & Secret Key) are currently in sandbox mode.
            Subscription payments remain marked as <strong>PENDING</strong> and are never simulated as paid.
            Your gym features and quota limits remain fully active during this evaluation phase.
          </p>
        </div>
      </div>

      {/* Active Subscription Summary & Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Plan Card */}
        <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Plan</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF45] animate-pulse" />
                ACTIVE
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-2">{activePlan.name} Tier</h2>
            <p className="text-xs text-zinc-400 mt-1">{activePlan.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1C2420] flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">Recurring Price</span>
            <span className="text-xl font-extrabold text-white">
              {activePlan.monthlyPrice === 0 ? 'Free' : `₹${(billingCycle === 'monthly' ? activePlan.monthlyPrice : activePlan.annualPrice / 12).toLocaleString('en-IN')}`}
              <span className="text-xs font-normal text-zinc-400"> / month</span>
            </span>
          </div>
        </div>

        {/* Member Quota Telemetry */}
        <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#B6FF45]" />
              Member Capacity
            </span>
            <span className="font-mono text-white font-bold">{memberUsagePercent}%</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{members.length}</span>
            <span className="text-xs text-zinc-400">/ {activePlan.memberLimit} registered athletes</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#090B0A] h-2 rounded-full mt-3 overflow-hidden border border-[#1C2420]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                memberUsagePercent > 90 ? 'bg-rose-500' : memberUsagePercent > 70 ? 'bg-amber-400' : 'bg-[#B6FF45]'
              }`}
              style={{ width: `${memberUsagePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-3 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            Backend blocks member creation once limit is reached.
          </p>
        </div>

        {/* Trainer Quota Telemetry */}
        <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
              Coach Quota
            </span>
            <span className="font-mono text-white font-bold">{trainerUsagePercent}%</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{trainers.length}</span>
            <span className="text-xs text-zinc-400">/ {activePlan.trainerLimit} staff seats</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#090B0A] h-2 rounded-full mt-3 overflow-hidden border border-[#1C2420]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                trainerUsagePercent > 90 ? 'bg-rose-500' : 'bg-purple-400'
              }`}
              style={{ width: `${trainerUsagePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-3 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            Invitation system enforces coach seat availability.
          </p>
        </div>
      </div>

      {/* Plan Comparison & Upgrade Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-white">Compare & Upgrade Plans</h2>
          <p className="text-xs text-zinc-400">
            Choose a plan that fits your gym scale. Instant backend provisioning with zero downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAAS_PLANS.map((plan) => {
            const isCurrent = plan.code === activePlanCode;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

            return (
              <div
                key={plan.code}
                className={`p-5 rounded-2xl flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-[#151A17] border-2 border-[#B6FF45] shadow-xl shadow-[#B6FF45]/10'
                    : 'bg-[#151A17]/60 hover:bg-[#151A17] border border-[#1C2420] hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-base">{plan.name}</h3>
                    {plan.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#B6FF45] text-[#090B0A]">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 min-h-[36px]">{plan.description}</p>

                  <div className="mt-4 mb-5 pb-4 border-b border-[#1C2420]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        {price === 0 ? '₹0' : `₹${price.toLocaleString('en-IN')}`}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {billingCycle === 'monthly' ? '/ month' : '/ year'}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2.5 text-xs">
                    <div className="font-semibold text-zinc-300 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#B6FF45]" />
                      <span>Up to <strong>{plan.memberLimit}</strong> members</span>
                    </div>
                    <div className="font-semibold text-zinc-300 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#B6FF45]" />
                      <span>Up to <strong>{plan.trainerLimit}</strong> trainers</span>
                    </div>

                    <div className="pt-2 border-t border-[#1C2420]/60 space-y-2">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="text-zinc-400 text-[11px] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1C2420]">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl bg-[#090B0A] text-[#B6FF45] font-bold text-xs border border-[#B6FF45]/30 cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedPlanToChange(plan)}
                      className="w-full py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a2e835] text-[#090B0A] font-extrabold text-xs transition-colors shadow-md shadow-[#B6FF45]/20 flex items-center justify-center gap-1.5"
                    >
                      <span>Switch to {plan.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Change Confirmation Modal */}
      {selectedPlanToChange && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPlanToChange(null)}
          title={`Switch Subscription to ${selectedPlanToChange.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              You are about to switch your SaaS subscription tier for{' '}
              <strong className="text-white">{currentGym.name}</strong> to{' '}
              <strong className="text-[#B6FF45]">{selectedPlanToChange.name}</strong> on a{' '}
              <strong className="text-white">{billingCycle}</strong> billing cadence.
            </p>

            <div className="p-3.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>New Member Limit:</span>
                <span className="font-bold text-white">{selectedPlanToChange.memberLimit} members</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>New Trainer Limit:</span>
                <span className="font-bold text-white">{selectedPlanToChange.trainerLimit} coaches</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-[#1C2420]">
                <span>Amount Due:</span>
                <span className="font-extrabold text-white text-sm">
                  {selectedPlanToChange.monthlyPrice === 0
                    ? 'Free (₹0)'
                    : `₹${(billingCycle === 'monthly' ? selectedPlanToChange.monthlyPrice : selectedPlanToChange.annualPrice).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Note: In this preview environment, your plan will activate immediately with backend quota updates.
                Payment status will remain marked as <strong>PENDING</strong> without mock charges.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSelectedPlanToChange(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#B6FF45] text-[#090B0A] hover:bg-[#a2e835] transition-all shadow-md shadow-[#B6FF45]/20"
              >
                {isUpdating ? 'Updating Plan...' : 'Confirm Plan Change'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
