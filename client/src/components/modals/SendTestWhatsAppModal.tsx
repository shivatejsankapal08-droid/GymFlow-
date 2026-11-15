import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface SendTestWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
}

export const SendTestWhatsAppModal: React.FC<SendTestWhatsAppModalProps> = ({
  isOpen,
  onClose,
  defaultPhone = '+91 98201 12345',
}) => {
  const { currentGym, sendTestWhatsApp, whatsappConfig } = useApp();
  const [recipient, setRecipient] = useState<string>(defaultPhone);
  const [recipientName, setRecipientName] = useState<string>('Vikram Malhotra');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [customMessage, setCustomMessage] = useState<string>(
    `Hello! This is a verified test message from ${currentGym.name} powered by GymFlow AI WhatsApp Automation. 🏋️‍♂️`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const templates: Record<string, { label: string; text: string; templateName?: string }> = {
    custom: {
      label: 'Custom Text Message',
      text: customMessage,
    },
    expiry: {
      label: 'Membership Expiry Reminder (3 Days Left)',
      templateName: 'gymflow_membership_expiry',
      text: `Hello ${recipientName}, your gym membership at ${currentGym.name} will expire on 2026-11-18. Renew your membership to continue enjoying your fitness journey!\n\nRenew instantly: https://pay.gymflow.ai/renew?code=IP-1003`,
    },
    payment: {
      label: 'Verified Payment Receipt & Tax Invoice',
      templateName: 'gymflow_payment_verified',
      text: `✅ *Payment Confirmed!*\n\nHello ${recipientName}, your payment of ₹24,999 for Annual Elite VIP at ${currentGym.name} was successful.\n\nTransaction ID: pay_ironpulse_001\nDigital Receipt: https://pay.gymflow.ai/receipt/pay_ironpulse_001\n\nThank you for training with us! 💪`,
    },
    birthday: {
      label: 'Athlete Birthday Greeting & Shake Voucher',
      templateName: 'gymflow_birthday_wishes',
      text: `Happy Birthday ${recipientName}! 🎉 Team ${currentGym.name} wishes you a healthy, strong, and successful year ahead! Enjoy a complimentary protein shake at our juice bar today! 🎂🥤`,
    },
    check_in: {
      label: 'Attendance Check-in Welcome',
      templateName: 'gymflow_check_in_alert',
      text: `🏋️ Welcome to ${currentGym.name}, ${recipientName}! Checked in at 07:30 AM. Have an energizing workout! 💪`,
    },
    check_out: {
      label: 'Attendance Check-out Summary',
      templateName: 'gymflow_check_out_alert',
      text: `✅ Checked out from ${currentGym.name} at 08:45 AM. Session duration: 75 mins. Great consistency today! 🔥`,
    },
    inactive: {
      label: 'Inactive Member Retention Note (> 7 Days)',
      templateName: 'gymflow_inactive_reminder',
      text: `We miss you at ${currentGym.name}, ${recipientName}! It has been 8 days since your last session. Your fitness goals are waiting — visit us today for a great workout! 💥`,
    },
    daily_report: {
      label: 'Daily Gym Owner Executive Briefing',
      templateName: 'gymflow_daily_owner_report',
      text: `📊 *Daily Executive Digest - ${currentGym.name}*\n📅 Date: Today\n\n👥 Active Members: 24\n🆕 New Signups Today: 2\n🏋️ Today's Attendance: 18 (Peak: 06:00 PM - 08:00 PM)\n💰 Revenue Collected: ₹24,999\n⏳ Pending Dues: ₹8,997\n⚠️ Expiring Soon: 2\n❌ Expired: 1\n\n_Powered by GymFlow AI Automation_`,
    },
  };

  const previewText = selectedTemplate === 'custom' ? customMessage : templates[selectedTemplate]?.text || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;

    setIsSubmitting(true);
    try {
      const isCustom = selectedTemplate === 'custom';
      await sendTestWhatsApp({
        recipient,
        recipientName,
        templateName: isCustom ? undefined : templates[selectedTemplate]?.templateName,
        messageText: isCustom ? customMessage : previewText,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Test WhatsApp Message" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#090B0A] border border-[#1C2420]">
          <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white flex items-center gap-2">
              Meta WhatsApp Cloud API Sandbox Mode
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#B6FF45]/10 text-[#B6FF45] border border-[#B6FF45]/20 font-mono">
                {whatsappConfig?.connection_status || 'Sandbox Mode (Active)'}
              </span>
            </div>
            <p className="text-zinc-400 mt-0.5">
              Simulates delivery or dispatches directly via Meta Cloud API when configured in environment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Recipient Phone Number (with Country Code) *
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+91 98201 12345"
              className="w-full px-4 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#B6FF45]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Recipient Full Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Vikram Malhotra"
              className="w-full px-4 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#B6FF45]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Select Message Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white text-sm focus:outline-none focus:border-[#B6FF45]"
          >
            {Object.entries(templates).map(([key, t]) => (
              <option key={key} value={key} className="bg-[#151A17] text-white">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate === 'custom' && (
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Custom WhatsApp Message Body</label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090B0A] border border-[#1C2420] text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#B6FF45]"
            />
          </div>
        )}

        {/* WhatsApp Chat Bubble Live Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" /> Live WhatsApp Message Preview
            </span>
            <span className="text-[11px] text-zinc-500">Delivered via +91 {currentGym.phone || '98765 00000'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1410] border border-[#1C2420]/80 relative overflow-hidden">
            <div className="max-w-[85%] bg-[#1c2e24] border border-[#2b4436] rounded-2xl rounded-tl-sm p-3.5 text-zinc-100 text-xs shadow-lg space-y-2">
              <div className="font-semibold text-[#B6FF45] text-[11px] flex items-center justify-between">
                <span>{currentGym.name}</span>
                <span className="text-[10px] text-zinc-400 font-normal">Official Business Account</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-zinc-200">{previewText}</p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 pt-1">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2420]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              'Dispatching...'
            ) : (
              <>
                <Send className="w-4 h-4" /> Send WhatsApp Test
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
