import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Repeat, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRightLeft, 
  PlusCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExchangeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: any; // Listing the user wants to learn
  onSuccess: () => void;
}

export const ExchangeProposalModal: React.FC<ExchangeProposalModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState<any[]>([]);
  const [selectedMyListingId, setSelectedMyListingId] = useState<number | ''>('');
  const [proposedDate, setProposedDate] = useState('Coming Saturday, 4:00 PM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadMyListings();
    }
  }, [isOpen, user]);

  const loadMyListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/listings/my');
      if (res.data.success) {
        const active = res.data.data.filter((l: any) => l.is_active);
        setMyListings(active);
        if (active.length > 0) {
          setSelectedMyListingId(active[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load user listings', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !targetListing) return null;

  const selectedListing = myListings.find((l) => l.id === Number(selectedMyListingId));

  // Calculate pricing comparison
  const myPrice = selectedListing ? Number(selectedListing.price_inr) : 0;
  const targetPrice = Number(targetListing.price_inr);
  const priceDiff = Math.abs(targetPrice - myPrice);
  const isEqual = myPrice === targetPrice;
  const iAmPaying = targetPrice > myPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMyListingId) {
      setErrorMsg('Please select a skill listing from your profile to exchange.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/exchanges', {
        recipient_id: targetListing.user_id,
        initiator_listing_id: Number(selectedMyListingId),
        recipient_listing_id: targetListing.id,
        proposed_date: proposedDate,
        notes,
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit exchange proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Propose Skill Exchange</h3>
              <p className="text-xs text-slate-500">
                Swapping with <span className="font-semibold text-slate-700">{targetListing.user_name}</span>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Target Skill (What you want to learn) */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Skill You Want to Learn
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{targetListing.title}</p>
                <p className="text-xs text-slate-500">
                  {targetListing.skill_name} • {targetListing.proficiency_level} level
                </p>
              </div>
              <span className="text-base font-bold text-indigo-900">
                ₹{targetPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* User's Offered Skill */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Select Your Skill Listing to Offer in Return
            </label>

            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                Loading your listings...
              </div>
            ) : myListings.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                <p className="font-medium">You don't have any active skill listings yet.</p>
                <p className="text-[11px] text-amber-700">
                  You can either publish a skill listing to offer, or use <strong>Rule 3: Direct Paid Learning</strong> to book without offering a skill.
                </p>
                <Link
                  to="/my-listings"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Create a Skill Listing
                </Link>
              </div>
            ) : (
              <select
                value={selectedMyListingId}
                onChange={(e) => setSelectedMyListingId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {myListings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.skill_name} ({l.proficiency_level}) — Valued at ₹{l.price_inr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Calculation Box: Rules 1 & 2 */}
          {selectedListing && (
            <div className={`p-4 rounded-xl border transition-all ${
              isEqual 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-blue-50/80 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {isEqual ? 'Rule 1: Equal-Level Exchange' : 'Rule 2: Unequal-Value Exchange'}
                </h4>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Your session value:</span>
                  <span className="font-mono font-medium">₹{myPrice}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{targetListing.user_name}'s session value:</span>
                  <span className="font-mono font-medium">₹{targetPrice}</span>
                </div>
                <div className="border-t border-slate-200/60 pt-1 mt-1 flex justify-between font-bold text-sm">
                  <span>Additional Payment Required:</span>
                  <span className={isEqual ? 'text-emerald-700' : 'text-indigo-700 font-mono'}>
                    {isEqual ? '₹0 (Free Swap)' : `₹${priceDiff}`}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                {isEqual ? (
                  <span className="text-emerald-700 font-medium">
                    Both skills have equal session values. Neither student needs to pay any additional amount!
                  </span>
                ) : iAmPaying ? (
                  <span>
                    Because {targetListing.user_name}'s session is valued at ₹{targetPrice} and yours at ₹{myPrice}, you will pay the differential fee of <strong className="text-indigo-900 font-semibold">₹{priceDiff}</strong> after {targetListing.user_name} accepts.
                  </span>
                ) : (
                  <span>
                    Because your session is valued at ₹{myPrice} and {targetListing.user_name}'s at ₹{targetPrice}, {targetListing.user_name} will pay the differential fee of <strong className="text-indigo-900 font-semibold">₹{priceDiff}</strong> to balance the exchange.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Proposed Date & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Schedule / Timing
              </label>
              <input
                type="text"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                placeholder="e.g. Next Saturday, 4:00 PM"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Message / Swap Goals (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you hope to cover or any specific topics..."
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || myListings.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Proposal...</span>
              </>
            ) : (
              <>
                <Repeat className="w-3.5 h-3.5" />
                <span>Submit Swap Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
