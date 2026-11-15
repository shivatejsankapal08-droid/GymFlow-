import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Send, MessageSquare, Sparkles, CheckCircle2, Users, Smartphone } from 'lucide-react';

export const SendNotificationModal: React.FC = () => {
  const { isSendNotificationModalOpen, setIsSendNotificationModalOpen, triggerAutomationTest, addToast } =
    useApp();

  const [audience, setAudience] = useState<'all' | 'expiring' | 'trainers' | 'single'>('expiring');
  const [template, setTemplate] = useState('renewal');
  const [customMessage, setCustomMessage] = useState(
    'Hey Athlete! Your GymFlow membership is expiring in 5 days. Tap here to renew with 1-click: https://pay.gymflow.ai/renew'
  );

  const templates: Record<string, string> = {
    renewal:
      'Hey Athlete! Your GymFlow membership is expiring in 5 days. Tap here to renew with 1-click: https://pay.gymflow.ai/renew',
    comeback:
      'We noticed you haven’t visited the gym in 10 days! Your fitness streak is waiting for you. Come in this week for a free InBody body composition scan!',
    holiday:
      'Important Update: The gym floor will be open with special holiday hours (07:00 AM - 02:00 PM) on Diwali. Stay consistent!',
    custom: '',
  };

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    if (templates[val] !== undefined) {
      setCustomMessage(templates[val]);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutomationTest(
      `WhatsApp Campaign (${audience.toUpperCase()})`,
      `${audience === 'all' ? '318 Active Members' : '14 Expiring Athletes'}`
    );
    setIsSendNotificationModalOpen(false);
  };

  return (
    <Modal
      isOpen={isSendNotificationModalOpen}
      onClose={() => setIsSendNotificationModalOpen(false)}
      title="Send Automated WhatsApp Notification"
      subtitle="Deliver targeted member updates via Meta WhatsApp Cloud API & n8n"
      maxWidth="md"
    >
      <form onSubmit={handleSend} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Target Audience</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'expiring', label: 'Expiring Soon (14)', desc: 'Next 7 days due' },
              { id: 'all', label: 'All Active Members (318)', desc: 'Full gym blast' },
              { id: 'trainers', label: 'All Trainers (3)', desc: 'Staff schedule' },
              { id: 'single', label: 'Single Member', desc: 'Direct 1-on-1' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAudience(opt.id as any)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  audience === opt.id
                    ? 'bg-[#151A17] border-[#B6FF45] text-white'
                    : 'bg-[#0F1311] border-[#1C2420] text-zinc-400 hover:text-white'
                }`}
              >
                <p className="font-bold text-xs">{opt.label}</p>
                <p className="text-[10px] text-zinc-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Select Message Template</label>
          <select
            value={template}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
          >
            <option value="renewal">Membership Expiry & Razorpay Renewal Link</option>
            <option value="comeback">Inactive Member Re-engagement ("We Miss You")</option>
            <option value="holiday">Holiday Operating Hours Announcement</option>
            <option value="custom">Custom Announcement Message</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-zinc-300 mb-1">Message Preview</label>
          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full bg-[#090B0A] border border-[#1C2420] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B6FF45] leading-relaxed"
            placeholder="Type your message here..."
          />
        </div>

        <div className="p-3 rounded-xl bg-[#0F1311] border border-[#1C2420] flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5 text-[#B6FF45] font-semibold">
            <Smartphone className="w-3.5 h-3.5" /> Meta WhatsApp Cloud API Verified
          </span>
          <span>Delivery Speed: ~1.2s</span>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Campaign via n8n</span>
        </button>
      </form>
    </Modal>
  );
};
