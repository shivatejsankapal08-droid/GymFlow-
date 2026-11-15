import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Users, Dumbbell, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { Badge } from '../common/Badge';

interface AssignMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedTrainerId?: string;
}

export const AssignMembersModal: React.FC<AssignMembersModalProps> = ({
  isOpen,
  onClose,
  preSelectedTrainerId,
}) => {
  const {
    trainers,
    members,
    currentGym,
    assignMembersToTrainer,
  } = useApp();

  const gymTrainers = trainers.filter(
    (t) => t.gymId === currentGym.id || (t as any).gym_id === currentGym.id
  );
  const gymMembers = members.filter(
    (m) => m.gymId === currentGym.id || (m as any).gym_id === currentGym.id
  );

  const [selectedTrainerId, setSelectedTrainerId] = useState(
    preSelectedTrainerId || (gymTrainers[0]?.id ?? '')
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTrainer = gymTrainers.find((t) => t.id === selectedTrainerId);

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnassigned = () => {
    const unassigned = gymMembers
      .filter((m) => !m.assignedTrainerId && !(m as any).assigned_trainer_id)
      .map((m) => m.id);
    setSelectedMemberIds(unassigned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainerId || selectedMemberIds.length === 0) return;

    setIsSubmitting(true);
    const result = await assignMembersToTrainer(
      selectedTrainerId,
      selectedMemberIds,
      notes || `Assigned to ${selectedTrainer?.fullName}`
    );
    setIsSubmitting(false);

    if (result.success) {
      setSelectedMemberIds([]);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Athletes to Coach"
      subtitle={`Multi-tenant protected athlete allocation for ${currentGym.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Coach Selection */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Select Coach *</label>
          <select
            value={selectedTrainerId}
            onChange={(e) => setSelectedTrainerId(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
          >
            {gymTrainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.specialization}) • {t.assignedMembersCount || 0} Athletes
              </option>
            ))}
          </select>
        </div>

        {/* Coach Workload Preview */}
        {selectedTrainer && (
          <div className="p-3 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-4 h-4 text-[#B6FF45]" />
              <div>
                <p className="font-bold text-white text-xs">{selectedTrainer.fullName}</p>
                <p className="text-[11px] text-zinc-400">
                  Current: {selectedTrainer.assignedMembersCount || 0} / 20 athletes assigned
                </p>
              </div>
            </div>
            <Badge variant="pro">
              {20 - (selectedTrainer.assignedMembersCount || 0)} Slots Available
            </Badge>
          </div>
        )}

        {/* Athletes List */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-semibold text-zinc-300">
              Select Athletes ({selectedMemberIds.length} selected)
            </label>
            <button
              type="button"
              onClick={handleSelectAllUnassigned}
              className="text-[11px] text-[#B6FF45] hover:underline font-bold"
            >
              Select All Unassigned
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#1C2420] rounded-2xl bg-[#0F1311] border border-[#1C2420]">
            {gymMembers.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">No members in this gym facility.</div>
            ) : (
              gymMembers.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                const isAssigned = Boolean(m.assignedTrainerId || (m as any).assigned_trainer_id);

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'bg-[#B6FF45]/10' : 'hover:bg-[#151A17]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded accent-[#B6FF45]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-xs">{m.fullName}</p>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {m.memberCode || 'MBR'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Plan: {m.planName || 'Standard'} •{' '}
                          {isAssigned ? (
                            <span className="text-zinc-400">
                              Assigned to {m.assignedTrainerName || 'Coach'}
                            </span>
                          ) : (
                            <span className="text-amber-400">Unassigned</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isSelected ? 'completed' : isAssigned ? 'pro' : 'pending'}>
                      {isSelected ? 'SELECTED' : isAssigned ? 'ASSIGNED' : 'OPEN'}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Assignment Notes</label>
          <input
            type="text"
            placeholder="Focus on 12-week hypertrophy program..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Buttons */}
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
            disabled={isSubmitting || selectedMemberIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Assigning...' : `Assign ${selectedMemberIds.length} Athlete(s)`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
