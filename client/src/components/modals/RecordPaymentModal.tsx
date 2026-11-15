import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RecordPaymentModal: React.FC = () => {
  const {
    isRecordPaymentModalOpen,
    setIsRecordPaymentModalOpen,
    members,
    plans,
    recordSmartPayment,
  } = useApp();

  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [membershipPlanId, setMembershipPlanId] = useState(plans[0]?.id || '');
  const [amount, setAmount] = useState('2999');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [isRenewal, setIsRenewal] = useState(false);
  const [notes, setNotes] = useState('Membership Payment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMember = members.find((m) => m.id === memberId) || members[0];
  const finalAmount = Math.max(0, Number(amount) - (Number(discount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;

    setIsSubmitting(true);
    const res = await recordSmartPayment({
      memberId,
      membershipPlanId,
      amount: Number(amount),
      discount: Number(discount) || 0,
      paymentMethod,
      notes,
      isRenewal,
    });
    setIsSubmitting(false);

    if (res.success) {
      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#B6FF45', '#10b981', '#ffffff'],
      });
      setIsRecordPaymentModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isRecordPaymentModalOpen}
      onClose={() => setIsRecordPaymentModalOpen(false)}
      title="Record / Collect Payment"
      subtitle="Generates tax invoice and automatically verifies payment status"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Select Athlete *</label>
          <select
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value);
              const m = members.find((mem) => mem.id === e.target.value);
              if (m && m.pendingDue && m.pendingDue > 0) {
                setAmount(String(m.pendingDue));
              }
            }}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.memberCode}) - {m.pendingDue ? `₹${m.pendingDue} Due` : 'Clear'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Membership Plan</label>
          <select
            value={membershipPlanId}
            onChange={(e) => {
              setMembershipPlanId(e.target.value);
              const pl = plans.find((p) => p.id === e.target.value);
              if (pl) setAmount(String(pl.price));
            }}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
          >
            {plans.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name} - ₹{pl.price} ({pl.durationMonths} Mo)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Discount (₹)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#B6FF45] mb-1">Final Amount (₹)</label>
            <div className="w-full bg-[#151A17] border border-[#B6FF45]/30 rounded-xl px-3 py-2 text-[#B6FF45] font-mono font-bold">
              ₹{finalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash at Front Desk</option>
              <option value="credit_card">Credit Card POS</option>
              <option value="debit_card">Debit Card POS</option>
              <option value="net_banking">Net Banking</option>
              <option value="razorpay">Razorpay Gateway</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={isRenewal}
                onChange={(e) => setIsRenewal(e.target.checked)}
                className="rounded bg-[#0F1311] border-[#1C2420] text-[#B6FF45] focus:ring-0"
              />
              <span>Renew Membership Contract</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Transaction Remarks</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Quarterly Pro Plan Renewal"
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-zinc-400 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-[#B6FF45]" />
            Tax Compliance:
          </span>
          <span className="text-[#B6FF45] font-semibold">
            Auto GST Tax Invoice + WhatsApp PDF Receipt
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={() => setIsRecordPaymentModalOpen(false)}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#151A17] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02] transition-transform"
          >
            {isSubmitting ? 'Recording...' : `Confirm & Collect ₹${finalAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
