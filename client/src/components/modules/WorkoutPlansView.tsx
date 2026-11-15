import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Flame,
  Plus,
  Dumbbell,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const WorkoutPlansView: React.FC = () => {
  const { workoutPlans, addWorkoutPlan, setActivePage, addToast, globalSearch, setGlobalSearch } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(workoutPlans[0]?.id || '');

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [category, setCategory] = useState<'Hypertrophy' | 'Strength' | 'Fat Loss' | 'Functional'>('Hypertrophy');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [targetAudience, setTargetAudience] = useState('');

  const filteredWorkoutPlans = workoutPlans.filter((w) => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return (
      w.title.toLowerCase().includes(q) ||
      (w.category && w.category.toLowerCase().includes(q)) ||
      (w.level && w.level.toLowerCase().includes(q))
    );
  });

  const activePlan = filteredWorkoutPlans.find((w) => w.id === selectedPlanId) || filteredWorkoutPlans[0] || workoutPlans[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkoutPlan({
      title,
      level,
      category,
      durationWeeks: Number(durationWeeks),
      daysPerWeek: Number(daysPerWeek),
      targetAudience: targetAudience || 'Athletes seeking progressive overload',
      trainerName: 'Alex Rivera',
      exercises: [
        {
          day: 'Day 1: Compound Foundations',
          items: [
            { name: 'Barbell Bench Press', sets: '4', reps: '8-10', rest: '90s' },
            { name: 'Barbell Squat', sets: '4', reps: '8', rest: '120s' },
            { name: 'Barbell Row', sets: '3', reps: '10', rest: '75s' },
          ],
        },
      ],
    });
    setIsAddModalOpen(false);
    setTitle('');
  };

  const handleAssignToMember = () => {
    addToast({
      type: 'success',
      title: 'Routine Assigned',
      message: `${activePlan?.title} assigned to athlete's mobile pass.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#B6FF45]" />
              Workout Plans & Exercise Protocols
            </h1>
            <Badge variant="pro">ROUTINES</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Structured strength splits, progressive overload volume targets and AI exercise routines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('ai-assistant')}
            className="px-4 py-2 rounded-xl bg-[#151A17] hover:bg-[#1C2420] text-[#B6FF45] font-bold text-xs border border-[#B6FF45]/30 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Routine Builder</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Protocol</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routine Selector Cards */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Available Programs ({filteredWorkoutPlans.length})
          </p>
          {filteredWorkoutPlans.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#151A17] border border-[#1C2420] text-center">
              <Dumbbell className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-zinc-300">No programs match</p>
              <p className="text-[11px] text-zinc-500 mt-1">Try another search keyword.</p>
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="mt-2.5 px-3 py-1 rounded-lg bg-[#0F1311] text-[#B6FF45] font-semibold text-xs border border-[#1C2420]"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            filteredWorkoutPlans.map((wp) => {
              const isSelected = wp.id === activePlan?.id;
              return (
                <div
                  key={wp.id}
                  onClick={() => setSelectedPlanId(wp.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#151A17] border-[#B6FF45] shadow-[0_0_15px_rgba(182,255,69,0.1)]'
                      : 'bg-[#151A17]/60 border-[#1C2420] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="starter" size="sm">
                      {(wp.level || 'Intermediate').toUpperCase()}
                    </Badge>
                    <span className="text-[11px] font-bold text-[#B6FF45]">{wp.category || 'Hypertrophy'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{wp.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{wp.targetAudience}</p>

                  <div className="mt-3 pt-3 border-t border-[#1C2420] flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{wp.daysPerWeek} Days / Week</span>
                    <span>{wp.durationWeeks} Weeks</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 2 Columns: Detailed Routine & Day-by-Day Breakdown */}
        {activePlan && (
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1C2420] mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">{activePlan.title}</h2>
                    <Badge variant="pro">{(activePlan.level || 'Intermediate').toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Coach: <strong className="text-white">{activePlan.trainerName}</strong> • {activePlan.durationWeeks} Weeks • {activePlan.daysPerWeek} Sessions/wk
                  </p>
                </div>

                <button
                  onClick={handleAssignToMember}
                  className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider self-start sm:self-auto transition-all shadow-md shadow-[#B6FF45]/20"
                >
                  Assign to Athlete
                </button>
              </div>

              {/* Day by Day Exercise Tables */}
              <div className="space-y-5">
                {(activePlan.exercises || []).map((dayGroup, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#0F1311] border border-[#1C2420]">
                    <h4 className="text-xs font-bold text-[#B6FF45] mb-3 flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      {dayGroup.day}
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-zinc-500 uppercase tracking-wider text-[10px] border-b border-[#1C2420]">
                            <th className="pb-2">Exercise Name</th>
                            <th className="pb-2">Working Sets</th>
                            <th className="pb-2">Target Reps</th>
                            <th className="pb-2">Rest Interval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C2420]">
                          {dayGroup.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="hover:bg-[#151A17]/60">
                              <td className="py-2.5 font-bold text-white">{item.name}</td>
                              <td className="py-2.5 font-mono text-[#B6FF45] font-semibold">{item.sets}</td>
                              <td className="py-2.5 text-zinc-300">{item.reps}</td>
                              <td className="py-2.5 text-zinc-400">{item.rest}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1C2420] flex items-center justify-between text-xs text-zinc-400">
              <span>Scientific progressive overload tracking enabled</span>
              <button
                onClick={() => setActivePage('ai-assistant')}
                className="text-[#B6FF45] font-bold hover:underline flex items-center gap-1"
              >
                <span>Ask AI to swap an exercise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Protocol Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Workout Program"
        subtitle="Standardized training protocol for athletes & personal trainers"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Program Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 5x5 Powerlifting Strength Peaking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Target Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="Hypertrophy">Hypertrophy (Muscle Size)</option>
                <option value="Strength">Strength (Compound 1RM)</option>
                <option value="Fat Loss">Fat Loss & HIIT</option>
                <option value="Functional">Functional & Athletic</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Experience Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced / Athlete</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Sessions Per Week</label>
              <input
                type="number"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Objective / Target Audience</label>
            <input
              type="text"
              placeholder="e.g. Designed for intermediate lifters plateaued on bench and squat"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider transition-all"
          >
            Publish Protocol
          </button>
        </form>
      </Modal>
    </div>
  );
};
