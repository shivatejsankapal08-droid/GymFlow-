import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Dumbbell, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createExercise, currentGym } = useApp();

  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Legs' | 'Abs' | 'Cardio' | 'Full Body'>('Chest');
  const [category, setCategory] = useState('Strength');
  const [equipment, setEquipment] = useState('Barbell');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [instructions, setInstructions] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [recommendedSets, setRecommendedSets] = useState(3);
  const [recommendedReps, setRecommendedReps] = useState('10-12');
  const [restSeconds, setRestSeconds] = useState(60);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim() || !instructions.trim()) return;

    setIsSubmitting(true);
    const result = await createExercise({
      exerciseName: exerciseName.trim(),
      muscleGroup,
      category,
      equipment,
      difficulty,
      instructions: instructions.trim(),
      safetyNotes: safetyNotes.trim(),
      recommendedSets: Number(recommendedSets),
      recommendedReps: recommendedReps.trim(),
      restSeconds: Number(restSeconds),
      mediaUrl: mediaUrl.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
      // Reset form
      setExerciseName('');
      setInstructions('');
      setSafetyNotes('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Exercise" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner */}
        <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-[#B6FF45]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Gym-Specific Exercise Definition</h4>
            <p className="text-[11px] text-zinc-400">
              This exercise will be available for trainers to assign at <strong className="text-zinc-200">{currentGym.name}</strong>.
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Exercise Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Deficit Trap Bar Deadlift"
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Primary Muscle Group <span className="text-red-400">*</span>
            </label>
            <select
              value={muscleGroup}
              onChange={(e: any) => setMuscleGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Biceps">Biceps</option>
              <option value="Triceps">Triceps</option>
              <option value="Legs">Legs</option>
              <option value="Abs">Abs</option>
              <option value="Cardio">Cardio</option>
              <option value="Full Body">Full Body</option>
            </select>
          </div>
        </div>

        {/* Category, Equipment, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Strength">Strength</option>
              <option value="Hypertrophy">Hypertrophy</option>
              <option value="Endurance">Endurance</option>
              <option value="Mobility">Mobility</option>
              <option value="Calisthenics">Calisthenics</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Equipment</label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Barbell">Barbell</option>
              <option value="Dumbbells">Dumbbells</option>
              <option value="Cable">Cable</option>
              <option value="Machine">Machine</option>
              <option value="Bodyweight">Bodyweight</option>
              <option value="Kettlebell">Kettlebell</option>
              <option value="Resistance Bands">Resistance Bands</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e: any) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Prescription: Sets, Reps, Rest */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Default Sets</label>
            <input
              type="number"
              min={1}
              max={10}
              value={recommendedSets}
              onChange={(e) => setRecommendedSets(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Default Reps / Time</label>
            <input
              type="text"
              value={recommendedReps}
              onChange={(e) => setRecommendedReps(e.target.value)}
              placeholder="e.g. 10-12 or 45s"
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Rest Duration (Seconds)</label>
            <input
              type="number"
              min={15}
              max={300}
              step={15}
              value={restSeconds}
              onChange={(e) => setRestSeconds(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            />
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
            Step-by-Step Instructions <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="1. Setup posture and foot alignment&#10;2. Execute concentric movement&#10;3. Controlled eccentric return"
            className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Safety Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Safety Notes & Form Warnings</span>
          </label>
          <input
            type="text"
            value={safetyNotes}
            onChange={(e) => setSafetyNotes(e.target.value)}
            placeholder="e.g. Maintain neutral lumbar spine; avoid neck hyperextension."
            className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Media URL */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Media / Demo Image URL (Optional)</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#1C2420] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] text-zinc-300 text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#B6FF45]/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save to Library</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
