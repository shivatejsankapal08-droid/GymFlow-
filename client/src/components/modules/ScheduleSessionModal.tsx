import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Clock,
  User,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedTrainerId?: string;
  preSelectedMemberId?: string;
}

export const ScheduleSessionModal: React.FC<ScheduleSessionModalProps> = ({
  isOpen,
  onClose,
  preSelectedTrainerId,
  preSelectedMemberId,
}) => {
  const {
    trainers,
    members,
    trainingSessions,
    currentGym,
    scheduleTrainingSession,
  } = useApp();

  const [trainerId, setTrainerId] = useState(preSelectedTrainerId || (trainers[0]?.id ?? ''));
  const [memberId, setMemberId] = useState(preSelectedMemberId || (members[0]?.id ?? ''));
  const [sessionTitle, setSessionTitle] = useState('Personal Training Session');
  const [trainingType, setTrainingType] = useState('Strength & Conditioning');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter gym-specific trainers & members
  const gymTrainers = trainers.filter(
    (t) => t.gymId === currentGym.id || (t as any).gym_id === currentGym.id
  );
  const gymMembers = members.filter(
    (m) => m.gymId === currentGym.id || (m as any).gym_id === currentGym.id
  );

  // Anti-Overlap Conflict Detection
  const conflictingSession = useMemo(() => {
    if (!trainerId || !sessionDate || !startTime || !endTime) return null;

    return trainingSessions.find((s: any) => {
      const sTrainer = s.trainerId || s.trainer_id;
      const sDate = s.sessionDate || s.session_date;
      const sStatus = s.sessionStatus || s.session_status;

      if (sTrainer !== trainerId || sDate !== sessionDate || sStatus === 'cancelled') {
        return false;
      }

      const sStart = s.startTime || s.start_time;
      const sEnd = s.endTime || s.end_time;

      return sStart < endTime && sEnd > startTime;
    });
  }, [trainerId, sessionDate, startTime, endTime, trainingSessions]);

  const hasOverlapConflict = Boolean(conflictingSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOverlapConflict || !trainerId || !memberId) return;

    setIsSubmitting(true);
    const result = await scheduleTrainingSession({
      trainerId,
      memberId,
      sessionTitle,
      sessionDate,
      startTime,
      endTime,
      trainingType,
      notes,
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
    }
  };

  const selectedTrainer = gymTrainers.find((t) => t.id === trainerId);
  const selectedMember = gymMembers.find((m) => m.id === memberId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Training Session"
      subtitle={`Book verified session with anti-overlap engine for ${currentGym.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Anti-Overlap Conflict Warning Banner */}
        {hasOverlapConflict && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 text-xs">
                Schedule Conflict Detected
              </p>
              <p className="text-[11px] text-amber-200/90 mt-0.5">
                {selectedTrainer?.fullName || 'This trainer'} already has another session scheduled on{' '}
                <strong>{sessionDate}</strong> from{' '}
                <strong>
                  {conflictingSession?.startTime || (conflictingSession as any)?.start_time} -{' '}
                  {conflictingSession?.endTime || (conflictingSession as any)?.end_time}
                </strong>
                . Overlapping sessions are strictly prevented by the GymFlow Anti-Overlap Engine.
              </p>
            </div>
          </div>
        )}

        {/* Trainer & Member Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Select Coach *</label>
            <select
              required
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="" disabled>Choose a coach</option>
              {gymTrainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.specialization}) - {t.trainerCode || 'TR'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Select Athlete / Member *</label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="" disabled>Choose an athlete</option>
              {gymMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode || 'MBR'}) - {m.planName || 'Standard'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Session Title & Training Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Session Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Strength & Conditioning Block"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Training Type</label>
            <select
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Strength & Conditioning">Strength & Conditioning</option>
              <option value="Hypertrophy / Bodybuilding">Hypertrophy / Bodybuilding</option>
              <option value="Olympic Weightlifting">Olympic Weightlifting</option>
              <option value="Powerlifting">Powerlifting</option>
              <option value="HIIT & Cardio Conditioning">HIIT & Cardio Conditioning</option>
              <option value="Mobility & Rehab">Mobility & Rehab</option>
              <option value="Boxing / MMA Fitness">Boxing / MMA Fitness</option>
            </select>
          </div>
        </div>

        {/* Date, Start Time & End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Session Date *</label>
            <div className="relative">
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
              <Calendar className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Start Time *</label>
            <div className="relative">
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
              <Clock className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">End Time *</label>
            <div className="relative">
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
              <Clock className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-center justify-center text-[#B6FF45]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">
                {trainingType} • {sessionDate}
              </p>
              <p className="text-[11px] text-zinc-400">
                Coach: <span className="text-zinc-200">{selectedTrainer?.fullName || 'Not selected'}</span> ➔ Athlete:{' '}
                <span className="text-zinc-200">{selectedMember?.fullName || 'Not selected'}</span>
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-[#B6FF45]">
            {startTime} - {endTime}
          </span>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Session Goals / Notes</label>
          <textarea
            rows={2}
            placeholder="Focus on squat mechanics, depth and core bracing..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent hover:bg-[#1C2420] text-zinc-400 hover:text-white font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || hasOverlapConflict}
            className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 disabled:cursor-not-allowed text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Booking...' : hasOverlapConflict ? 'Conflict Detected' : 'Confirm Booking'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
