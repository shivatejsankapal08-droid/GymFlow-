import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Flame,
  Dumbbell,
  Apple,
  Calendar as CalendarIcon,
  TrendingUp,
  Bot,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Users,
  Scale,
  Ruler,
  AlertCircle,
  Trash2,
  ChevronRight,
  Info,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Zap,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { AddExerciseModal } from '../modals/AddExerciseModal';
import { WorkoutPlanBuilderModal } from '../modals/WorkoutPlanBuilderModal';
import { DietPlanBuilderModal } from '../modals/DietPlanBuilderModal';
import { RecordProgressModal } from '../modals/RecordProgressModal';
import { Exercise, WorkoutPlan, DietPlan, MemberProgressRecord } from '../../types';

export const WorkoutDietManagement: React.FC = () => {
  const {
    currentUser,
    currentGym,
    exercises,
    workoutPlans,
    dietPlans,
    workoutStats,
    members,
    fetchWorkoutStats,
    fetchExercises,
    fetchWorkoutPlans,
    fetchDietPlans,
    fetchMemberProgress,
    askAIWorkoutCoach,
    logWorkoutCompletion,
    deleteWorkoutPlan,
    deleteDietPlan,
    addToast
  } = useApp();

  const stats = workoutStats || {
    totalWorkoutPlans: 0,
    activeWorkoutPlans: 0,
    totalAssignedMembers: 0,
    completedWorkoutsToday: 0,
    upcomingTrainingSessions: 0,
    membersRequiringProgressReviews: 0,
    membersNeedingReview: [],
    recentActivity: []
  };

  // Active Tab: overview | exercises | workout-plans | diet-plans | progress | calendar | ai-assistant
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modals state
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isBuildPlanOpen, setIsBuildPlanOpen] = useState(false);
  const [isBuildDietOpen, setIsBuildDietOpen] = useState(false);
  const [isRecordProgressOpen, setIsRecordProgressOpen] = useState(false);
  const [selectedMemberForProgress, setSelectedMemberForProgress] = useState<string>('');

  // Exercise Filter State
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);

  // Workout Plans Tab State
  const [planSearch, setPlanSearch] = useState('');
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<WorkoutPlan | null>(null);

  // Diet Plans Tab State
  const [dietSearch, setDietSearch] = useState('');
  const [selectedDietDetail, setSelectedDietDetail] = useState<DietPlan | null>(null);

  // Progress Tab State
  const [progressMemberId, setProgressMemberId] = useState<string>('');
  const [progressHistory, setProgressHistory] = useState<MemberProgressRecord[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGoal, setAiGoal] = useState('Muscle Building');
  const [aiExperience, setAiExperience] = useState('Intermediate');
  const [aiDaysPerWeek, setAiDaysPerWeek] = useState(4);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; disclaimer?: string }>>([
    {
      role: 'assistant',
      text: "Hello! I am your AI Workout & Nutrition Coach. I can help generate customized training splits, suggest exercise variations (e.g., knee or lower back friendly), clarify lifting cues, and review athlete progression.",
      disclaimer: "AI guidance is for informational and educational purposes. Consult a certified personal trainer or medical specialist prior to heavy exercise."
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load Initial Data
  useEffect(() => {
    fetchWorkoutStats();
    fetchExercises();
    fetchWorkoutPlans();
    fetchDietPlans();
  }, [currentGym?.id]);

  // Set default athlete for progress tracking
  useEffect(() => {
    if (members.length > 0 && !progressMemberId) {
      const defaultId = currentUser?.role === 'member' ? currentUser.id : members[0].id;
      setProgressMemberId(defaultId);
    }
  }, [members, currentUser]);

  // Fetch progress history when progressMemberId changes
  useEffect(() => {
    if (progressMemberId) {
      loadMemberProgress(progressMemberId);
    }
  }, [progressMemberId]);

  const loadMemberProgress = async (mId: string) => {
    setProgressLoading(true);
    try {
      const records = await fetchMemberProgress(mId);
      setProgressHistory(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load member progress', err);
    } finally {
      setProgressLoading(false);
    }
  };

  // Filtered Exercises
  const muscleGroups = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio', 'Full Body'];
  const filteredExercises = exercises.filter((ex) => {
    const exName = ex.exerciseName || ex.name || '';
    const matchesSearch = exName.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(exerciseSearch.toLowerCase()));
    const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup.toLowerCase() === selectedMuscle.toLowerCase();
    const matchesDiff = selectedDifficulty === 'All' || ex.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesMuscle && matchesDiff;
  });

  // Filtered Plans
  const filteredPlans = workoutPlans.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(planSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(planSearch.toLowerCase())) ||
      (p.targetAudience && p.targetAudience.toLowerCase().includes(planSearch.toLowerCase()));
    return matchesSearch;
  });

  // Filtered Diets
  const filteredDiets = dietPlans.filter((d) => {
    const matchesSearch = d.planName.toLowerCase().includes(dietSearch.toLowerCase()) ||
      (d.memberName && d.memberName.toLowerCase().includes(dietSearch.toLowerCase())) ||
      (d.dietaryPreference && d.dietaryPreference.toLowerCase().includes(dietSearch.toLowerCase()));
    return matchesSearch;
  });

  // AI Assistant Submission
  const handleAskAI = async (customPrompt?: string) => {
    const query = customPrompt || aiPrompt;
    if (!query.trim()) return;

    const userMsg = { role: 'user' as const, text: query };
    setAiChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await askAIWorkoutCoach('suggest_plan', query, {
        goal: aiGoal,
        experienceLevel: aiExperience,
        daysPerWeek: aiDaysPerWeek,
      });

      if (res.success && res.recommendations) {
        setAiChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.recommendations.planOverview || res.recommendations.answer || JSON.stringify(res.recommendations, null, 2),
            disclaimer: res.disclaimer || 'AI workout suggestions are for general fitness conditioning only.'
          }
        ]);
      } else {
        setAiChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.error || 'Failed to fetch AI coaching recommendations.',
            disclaimer: 'Please try again with a specific fitness prompt.'
          }
        ]);
      }
    } catch (err: any) {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err.message || 'Error communicating with AI assistant.',
          disclaimer: 'System fallback activated.'
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Flame className="w-6 h-6 text-[#B6FF45]" />
                Workout & Diet Management System
              </h1>
              <Badge variant="pro">STEP 10 PRO</Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Personalized training protocols, comprehensive diet plans, exercise database, and athlete progression tracking
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddExerciseOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#090B0A] hover:bg-[#1C2420] text-zinc-300 hover:text-white border border-[#1C2420] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Dumbbell className="w-3.5 h-3.5 text-[#B6FF45]" />
              <span>Add Exercise</span>
            </button>

            <button
              onClick={() => setIsBuildDietOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#090B0A] hover:bg-[#1C2420] text-zinc-300 hover:text-white border border-[#1C2420] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Apple className="w-3.5 h-3.5 text-[#B6FF45]" />
              <span>New Diet Plan</span>
            </button>

            <button
              onClick={() => {
                setSelectedMemberForProgress('');
                setIsRecordProgressOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#090B0A] hover:bg-[#1C2420] text-zinc-300 hover:text-white border border-[#1C2420] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#B6FF45]" />
              <span>Log Progress</span>
            </button>

            <button
              onClick={() => setIsBuildPlanOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(182,255,69,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Build Workout Plan</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 pt-4 border-t border-[#1C2420] overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: Activity },
            { id: 'exercises', label: 'Exercise Library', icon: Dumbbell },
            { id: 'workout-plans', label: 'Workout Plans', icon: Flame },
            { id: 'diet-plans', label: 'Diet & Nutrition', icon: Apple },
            { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
            { id: 'calendar', label: 'Workout Calendar', icon: CalendarIcon },
            { id: 'ai-assistant', label: 'AI Workout Coach', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#B6FF45] text-black shadow-[0_0_15px_rgba(182,255,69,0.25)]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#090B0A]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & 6 LIVE KPIS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 6 Live KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Total Plans</span>
                <Flame className="w-4 h-4 text-[#B6FF45]" />
              </div>
              <div className="text-2xl font-black text-white">{stats.totalWorkoutPlans}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Gym protocols</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Active Plans</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.activeWorkoutPlans}</div>
              <div className="text-[11px] text-emerald-400 mt-1">Currently assigned</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Assigned Athletes</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.totalAssignedMembers}</div>
              <div className="text-[11px] text-zinc-500 mt-1">On active splits</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Completed Today</span>
                <Dumbbell className="w-4 h-4 text-[#B6FF45]" />
              </div>
              <div className="text-2xl font-black text-white">{stats.completedWorkoutsToday}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Exercises crushed</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Upcoming Sessions</span>
                <CalendarIcon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.upcomingTrainingSessions}</div>
              <div className="text-[11px] text-zinc-500 mt-1">PT slots scheduled</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Reviews Needed</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{stats.membersRequiringProgressReviews}</div>
              <div className="text-[11px] text-zinc-500 mt-1">&gt;14 days without log</div>
            </div>
          </div>

          {/* Review Required Athletes Banner & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Review Required Athletes */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white">Athletes Due for Progress Check-in</h3>
                </div>
                <Badge variant="pending">{stats.membersNeedingReview?.length || 0} Requiring Review</Badge>
              </div>

              {stats.membersNeedingReview && stats.membersNeedingReview.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.membersNeedingReview.map((m) => (
                    <div
                      key={m.memberId}
                      className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between gap-3 hover:border-amber-400/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          {m.memberName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{m.memberName}</h4>
                          <p className="text-[11px] text-zinc-400">
                            Code: <span className="text-zinc-300 font-mono">{m.memberCode}</span> •{' '}
                            <span className="text-amber-400 font-semibold">
                              {m.daysSinceLastReview !== null ? `${m.daysSinceLastReview} days overdue` : 'No records yet'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedMemberForProgress(m.memberId);
                          setIsRecordProgressOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-1 transition-all"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Log Progress</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#090B0A] border border-[#1C2420]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-300">All athlete progress reviews are up to date!</p>
                  <p className="text-[11px] text-zinc-500 mt-1">No members are currently overdue for their bi-weekly review.</p>
                </div>
              )}
            </div>

            {/* Quick Actions & AI Assistant Shortcut */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B6FF45]" />
                Intelligent Coach Hub
              </h3>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090B0A] to-[#151A17] border border-[#B6FF45]/20 space-y-3">
                <p className="text-xs text-zinc-300 font-semibold">
                  Generate instant hypertrophy splits or calculate daily macro targets tailored to athlete goals.
                </p>
                <button
                  onClick={() => setActiveTab('ai-assistant')}
                  className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(182,255,69,0.25)]"
                >
                  <Bot className="w-4 h-4" />
                  <span>Launch AI Coach</span>
                </button>
              </div>

              {/* Recent Activity List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Live Activity Feed</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(stats.recentActivity || []).length > 0 ? (
                    stats.recentActivity?.map((act: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center gap-2.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B6FF45] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{act.title}</p>
                          <p className="text-[10px] text-zinc-500">{act.subtitle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-4">No recent workout activity logged today.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXERCISE LIBRARY */}
      {/* ========================================================================= */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* Controls: Search, Muscle Tabs, Difficulty Dropdown, Add Button */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search exercise name, equipment, or muscle..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45] transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-zinc-300 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>

                <button
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Exercise</span>
                </button>
              </div>
            </div>

            {/* Muscle Group Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {muscleGroups.map((mg) => (
                <button
                  key={mg}
                  onClick={() => setSelectedMuscle(mg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedMuscle === mg
                      ? 'bg-[#B6FF45] text-black'
                      : 'bg-[#090B0A] text-zinc-400 hover:text-white border border-[#1C2420]'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] text-[10px] font-black uppercase tracking-wider border border-[#B6FF45]/20">
                      {ex.muscleGroup}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-semibold">{ex.difficulty}</span>
                  </div>

                  <h4 className="text-sm font-black text-white group-hover:text-[#B6FF45] transition-colors">
                    {ex.exerciseName || ex.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Equipment: <span className="text-zinc-300 font-medium">{ex.equipment || 'None'}</span>
                  </p>

                  <p className="text-xs text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                    {ex.instructions}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1C2420] flex items-center justify-between">
                  <div className="text-[11px] text-zinc-400">
                    <span className="text-white font-bold">{ex.recommendedSets || 3}</span> sets ×{' '}
                    <span className="text-white font-bold">{ex.recommendedReps || '10'}</span> reps
                  </div>

                  <button
                    onClick={() => setInspectExercise(ex)}
                    className="text-xs font-bold text-[#B6FF45] hover:underline flex items-center gap-1"
                  >
                    <span>View Cues</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-300">No exercises found matching your search</p>
              <p className="text-xs text-zinc-500 mt-1">Try clearing filters or add a new custom exercise.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKOUT PLANS */}
      {/* ========================================================================= */}
      {activeTab === 'workout-plans' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search plans by title or goal..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <button
              onClick={() => setIsBuildPlanOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(182,255,69,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span>Build 7-Day Plan</span>
            </button>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] text-[10px] font-black uppercase tracking-wider border border-[#B6FF45]/20">
                        {plan.category || 'Hypertrophy'}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-semibold">{plan.level}</span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1.5">{plan.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{plan.targetAudience}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      plan.status === 'active' || !plan.status
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {plan.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                    {currentUser?.role !== 'member' && (
                      <button
                        onClick={() => deleteWorkoutPlan(plan.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Meta */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Duration</span>
                    <span className="font-bold text-white">{plan.durationWeeks} Weeks</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Frequency</span>
                    <span className="font-bold text-[#B6FF45]">{plan.daysPerWeek} Days/Wk</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Trainer</span>
                    <span className="font-bold text-white truncate block">{plan.trainerName || 'Staff Coach'}</span>
                  </div>
                </div>

                {/* Weekly Exercises Accordion / Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-[#B6FF45]" />
                    Scheduled Routines & Exercises
                  </span>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {plan.exercises && plan.exercises.length > 0 ? (
                      plan.exercises.map((dayGroup, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs">
                          <p className="font-bold text-[#B6FF45] mb-1">{dayGroup.day}</p>
                          <div className="space-y-1">
                            {dayGroup.items?.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between text-[11px] text-zinc-400">
                                <span className="font-medium text-white">{item.name}</span>
                                <span className="text-zinc-400 font-mono">
                                  {item.sets} sets × {item.reps} ({item.rest || '60s'})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic p-2">No exercises configured for this routine.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlans.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <Flame className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-300">No workout plans found</p>
              <p className="text-xs text-zinc-500 mt-1">Click "Build 7-Day Plan" to create a routine.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIET & NUTRITION PLANS */}
      {/* ========================================================================= */}
      {activeTab === 'diet-plans' && (
        <div className="space-y-6">
          {/* Header & Medical Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Professional Nutrition Disclaimer:</span> Dietary suggestions and macro calculations are intended solely for fitness conditioning and sports nutrition. They do not constitute medical diagnosis or therapeutic treatment. Athletes with medical conditions or allergies should consult a licensed healthcare professional.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search diet plans by title, athlete, or diet type..."
                value={dietSearch}
                onChange={(e) => setDietSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <button
              onClick={() => setIsBuildDietOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(182,255,69,0.25)]"
            >
              <Apple className="w-4 h-4" />
              <span>Create Diet Plan</span>
            </button>
          </div>

          {/* Diet Plan Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredDiets.map((diet) => (
              <div
                key={diet.id}
                className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] hover:border-[#B6FF45]/30 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] text-[10px] font-black uppercase tracking-wider border border-[#B6FF45]/20">
                        {diet.dietaryPreference}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-semibold">{diet.fitnessGoal}</span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1.5">{diet.planName}</h3>
                    <p className="text-xs text-zinc-400">
                      Assigned to: <span className="text-zinc-200 font-semibold">{diet.memberName}</span>
                    </p>
                  </div>

                  {currentUser?.role !== 'member' && (
                    <button
                      onClick={() => deleteDietPlan(diet.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Diet Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Macro Target Summary */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Calories</span>
                    <span className="font-black text-white">{diet.totalCalories || 0} kcal</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Protein</span>
                    <span className="font-black text-[#B6FF45]">{diet.totalProtein || 0}g</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Carbs</span>
                    <span className="font-black text-cyan-400">{diet.totalCarbs || 0}g</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Fats</span>
                    <span className="font-black text-amber-400">{diet.totalFat || 0}g</span>
                  </div>
                </div>

                {/* Meal Breakdown List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300">Daily Meal Schedule (6 Slots)</span>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {diet.meals && diet.meals.length > 0 ? (
                      diet.meals.map((meal, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-black text-[#B6FF45] uppercase tracking-wider block">
                              {meal.mealName}
                            </span>
                            <span className="font-bold text-white">{meal.foodName}</span>
                            <span className="text-zinc-400 text-[11px] block">{meal.portionSize}</span>
                          </div>
                          <div className="text-right font-mono text-[11px] text-zinc-400">
                            <div>{meal.calories || 0} kcal</div>
                            <div className="text-[10px] text-zinc-500">P: {meal.protein || 0}g | C: {meal.carbohydrates || 0}g</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic p-2">No meals scheduled in this plan.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDiets.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <Apple className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-300">No diet plans found</p>
              <p className="text-xs text-zinc-500 mt-1">Click "Create Diet Plan" to design a nutrition guide.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PROGRESS TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Athlete Selector & Log Button */}
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#B6FF45]" />
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">Viewing Athlete</label>
                <select
                  value={progressMemberId}
                  onChange={(e) => setProgressMemberId(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs font-bold text-white focus:outline-none focus:border-[#B6FF45]"
                >
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName || m.name || m.full_name} ({m.memberCode || 'MBR'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedMemberForProgress(progressMemberId);
                setIsRecordProgressOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(182,255,69,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Progress Check</span>
            </button>
          </div>

          {/* Progress Metrics & Weight Progression */}
          {progressHistory.length > 0 ? (
            <div className="space-y-6">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <span className="text-xs text-zinc-400 font-semibold block mb-1">Current Weight</span>
                  <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
                    {progressHistory[0].weight} <span className="text-sm font-bold text-[#B6FF45]">KG</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Recorded {new Date(progressHistory[0].recordedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <span className="text-xs text-zinc-400 font-semibold block mb-1">Previous Weight</span>
                  <div className="text-3xl font-black text-zinc-300 flex items-baseline gap-1.5">
                    {progressHistory[1]?.weight || progressHistory[0].previousWeight || progressHistory[0].weight}{' '}
                    <span className="text-sm font-bold text-zinc-500">KG</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Prior milestone</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <span className="text-xs text-zinc-400 font-semibold block mb-1">Target Weight</span>
                  <div className="text-3xl font-black text-cyan-400 flex items-baseline gap-1.5">
                    {progressHistory[0].targetWeight || '—'}{' '}
                    <span className="text-sm font-bold text-cyan-500">KG</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Goal target</span>
                </div>
              </div>

              {/* Latest Tape Measurements */}
              {progressHistory[0].bodyMeasurements && (
                <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[#B6FF45]" />
                    Latest Body Circumference & Composition
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase">Chest</span>
                      <span className="text-sm font-black text-white">{progressHistory[0].bodyMeasurements.chest || '—'} in</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase">Waist</span>
                      <span className="text-sm font-black text-white">{progressHistory[0].bodyMeasurements.waist || '—'} in</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase">Arms</span>
                      <span className="text-sm font-black text-white">{progressHistory[0].bodyMeasurements.arms || '—'} in</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase">Thighs</span>
                      <span className="text-sm font-black text-white">{progressHistory[0].bodyMeasurements.thighs || '—'} in</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase">Hips</span>
                      <span className="text-sm font-black text-white">{progressHistory[0].bodyMeasurements.hips || '—'} in</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <span className="text-[10px] text-[#B6FF45] block uppercase">Body Fat</span>
                      <span className="text-sm font-black text-[#B6FF45]">{progressHistory[0].bodyMeasurements.bodyFatPct || '—'}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress History Table */}
              <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
                <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">Historical Progress Logs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#090B0A] text-zinc-400 font-bold border-b border-[#1C2420]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Weight (kg)</th>
                        <th className="py-2.5 px-3">Target (kg)</th>
                        <th className="py-2.5 px-3">Body Fat %</th>
                        <th className="py-2.5 px-3">Trainer Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C2420]">
                      {progressHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#090B0A]/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white">
                            {new Date(rec.recordedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#B6FF45]">{rec.weight} kg</td>
                          <td className="py-2.5 px-3 text-zinc-400">{rec.targetWeight ? `${rec.targetWeight} kg` : '—'}</td>
                          <td className="py-2.5 px-3 text-zinc-400">{rec.bodyMeasurements?.bodyFatPct ? `${rec.bodyMeasurements.bodyFatPct}%` : '—'}</td>
                          <td className="py-2.5 px-3 text-zinc-300 max-w-xs truncate">{rec.progressNotes || 'Regular progression check-in'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <Scale className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-300">No progress records found for this athlete</p>
              <p className="text-xs text-zinc-500 mt-1">Click "Record New Progress Check" to log baseline weight and measurements.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: WORKOUT CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-[#B6FF45]" />
              <h3 className="text-sm font-black text-white">Weekly Training & Recovery Calendar</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B6FF45]" />
              <span className="text-[11px] text-zinc-400 font-semibold mr-3">Training Day</span>
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              <span className="text-[11px] text-zinc-400 font-semibold">Active Rest</span>
            </div>
          </div>

          {/* 7 Days Weekly Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { day: 'Monday', title: 'Chest & Triceps Push', exercises: 4, isRest: false },
              { day: 'Tuesday', title: 'Back & Biceps Pull', exercises: 5, isRest: false },
              { day: 'Wednesday', title: 'Active Recovery & Core', exercises: 0, isRest: true },
              { day: 'Thursday', title: 'Legs & Calves Hypertrophy', exercises: 5, isRest: false },
              { day: 'Friday', title: 'Shoulders & Arms Focus', exercises: 4, isRest: false },
              { day: 'Saturday', title: 'Conditioning & HIIT', exercises: 3, isRest: false },
              { day: 'Sunday', title: 'Full Rest & Mobility', exercises: 0, isRest: true },
            ].map((slot, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  slot.isRest
                    ? 'bg-[#090B0A] border-[#1C2420] text-zinc-500'
                    : 'bg-[#151A17] border-[#1C2420] hover:border-[#B6FF45]/40 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">{slot.day}</span>
                  {slot.isRest ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400">REST</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#B6FF45]/10 text-[#B6FF45] font-black">
                      {slot.exercises} EX
                    </span>
                  )}
                </div>
                <h5 className="text-xs font-black line-clamp-1">{slot.title}</h5>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {slot.isRest ? 'Hydration & soft tissue recovery' : 'High volume progressive overload'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: AI WORKOUT COACH */}
      {/* ========================================================================= */}
      {activeTab === 'ai-assistant' && (
        <div className="space-y-6">
          {/* Medical Disclaimer Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Medical & Safety Notice:</span> AI recommendations are designed for healthy adults seeking athletic conditioning. They are not medical prescriptions. Always warm up thoroughly and verify proper biomechanics with a qualified trainer.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Prompt Setup & Presets */}
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B6FF45]" />
                Routine Parameters
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Primary Fitness Goal</label>
                  <select
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white focus:outline-none focus:border-[#B6FF45]"
                  >
                    <option value="Muscle Building">Muscle Building (Hypertrophy)</option>
                    <option value="Fat Loss & Definition">Fat Loss & Definition</option>
                    <option value="Strength & Power">Strength & Power</option>
                    <option value="Endurance">Endurance & Conditioning</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Experience Level</label>
                  <select
                    value={aiExperience}
                    onChange={(e) => setAiExperience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white focus:outline-none focus:border-[#B6FF45]"
                  >
                    <option value="Beginner">Beginner (0-1 yrs)</option>
                    <option value="Intermediate">Intermediate (1-3 yrs)</option>
                    <option value="Advanced">Advanced (3+ yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Frequency (Days/Week)</label>
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={aiDaysPerWeek}
                    onChange={(e) => setAiDaysPerWeek(parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white focus:outline-none focus:border-[#B6FF45]"
                  />
                </div>
              </div>

              {/* Prompt Shortcuts */}
              <div className="pt-2 border-t border-[#1C2420] space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">One-Click Prompts</span>
                {[
                  "Suggest 4-Day Upper/Lower Strength Split",
                  "Recommend knee-friendly alternatives for Squats",
                  "Explain form cues and safety for Deadlifts",
                  "Calculate daily protein and calories for 75kg athlete"
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(preset)}
                    className="w-full text-left p-2 rounded-xl bg-[#090B0A] hover:bg-[#1C2420] border border-[#1C2420] hover:border-[#B6FF45]/30 text-[11px] text-zinc-300 transition-all truncate block"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Conversation Area */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col justify-between h-[520px]">
              {/* Message List */}
              <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                {aiChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl text-xs space-y-2 ${
                      msg.role === 'user'
                        ? 'bg-[#B6FF45]/10 border border-[#B6FF45]/30 text-white ml-8'
                        : 'bg-[#090B0A] border border-[#1C2420] text-zinc-200 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[11px]">
                      {msg.role === 'user' ? (
                        <>
                          <User className="w-3.5 h-3.5 text-[#B6FF45]" />
                          <span className="text-[#B6FF45]">You</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-[#B6FF45]" />
                          <span className="text-white">GymFlow AI Coach</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    {msg.disclaimer && (
                      <p className="text-[10px] text-zinc-500 italic pt-1 border-t border-[#1C2420]">
                        {msg.disclaimer}
                      </p>
                    )}
                  </div>
                ))}
                {aiLoading && (
                  <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-xs text-zinc-400 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#B6FF45] border-t-transparent rounded-full animate-spin" />
                    <span>AI Coach is synthesizing fitness protocols...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="pt-4 border-t border-[#1C2420] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask for routine adjustments, lifting cues, or macro plans..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-black font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSuccess={() => fetchExercises()}
      />

      <WorkoutPlanBuilderModal
        isOpen={isBuildPlanOpen}
        onClose={() => setIsBuildPlanOpen(false)}
        onSuccess={() => {
          fetchWorkoutPlans();
          fetchWorkoutStats();
        }}
      />

      <DietPlanBuilderModal
        isOpen={isBuildDietOpen}
        onClose={() => setIsBuildDietOpen(false)}
        onSuccess={() => fetchDietPlans()}
      />

      <RecordProgressModal
        isOpen={isRecordProgressOpen}
        onClose={() => setIsRecordProgressOpen(false)}
        initialMemberId={selectedMemberForProgress || progressMemberId}
        onSuccess={() => {
          if (progressMemberId) loadMemberProgress(progressMemberId);
          fetchWorkoutStats();
        }}
      />

      {/* Exercise Detail Modal */}
      {inspectExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] text-[10px] font-black uppercase tracking-wider">
                  {inspectExercise.muscleGroup}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{inspectExercise.exerciseName || inspectExercise.name}</h3>
              </div>
              <button
                onClick={() => setInspectExercise(null)}
                className="text-zinc-500 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-zinc-300 block mb-1">Execution & Form Cues:</span>
                <p className="text-zinc-400 leading-relaxed bg-[#090B0A] p-3 rounded-xl border border-[#1C2420]">
                  {inspectExercise.instructions}
                </p>
              </div>

              {inspectExercise.safetyNotes && (
                <div>
                  <span className="font-bold text-amber-400 block mb-1">Safety & Joint Precautions:</span>
                  <p className="text-amber-300/90 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    {inspectExercise.safetyNotes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                  <span className="text-[10px] text-zinc-500 block">Sets</span>
                  <span className="font-bold text-white">{inspectExercise.recommendedSets}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                  <span className="text-[10px] text-zinc-500 block">Reps</span>
                  <span className="font-bold text-white">{inspectExercise.recommendedReps}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#090B0A] border border-[#1C2420]">
                  <span className="text-[10px] text-zinc-500 block">Rest</span>
                  <span className="font-bold text-[#B6FF45]">{inspectExercise.restSeconds || inspectExercise.restDurationSeconds || 60}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
