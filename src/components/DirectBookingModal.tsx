import React, { useState } from 'react';
import api from '../services/api.ts';
import { 
  Calendar, 
  Clock, 
  X, 
  AlertCircle, 
  CreditCard, 
  Sparkles,
  Loader2 
} from 'lucide-react';

interface DirectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onSuccess: (bookingData: { bookingId: number; sessionPrice: number }) => void;
}

export const DirectBookingModal: React.FC<DirectBookingModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
}) => {
  const [scheduledAt, setScheduledAt] = useState('2026-10-25 10:00 AM');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !listing) return null;

  const price = Number(listing.price_inr);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/bookings', {
        listing_id: listing.id,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        student_notes: notes,
      });

      if (res.data.success) {
        onSuccess({
          bookingId: res.data.bookingId,
          sessionPrice: res.data.sessionPrice,
        });
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to initialize booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Book Learning Session</h3>
              <p className="text-xs text-slate-500">
                Rule 3: Direct Paid Learning (No swap needed)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleBook} className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 font-medium">{listing.skill_name}</p>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{listing.title}</h4>
                <p className="text-xs text-slate-600 mt-1">Instructor: {listing.user_name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-bold text-indigo-700 font-mono">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">{listing.session_duration_minutes || 60} mins</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Date & Time Slot
              </label>
              <input
                type="text"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                placeholder="e.g. 2026-10-25 10:00 AM"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Teacher availability: {listing.teaching_availability}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes (Deep Dive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes for Instructor (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What topics or specific challenges would you like to focus on?"
                rows={2}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Proceed to Pay ₹{price.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
