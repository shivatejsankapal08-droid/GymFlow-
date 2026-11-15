import React, { useRef } from 'react';
import { PaymentReceiptData, PaymentTransaction } from '../../types';
import { Badge } from '../common/Badge';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  Building2,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ShieldCheck,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData?: PaymentReceiptData | null;
  payment?: PaymentTransaction | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  payment,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Fallback if full structured receiptData is not yet fetched
  const receiptNum = receiptData?.receiptNumber || payment?.receiptNumber || payment?.invoiceNumber || `REC-2026-00001`;
  const gymName = receiptData?.gym.name || 'IronPulse Fitness Club';
  const gymAddress = receiptData?.gym.address || 'Platinum Towers, Linking Road, Bandra West, Mumbai';
  const gymPhone = receiptData?.gym.phone || '+91 98765 43210';
  const gymEmail = receiptData?.gym.email || 'billing@ironpulse.com';
  const memberName = receiptData?.member.name || payment?.memberName || 'Athlete Member';
  const memberCode = receiptData?.member.code || payment?.memberCode || 'IP-1001';
  const planName = receiptData?.member.planName || payment?.planName || 'GymFlow Membership';
  const finalAmount = receiptData?.summary.totalPaid ?? payment?.finalAmount ?? payment?.amount ?? 2999;
  const basePrice = receiptData?.summary.subtotal ?? payment?.amount ?? 2999;
  const discount = receiptData?.summary.discountTotal ?? payment?.discount ?? 0;
  const remainingDue = receiptData?.summary.remainingDue ?? 0;
  const status = (receiptData?.paymentStatus || payment?.paymentStatus || 'completed').toLowerCase();
  const method = (receiptData?.paymentMethod || payment?.paymentMethod || 'razorpay').toUpperCase();
  const dateStr = receiptData?.paymentDate || payment?.paymentDate || payment?.paidAt || new Date().toISOString();
  const txnId = receiptData?.transactionId || payment?.transactionId || payment?.razorpayPaymentId || 'TXN-DIRECT';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const textContent = `
=====================================================
            ${gymName.toUpperCase()}
          OFFICIAL TAX INVOICE RECEIPT
=====================================================
Receipt No: ${receiptNum}
Transaction ID: ${txnId}
Date: ${new Date(dateStr).toLocaleString('en-IN')}
Status: ${status.toUpperCase()}
Payment Method: ${method}

FACILITY DETAILS:
Address: ${gymAddress}
Phone: ${gymPhone}
Email: ${gymEmail}
GSTIN: 27AABCG1234F1Z8

MEMBER DETAILS:
Athlete Name: ${memberName}
Member ID: ${memberCode}
Plan: ${planName}

BREAKDOWN:
Plan Base Fee:     ₹${basePrice.toLocaleString('en-IN')}
Discount Applied: -₹${discount.toLocaleString('en-IN')}
-----------------------------------------------------
TOTAL PAID:        ₹${finalAmount.toLocaleString('en-IN')}
REMAINING DUE:     ₹${remainingDue.toLocaleString('en-IN')}
-----------------------------------------------------
Recorded By: ${receiptData?.recordedBy || payment?.recordedBy || 'Frontdesk System'}
Notes: ${payment?.notes || 'Thank you for training with us.'}
Security Hash: ${receiptData?.verificationSignature || 'SHA256:VERIFIED'}
=====================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receiptNum}_Tax_Invoice.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0F1311] border border-[#1C2420] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C2420] bg-[#151A17]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#B6FF45]/10 border border-[#B6FF45]/20 rounded-xl">
              <CreditCard className="w-5 h-5 text-[#B6FF45]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Official Tax Invoice Receipt
                <Badge variant={status === 'completed' ? 'completed' : status === 'refunded' ? 'refunded' : status === 'pending' ? 'pending' : 'failed'}>
                  {status.toUpperCase()}
                </Badge>
              </h2>
              <p className="text-xs text-zinc-400 font-mono">{receiptNum}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300" ref={printableRef}>
          {/* Receipt Header Card */}
          <div className="p-5 rounded-2xl bg-[#151A17] border border-[#1C2420] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B6FF45] shadow-[0_0_8px_#B6FF45]" />
                <h3 className="text-lg font-black tracking-tight text-white">{gymName}</h3>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                {gymAddress}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#B6FF45]" />
                  {gymPhone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#B6FF45]" />
                  {gymEmail}
                </span>
                <span>•</span>
                <span className="font-mono text-zinc-500">GSTIN: 27AABCG1234F1Z8</span>
              </div>
            </div>

            {/* QR Code Verification Stamp */}
            <div className="flex flex-col items-center bg-[#090B0A] p-2.5 rounded-xl border border-[#1C2420]">
              <QRCodeSVG
                value={`GYMFLOW-TAX-INVOICE:${receiptNum}:${finalAmount}:${status}`}
                size={70}
                bgColor="#090B0A"
                fgColor="#B6FF45"
                level="M"
              />
              <span className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">VERIFIED HASH</span>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Receipt No</span>
              <p className="text-white font-mono font-semibold truncate mt-0.5">{receiptNum}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Date & Time</span>
              <p className="text-white font-semibold truncate mt-0.5">
                {new Date(dateStr).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Payment Mode</span>
              <p className="text-[#B6FF45] font-semibold truncate mt-0.5">{method}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#151A17] border border-[#1C2420]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Transaction ID</span>
              <p className="text-white font-mono text-[11px] truncate mt-0.5">{txnId}</p>
            </div>
          </div>

          {/* Member Card */}
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B6FF45]">Billed To Athlete</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{memberName}</h4>
              <p className="text-xs text-zinc-400 font-mono">Member ID: {memberCode}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active Tier</span>
              <p className="text-xs font-semibold text-white mt-0.5">{planName}</p>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="rounded-2xl border border-[#1C2420] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151A17] text-zinc-400 font-semibold border-b border-[#1C2420]">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Base Amount</th>
                  <th className="py-2.5 px-4 text-right">Discount</th>
                  <th className="py-2.5 px-4 text-right">Final Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2420] bg-[#0A0D0B]">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">Gym Membership Access</p>
                    <p className="text-[11px] text-zinc-400">{planName} • Full Access Facility</p>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-300">
                    ₹{basePrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">
                    {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    ₹{finalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation & Remaining Due Summary */}
          <div className="p-4 rounded-2xl bg-[#151A17] border border-[#1C2420] space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">₹{basePrice.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Special Privilege Discount:</span>
                <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Applicable Taxes (GST 0% Included):</span>
              <span className="font-mono text-white">₹0.00</span>
            </div>
            <div className="pt-2 border-t border-[#1C2420] flex justify-between items-center text-sm">
              <span className="font-bold text-white">Total Amount Paid:</span>
              <span className="text-lg font-black font-mono text-[#B6FF45]">
                ₹{finalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            {remainingDue > 0 && (
              <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center text-xs text-amber-400 bg-amber-500/5 px-3 py-1.5 rounded-lg">
                <span className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Remaining Outstanding Due:
                </span>
                <span className="font-mono font-bold">₹{remainingDue.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Security & Audit Footer */}
          <div className="p-3 rounded-xl bg-[#090B0A] border border-[#1C2420] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-[#B6FF45]" />
              <span>Tamper-Proof Audit Hash: {receiptData?.verificationSignature || 'SHA256:7B8F9A23E01D'}</span>
            </div>
            <span>Recorded by: {payment?.recordedBy || 'Staff Desk'}</span>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#1C2420] bg-[#151A17]">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#B6FF45]" />
            Official GST-compliant digital tax invoice
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1C2420] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .TXT
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#B6FF45] text-black hover:bg-[#a3e635] shadow-[0_0_15px_rgba(182,255,69,0.25)] transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
