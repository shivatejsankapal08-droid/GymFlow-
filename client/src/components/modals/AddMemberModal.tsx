import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  Users,
  User,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Tag,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

export const AddMemberModal: React.FC = () => {
  const {
    isAddMemberModalOpen,
    setIsAddMemberModalOpen,
    plans,
    trainers,
    addMember,
    currentGym,
    members,
    addToast
  } = useApp();

  // Tab state for multi-section form
  const [activeSection, setActiveSection] = useState<'personal' | 'membership' | 'additional'>('personal');

  // Personal Details
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [dateOfBirth, setDateOfBirth] = useState('1998-05-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Membership Details
  const gymPrefix = useMemo(() => {
    if (currentGym.id === 'gym-2') return 'TF';
    if (currentGym.id === 'gym-3') return 'ZF';
    return 'IP';
  }, [currentGym.id]);

  const generatedMemberCode = useMemo(() => {
    const nextSeq = 1000 + members.filter((m) => m.gymId === currentGym.id).length + 1;
    return `${gymPrefix}-${nextSeq}`;
  }, [gymPrefix, members, currentGym.id]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending'>('completed');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay' | 'cash' | 'card'>('upi');

  // Additional Details
  const [medicalNotes, setMedicalNotes] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Lean Muscle & Hypertrophy');
  const [assignedTrainerId, setAssignedTrainerId] = useState('');

  // Initialize plan id
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[1]?.id || plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  // Auto calculate End Date based on Start Date + Plan Duration
  const calculatedEndDate = useMemo(() => {
    if (!startDate || !selectedPlan) return '';
    try {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + (selectedPlan.durationMonths || 1));
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [startDate, selectedPlan]);

  // Pricing calculations
  const planAmount = selectedPlan?.price || 0;
  const finalAmount = Math.max(0, planAmount - (Number(discount) || 0));

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setEmergencyContact('');
    setMedicalNotes('');
    setDiscount(0);
    setPaymentStatus('completed');
    setActiveSection('personal');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      setActiveSection('personal');
      addToast({ type: 'warning', title: 'Name Required', message: 'Please enter athlete full name.' });
      return;
    }
    if (!phone.trim()) {
      setActiveSection('personal');
      addToast({ type: 'warning', title: 'Phone Required', message: 'Please enter valid phone number.' });
      return;
    }
    if (!selectedPlan) {
      setActiveSection('membership');
      addToast({ type: 'warning', title: 'Plan Required', message: 'Please select a membership package.' });
      return;
    }

    const chosenTrainer = trainers.find((t) => t.id === assignedTrainerId);

    addMember({
      memberCode: generatedMemberCode,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dateOfBirth,
      gender,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      medicalNotes: medicalNotes.trim(),
      fitnessGoal,
      avatarUrl,
      currentPlanId: selectedPlan.id,
      currentPlanName: selectedPlan.name,
      membershipStartDate: startDate,
      membershipEndDate: calculatedEndDate,
      assignedTrainerId: assignedTrainerId || undefined,
      assignedTrainerName: chosenTrainer?.fullName,
      pendingDue: paymentStatus === 'pending' ? finalAmount : 0,
    });

    setIsAddMemberModalOpen(false);
    resetForm();
  };

  return (
    <Modal
      isOpen={isAddMemberModalOpen}
      onClose={() => setIsAddMemberModalOpen(false)}
      title="Register New Athlete Member"
      subtitle="Generates Member ID, digital QR token & dispatches automated WhatsApp welcome"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Navigation Sections */}
        <div className="flex border-b border-[#1C2420] text-xs font-bold gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('personal')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeSection === 'personal'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Personal Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('membership')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeSection === 'membership'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>2. Membership & Billing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('additional')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeSection === 'additional'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>3. Health & Goals</span>
          </button>
        </div>

        {/* SECTION 1: PERSONAL DETAILS */}
        {activeSection === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Avatar Selection */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-2">
                Select Profile Avatar Photo
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="Preset"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-11 h-11 rounded-xl object-cover cursor-pointer ring-2 transition-all ${
                      avatarUrl === url
                        ? 'ring-[#B6FF45] scale-105'
                        : 'ring-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yash Vardhan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="athlete@gymflow.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Address / Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Bandra West, Mumbai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Emergency Contact (Name & Phone)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Vardhan (+91 98222 11000)"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('membership')}
                className="px-4 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302b] text-[#B6FF45] font-bold"
              >
                Proceed to Membership Details →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: MEMBERSHIP DETAILS */}
        {activeSection === 'membership' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Auto Generated Member Code */}
            <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  Auto-Generated Member ID:
                </span>
                <span className="font-mono text-sm font-black text-[#B6FF45] block">
                  {generatedMemberCode}
                </span>
              </div>
              <Badge variant="pro" size="sm">
                TENANT SCOPED
              </Badge>
            </div>

            {/* Plan Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Select Membership Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationMonths} mo) - ₹{p.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Membership Duration
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedPlan?.durationMonths || 1} Months (~${(selectedPlan?.durationMonths || 1) * 30} Days)`}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-zinc-300 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Auto-Calculated Expiry Date
                </label>
                <input
                  type="text"
                  readOnly
                  value={calculatedEndDate}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-[#B6FF45] font-mono font-bold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Pricing & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Plan Standard Price</label>
                <input
                  type="text"
                  readOnly
                  value={`₹${planAmount.toLocaleString('en-IN')}`}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-zinc-300 font-mono font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Discount (INR)</label>
                <input
                  type="number"
                  min="0"
                  max={planAmount}
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6FF45] mb-1">Final Net Amount</label>
                <input
                  type="text"
                  readOnly
                  value={`₹${finalAmount.toLocaleString('en-IN')}`}
                  className="w-full bg-[#151A17] border border-[#B6FF45]/40 rounded-xl px-3 py-2 text-[#B6FF45] font-mono font-bold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Payment Status & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block font-semibold text-zinc-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash on Desk</option>
                  <option value="card">Credit / Debit POS Card</option>
                  <option value="razorpay">Razorpay Gateway</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('personal')}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('additional')}
                className="px-4 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302b] text-[#B6FF45] font-bold"
              >
                Proceed to Health & Goals →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: ADDITIONAL DETAILS */}
        {activeSection === 'additional' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Primary Fitness Goal</label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="Lean Muscle & Hypertrophy">Lean Muscle & Hypertrophy</option>
                  <option value="Fat Loss & HIIT">Fat Loss & HIIT</option>
                  <option value="Powerlifting & Heavy Strength">Powerlifting & Heavy Strength</option>
                  <option value="General Functional Conditioning">General Functional Conditioning</option>
                  <option value="Athletic Performance & Mobility">Athletic Performance & Mobility</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Assign Trainer (Optional)</label>
                <select
                  value={assignedTrainerId}
                  onChange={(e) => setAssignedTrainerId(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="">No Assigned Trainer (General Floor)</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Medical & Clinical Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Past shoulder labrum surgery, mild asthma, advised to avoid heavy overhead pressing without warmup"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-zinc-400 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-[#B6FF45]" />
                Automated Actions on Registration:
              </span>
              <span className="text-[#B6FF45] font-semibold">
                QR Token Generated + WhatsApp Welcome Dispatched
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('membership')}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
              >
                ← Back
              </button>
              <span className="text-zinc-500 text-[10px] self-center">
                Registration Date: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Global Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={() => {
              setIsAddMemberModalOpen(false);
              resetForm();
            }}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#151A17] font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02] transition-transform"
          >
            Confirm & Create Member
          </button>
        </div>
      </form>
    </Modal>
  );
};
