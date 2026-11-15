import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Star, MessageSquare, Dumbbell, CheckCircle2, User } from 'lucide-react';
import { Trainer } from '../../types';

interface TrainerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer | null;
  onSuccess?: () => void;
}

export const TrainerFeedbackModal: React.FC<TrainerFeedbackModalProps> = ({
  isOpen,
  onClose,
  trainer,
  onSuccess,
}) => {
  const { currentGym, members, addToast } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gymMembers = members.filter(
    (m) => m.gymId === currentGym.id || (m as any).gym_id === currentGym.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trainers/${trainer.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'demo-token-member',
          'X-Gym-Id': currentGym.id,
        },
        body: JSON.stringify({
          rating,
          feedback: feedbackText,
          memberId: selectedMemberId || gymMembers[0]?.id,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: 'Review Submitted ⭐',
          message: `Feedback recorded for ${trainer.fullName}. Updated rating: ${data.updatedTrainerRating}/5.0.`,
        });
        setFeedbackText('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        addToast({
          type: 'error',
          title: 'Submission Failed',
          message: data.error || 'Failed to submit feedback.',
        });
      }
    } catch {
      setIsSubmitting(false);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to backend server.',
      });
    }
  };

  if (!trainer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Coach Feedback & Rating"
      subtitle={`Verified athlete review for ${trainer.fullName} (${trainer.trainerCode || 'TR-1001'})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Coach Overview Card */}
        <div className="p-3.5 rounded-2xl bg-[#0F1311] border border-[#1C2420] flex items-center gap-3">
          <img
            src={
              trainer.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
            }
            alt={trainer.fullName}
            className="w-12 h-12 rounded-xl object-cover border border-[#1C2420]"
          />
          <div>
            <h4 className="font-bold text-white text-sm">{trainer.fullName}</h4>
            <p className="text-[11px] text-zinc-400">{trainer.specialization}</p>
            <p className="text-[10px] text-[#B6FF45] font-mono mt-0.5">
              Current Rating: {trainer.rating || 4.9} / 5.0
            </p>
          </div>
        </div>

        {/* Member Selector (Athlete Identity) */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Submitting Athlete *</label>
          <select
            value={selectedMemberId || gymMembers[0]?.id}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
          >
            {gymMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.memberCode || 'MBR'})
              </option>
            ))}
          </select>
        </div>

        {/* Star Rating Picker */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-2">
            Coaching Rating (1 - 5 Stars) *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 text-zinc-600 hover:scale-110 transition-all focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-zinc-600'
                  }`}
                />
              </button>
            ))}
            <span className="font-bold text-amber-400 text-sm ml-2">
              {rating} / 5 ({rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Needs Improvement'})
            </span>
          </div>
        </div>

        {/* Review / Comments */}
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">
            Detailed Coaching Review & Feedback *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Share specific feedback regarding workout guidance, technique correction, punctuality, and motivation..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent hover:bg-[#1C2420] text-zinc-400 hover:text-white font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !feedbackText}
            className="px-5 py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] disabled:opacity-40 text-[#090B0A] font-black uppercase tracking-wider shadow-md shadow-[#B6FF45]/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Post Verified Review'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
