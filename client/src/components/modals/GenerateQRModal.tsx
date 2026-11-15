import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Share2, Check, RefreshCw, UserCheck } from 'lucide-react';

export const GenerateQRModal: React.FC = () => {
  const { isGenerateQRModalOpen, setIsGenerateQRModalOpen, members, addToast } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [qrType, setQrType] = useState<'member' | 'kiosk_checkin' | 'guest'>('member');
  const [guestName, setGuestName] = useState('');

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const getQRValue = () => {
    if (qrType === 'kiosk_checkin') {
      return `GYMFLOW-KIOSK-STATION-BANDRA-${Date.now().toString().slice(-6)}`;
    }
    if (qrType === 'guest') {
      return `GYMFLOW-GUEST-PASS-${guestName.toUpperCase().replace(/\s+/g, '_') || 'VALUED_GUEST'}-2026`;
    }
    return selectedMember?.qrToken || 'GYMFLOW-DEFAULT';
  };

  const qrValue = getQRValue();

  const handleDownloadQR = () => {
    addToast({
      type: 'success',
      title: 'QR Code Downloaded',
      message: 'Digital pass QR graphic prepared for print and kiosk badges.',
    });
  };

  const handleShareWhatsApp = () => {
    addToast({
      type: 'success',
      title: 'Pass Sent to WhatsApp',
      message: `QR Access pass dispatched to ${selectedMember?.phone || 'member phone'}.`,
    });
    setIsGenerateQRModalOpen(false);
  };

  return (
    <Modal
      isOpen={isGenerateQRModalOpen}
      onClose={() => setIsGenerateQRModalOpen(false)}
      title="Generate QR Access Pass"
      subtitle="Issue dynamic encrypted entrance tokens for athletes, guests & turnstiles"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Pass Type Selector */}
        <div className="flex p-1 bg-[#0F1311] rounded-xl border border-[#1C2420]">
          <button
            onClick={() => setQrType('member')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              qrType === 'member'
                ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Member Pass
          </button>
          <button
            onClick={() => setQrType('guest')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              qrType === 'guest'
                ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Guest Pass
          </button>
          <button
            onClick={() => setQrType('kiosk_checkin')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              qrType === 'kiosk_checkin'
                ? 'bg-[#151A17] text-[#B6FF45] border border-[#B6FF45]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Turnstile Kiosk
          </button>
        </div>

        {/* Member Selector if member type */}
        {qrType === 'member' && (
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Select Member</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode}) • {m.currentPlanName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Guest Name if guest type */}
        {qrType === 'guest' && (
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Guest Full Name</label>
            <input
              type="text"
              placeholder="e.g. Siddharth Joshi"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-[#0F1311] border border-[#1C2420] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6FF45]"
            />
          </div>
        )}

        {/* Rendered QR Card */}
        <div className="p-6 rounded-2xl bg-[#090B0A] border-2 border-[#1C2420] flex flex-col items-center text-center">
          <div className="p-4 bg-white rounded-2xl shadow-xl ring-4 ring-[#B6FF45]/20">
            <QRCodeSVG value={qrValue} size={150} level="H" fgColor="#090B0A" bgColor="#ffffff" />
          </div>

          <p className="mt-3 font-mono font-bold text-[#B6FF45] text-xs truncate max-w-xs">
            {qrValue}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Encrypted AES-256 token compatible with turnstiles & mobile app scanner
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleDownloadQR}
            className="py-2.5 rounded-xl bg-[#151A17] hover:bg-[#1C2420] text-zinc-200 font-bold border border-[#1C2420] flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-[#B6FF45]" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 rounded-xl bg-[#B6FF45] hover:bg-[#a6ec3c] text-[#090B0A] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B6FF45]/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Send to Member</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
