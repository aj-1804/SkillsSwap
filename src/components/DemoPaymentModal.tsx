import React, { useState } from 'react';
import api from '../services/api.ts';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Lock
} from 'lucide-react';

interface DemoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  type: 'booking' | 'exchange';
  referenceId: number;
  amountInr: number;
  title: string;
  recipientName?: string;
}

export const DemoPaymentModal: React.FC<DemoPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  referenceId,
  amountInr,
  title,
  recipientName,
}) => {
  const [tab, setTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // Simulate network gateway processing delay
      await new Promise((r) => setTimeout(r, 1200));

      const res = await api.post('/payments/verify', {
        type,
        reference_id: referenceId,
        payment_method: tab,
        simulate_failure: simulateFailure,
      });

      if (res.data.success) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.data.message || 'Payment processing failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Transaction authorization failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                Demo Payment Gateway
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-slate-300 truncate max-w-[240px]">{title}</p>
              {recipientName && (
                <p className="text-[11px] text-slate-400">Mentor: {recipientName}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold tracking-tight text-white">
                ₹{amountInr.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block">INR (Rupees)</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-y border-amber-100 px-4 py-2 text-[11px] text-amber-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Simulation mode for project testing. No actual money will be deducted.</span>
        </div>

        {/* Payment Methods */}
        <div className="p-5">
          <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setTab('upi')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                tab === 'upi'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              UPI / QR
            </button>
            <button
              type="button"
              onClick={() => setTab('card')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                tab === 'card'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Debit / Card
            </button>
            <button
              type="button"
              onClick={() => setTab('netbanking')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                tab === 'netbanking'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              NetBanking
            </button>
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            {tab === 'upi' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Virtual Payment Address (UPI ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="username@bank"
                    required
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                    Verified Demo
                  </span>
                </div>
                <div className="flex gap-2 pt-1 text-[10px] text-slate-500">
                  <span className="px-2 py-1 bg-slate-100 rounded">GPay</span>
                  <span className="px-2 py-1 bg-slate-100 rounded">PhonePe</span>
                  <span className="px-2 py-1 bg-slate-100 rounded">Paytm</span>
                  <span className="px-2 py-1 bg-slate-100 rounded">BHIM</span>
                </div>
              </div>
            )}

            {tab === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      defaultValue="08/29"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      defaultValue="772"
                      maxLength={3}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === 'netbanking' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Select Bank</label>
                <select className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>State Bank of India (SBI)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Punjab National Bank</option>
                </select>
              </div>
            )}

            {/* Test Simulation Controls */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-[11px]">
                  Simulate Bank Failure (Test error state handling)
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing ₹{amountInr.toLocaleString('en-IN')}...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pay ₹{amountInr.toLocaleString('en-IN')} via Demo Gateway</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
