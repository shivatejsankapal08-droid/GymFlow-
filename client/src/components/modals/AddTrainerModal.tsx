import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Dumbbell,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  Award,
  Clock,
  Send,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const AddTrainerModal: React.FC = () => {
  const {
    isAddTrainerModalOpen,
    setIsAddTrainerModalOpen,
    addTrainer,
    trainers,
    currentGym,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'compensation'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Professional Details
  const [specialization, setSpecialization] = useState('Strength & Conditioning');
  const [experience, setExperience] = useState('4+ years');
  const [certifications, setCertifications] = useState('ACE Certified Personal Trainer, CSCS');
  const [skills, setSkills] = useState('Hypertrophy, Powerlifting, Olympic Lifting, Nutrition');
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'contract'>('full_time');
  const [shiftTiming, setShiftTiming] = useState('06:00 AM - 02:00 PM');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Compensation Details
  const [salaryType, setSalaryType] = useState<'monthly' | 'hourly' | 'commission' | 'hybrid'>('monthly');
  const [basePay, setBasePay] = useState('45000');
  const [hourlyRate, setHourlyRate] = useState('800');
  const [commissionRate, setCommissionRate] = useState('15');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [notes, setNotes] = useState('');
  const [sendInvitation, setSendInvitation] = useState(true);

  // Estimated next trainer ID
  const estimatedTrainerCode = `TR-${1001 + trainers.length}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !specialization) return;

    setIsSubmitting(true);
    const result = await addTrainer({
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      specialization,
      experience,
      certifications,
      skills,
      employmentType,
      workingHours: shiftTiming,
      joiningDate,
      salaryType,
      basePay: Number(basePay) || 40000,
      hourlyRate: Number(hourlyRate) || 800,
      commissionRate: Number(commissionRate) || 10,
      notes,
      sendInvitation,
    });

    setIsSubmitting(false);
    if (result.success) {
      setIsAddTrainerModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setEmergencyContact('');
    setSpecialization('Strength & Conditioning');
    setExperience('4+ years');
    setShiftTiming('06:00 AM - 02:00 PM');
    setBasePay('45000');
    setBankAccountNumber('');
    setBankIfscCode('');
    setNotes('');
    setActiveTab('personal');
  };

  return (
    <Modal
      isOpen={isAddTrainerModalOpen}
      onClose={() => setIsAddTrainerModalOpen(false)}
      title="Add Certified Trainer"
      subtitle={`Register and onboard fitness coach for ${currentGym.name}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Top Header Card with Auto Trainer Code */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-center justify-center text-[#B6FF45]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">New Coach Profile</span>
                <span className="px-2 py-0.5 rounded-md bg-[#B6FF45]/20 text-[#B6FF45] font-black text-[11px] font-mono border border-[#B6FF45]/30">
                  {estimatedTrainerCode}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Gym: <strong className="text-zinc-200">{currentGym.name}</strong> • Tenant: <span className="font-mono text-zinc-400">{currentGym.id}</span>
              </p>
            </div>
          </div>
          <Badge variant="pro">COACH ROSTER</Badge>
        </div>

        {/* Form Section Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1C2420] pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`pb-1.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'personal'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Personal Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('professional')}
            className={`pb-1.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'professional'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>2. Professional Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compensation')}
            className={`pb-1.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'compensation'
                ? 'border-[#B6FF45] text-[#B6FF45]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Salary & Account</span>
          </button>
        </div>

        {/* Tab 1: Personal Details */}
        {activeTab === 'personal' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Full Name * <span className="text-zinc-500 font-normal">(Required)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Rathore"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="coach@gymflow.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+91 99887 76655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                  />
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                  <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                </div>
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
                  <option value="Other">Other / Non-binary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. 402 Palm Heights, Bandra West"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Brother: +91 98220 11223"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Professional Details */}
        {activeTab === 'professional' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Coaching Specialization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Strength & Conditioning, Powerlifting"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Experience in Years</label>
                <input
                  type="text"
                  placeholder="e.g. 5+ years"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="full_time">Full Time Staff</option>
                  <option value="part_time">Part Time Coach</option>
                  <option value="contract">Freelance / Contractor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Shift Timing / Availability</label>
                <select
                  value={shiftTiming}
                  onChange={(e) => setShiftTiming(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="06:00 AM - 02:00 PM">Morning Shift (06:00 AM - 02:00 PM)</option>
                  <option value="02:00 PM - 10:00 PM">Evening Shift (02:00 PM - 10:00 PM)</option>
                  <option value="06:00 AM - 10:00 AM & 05:00 PM - 09:00 PM">Split Shift (Morning & Evening)</option>
                  <option value="Flexible / By Appointment">Flexible / By Appointment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Certifications & Licenses</label>
              <input
                type="text"
                placeholder="e.g. ACE-CPT, CSCS, Crossfit L2, K11 Certified"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Key Coaching Skills</label>
              <input
                type="text"
                placeholder="e.g. Barbell Mechanics, Body Recomposition, Injury Rehab"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Salary & Account */}
        {activeTab === 'compensation' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Salary Model</label>
                <select
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value as any)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="monthly">Fixed Monthly Salary</option>
                  <option value="hourly">Hourly Billing Rate</option>
                  <option value="commission">Commission Only (% of Client Fees)</option>
                  <option value="hybrid">Hybrid (Base Pay + Commission)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Base Monthly Pay (INR)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={basePay}
                    onChange={(e) => setBasePay(e.target.value)}
                    className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                  <span className="text-zinc-500 font-bold absolute left-3 top-2">₹</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Hourly Rate (INR/hr)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 50100456789123"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value)}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Background check verified, joining contract signed."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            {/* Email Invitation Option */}
            <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-[#B6FF45]" />
                <div>
                  <p className="font-bold text-white text-xs">Send Email Invitation</p>
                  <p className="text-[11px] text-zinc-400">
                    Creates secure access token for coach login without duplicate accounts.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B6FF45]"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1C2420]">
          <div className="flex items-center gap-2">
            {activeTab !== 'personal' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'compensation') setActiveTab('professional');
                  else if (activeTab === 'professional') setActiveTab('personal');
                }}
                className="px-3 py-2 rounded-xl bg-[#1C2420] text-zinc-300 hover:text-white font-bold"
              >
                Back
              </button>
            )}
            {activeTab !== 'compensation' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'personal') setActiveTab('professional');
                  else if (activeTab === 'professional') setActiveTab('compensation');
                }}
                className="px-4 py-2 rounded-xl bg-[#1C2420] hover:bg-[#25302a] text-[#B6FF45] font-bold border border-[#B6FF45]/30"
              >
                Next Step →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddTrainerModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-[#1C2420] text-zinc-400 hover:text-white font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fullName}
              className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-50 text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 flex items-center gap-2"
            >
              <Dumbbell className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Trainer'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
