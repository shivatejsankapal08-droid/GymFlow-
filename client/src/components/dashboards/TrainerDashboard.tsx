import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Sparkles,
  Bot,
  MessageSquare,
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';

export const TrainerDashboard: React.FC = () => {
  const { currentUser, members, trainers, setActivePage, addToast } = useApp();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Find trainer info
  const myTrainerProfile = trainers.find((t) => t.fullName === currentUser?.fullName) || trainers[0];
  const myClients = members.filter((m) => m.assignedTrainerName?.includes('Alex') || m.assignedTrainerId === myTrainerProfile.id);

  const [todaySchedule, setTodaySchedule] = useState([
    { id: 's-1', time: '07:00 AM - 08:00 AM', client: 'Vikram Malhotra', goal: 'Heavy Chest & Triceps Hypertrophy', status: 'completed' },
    { id: 's-2', time: '09:00 AM - 10:00 AM', client: 'Kabir Deshmukh', goal: 'Deadlift Technique & Upper Back', status: 'in_progress' },
    { id: 's-3', time: '11:00 AM - 12:00 PM', client: 'Devansh Roy', goal: 'Core Stability & HIIT Circuit', status: 'upcoming' },
    { id: 's-4', time: '01:00 PM - 02:00 PM', client: 'Open Consultation Slot', goal: 'New Member Assessment', status: 'available' },
  ]);

  const markSessionComplete = (id: string, clientName: string) => {
    setTodaySchedule((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'completed' } : s))
    );
    addToast({
      type: 'success',
      title: 'Session Logged! 🏋️‍♂️',
      message: `Completed training session with ${clientName}. Client progress saved.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Trainer Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
            alt={currentUser?.fullName}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-400/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser?.fullName}</h1>
              <Badge variant="pro">COACH</Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {myTrainerProfile.specialization} • Shift: {myTrainerProfile.workingHours}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActivePage('ai-assistant')}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
        >
          <Bot className="w-4 h-4" />
          <span>Generate Client Routine with AI</span>
        </button>
      </div>

      {/* Trainer Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned Clients"
          value={myClients.length}
          change="3 new this month"
          isPositive={true}
          icon={Users}
          subtext="Active 1-on-1 athletes"
          accentColor="cyan"
        />

        <MetricCard
          title="Sessions Today"
          value="4"
          change="2 completed"
          isPositive={true}
          icon={Calendar}
          subtext="6 hours on floor"
          accentColor="emerald"
        />

        <MetricCard
          title="Client Satisfaction"
          value="4.95 / 5.0"
          change="Top 5% in gym"
          isPositive={true}
          icon={Award}
          subtext="Based on 48 reviews"
          accentColor="purple"
        />

        <MetricCard
          title="Monthly Pay & Bonus"
          value={`₹${(myTrainerProfile.basePay + 12000).toLocaleString('en-IN')}`}
          change="+₹12,000 commission"
          isPositive={true}
          icon={Dumbbell}
          subtext="Calculated via check-ins"
          accentColor="amber"
        />
      </div>

      {/* Schedule & Client List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Today's Coaching Schedule
            </h3>
            <span className="text-xs text-zinc-400">4 Slots Scheduled</span>
          </div>

          <div className="space-y-3">
            {todaySchedule.map((slot) => (
              <div
                key={slot.id}
                className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">{slot.time}</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">{slot.client}</h4>
                  <p className="text-[11px] text-zinc-400">{slot.goal}</p>
                </div>

                {slot.status === 'completed' ? (
                  <Badge variant="completed" size="sm">
                    Done
                  </Badge>
                ) : slot.status === 'in_progress' ? (
                  <button
                    onClick={() => markSessionComplete(slot.id, slot.client)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all"
                  >
                    Mark Done
                  </button>
                ) : (
                  <Badge variant="pending" size="sm">
                    Upcoming
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Clients Roster */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              My Assigned Athletes ({myClients.length})
            </h3>
            <button
              onClick={() => setActivePage('members')}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {myClients.map((client) => (
              <div
                key={client.id}
                className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={client.avatarUrl}
                    alt={client.fullName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-zinc-700"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-white">{client.fullName}</h5>
                    <p className="text-[11px] text-zinc-400">{client.fitnessGoal}</p>
                    <p className="text-[10px] text-emerald-400">Last seen: {client.lastCheckIn}</p>
                  </div>
                </div>

                <Badge variant={client.status} size="sm">
                  {client.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
