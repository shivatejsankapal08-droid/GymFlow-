import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  TrendingUp,
  Scale,
  Ruler,
  FileText,
  User,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Percent
} from 'lucide-react';

interface RecordProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string;
  onSuccess?: () => void;
}

export const RecordProgressModal: React.FC<RecordProgressModalProps> = ({
  isOpen,
  onClose,
  initialMemberId,
  onSuccess,
}) => {
  const { members, recordMemberProgress } = useApp();

  const [memberId, setMemberId] = useState<string>(initialMemberId || '');
  const [weight, setWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [recordedAt, setRecordedAt] = useState<string>(new Date().toISOString().split('T')[0]);

  // Body Measurements
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [arms, setArms] = useState<string>('');
  const [thighs, setThighs] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [bodyFatPct, setBodyFatPct] = useState<string>('');

  const [progressNotes, setProgressNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMemberId) {
      setMemberId(initialMemberId);
    } else if (members.length > 0 && !memberId) {
      setMemberId(members[0].id);
    }
  }, [initialMemberId, members]);

  const selectedMember = members.find((m: any) => m.id === memberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId) {
      setError('Please select an athlete/member.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 20 || weightNum > 350) {
      setError('Please enter a valid weight in kg (between 20 and 350 kg).');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        memberId,
        weight: weightNum,
        recordedAt: new Date(recordedAt).toISOString(),
      };

      if (targetWeight) {
        const tw = parseFloat(targetWeight);
        if (!isNaN(tw)) payload.targetWeight = tw;
      }

      const bodyMeasurements: any = {};
      if (chest && !isNaN(parseFloat(chest))) bodyMeasurements.chest = parseFloat(chest);
      if (waist && !isNaN(parseFloat(waist))) bodyMeasurements.waist = parseFloat(waist);
      if (arms && !isNaN(parseFloat(arms))) bodyMeasurements.arms = parseFloat(arms);
      if (thighs && !isNaN(parseFloat(thighs))) bodyMeasurements.thighs = parseFloat(thighs);
      if (hips && !isNaN(parseFloat(hips))) bodyMeasurements.hips = parseFloat(hips);
      if (bodyFatPct && !isNaN(parseFloat(bodyFatPct))) bodyMeasurements.bodyFatPct = parseFloat(bodyFatPct);

      if (Object.keys(bodyMeasurements).length > 0) {
        payload.bodyMeasurements = bodyMeasurements;
      }

      if (progressNotes.trim()) {
        payload.progressNotes = progressNotes.trim();
      }

      const res = await recordMemberProgress(payload);
      if (res.success) {
        // Reset form
        setWeight('');
        setTargetWeight('');
        setChest('');
        setWaist('');
        setArms('');
        setThighs('');
        setHips('');
        setBodyFatPct('');
        setProgressNotes('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Failed to record progress.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Athlete Fitness Progress" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Member Selector & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B6FF45]" />
              Select Athlete / Member *
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              disabled={Boolean(initialMemberId)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-sm text-white focus:outline-none focus:border-[#B6FF45] transition-all disabled:opacity-60"
              required
            >
              <option value="">Select an athlete...</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.fullName || m.name || m.full_name} ({m.memberCode || m.member_code || 'MBR'})
                </option>
              ))}
            </select>
            {selectedMember && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Plan: <span className="text-zinc-300">{selectedMember.currentPlanName || (selectedMember as any).plan || 'Active Plan'}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B6FF45]" />
              Progress Check Date
            </label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-sm text-white focus:outline-none focus:border-[#B6FF45] transition-all"
              required
            />
          </div>
        </div>

        {/* Weight Section */}
        <div className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#B6FF45]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Body Weight Tracking</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Current Weight (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  placeholder="e.g. 76.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45] font-semibold"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-500 font-bold">KG</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Target Weight (kg) <span className="text-zinc-600">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  placeholder="e.g. 72.0"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45] font-semibold"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-500 font-bold">KG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body Circumference Measurements */}
        <div className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#B6FF45]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Body Tape Measurements & Body Fat</h4>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">Inches / Percentage</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Chest (in)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 40.5"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#151A17] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Waist (in)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 32.0"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#151A17] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Arms / Biceps (in)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 15.2"
                value={arms}
                onChange={(e) => setArms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#151A17] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Thighs (in)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 23.5"
                value={thighs}
                onChange={(e) => setThighs(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#151A17] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Hips (in)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 38.0"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#151A17] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3 text-[#B6FF45]" />
                Body Fat %
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 14.5"
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#151A17] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>
        </div>

        {/* Trainer / Progress Notes */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#B6FF45]" />
            Trainer Observations & Progress Notes
          </label>
          <textarea
            rows={3}
            placeholder="e.g., Athlete reports higher stamina and improved shoulder mobility. Target bench volume increased by 5kg this week."
            value={progressNotes}
            onChange={(e) => setProgressNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45] transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#151A17] hover:bg-[#1C2420] text-xs font-bold text-zinc-400 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(182,255,69,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving Progress...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Progress Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
