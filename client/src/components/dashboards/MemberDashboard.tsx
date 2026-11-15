import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../common/Badge';
import {
  QrCode,
  Calendar,
  CreditCard,
  Sparkles,
  Dumbbell,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Flame,
  Apple,
  TrendingUp,
  Scale,
  Ruler,
  AlertCircle,
  Plus,
  Smartphone,
  Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecordProgressModal } from '../modals/RecordProgressModal';
import { WorkoutPlan, DietPlan, MemberProgressRecord } from '../../types';

export const MemberDashboard: React.FC = () => {
  const {
    currentUser,
    currentGym,
    members,
    workoutPlans,
    dietPlans,
    recordPayment,
    setActivePage,
    addToast,
    fetchWorkoutPlans,
    fetchDietPlans,
    fetchMemberProgress,
    logWorkoutCompletion,
    updateMemberConsent
  } = useApp();

  // Find logged in member record
  const currentMember =
    members.find((m) => m.email === currentUser?.email || m.fullName === currentUser?.fullName) ||
    members[0];

  const [isRenewing, setIsRenewing] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [memberProgressHistory, setMemberProgressHistory] = useState<MemberProgressRecord[]>([]);
  const [completedExercisesToday, setCompletedExercisesToday] = useState<Record<string, boolean>>({});

  // Step 11: Member WhatsApp notification consents
  const [waConsent, setWaConsent] = useState(true);
  const [waExpiry, setWaExpiry] = useState(true);
  const [waPayment, setWaPayment] = useState(true);
  const [waAttendance, setWaAttendance] = useState(true);
  const [waBirthday, setWaBirthday] = useState(true);

  useEffect(() => {
    fetchWorkoutPlans();
    fetchDietPlans();
    if (currentMember?.id) {
      loadProgress(currentMember.id);
    }
  }, [currentMember?.id]);

  const loadProgress = async (mId: string) => {
    try {
      const records = await fetchMemberProgress(mId);
      if (Array.isArray(records)) {
        setMemberProgressHistory(records);
      }
    } catch (err) {
      console.error('Failed to load member progress:', err);
    }
  };

  // Find assigned workout plan & diet plan for this member
  const assignedWorkoutPlan =
    workoutPlans.find((p) => p.assignedMemberId === currentMember.id || (p as any).memberId === currentMember.id) ||
    workoutPlans[0];

  const assignedDietPlan =
    dietPlans.find((d) => d.memberId === currentMember.id) ||
    dietPlans[0];

  const handleSimulateRazorpayRenewal = () => {
    setIsRenewing(true);
    setTimeout(() => {
      recordPayment({
        memberId: currentMember.id,
        memberName: currentMember.fullName,
        memberCode: currentMember.memberCode,
        planName: currentMember.currentPlanName || 'Annual Elite VIP',
        amount: 21999,
        paymentMethod: 'razorpay',
      });
      setIsRenewing(false);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00ff88', '#10b981', '#34d399', '#ffffff'],
      });
    }, 1200);
  };

  // Complete an exercise
  const handleCompleteExercise = async (exerciseName: string, sets: string, reps: string) => {
    const key = exerciseName;
    if (completedExercisesToday[key]) return;

    try {
      const res = await logWorkoutCompletion({
        memberId: currentMember.id,
        workoutPlanId: assignedWorkoutPlan?.id,
        exerciseName,
        setsCompleted: parseInt(sets) || 3,
        repsCompleted: reps || '10',
        rpe: 8,
      });

      if (res.success) {
        setCompletedExercisesToday((prev) => ({ ...prev, [key]: true }));
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#B6FF45', '#10b981', '#ffffff'],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const latestProgress = memberProgressHistory[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Welcome back, {currentMember.fullName}
            </h1>
            <Badge variant="active">ATHLETE PASS</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {currentGym.name} • Member Code: <strong className="text-[#B6FF45] font-mono">{currentMember.memberCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProgressModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#090B0A] hover:bg-[#1C2420] text-zinc-300 hover:text-white border border-[#1C2420] text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Scale className="w-3.5 h-3.5 text-[#B6FF45]" />
            <span>Log Weight</span>
          </button>

          <button
            onClick={() => setActivePage('ai-assistant')}
            className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black font-black text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(182,255,69,0.3)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Routine Coach</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Pass + Routine Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Digital Pass + Physical Stats */}
        <div className="space-y-6">
          {/* Digital Gym Pass */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#151A17] via-[#090B0A] to-black border-2 border-[#B6FF45]/40 shadow-2xl shadow-[#B6FF45]/10 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-3 right-4 text-[10px] uppercase tracking-wider font-black text-[#B6FF45] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Pass</span>
            </div>

            <div className="mt-2 relative">
              <img
                src={currentMember.avatarUrl}
                alt={currentMember.fullName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#B6FF45]/30 shadow-lg"
              />
            </div>

            <h3 className="text-lg font-black text-white mt-3">{currentMember.fullName}</h3>
            <p className="text-xs text-[#B6FF45] font-semibold">{currentMember.currentPlanName}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Code: {currentMember.memberCode}</p>

            <div className="my-5 p-3.5 rounded-2xl bg-white shadow-xl shadow-black/50 ring-4 ring-[#B6FF45]/20">
              <QRCodeSVG
                value={currentMember.qrToken}
                size={140}
                level="H"
                fgColor="#090a0f"
                bgColor="#ffffff"
              />
            </div>

            <div className="w-full pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Valid From:</span>
                <span className="text-zinc-200">{currentMember.membershipStartDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Expires On:</span>
                <span className="text-[#B6FF45] font-bold">{currentMember.membershipEndDate}</span>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-zinc-500">
              Hold QR code directly in front of the entrance scanner tablet for entry.
            </p>
          </div>

          {/* Body Measurements & Progression Card */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#B6FF45]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Body Progression</h4>
              </div>
              <button
                onClick={() => setIsProgressModalOpen(true)}
                className="text-xs text-[#B6FF45] font-bold hover:underline"
              >
                + Check-in
              </button>
            </div>

            {latestProgress ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                    <span className="text-[10px] text-zinc-500 block">Current Weight</span>
                    <span className="text-xl font-black text-white">{latestProgress.weight} kg</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                    <span className="text-[10px] text-zinc-500 block">Target Weight</span>
                    <span className="text-xl font-black text-cyan-400">{latestProgress.targetWeight || '—'} kg</span>
                  </div>
                </div>

                {latestProgress.bodyMeasurements && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                      <span className="text-[10px] text-zinc-500 block">Chest</span>
                      <span className="font-bold text-zinc-200">{latestProgress.bodyMeasurements.chest || '—'} in</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                      <span className="text-[10px] text-zinc-500 block">Waist</span>
                      <span className="font-bold text-zinc-200">{latestProgress.bodyMeasurements.waist || '—'} in</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                      <span className="text-[10px] text-zinc-500 block">Body Fat</span>
                      <span className="font-bold text-[#B6FF45]">{latestProgress.bodyMeasurements.bodyFatPct || '—'}%</span>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-zinc-400 italic">
                  "{latestProgress.progressNotes || 'Consistent progression recorded by athlete.'}"
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-zinc-500">
                <p>No progress check-ins recorded yet.</p>
                <button
                  onClick={() => setIsProgressModalOpen(true)}
                  className="mt-2 text-xs text-[#B6FF45] font-bold underline"
                >
                  Record first check-in
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp Notification & Consent Preferences Card */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#25D366]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">WhatsApp Alerts</h4>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${waConsent ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20' : 'bg-zinc-800 text-zinc-400'}`}>
                {waConsent ? 'Opted In' : 'Paused'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Receive verified payment invoices, membership expiry alerts, and attendance notifications directly on WhatsApp ({currentMember.phone || '+91 98201 12345'}).
            </p>

            <div className="space-y-2.5 pt-2 border-t border-[#1C2420] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Master WhatsApp Consent</span>
                <button
                  onClick={() => {
                    const next = !waConsent;
                    setWaConsent(next);
                    updateMemberConsent(currentMember.id, { whatsapp_consent: next });
                  }}
                  className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors ${waConsent ? 'bg-[#25D366] justify-end' : 'bg-zinc-800 justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-black" />
                </button>
              </div>

              {waConsent && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Expiry Reminders (7d/3d/1d)</span>
                    <button
                      onClick={() => {
                        const next = !waExpiry;
                        setWaExpiry(next);
                        updateMemberConsent(currentMember.id, { expiry_reminders: next });
                      }}
                      className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${waExpiry ? 'bg-[#B6FF45] justify-end' : 'bg-zinc-800 justify-start'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-black" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Payment &amp; Tax Receipts</span>
                    <button
                      onClick={() => {
                        const next = !waPayment;
                        setWaPayment(next);
                        updateMemberConsent(currentMember.id, { payment_notifications: next });
                      }}
                      className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${waPayment ? 'bg-[#B6FF45] justify-end' : 'bg-zinc-800 justify-start'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-black" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Turnstile Check-in Alerts</span>
                    <button
                      onClick={() => {
                        const next = !waAttendance;
                        setWaAttendance(next);
                        updateMemberConsent(currentMember.id, { attendance_notifications: next });
                      }}
                      className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${waAttendance ? 'bg-[#B6FF45] justify-end' : 'bg-zinc-800 justify-start'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-black" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Birthday Rewards &amp; Wishes</span>
                    <button
                      onClick={() => {
                        const next = !waBirthday;
                        setWaBirthday(next);
                        updateMemberConsent(currentMember.id, { birthday_messages: next });
                      }}
                      className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${waBirthday ? 'bg-[#B6FF45] justify-end' : 'bg-zinc-800 justify-start'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-black" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Today's Workout Routine & Nutrition Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Workout Routine */}
          <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#B6FF45]" />
                  <h3 className="text-base font-black text-white">Assigned Workout Routine</h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {assignedWorkoutPlan ? assignedWorkoutPlan.title : 'No active workout plan'} •{' '}
                  <span className="text-[#B6FF45] font-semibold">{assignedWorkoutPlan?.category || 'Hypertrophy'}</span>
                </p>
              </div>

              <button
                onClick={() => setActivePage('workouts')}
                className="text-xs text-[#B6FF45] font-bold hover:underline flex items-center gap-1"
              >
                <span>View Full Split</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today's Exercises Check-Off List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Today's Protocol (Check off as you complete)</span>
                <span className="text-[#B6FF45]">
                  {Object.keys(completedExercisesToday).length} Done
                </span>
              </div>

              {assignedWorkoutPlan?.exercises && assignedWorkoutPlan.exercises[0]?.items ? (
                <div className="space-y-2">
                  {assignedWorkoutPlan.exercises[0].items.map((ex, idx) => {
                    const isDone = Boolean(completedExercisesToday[ex.name]);
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-[#B6FF45]/10 border-[#B6FF45]/40 text-zinc-300'
                            : 'bg-[#090B0A] border-[#1C2420] text-white hover:border-[#1C2420]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCompleteExercise(ex.name, ex.sets, ex.reps)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-[#B6FF45] text-black font-bold'
                                : 'border border-zinc-600 hover:border-[#B6FF45]'
                            }`}
                          >
                            {isDone ? '✓' : ''}
                          </button>
                          <div>
                            <h4 className={`text-xs font-bold ${isDone ? 'line-through text-zinc-400' : 'text-white'}`}>
                              {ex.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              {ex.sets} sets × {ex.reps} reps • Rest: {ex.rest || '60s'}
                            </p>
                          </div>
                        </div>

                        {isDone ? (
                          <span className="text-[10px] font-black text-[#B6FF45] uppercase">Crushed! 🔥</span>
                        ) : (
                          <button
                            onClick={() => handleCompleteExercise(ex.name, ex.sets, ex.reps)}
                            className="px-2.5 py-1 rounded-lg bg-[#151A17] hover:bg-[#1C2420] text-zinc-300 text-[11px] font-bold border border-[#1C2420] transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#090B0A] text-center text-xs text-zinc-500">
                  No exercise items scheduled for today.
                </div>
              )}
            </div>
          </div>

          {/* Assigned Diet Plan */}
          <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-[#B6FF45]" />
                  <h3 className="text-base font-black text-white">Assigned Nutrition Guide</h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {assignedDietPlan?.planName || 'Custom Macro Conditioning'} •{' '}
                  <span className="text-[#B6FF45] font-semibold">{assignedDietPlan?.dietaryPreference || 'High Protein'}</span>
                </p>
              </div>

              {assignedDietPlan && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#090B0A] text-zinc-300 border border-[#1C2420]">
                    {assignedDietPlan.totalCalories || 2400} kcal
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#B6FF45]/10 text-[#B6FF45] font-bold border border-[#B6FF45]/20">
                    {assignedDietPlan.totalProtein || 170}g Protein
                  </span>
                </div>
              )}
            </div>

            {/* Meal Slots Preview */}
            <div className="space-y-2">
              {assignedDietPlan?.meals && assignedDietPlan.meals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {assignedDietPlan.meals.map((meal, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-xs">
                      <span className="text-[10px] font-black text-[#B6FF45] uppercase tracking-wider block">
                        {meal.mealName}
                      </span>
                      <h5 className="font-bold text-white mt-0.5">{meal.foodName}</h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{meal.portionSize}</p>
                      <div className="mt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                        <span>{meal.calories || 0} kcal</span>
                        <span>P: {meal.protein || 0}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#090B0A] text-center text-xs text-zinc-500">
                  No meals specified in nutrition plan.
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-500 italic pt-2 border-t border-[#1C2420]">
              * Nutrition recommendations are for sports conditioning. Consult with a dietitian for specific health needs.
            </p>
          </div>

          {/* Membership Tier & Renewal Action */}
          <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C2420] mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#B6FF45]" />
                  Active Membership Tier
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{currentMember.currentPlanName}</p>
              </div>
              <Badge variant="active" size="md">
                ACTIVE
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Membership Timeline</span>
                <span className="text-[#B6FF45]">62 Days Remaining</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#090B0A] overflow-hidden">
                <div className="h-full bg-[#B6FF45] rounded-full w-3/4 shadow-[0_0_10px_rgba(182,255,69,0.5)]" />
              </div>
            </div>

            <div className="pt-3 border-t border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-400">Renewal rate</p>
                <p className="text-lg font-black text-white">₹21,999 / year</p>
              </div>

              <button
                onClick={handleSimulateRazorpayRenewal}
                disabled={isRenewing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(182,255,69,0.3)]"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isRenewing ? 'Processing via Razorpay...' : 'Renew Membership'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <RecordProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        initialMemberId={currentMember.id}
        onSuccess={() => loadProgress(currentMember.id)}
      />
    </div>
  );
};
