import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DemoPaymentModal } from '../components/DemoPaymentModal.tsx';
import { 
  Repeat, 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  Sparkles,
  Loader2,
  Calendar
} from 'lucide-react';

export const ExchangesPage: React.FC = () => {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Payment modal state for paying differential fee (Rule 2)
  const [selectedPaymentExchange, setSelectedPaymentExchange] = useState<any | null>(null);

  useEffect(() => {
    loadExchanges();
  }, [filterType]);

  const loadExchanges = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/exchanges/me?type=${filterType}`);
      if (res.data.success) {
        setExchanges(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      setActionError(null);
      const res = await api.patch(`/exchanges/${id}/accept`);
      if (res.data.success) {
        loadExchanges();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to accept exchange.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      setActionError(null);
      const res = await api.patch(`/exchanges/${id}/reject`, { reason: 'Schedule mismatch or unavailable.' });
      if (res.data.success) {
        loadExchanges();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reject exchange.');
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPaymentExchange(null);
    loadExchanges();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Confirmed</span>;
      case 'awaiting_payment':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Awaiting Payment</span>;
      case 'accepted':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Accepted</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Declined</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">Completed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Pending Review</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Skill Exchange Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Equal-level free swaps and unequal-level exchanges with differential fee calculations
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Exchanges
          </button>
          <button
            onClick={() => setFilterType('incoming')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'incoming' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Incoming
          </button>
          <button
            onClick={() => setFilterType('outgoing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'outgoing' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Outgoing
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Loading exchange requests...</p>
        </div>
      ) : exchanges.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No exchange requests found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Browse the skill catalog to find mentors and propose your first equal or unequal skill swap!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exchanges.map((ex) => {
            const isIncoming = ex.isIncoming;
            const diffAmount = Number(ex.additional_payment_amount);
            const isFree = diffAmount === 0;
            const amIPayer = ex.payer_user_id === user?.id;
            const isAwaitingMyPayment = ex.status === 'awaiting_payment' && amIPayer;

            return (
              <div
                key={ex.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header: Status and Parties */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Exchange #{ex.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-600">
                      {isIncoming ? (
                        <>From student: <strong className="text-slate-900">{ex.initiator_name}</strong></>
                      ) : (
                        <>To mentor: <strong className="text-slate-900">{ex.recipient_name}</strong></>
                      )}
                    </span>
                  </div>
                  <div>{getStatusBadge(ex.status)}</div>
                </div>

                {/* 2-Side Skill Comparison (Rule 1 & Rule 2 Visualizer) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Initiator Offer */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {ex.initiator_name} Offers
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{ex.initiator_listing_title}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>
                        {ex.initiator_skill_name} ({ex.initiator_proficiency})
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(ex.initiator_session_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Recipient Offer */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {ex.recipient_name} Teaches
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{ex.recipient_listing_title}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>
                        {ex.recipient_skill_name} ({ex.recipient_proficiency})
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(ex.recipient_session_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Valuation Calculation Banner */}
                <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isFree
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span>
                      {isFree ? (
                        <strong>Rule 1: Equal-level Free Swap. Additional payment = ₹0!</strong>
                      ) : (
                        <span>
                          <strong>Rule 2: Unequal value.</strong> Higher session value is ₹{Math.max(ex.initiator_session_price, ex.recipient_session_price)}. Differential fee to pay: <strong className="font-mono">₹{diffAmount}</strong>.
                        </span>
                      )}
                    </span>
                  </div>

                  {!isFree && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-indigo-200 shrink-0">
                      Payer: {amIPayer ? 'You' : ex.recipient_id === ex.payer_user_id ? ex.recipient_name : ex.initiator_name}
                    </span>
                  )}
                </div>

                {ex.notes && (
                  <p className="text-xs text-slate-600 italic">
                    Note: "{ex.notes}"
                  </p>
                )}

                {/* Proposed Timing */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Proposed Slot: <strong>{ex.proposed_date || 'Flexible Weekend'}</strong></span>
                </div>

                {/* Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Created on {new Date(ex.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Recipient can accept or reject pending request */}
                    {isIncoming && ex.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReject(ex.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(ex.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors"
                        >
                          Accept Exchange
                        </button>
                      </>
                    )}

                    {/* Pay Differential button if awaiting payment */}
                    {isAwaitingMyPayment && (
                      <button
                        onClick={() => setSelectedPaymentExchange(ex)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Differential ₹{diffAmount} via Demo Gateway
                      </button>
                    )}

                    {ex.status === 'confirmed' && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Swap Active & Confirmed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Demo Payment Modal for Paying Differential Fee */}
      {selectedPaymentExchange && (
        <DemoPaymentModal
          isOpen={!!selectedPaymentExchange}
          onClose={() => setSelectedPaymentExchange(null)}
          type="exchange"
          referenceId={selectedPaymentExchange.id}
          amountInr={Number(selectedPaymentExchange.additional_payment_amount)}
          title={`Exchange Differential Fee #${selectedPaymentExchange.id}`}
          recipientName={selectedPaymentExchange.recipient_name}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
