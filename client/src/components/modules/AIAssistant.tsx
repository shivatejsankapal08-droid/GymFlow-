import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Bot,
  Sparkles,
  Send,
  User,
  Dumbbell,
  Utensils,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Trash2,
  Plus,
  ShieldCheck,
  FileText,
  Activity,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';
import {
  AIConversation,
  AIMessageRecord,
  AIGeneratedPlan,
  AIUsageStats,
  AIBusinessInsightsData,
} from '../../types';

export const AIAssistant: React.FC = () => {
  const { currentUser, currentGym, members } = useApp();
  const isOwner = currentUser?.role === 'gym_owner' || currentUser?.role === 'super_admin';
  const isTrainer = currentUser?.role === 'trainer';
  const isMember = currentUser?.role === 'member';

  // Navigation Tabs
  type TabType = 'chat' | 'workout-generator' | 'diet-assistant' | 'business-insights' | 'plans-approval' | 'usage';
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // Chat State
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageRecord[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [engineSource, setEngineSource] = useState<string>('gymflow_engine');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Workout Generator Form State
  const [workoutGoal, setWorkoutGoal] = useState('Hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [availableDays, setAvailableDays] = useState(4);
  const [equipmentAvailability, setEquipmentAvailability] = useState('Full Gym');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [targetMemberId, setTargetMemberId] = useState('');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  // Diet Generator Form State
  const [dietGoal, setDietGoal] = useState('Muscle Gain');
  const [dietaryPref, setDietaryPref] = useState('High-Protein Non-Veg');
  const [foodChoices, setFoodChoices] = useState('Oats, eggs, chicken breast, paneer, brown basmati rice, whey');
  const [mealCount, setMealCount] = useState(5);
  const [targetCalories, setTargetCalories] = useState(2650);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [generatedDiet, setGeneratedDiet] = useState<any>(null);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);

  // Business Insights State
  const [businessData, setBusinessData] = useState<AIBusinessInsightsData | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Plans & Approvals State
  const [plansList, setPlansList] = useState<AIGeneratedPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [planFilter, setPlanFilter] = useState<'all' | 'draft' | 'approved' | 'rejected'>('all');

  // AI Usage Stats State
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const BASE_URL = 'http://localhost:5000';

  const getAuthToken = () => {
    return localStorage.getItem('gymflow_token') || 'demo-token-gym_owner';
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    'X-Gym-Id': currentGym?.id || '11111111-1111-1111-1111-111111111111',
  });

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, activeTab]);

  // Load Conversations on Mount
  useEffect(() => {
    fetchConversations();
    if (isOwner) {
      fetchUsageStats();
    }
  }, [currentGym?.id]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/conversations`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConvId) {
          loadConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not load AI conversations:', err);
    }
  };

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/conversations/${convId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.conversation?.messages) {
        setMessages(data.conversation.messages);
      }
    } catch (err) {
      console.warn('Failed to load conversation details:', err);
    }
  };

  const createNewChat = () => {
    setActiveConvId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: isOwner
          ? `👋 Hello ${currentUser?.fullName || 'Owner'}! I'm your GymFlow AI Business Copilot. Ask me about active members, monthly revenue, pending dues, or attendance peak hours.`
          : isTrainer
          ? `⚡ Greetings Coach ${currentUser?.fullName || ''}! I'm your AI Training Copilot. Ask me to draft workout routines, suggest exercise alternatives, or review client progress.`
          : `⚡ Welcome, athlete! I'm your AI Fitness Coach. Ask me about today's assigned workout, membership expiry, attendance check-ins, or squat mechanics!`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const deleteCurrentConversation = async () => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    try {
      await fetch(`${BASE_URL}/api/ai/conversations/${activeConvId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      setConversations((prev) => prev.filter((c) => c.id !== activeConvId));
      createNewChat();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if (!text) return;

    const userMessage: AIMessageRecord = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          prompt: text,
          conversationId: activeConvId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEngineSource(data.source || 'gymflow_engine');
        if (data.conversationId && data.conversationId !== activeConvId) {
          setActiveConvId(data.conversationId);
          fetchConversations();
        }
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              role: 'assistant',
              content: data.reply,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } else if (data.error === 'QUOTA_EXCEEDED') {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Subscription Quota Reached:** ${data.message || 'Daily limit reached for your gym tier.'}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${data.error || 'Failed to generate response. Please try again.'}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Network error: Could not reach AI server.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Workout Generator Action
  const handleGenerateWorkout = async () => {
    setIsGeneratingWorkout(true);
    setGeneratedWorkout(null);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/workout-plan`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          memberId: targetMemberId || undefined,
          fitnessGoal: workoutGoal,
          experienceLevel,
          availableDays: Number(availableDays),
          equipmentAvailability,
          durationMinutes: Number(durationMinutes),
          trainerNotes,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.success) {
        setGeneratedWorkout(data);
        fetchPlans();
      } else {
        alert(data.error || data.message || 'Failed to generate workout plan.');
      }
    } catch (err: any) {
      alert(`Error generating workout plan: ${err.message}`);
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  // Diet Generator Action
  const handleGenerateDiet = async () => {
    setIsGeneratingDiet(true);
    setGeneratedDiet(null);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/diet-plan`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          memberId: targetMemberId || undefined,
          fitnessGoal: dietGoal,
          dietaryPreference: dietaryPref,
          foodPreferences: foodChoices,
          mealSchedule: Number(mealCount),
          targetCalories: Number(targetCalories),
          allergies: allergiesInput,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.success) {
        setGeneratedDiet(data);
        fetchPlans();
      } else {
        alert(data.error || data.message || 'Failed to generate diet plan.');
      }
    } catch (err: any) {
      alert(`Error generating diet plan: ${err.message}`);
    } finally {
      setIsGeneratingDiet(false);
    }
  };

  // Business Insights Action
  const fetchBusinessInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/business-insights`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setBusinessData(data.insights);
      }
    } catch (err) {
      console.warn('Failed to load business insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Plans List & Approval
  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/plans`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.plans)) {
        setPlansList(data.plans);
      }
    } catch (err) {
      console.warn('Failed to load plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleApprovePlan = async (planId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/plans/${planId}/approve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notes: `Approved by ${currentUser?.fullName || 'Coach'}` }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPlans();
        if (generatedWorkout?.planId === planId) {
          setGeneratedWorkout((prev: any) => ({ ...prev, approvalStatus: 'approved' }));
        }
        if (generatedDiet?.planId === planId) {
          setGeneratedDiet((prev: any) => ({ ...prev, approvalStatus: 'approved' }));
        }
      }
    } catch (err: any) {
      alert(`Failed to approve plan: ${err.message}`);
    }
  };

  const handleRejectPlan = async (planId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/plans/${planId}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notes: 'Rejected by coach for re-generation.' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPlans();
      }
    } catch (err: any) {
      alert(`Failed to reject plan: ${err.message}`);
    }
  };

  // AI Usage Stats
  const fetchUsageStats = async () => {
    setIsLoadingUsage(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/usage`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.stats) {
        setUsageStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed to load AI usage stats:', err);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  // Suggested Prompts by Role
  const memberSuggestions = [
    "Show me today's workout plan and exercises",
    'When does my gym membership expire?',
    'How many days did I visit the gym this month?',
    'Explain how to perform a barbell back squat with proper form',
    'Summarize my workout progress and weight changes',
  ];

  const trainerSuggestions = [
    'Summarize my assigned members progress and attendance',
    'Draft a 4-day Hypertrophy Upper/Lower split',
    'Suggest knee-friendly squat alternatives for injured athletes',
    'Explain how to fix shoulder impingement during dumbbell bench press',
  ];

  const ownerSuggestions = [
    'How many active members do we have?',
    'What is this month revenue and pending dues?',
    'Which days and hours have the highest gym attendance?',
    'How many memberships are expiring in the next 14 days?',
    'Summarize our overall gym performance and operational health',
  ];

  const suggestions = isMember ? memberSuggestions : isTrainer ? trainerSuggestions : ownerSuggestions;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30 flex items-center justify-center font-bold shadow-lg shadow-[#B6FF45]/10">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white tracking-tight">GYMFLOW AI ASSISTANT</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B6FF45]/15 text-[#B6FF45] border border-[#B6FF45]/30">
                {engineSource === 'openai_live' ? 'GPT-4o Mini (Live)' : 'GymFlow Engine (Sandbox Mode)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1C2420] text-zinc-300">
                Role: {currentUser?.role.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Multi-role conversational intelligence, workout periodization, diet macros, and business analytics.
            </p>
          </div>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#090B0A] rounded-2xl border border-[#1C2420] overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Chat
          </button>

          {(isTrainer || isOwner) && (
            <button
              onClick={() => setActiveTab('workout-generator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'workout-generator'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Workout Generator
            </button>
          )}

          <button
            onClick={() => setActiveTab('diet-assistant')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'diet-assistant'
                ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Diet Assistant
          </button>

          {isOwner && (
            <button
              onClick={() => {
                setActiveTab('business-insights');
                fetchBusinessInsights();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'business-insights'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Business Insights
            </button>
          )}

          {(isTrainer || isOwner) && (
            <button
              onClick={() => {
                setActiveTab('plans-approval');
                fetchPlans();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'plans-approval'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Plan Approvals
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => {
                setActiveTab('usage');
                fetchUsageStats();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'usage'
                  ? 'bg-[#B6FF45] text-[#090B0A] shadow-md shadow-[#B6FF45]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-[#151A17]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Usage & Quota
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI CHAT INTERFACE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversation History Sidebar */}
          <div className="lg:col-span-1 rounded-3xl bg-[#151A17] border border-[#1C2420] p-4 flex flex-col h-[600px] shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2420]">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Conversations</span>
              <button
                onClick={createNewChat}
                className="p-1.5 rounded-xl bg-[#B6FF45]/15 text-[#B6FF45] hover:bg-[#B6FF45]/25 border border-[#B6FF45]/30 transition-colors"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">No saved chats yet. Start chatting below!</div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`p-3 rounded-2xl cursor-pointer text-xs transition-all border ${
                      activeConvId === c.id
                        ? 'bg-[#090B0A] border-[#B6FF45]/40 text-white font-bold'
                        : 'bg-[#0F1311] border-[#1C2420] text-zinc-400 hover:text-zinc-200 hover:bg-[#151A17]'
                    }`}
                  >
                    <div className="truncate">{c.title || 'Conversation'}</div>
                    <div className="text-[10px] text-zinc-600 mt-1 font-mono">
                      {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#1C2420]">
              <button
                onClick={deleteCurrentConversation}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat
              </button>
            </div>
          </div>

          {/* Chat Main Window */}
          <div className="lg:col-span-3 rounded-3xl bg-[#151A17] border border-[#1C2420] flex flex-col h-[600px] overflow-hidden shadow-2xl">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                        isUser
                          ? 'bg-[#1C2420] text-zinc-200'
                          : 'bg-[#B6FF45]/20 text-[#B6FF45] border border-[#B6FF45]/30'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-line shadow-md ${
                        isUser
                          ? 'bg-[#B6FF45] text-[#090B0A] font-semibold rounded-tr-none'
                          : 'bg-[#090B0A] border border-[#1C2420] text-zinc-200 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                      <span
                        className={`block text-[10px] mt-2 font-mono ${
                          isUser ? 'text-[#090B0A]/70' : 'text-zinc-500'
                        }`}
                      >
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B6FF45]/20 text-[#B6FF45] border border-[#B6FF45]/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-xs text-zinc-400 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#B6FF45] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#B6FF45] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#B6FF45] animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 font-mono text-[11px] text-zinc-400">
                      GymFlow AI is analyzing your authorized gym records...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Role-Specific Suggested Prompts Bar */}
            <div className="p-3 border-t border-[#1C2420] bg-[#090B0A]/80 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0">Suggestions:</span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="px-2.5 py-1 rounded-lg bg-[#0F1311] hover:bg-[#1C2420] text-zinc-300 hover:text-[#B6FF45] border border-[#1C2420] text-[11px] whitespace-nowrap transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#1C2420] bg-[#090B0A] flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  isOwner
                    ? 'Ask about monthly revenue, active members, attendance peaks...'
                    : isTrainer
                    ? 'Ask about workout splits, client assessments, exercise alternatives...'
                    : 'Ask about your workout, membership expiry, attendance check-ins...'
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#151A17] border border-[#1C2420] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45] transition-all"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isTyping}
                className="p-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 text-[#090B0A] font-bold transition-all shadow-md shadow-[#B6FF45]/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI WORKOUT PLAN GENERATOR                                          */}
      {/* ========================================================================= */}
      {activeTab === 'workout-generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Inputs Form */}
          <div className="lg:col-span-1 rounded-3xl bg-[#151A17] border border-[#1C2420] p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1C2420]">
              <Dumbbell className="w-5 h-5 text-[#B6FF45]" />
              <h2 className="text-base font-bold text-white">Workout Parameters</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Target Athlete (Optional)</label>
              <select
                value={targetMemberId}
                onChange={(e) => setTargetMemberId(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="">General Gym Template</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Fitness Goal</label>
                <select
                  value={workoutGoal}
                  onChange={(e) => setWorkoutGoal(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="Hypertrophy">Hypertrophy (Muscle)</option>
                  <option value="Strength">Strength Powerlifting</option>
                  <option value="Fat Loss">Fat Loss & Conditioning</option>
                  <option value="Endurance">Athletic Endurance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Experience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="Beginner">Beginner (1-6 mo)</option>
                  <option value="Intermediate">Intermediate (1-3 yr)</option>
                  <option value="Advanced">Advanced (3+ yr)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Training Days</label>
                <select
                  value={availableDays}
                  onChange={(e) => setAvailableDays(Number(e.target.value))}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value={3}>3 Days (Full Body)</option>
                  <option value={4}>4 Days (Upper/Lower)</option>
                  <option value={5}>5 Days (Push/Pull/Legs)</option>
                  <option value={6}>6 Days (PPL 2x)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Session Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={75}>75 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Equipment</label>
              <select
                value={equipmentAvailability}
                onChange={(e) => setEquipmentAvailability(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="Full Gym">Commercial Full Gym (Free Weights + Cables)</option>
                <option value="Dumbbells Only">Dumbbells & Bench Only</option>
                <option value="Barbell Only">Barbell & Squat Rack</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Coach Notes / Focus</label>
              <textarea
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Focus on shoulder health, progressive overload on incline press, hamstring curls..."
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <button
              onClick={handleGenerateWorkout}
              disabled={isGeneratingWorkout}
              className="w-full py-3 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 text-[#090B0A] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#B6FF45]/20"
            >
              {isGeneratingWorkout ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Periodized Split...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Workout Blueprint
                </>
              )}
            </button>
          </div>

          {/* Generator Output Preview */}
          <div className="lg:col-span-2 rounded-3xl bg-[#151A17] border border-[#1C2420] p-6 flex flex-col h-full shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C2420]">
              <div>
                <h2 className="text-base font-bold text-white">Generated Plan Blueprint</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  AI-generated routines are saved as DRAFTS and require coach approval before member assignment.
                </p>
              </div>

              {generatedWorkout && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      generatedWorkout.approvalStatus === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {generatedWorkout.approvalStatus}
                  </span>

                  {generatedWorkout.approvalStatus === 'draft' && (
                    <button
                      onClick={() => handleApprovePlan(generatedWorkout.planId)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#B6FF45] text-[#090B0A] text-xs font-bold hover:bg-[#a6ec3c] transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve & Assign
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              {!generatedWorkout ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <Dumbbell className="w-12 h-12 mb-3 text-zinc-600" />
                  <p className="text-sm font-semibold text-zinc-400">No workout generated yet</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    Configure your workout split parameters on the left and tap "Generate AI Workout Blueprint".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-black text-white">{generatedWorkout.planTitle}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                        {generatedWorkout.generatedContent?.splitName} • {generatedWorkout.generatedContent?.durationMinutes}
                      </p>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Goal: <span className="text-[#B6FF45] font-bold">{generatedWorkout.generatedContent?.fitnessGoal}</span>
                    </div>
                  </div>

                  {/* Days Breakdown */}
                  <div className="space-y-3">
                    {generatedWorkout.generatedContent?.days?.map((d: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
                          <span className="text-xs font-black text-white">{d.day}</span>
                          <span className="text-[11px] text-zinc-400 font-mono">{d.focus}</span>
                        </div>

                        {d.exercises.length === 0 ? (
                          <div className="py-3 text-xs text-zinc-500 italic">Active Rest & Recovery Day</div>
                        ) : (
                          <div className="divide-y divide-[#1C2420] mt-2">
                            {d.exercises.map((ex: any, exIdx: number) => (
                              <div key={exIdx} className="py-2 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-zinc-200">{ex.name}</span>
                                  <span className="text-[10px] text-zinc-500 ml-2 font-mono">({ex.equipment || 'Gym'})</span>
                                </div>
                                <div className="text-right font-mono text-[11px] text-[#B6FF45]">
                                  {ex.sets} sets × {ex.reps} reps • Rest: {ex.rest}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#1C2420]/50 border border-[#1C2420] text-xs text-zinc-400">
                    <span className="font-bold text-zinc-300">Coach Guidance: </span>
                    {generatedWorkout.generatedContent?.trainerNotes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI DIET PLAN ASSISTANT                                             */}
      {/* ========================================================================= */}
      {activeTab === 'diet-assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Inputs Form */}
          <div className="lg:col-span-1 rounded-3xl bg-[#151A17] border border-[#1C2420] p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1C2420]">
              <Utensils className="w-5 h-5 text-[#B6FF45]" />
              <h2 className="text-base font-bold text-white">Diet & Nutrition Goals</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Target Athlete (Optional)</label>
              <select
                value={targetMemberId}
                onChange={(e) => setTargetMemberId(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="">General Nutrition Blueprint</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Goal</label>
                <select
                  value={dietGoal}
                  onChange={(e) => setDietGoal(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="Muscle Gain">Muscle Gain (Surplus)</option>
                  <option value="Fat Loss">Fat Loss (Deficit)</option>
                  <option value="Maintenance">Body Recomposition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Preference</label>
                <select
                  value={dietaryPref}
                  onChange={(e) => setDietaryPref(e.target.value)}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value="High-Protein Non-Veg">High-Protein Non-Veg</option>
                  <option value="Vegetarian">High-Protein Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Vegan">Vegan Plant-Based</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Meals Per Day</label>
                <select
                  value={mealCount}
                  onChange={(e) => setMealCount(Number(e.target.value))}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                >
                  <option value={3}>3 Meals</option>
                  <option value={4}>4 Meals</option>
                  <option value={5}>5 Meals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Daily Target (kcal)</label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Preferred Foods</label>
              <textarea
                value={foodChoices}
                onChange={(e) => setFoodChoices(e.target.value)}
                rows={2}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Allergies / Restrictions</label>
              <input
                type="text"
                placeholder="e.g. Lactose intolerant, peanut allergy, gluten sensitive"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <button
              onClick={handleGenerateDiet}
              disabled={isGeneratingDiet}
              className="w-full py-3 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 text-[#090B0A] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#B6FF45]/20"
            >
              {isGeneratingDiet ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Macros & Meal Slots...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Nutrition Plan
                </>
              )}
            </button>
          </div>

          {/* Generator Output Preview */}
          <div className="lg:col-span-2 rounded-3xl bg-[#151A17] border border-[#1C2420] p-6 flex flex-col h-full shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C2420]">
              <div>
                <h2 className="text-base font-bold text-white">Generated Nutrition Schedule</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Macro targets and daily nutrient breakdown with medical safety notice.
                </p>
              </div>

              {generatedDiet && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      generatedDiet.approvalStatus === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {generatedDiet.approvalStatus}
                  </span>

                  {generatedDiet.approvalStatus === 'draft' && (isTrainer || isOwner) && (
                    <button
                      onClick={() => handleApprovePlan(generatedDiet.planId)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#B6FF45] text-[#090B0A] text-xs font-bold hover:bg-[#a6ec3c] transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Nutrition Plan
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              {!generatedDiet ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <Utensils className="w-12 h-12 mb-3 text-zinc-600" />
                  <p className="text-sm font-semibold text-zinc-400">No diet plan generated yet</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    Select your nutritional preferences and calories, then click "Generate AI Nutrition Plan".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mandatory Clinical Disclaimer Alert */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-1">Medical & Dietary Notice:</span>
                      {generatedDiet.disclaimer || generatedDiet.generatedContent?.disclaimer}
                    </div>
                  </div>

                  {/* Macro Counters Bar */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Calories</div>
                      <div className="text-base font-black text-white mt-1">
                        {generatedDiet.generatedContent?.macros?.calories}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Protein</div>
                      <div className="text-base font-black text-[#B6FF45] mt-1">
                        {generatedDiet.generatedContent?.macros?.protein}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Carbohydrates</div>
                      <div className="text-base font-black text-sky-400 mt-1">
                        {generatedDiet.generatedContent?.macros?.carbohydrates}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Fats</div>
                      <div className="text-base font-black text-amber-400 mt-1">
                        {generatedDiet.generatedContent?.macros?.fats}
                      </div>
                    </div>
                  </div>

                  {/* Meal Slots List */}
                  <div className="space-y-3">
                    {generatedDiet.generatedContent?.meals?.map((m: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1C2420]">
                          <span className="text-xs font-black text-white">{m.name}</span>
                          <span className="text-[11px] text-[#B6FF45] font-mono font-bold">{m.calories} kcal</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{m.foods}</p>
                        <div className="text-[10px] text-zinc-500 font-mono mt-2 flex items-center gap-3">
                          <span>P: <strong className="text-zinc-300">{m.protein}</strong></span>
                          <span>C: <strong className="text-zinc-300">{m.carbs}</strong></span>
                          <span>F: <strong className="text-zinc-300">{m.fats}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI BUSINESS INSIGHTS (OWNER / SUPER ADMIN)                        */}
      {/* ========================================================================= */}
      {activeTab === 'business-insights' && isOwner && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Autonomous Gym Intelligence & Revenue Analytics</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time synthesis comparing authorized Supabase financial ledgers with predictive retention strategies.
              </p>
            </div>
            <button
              onClick={fetchBusinessInsights}
              disabled={isLoadingInsights}
              className="px-4 py-2 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 text-[#090B0A] text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#B6FF45]/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              Generate Fresh Insights
            </button>
          </div>

          {!businessData ? (
            <div className="p-12 text-center rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-400 font-bold">No insights loaded</p>
              <button
                onClick={fetchBusinessInsights}
                className="mt-3 px-4 py-2 rounded-xl bg-[#B6FF45] text-[#090B0A] font-bold text-xs"
              >
                Fetch Real-Time Analytics
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Live Factual Database Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Active Members</div>
                  <div className="text-xl font-black text-white mt-1">
                    {businessData.databaseMetrics.activeMembers}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Total: {businessData.databaseMetrics.totalMembers}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Monthly Revenue</div>
                  <div className="text-xl font-black text-[#B6FF45] mt-1">
                    {businessData.databaseMetrics.monthlyRevenue}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Today: {businessData.databaseMetrics.todayRevenue}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Pending Dues</div>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {businessData.databaseMetrics.pendingPayments}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Awaiting settlement</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Today's Visits</div>
                  <div className="text-xl font-black text-sky-400 mt-1">
                    {businessData.databaseMetrics.todayCheckins} visits
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Peak: {businessData.databaseMetrics.peakHours}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Expiring in 14d</div>
                  <div className="text-xl font-black text-rose-400 mt-1">
                    {businessData.databaseMetrics.expiringMemberships} athletes
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">High retention risk</div>
                </div>
              </div>

              {/* Strategic Insights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-[#B6FF45]">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="font-bold text-white text-sm">Revenue & Cashflow Trends</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {businessData.strategicAnalysis.revenueTrends}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-bold text-white text-sm">Attendance & Facility Load</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {businessData.strategicAnalysis.attendanceTrends}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Clock className="w-5 h-5" />
                    <h3 className="font-bold text-white text-sm">Expiry & Churn Forecast</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {businessData.strategicAnalysis.expiryForecast}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420] space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Zap className="w-5 h-5" />
                    <h3 className="font-bold text-white text-sm">Operational Recommendations</h3>
                  </div>
                  <ul className="space-y-2">
                    {businessData.strategicAnalysis.operationalRecommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-[#B6FF45] font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PLAN APPROVAL CENTER (TRAINER / OWNER)                             */}
      {/* ========================================================================= */}
      {activeTab === 'plans-approval' && (isTrainer || isOwner) && (
        <div className="rounded-3xl bg-[#151A17] border border-[#1C2420] p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#1C2420]">
            <div>
              <h2 className="text-base font-bold text-white">AI Plan Review & Approval Center</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every AI-generated workout or diet plan must be formally vetted by certified trainers before assignment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Filter:</span>
              <select
                value={planFilter}
                onChange={(e: any) => setPlanFilter(e.target.value)}
                className="bg-[#090B0A] border border-[#1C2420] rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="all">All Plans</option>
                <option value="draft">Pending Approval (Drafts)</option>
                <option value="approved">Approved & Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {isLoadingPlans ? (
            <div className="py-12 text-center text-xs text-zinc-500">Loading plan ledger...</div>
          ) : plansList.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">No generated plans in the ledger.</div>
          ) : (
            <div className="space-y-3">
              {plansList
                .filter((p) => (planFilter === 'all' ? true : p.approval_status === planFilter || p.approvalStatus === planFilter))
                .map((plan) => {
                  const status = plan.approval_status || plan.approvalStatus;
                  const type = plan.plan_type || plan.planType;
                  return (
                    <div
                      key={plan.id}
                      className="p-4 rounded-2xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            type === 'workout'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {type === 'workout' ? <Dumbbell className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{plan.title}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1C2420] text-zinc-400">
                              {type}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                            Plan ID: {plan.id} • Created {new Date(plan.created_at || plan.createdAt || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {status}
                        </span>

                        {status === 'draft' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprovePlan(plan.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPlan(plan.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AI USAGE DASHBOARD & SUBSCRIPTION QUOTA (OWNER)                    */}
      {/* ========================================================================= */}
      {activeTab === 'usage' && isOwner && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="text-xs font-bold text-zinc-400 uppercase">Subscription Tier</div>
              <div className="text-2xl font-black text-white mt-1 capitalize">
                {usageStats?.subscriptionTier || 'Trial'}
              </div>
              <div className="text-[11px] text-[#B6FF45] mt-1 font-mono">
                Daily Limit: {usageStats?.dailyLimit || 20} requests/day
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="text-xs font-bold text-zinc-400 uppercase">Requests Today</div>
              <div className="text-2xl font-black text-[#B6FF45] mt-1">
                {usageStats?.todayRequests || 0}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                Remaining: {usageStats?.remainingToday ?? 20}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="text-xs font-bold text-zinc-400 uppercase">Total Tokens Processed</div>
              <div className="text-2xl font-black text-sky-400 mt-1">
                {(usageStats?.totalTokens || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                All-time gym telemetry
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <div className="text-xs font-bold text-zinc-400 uppercase">Total All-Time Requests</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {usageStats?.totalRequests || 0}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                Chat, Workouts & Diets
              </div>
            </div>
          </div>

          {/* Usage by Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <h3 className="text-sm font-bold text-white mb-4">Requests by Feature Type</h3>
              <div className="space-y-3">
                {usageStats?.byType &&
                  Object.entries(usageStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 capitalize">{type.replace('_', ' ')}</span>
                      <span className="font-mono text-[#B6FF45] font-bold">{count} calls</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#151A17] border border-[#1C2420]">
              <h3 className="text-sm font-bold text-white mb-4">Recent AI Telemetry Logs</h3>
              <div className="space-y-2">
                {usageStats?.recentLogs?.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 capitalize">{log.request_type || log.requestType}</span>
                      <span className="text-[10px] text-zinc-500 font-mono ml-2">({log.model})</span>
                    </div>
                    <span className="font-mono text-[#B6FF45] text-[11px]">
                      {log.token_usage || log.tokenUsage || 0} tokens
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
