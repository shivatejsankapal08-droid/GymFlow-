import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Apple,
  Plus,
  Trash2,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Sparkles,
  Utensils
} from 'lucide-react';

interface DietPlanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_MEAL_SLOTS: ('Early Morning' | 'Breakfast' | 'Mid-Morning' | 'Lunch' | 'Evening Snack' | 'Dinner')[] = [
  'Early Morning',
  'Breakfast',
  'Mid-Morning',
  'Lunch',
  'Evening Snack',
  'Dinner',
];

export const DietPlanBuilderModal: React.FC<DietPlanBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { members, trainers, createDietPlan } = useApp();

  const [planName, setPlanName] = useState('');
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [trainerId, setTrainerId] = useState(trainers[0]?.id || '');
  const [dietaryPreference, setDietaryPreference] = useState<'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Custom' | 'Keto' | 'High Protein'>('Non-Vegetarian');
  const [fitnessGoal, setFitnessGoal] = useState('Muscle Building');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [instructions, setInstructions] = useState('Maintain consistent meal timing. Hydrate with minimum 3.5L of water daily.');

  // Default meal items array
  const [meals, setMeals] = useState<{
    mealName: 'Early Morning' | 'Breakfast' | 'Mid-Morning' | 'Lunch' | 'Evening Snack' | 'Dinner';
    foodName: string;
    portionSize: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    notes?: string;
  }[]>([
    {
      mealName: 'Early Morning',
      foodName: 'Lukewarm Water + 10 Soaked Almonds + 2 Walnuts',
      portionSize: '1 glass + 35g nuts',
      calories: 180,
      protein: 5,
      carbohydrates: 7,
      fat: 15,
      notes: 'Hydration and brain fuel upon waking',
    },
    {
      mealName: 'Breakfast',
      foodName: 'Rolled Oats with Whey Protein & Mixed Berries',
      portionSize: '80g oats + 1 scoop whey + 50g berries',
      calories: 520,
      protein: 36,
      carbohydrates: 68,
      fat: 10,
      notes: 'Complex carbs for morning lifting session',
    },
    {
      mealName: 'Lunch',
      foodName: 'Grilled Chicken Breast / Paneer with Brown Rice & Broccoli',
      portionSize: '200g protein source + 150g rice + 100g greens',
      calories: 650,
      protein: 54,
      carbohydrates: 70,
      fat: 14,
      notes: 'Main anabolic daytime feeding',
    },
    {
      mealName: 'Dinner',
      foodName: 'Grilled Salmon or Tofu with Roasted Sweet Potato & Asparagus',
      portionSize: '180g protein + 150g sweet potato',
      calories: 580,
      protein: 42,
      carbohydrates: 48,
      fat: 16,
      notes: 'Clean dinner before 8:30 PM',
    },
  ]);

  const [activeSlot, setActiveSlot] = useState<'Early Morning' | 'Breakfast' | 'Mid-Morning' | 'Lunch' | 'Evening Snack' | 'Dinner'>('Mid-Morning');
  const [newFood, setNewFood] = useState('');
  const [newPortion, setNewPortion] = useState('');
  const [newCal, setNewCal] = useState<number>(250);
  const [newProtein, setNewProtein] = useState<number>(20);
  const [newCarbs, setNewCarbs] = useState<number>(25);
  const [newFat, setNewFat] = useState<number>(6);
  const [newNotes, setNewNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMeal = () => {
    if (!newFood.trim() || !newPortion.trim()) return;

    setMeals((prev) => [
      ...prev,
      {
        mealName: activeSlot,
        foodName: newFood.trim(),
        portionSize: newPortion.trim(),
        calories: Number(newCal),
        protein: Number(newProtein),
        carbohydrates: Number(newCarbs),
        fat: Number(newFat),
        notes: newNotes.trim(),
      },
    ]);

    setNewFood('');
    setNewPortion('');
    setNewNotes('');
  };

  const handleRemoveMeal = (idx: number) => {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  };

  // Macro Totals
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbohydrates || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !memberId) return;

    setIsSubmitting(true);
    const result = await createDietPlan({
      planName: planName.trim(),
      memberId,
      trainerId,
      dietaryPreference,
      fitnessGoal,
      startDate,
      endDate,
      instructions: instructions.trim(),
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      meals,
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Personalized Nutrition & Diet Plan Builder" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Medical & Nutritional Disclaimer Notice */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-300 leading-relaxed">
            <strong className="text-amber-300 font-bold block mb-0.5">Professional Medical Disclaimer:</strong>
            Diet plans must be reviewed by an appropriately qualified professional where necessary. Do not present AI-generated nutrition suggestions as medical advice. Always consider athlete allergies, renal health, and clinical contraindications.
          </div>
        </div>

        {/* Basic Diet Plan Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Diet Plan Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. 2,800 kcal Lean Bulk High-Protein Nutrition Plan"
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

        {/* Dietary Preference, Goal, Trainer, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Dietary Preference</label>
            <select
              value={dietaryPreference}
              onChange={(e: any) => setDietaryPreference(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Custom">Custom</option>
              <option value="Keto">Keto</option>
              <option value="High Protein">High Protein</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Fitness Goal</label>
            <select
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              <option value="Muscle Building">Muscle Building</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Endurance">Endurance</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Nutritionist / Trainer</label>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Duration End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
            />
          </div>
        </div>

        {/* Live Macronutrient Calculator Bar */}
        <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-xl bg-[#151A17] border border-[#1C2420]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Calories</span>
            <span className="text-base font-black text-[#B6FF45]">{totalCalories} kcal</span>
          </div>

          <div className="p-2 rounded-xl bg-[#151A17] border border-[#1C2420]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Protein</span>
            <span className="text-base font-black text-cyan-400">{Math.round(totalProtein)} g</span>
          </div>

          <div className="p-2 rounded-xl bg-[#151A17] border border-[#1C2420]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Carbohydrates</span>
            <span className="text-base font-black text-amber-400">{Math.round(totalCarbs)} g</span>
          </div>

          <div className="p-2 rounded-xl bg-[#151A17] border border-[#1C2420]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Fats</span>
            <span className="text-base font-black text-rose-400">{Math.round(totalFat)} g</span>
          </div>
        </div>

        {/* Meal Schedule List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#B6FF45]" />
              <span>Configured Meals ({meals.length})</span>
            </h5>
            <span className="text-[10px] text-zinc-400">All 6 daily slots supported</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {meals.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#B6FF45]/10 text-[#B6FF45] text-[10px] font-bold">
                      {m.mealName}
                    </span>
                    <h6 className="text-xs font-bold text-white">{m.foodName}</h6>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Portion: <strong className="text-zinc-200">{m.portionSize}</strong> •{' '}
                    <span className="text-[#B6FF45]">{m.calories} kcal</span> • P: {m.protein}g | C: {m.carbohydrates}g | F: {m.fat}g
                    {m.notes && <span className="text-zinc-500"> ({m.notes})</span>}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMeal(idx)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Meal Item Box */}
        <div className="p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-200 block">+ Add Meal Feeding Slot</span>
            <select
              value={activeSlot}
              onChange={(e: any) => setActiveSlot(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#151A17] border border-[#1C2420] text-[#B6FF45] text-xs font-bold focus:outline-none"
            >
              {DEFAULT_MEAL_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newFood}
              onChange={(e) => setNewFood(e.target.value)}
              placeholder="Food name (e.g. Scrambled Eggs + Multigrain Toast)"
              className="w-full px-3 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
            />
            <input
              type="text"
              value={newPortion}
              onChange={(e) => setNewPortion(e.target.value)}
              placeholder="Portion size (e.g. 3 eggs + 2 slices)"
              className="w-full px-3 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <input
                type="number"
                value={newCal}
                onChange={(e) => setNewCal(Number(e.target.value))}
                placeholder="Calories"
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
              />
            </div>
            <div>
              <input
                type="number"
                value={newProtein}
                onChange={(e) => setNewProtein(Number(e.target.value))}
                placeholder="Protein (g)"
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-cyan-400 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <input
                type="number"
                value={newCarbs}
                onChange={(e) => setNewCarbs(Number(e.target.value))}
                placeholder="Carbs (g)"
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-amber-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <input
                type="number"
                value={newFat}
                onChange={(e) => setNewFat(Number(e.target.value))}
                placeholder="Fat (g)"
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-rose-400 text-xs focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Preparation notes (e.g. Cook in extra virgin olive oil)"
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#151A17] border border-[#1C2420] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF45]"
            />
            <button
              type="button"
              onClick={handleAddMeal}
              className="px-4 py-1.5 rounded-xl bg-[#B6FF45]/10 hover:bg-[#B6FF45]/20 text-[#B6FF45] font-bold text-xs border border-[#B6FF45]/30 flex items-center gap-1.5 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Meal</span>
            </button>
          </div>
        </div>

        {/* Additional Instructions */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
            General Nutrition & Hydration Directives
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-xs focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Action Buttons */}
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
            disabled={isSubmitting || meals.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a3e635] text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#B6FF45]/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Diet Plan...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Assign Diet Plan to Member</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
