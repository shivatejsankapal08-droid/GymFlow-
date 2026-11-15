import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Flame,
  Plus,
  Trash2,
  Calendar,
  Dumbbell,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

interface WorkoutPlanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const WorkoutPlanBuilderModal: React.FC<WorkoutPlanBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    members,
    trainers,
    exercises,
    createWorkoutPlan,
    currentGym,
  } = useApp();

  const [planName, setPlanName] = useState('');
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [trainerId, setTrainerId] = useState(trainers[0]?.id || '');
  const [fitnessGoal, setFitnessGoal] = useState<'Weight Loss' | 'Muscle Building' | 'Strength' | 'Endurance' | 'General Fitness'>('Muscle Building');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [trainerNotes, setTrainerNotes] = useState('');

  // Weekly schedule state: map of day -> exercises array
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [day: string]: {
      exerciseId: string;
      exerciseName: string;
      sets: number;
      repetitions: string;
      restSeconds: number;
      notes?: string;
    }[];
  }>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  // New exercise inline form for current day
  const [newExerciseId, setNewExerciseId] = useState(exercises[0]?.id || 'ex-101');
  const [newSets, setNewSets] = useState(4);
  const [newReps, setNewReps] = useState('8-10');
  const [newRest, setNewRest] = useState(90);
  const [newNotes, setNewNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddExerciseToDay = () => {
    const selectedEx = exercises.find((e) => e.id === newExerciseId) || exercises[0];
    const exerciseName = selectedEx ? selectedEx.exerciseName : 'Barbell Exercise';

    setWeeklySchedule((prev) => ({
      ...prev,
      [selectedDay]: [
        ...(prev[selectedDay] || []),
        {
          exerciseId: newExerciseId,
          exerciseName,
          sets: Number(newSets),
          repetitions: newReps,
          restSeconds: Number(newRest),
          notes: newNotes,
        },
      ],
    }));

    setNewNotes('');
  };

  const handleRemoveExercise = (day: string, index: number) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !memberId) return;

    // Flatten weeklySchedule into array
    const flattenedSchedule: any[] = [];
    Object.keys(weeklySchedule).forEach((day) => {
      weeklySchedule[day].forEach((item, idx) => {
        flattenedSchedule.push({
          dayOfWeek: day,
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          sets: item.sets,
          repetitions: item.repetitions,
          restSeconds: item.restSeconds,
          displayOrder: idx + 1,
          notes: item.notes,
        });
      });
    });

    setIsSubmitting(true);
    const result = await createWorkoutPlan({
      planName: planName.trim(),
      memberId,
      trainerId,
      fitnessGoal,
      difficulty,
      startDate,
      endDate,
      trainerNotes: trainerNotes.trim(),
      weeklySchedule: flattenedSchedule,
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const currentDayExercises = weeklySchedule[selectedDay] || [];
  const totalScheduledExercises = Object.values(weeklySchedule).reduce(
    (sum, list) => sum + list.length,
    0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workout Plan Builder" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B6FF45]/10 border border-[#B6FF45]/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-[#B6FF45]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Routine & Periodization Designer</h4>
              <p className="text-xs text-zinc-400">
                Schedule daily exercises, volume targets, and progressive overload protocols.
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Weekly Volume</span>
            <span className="text-xs font-bold text-[#B6FF45]">
              {totalScheduledExercises} Total Exercises Scheduled
            </span>
          </div>
        </div>

        {/* Basic Plan Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Workout Plan Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. 12-Week Lean Hypertrophy & Power Split"
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Assign to Member <span className="text-red-400">*</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Goal, Trainer, Difficulty, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Fitness Goal</label>
            <select
              value={fitnessGoal}
              onChange={(e: any) => setFitnessGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Muscle Building">Muscle Building</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Strength">Strength</option>
              <option value="Endurance">Endurance</option>
              <option value="General Fitness">General Fitness</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Supervising Trainer</label>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.specialization})
                </option>
              ))}
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

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            />
          </div>
        </div>

        {/* Weekly Day Tabs */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-2">
            Weekly Routine Schedule
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DAYS_OF_WEEK.map((day) => {
              const count = weeklySchedule[day]?.length || 0;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#B6FF45] text-zinc-950 shadow-md shadow-[#B6FF45]/20'
                      : 'bg-[#151A17] text-zinc-400 hover:text-white hover:bg-[#1C2420] border border-[#1C2420]'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-zinc-950/20 text-zinc-950 font-black'
                        : count > 0
                        ? 'bg-[#B6FF45]/20 text-[#B6FF45]'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Day Exercise List & Add Drawer */}
        <div className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#B6FF45]" />
              <span>{selectedDay} Exercises</span>
            </h5>
            <span className="text-[10px] text-zinc-400">
              {currentDayExercises.length === 0 ? 'Rest Day (No exercises scheduled)' : `${currentDayExercises.length} movements configured`}
            </span>
          </div>

          {/* List of exercises on selected day */}
          {currentDayExercises.length > 0 && (
            <div className="space-y-2">
              {currentDayExercises.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h6 className="text-xs font-bold text-white">{item.exerciseName}</h6>
                      <p className="text-[11px] text-[#B6FF45] font-semibold">
                        {item.sets} sets × {item.repetitions} • {item.restSeconds}s rest
                        {item.notes && <span className="text-zinc-400 font-normal"> — {item.notes}</span>}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(selectedDay, idx)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise to Day Form */}
          <div className="p-3 rounded-xl bg-[#151A17]/60 border border-[#1C2420] space-y-2.5">
            <span className="text-[11px] font-bold text-zinc-300 block">
              + Add Movement to {selectedDay}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={newExerciseId}
                  onChange={(e) => setNewExerciseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.exerciseName} ({ex.muscleGroup} • {ex.equipment})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newSets}
                  onChange={(e) => setNewSets(Number(e.target.value))}
                  placeholder="Sets"
                  className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newReps}
                  onChange={(e) => setNewReps(e.target.value)}
                  placeholder="Reps (e.g. 10-12)"
                  className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Specific cues (e.g. 2-second eccentric, drop set on final round)"
                className="flex-1 px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
              <button
                type="button"
                onClick={handleAddExerciseToDay}
                className="px-4 py-2 rounded-xl bg-[#B6FF45]/10 hover:bg-[#B6FF45]/20 text-[#B6FF45] font-bold text-xs border border-[#B6FF45]/30 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to {selectedDay}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trainer Periodization Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
            Trainer Periodization & Coaching Notes
          </label>
          <textarea
            rows={2}
            value={trainerNotes}
            onChange={(e) => setTrainerNotes(e.target.value)}
            placeholder="e.g. Progressive overload cycle: Add 2.5kg each Monday. Deload every 6th week."
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
            disabled={isSubmitting || totalScheduledExercises === 0}
            className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#B6FF45]/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Assigning Plan...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Assign Workout Plan to Athlete</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
