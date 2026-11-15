import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MembershipPlan } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Tag,
  Plus,
  CheckCircle2,
  Users,
  Edit2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Power,
  Search,
  AlertTriangle,
  XCircle,
  Percent
} from 'lucide-react';

export const MembershipPlansView: React.FC = () => {
  const {
    plans,
    members,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    addToast,
    globalSearch,
    setGlobalSearch
  } = useApp();

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add Plan Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDurationType, setAddDurationType] = useState<'1' | '3' | '6' | '12' | 'custom'>('1');
  const [addCustomMonths, setAddCustomMonths] = useState(2);
  const [addPrice, setAddPrice] = useState(3499);
  const [addDescription, setAddDescription] = useState('');
  const [addFeatures, setAddFeatures] = useState('Full Gym Floor Access\nLocker Room & Showers\nFree Mobile App QR Pass');

  // Edit Plan Modal State
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editName, setEditName] = useState('');
  const [editDurationMonths, setEditDurationMonths] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editFeatures, setEditFeatures] = useState('');

  const effectiveSearch = globalSearch || searchTerm;

  const filteredPlans = plans.filter((p) => {
    // Status filter
    if (statusFilter === 'active' && p.isActive === false) return false;
    if (statusFilter === 'inactive' && p.isActive !== false) return false;

    // Search query
    if (!effectiveSearch) return true;
    const q = effectiveSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const featArray = addFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const finalMonths = addDurationType === 'custom' ? Number(addCustomMonths) : Number(addDurationType);

    addPlan({
      name: addName.trim(),
      durationMonths: Math.max(1, finalMonths),
      price: Number(addPrice),
      description: addDescription.trim(),
      features: featArray,
      isActive: true,
    });

    setIsAddModalOpen(false);
    setAddName('');
    setAddDescription('');
    setAddDurationType('1');
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditDurationMonths(plan.durationMonths);
    setEditPrice(plan.price);
    setEditDescription(plan.description || '');
    setEditFeatures((plan.features || []).join('\n'));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const featArray = editFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    updatePlan(editingPlan.id, {
      name: editName.trim(),
      durationMonths: Number(editDurationMonths),
      price: Number(editPrice),
      description: editDescription.trim(),
      features: featArray,
    });

    setEditingPlan(null);
  };

  const handleDeletePlan = (plan: MembershipPlan) => {
    deletePlan(plan.id);
  };

  const getDurationLabel = (months: number) => {
    if (months === 1) return 'MONTHLY';
    if (months === 3) return 'QUARTERLY';
    if (months === 6) return 'HALF-YEARLY';
    if (months === 12) return 'YEARLY / ANNUAL';
    return `CUSTOM (${months} MO)`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#151A17] border border-[#1C2420]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Tag className="w-6 h-6 text-[#B6FF45]" />
              Membership Plans & Pricing
            </h1>
            <Badge variant="pro">SAAS BILLING</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure subscription durations (Monthly, Quarterly, Half-Yearly, Yearly, Custom), rates, and perks
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search plans by title or amenities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-[#1C2420] text-[#B6FF45] border border-[#B6FF45]/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1C2420]/50'
              }`}
            >
              {tab === 'all' ? 'All Packages' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#151A17] border border-[#1C2420] text-center">
          <Tag className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold text-zinc-300">No membership tiers found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {effectiveSearch
              ? `No packages match "${effectiveSearch}". Try another search term.`
              : 'No membership packages found under this filter.'}
          </p>
          {effectiveSearch && (
            <button
              onClick={() => {
                setSearchTerm('');
                setGlobalSearch('');
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#0F1311] hover:bg-[#1C2420] text-[#B6FF45] font-semibold text-xs border border-[#1C2420] transition-colors"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            // Count active assigned members
            const activeSubscribers = members.filter(
              (m) => (m.currentPlanId === plan.id || m.currentPlanName === plan.name) && m.status === 'active'
            ).length;

            const isPlanActive = plan.isActive !== false;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl bg-[#151A17] border transition-all flex flex-col justify-between group glow-card ${
                  isPlanActive
                    ? 'border-[#1C2420] hover:border-[#B6FF45]/40'
                    : 'border-zinc-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={plan.durationMonths >= 12 ? 'pro' : 'active'} size="sm">
                      {getDurationLabel(plan.durationMonths)}
                    </Badge>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isPlanActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {isPlanActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 font-semibold">
                        <Users className="w-3.5 h-3.5 text-[#B6FF45]" />
                        <span>{activeSubscribers} Active</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 min-h-[36px] leading-relaxed">
                    {plan.description || 'Full equipment access and locker room perks.'}
                  </p>

                  <div className="my-5 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#B6FF45]">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      / {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-[#1C2420]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Included Amenities:
                    </p>
                    {(plan.features || []).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B6FF45] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-[#1C2420] flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    ~₹{Math.round(plan.price / (plan.durationMonths * 30))}/day
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Edit Plan */}
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      title="Edit Plan Details"
                      className="p-1.5 rounded-lg bg-[#0F1311] hover:bg-[#1C2420] text-zinc-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Active/Inactive */}
                    <button
                      onClick={() =>
                        togglePlanStatus(plan.id, isPlanActive ? 'inactive' : 'active')
                      }
                      title={isPlanActive ? 'Deactivate Plan' : 'Activate Plan'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPlanActive
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Plan with safety check */}
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      title="Delete Plan Tier"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Membership Plan"
        subtitle="Adds a new recurring package tier (Monthly, Quarterly, Half-Yearly, Yearly or Custom)"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Plan Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 6-Month Hypertrophy Transformation"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Duration Type *</label>
              <select
                value={addDurationType}
                onChange={(e) => setAddDurationType(e.target.value as any)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              >
                <option value="1">1 Month (Monthly)</option>
                <option value="3">3 Months (Quarterly)</option>
                <option value="6">6 Months (Half-Yearly)</option>
                <option value="12">12 Months (Yearly / Annual)</option>
                <option value="custom">Custom Duration...</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Price (INR) *</label>
              <input
                type="number"
                required
                min="0"
                value={addPrice}
                onChange={(e) => setAddPrice(Number(e.target.value))}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          </div>

          {/* Custom Duration Input if selected */}
          {addDurationType === 'custom' && (
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Enter Custom Duration in Months *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={addCustomMonths}
                onChange={(e) => setAddCustomMonths(Number(e.target.value))}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Short Description</label>
            <input
              type="text"
              placeholder="e.g. Includes full equipment access, cardio floor and 4 personal trainer sessions"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Included Amenities & Perks (One per line)
            </label>
            <textarea
              rows={4}
              value={addFeatures}
              onChange={(e) => setAddFeatures(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl p-3 text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2420]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider"
            >
              Publish Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <Modal
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          title={`Edit Plan: ${editingPlan.name}`}
          subtitle="Modify pricing, duration and member perks"
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Duration (Months) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editDurationMonths}
                  onChange={(e) => setEditDurationMonths(Number(e.target.value))}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Price (INR) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Description</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Included Amenities (One per line)
              </label>
              <textarea
                rows={4}
                value={editFeatures}
                onChange={(e) => setEditFeatures(e.target.value)}
                className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl p-3 text-white focus:outline-none focus:border-[#B6FF45]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2420]">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
