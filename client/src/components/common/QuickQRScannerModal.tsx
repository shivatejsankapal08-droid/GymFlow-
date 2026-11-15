import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { QrCode, Scan, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickQRScannerModal: React.FC<QuickQRScannerModalProps> = ({ isOpen, onClose }) => {
  const { members, checkInMemberWithQR } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    member?: any;
    message: string;
  } | null>(null);

  const handleScan = (tokenOrCode: string) => {
    const res = checkInMemberWithQR(tokenOrCode);
    setScanResult(res);

    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00ff88', '#10b981', '#34d399', '#ffffff'],
      });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualCode('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetScanner();
        onClose();
      }}
      title="QR Attendance Scanner"
      subtitle="Fast contactless check-in & check-out kiosk"
      maxWidth="md"
    >
      <div className="space-y-5">
        {scanResult ? (
          <div
            className={`p-6 rounded-2xl border text-center transition-all ${
              scanResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400 mb-3 animate-bounce" />
            ) : (
              <AlertCircle className="w-14 h-14 mx-auto text-rose-400 mb-3" />
            )}

            <h3 className="text-xl font-bold text-white mb-1">
              {scanResult.success ? 'Access Granted' : 'Access Restricted'}
            </h3>
            <p className="text-sm text-zinc-300 mb-4">{scanResult.message}</p>

            {scanResult.member && (
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left max-w-xs mx-auto mb-5">
                <img
                  src={scanResult.member.avatarUrl}
                  alt={scanResult.member.fullName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/40"
                />
                <div>
                  <p className="text-sm font-bold text-white">{scanResult.member.fullName}</p>
                  <p className="text-xs text-zinc-400">{scanResult.member.memberCode}</p>
                  <p className="text-xs text-emerald-400 font-medium">
                    {scanResult.member.currentPlanName}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={resetScanner}
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Scan Next Member
            </button>
          </div>
        ) : (
          <>
            {/* Simulated Live Camera Scanner Screen */}
            <div className="relative aspect-video rounded-2xl bg-zinc-900/90 border-2 border-dashed border-emerald-500/40 overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
              {/* Corner lasers */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

              {/* Animated laser scan line */}
              <div className="absolute inset-x-8 top-1/4 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#00ff88] animate-pulse" />

              <Scan className="w-12 h-12 text-emerald-400 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white">Live Camera Optical Scanner</p>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                Point member QR code towards the lens for instant auto-checkin
              </p>
            </div>

            {/* Quick Demo Simulator Buttons */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Quick Test with Registered Members:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {members.slice(0, 6).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleScan(member.qrToken)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all hover:border-emerald-500/40 group"
                  >
                    <img
                      src={member.avatarUrl}
                      alt={member.fullName}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-emerald-400">
                        {member.fullName}
                      </p>
                      <p className="text-[10px] text-zinc-400">{member.memberCode}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Code Input */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Or Type Member Code / QR Token:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. IP-1001"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleScan(manualCode)}
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl transition-all"
                >
                  Verify
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
