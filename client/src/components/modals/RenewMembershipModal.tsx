import React, { useState, useEffect, useMemo } from 'react';
import { Member } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  RefreshCw,
  Calendar,
  CreditCard,
  Tag,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Percent
} from 'lucide-react';

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export const RenewMembershipModal: React.FC<RenewMembershipModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const { plans, renewMember, addToast } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay' | 'cash' | 'card' | 'bank_transfer'>('upi');
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending'>('completed');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set initial plan to member's current plan or the first available plan
  useEffect(() => {
    if (member && plans.length > 0) {
      const currentPlanExists = plans.find((p) => p.id === member.currentPlanId);
      setSelectedPlanId(currentPlanExists ? currentPlanExists.id : plans[0].id);
      setDiscountAmount(0);
      setPaymentMethod('upi');
      setPaymentStatus('completed');
      setNotes('');
    }
  }, [member, plans, isOpen]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  // Compute renewal start & new projected expiry date
  const renewalDates = useMemo(() => {
    if (!member || !selectedPlan) {
      return { startDate: '', newExpiryDate: '', isExtension: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentExpiry = new Date(member.membershipEndDate);
    currentExpiry.setHours(0, 0, 0, 0);

    // If current membership is still active, extend from current expiry date
    // If expired, start from today
    const isExtension = currentExpiry >= today;
    const baseDate = isExtension ? currentExpiry : today;

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + (selectedPlan.durationMonths || 1));

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    return {
      startDate: formatDate(baseDate),
      newExpiryDate: formatDate(newExpiry),
      isExtension,
    };
  }, [member, selectedPlan]);

  const finalAmount = useMemo(() => {
    if (!selectedPlan) return 0;
    const base = selectedPlan.price || 0;
    const disc = Math.max(0, Math.min(base, Number(discountAmount) || 0));
    return base - disc;
  }, [selectedPlan, discountAmount]);

  if (!member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmitting(true);
    try {
      const res = await renewMember(member.id, {
        planId: selectedPlan.id,
        discount: Number(discountAmount) || 0,
        paymentMethod,
        paymentStatus,
        notes,
      });

      if (res.success) {
        onClose();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Renewal Failed',
        message: err.message || 'Could not process membership extension.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renew Athlete Membership"
      subtitle="Extend subscription validity, update package tier and record payment"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Athlete Overview Banner */}
        <div className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={member.avatarUrl}
              alt={member.fullName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#1C2420]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{member.fullName}</h4>
                <span className="font-mono text-[11px] text-[#B6FF45] font-bold">
                  {member.memberCode}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Current Plan: <span className="text-zinc-200 font-semibold">{member.currentPlanName}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <Badge variant={member.status} size="sm">
              {member.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-[10px] text-zinc-400 mt-1">
              Current Expiry:{' '}
              <span className="text-white font-mono font-medium">{member.membershipEndDate}</span>
            </p>
          </div>
        </div>

        {/* Plan Selection */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-2">
            Select Membership Renewal Plan *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#151A17] border-[#B6FF45] shadow-sm shadow-[#B6FF45]/10'
                      : 'bg-[#0F1311] border-[#1C2420] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{plan.name}</span>
                    <Badge variant={isSelected ? 'active' : 'secondary'} size="sm">
                      {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-sm font-black text-[#B6FF45]">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      ~₹{Math.round(plan.price / (plan.durationMonths * 30))}/day
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projected Expiry Extension Calculation */}
        <div className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] space-y-3">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#B6FF45]" />
              Validity Extension Window
            </span>
            <span className="text-[10px] font-semibold text-zinc-400">
              {renewalDates.isExtension
                ? 'Extending existing active validity'
                : 'Starting immediately from today'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center text-center">
            <div className="p-2.5 rounded-xl bg-[#0F1311] border border-[#1C2420]">
              <span className="block text-[10px] text-zinc-400">Starts From</span>
              <span className="text-xs font-mono font-bold text-white">{renewalDates.startDate}</span>
            </div>

            <div className="flex items-center justify-center">
              <span className="px-2.5 py-1 rounded-full bg-[#151A17] border border-[#1C2420] text-[#B6FF45] font-bold text-[10px] flex items-center gap-1">
                +{selectedPlan?.durationMonths || 1} mo <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#151A17] border border-[#B6FF45]/40 shadow-sm">
              <span className="block text-[10px] text-[#B6FF45] font-bold">New Expiry Date</span>
              <span className="text-xs font-mono font-black text-white">
                {renewalDates.newExpiryDate}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing, Discount & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Discount / Waiver (INR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={selectedPlan?.price || 100000}
                  placeholder="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-3 pr-8 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                  ₹
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="razorpay">Razorpay Gateway (Online Link)</option>
                <option value="cash">Cash on Desk</option>
                <option value="card">POS Debit / Credit Card</option>
                <option value="bank_transfer">Direct IMPS / NEFT</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="completed">Completed / Settled (Full Payment)</option>
                <option value="pending">Payment Pending (Due Later)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Renewal Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Loyalty discount applied / Seasonal offer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>
        </div>

        {/* Final Amount Summary Card */}
        <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
              Net Payable Amount
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-[#B6FF45]">
                ₹{finalAmount.toLocaleString('en-IN')}
              </span>
              {discountAmount > 0 && (
                <span className="text-xs text-zinc-400 line-through">
                  ₹{selectedPlan?.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-[11px] text-zinc-400">
            <span className="text-zinc-300 font-semibold block">
              {paymentStatus === 'completed' ? '✓ Immediate Receipt Generated' : '⚠️ Marked as Pending Due'}
            </span>
            <span className="text-[10px] text-zinc-500">Includes all gym amenities & access</span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#151A17] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Extending...' : 'Confirm Renewal'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
