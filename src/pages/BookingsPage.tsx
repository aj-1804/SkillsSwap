import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DemoPaymentModal } from '../components/DemoPaymentModal.tsx';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Star, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  Video
} from 'lucide-react';

export const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'learner' | 'instructor'>('all');
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [paymentBooking, setPaymentBooking] = useState<any | null>(null);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [roleFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/me?role=${roleFilter}`);
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const res = await api.patch(`/bookings/${id}/complete`);
      if (res.data.success) {
        loadBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete booking');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.patch(`/bookings/${id}/cancel`);
      if (res.data.success) {
        loadBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setReviewSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        listing_id: reviewBooking.listing_id,
        session_id: reviewBooking.session_id,
        rating,
        comment,
      });
      if (res.data.success) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewBooking(null);
          setReviewSuccess(false);
          setComment('');
          loadBookings();
        }, 1200);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Learning Sessions & Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rule 3 direct paid bookings and peer scheduled classrooms
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              roleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setRoleFilter('learner')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              roleFilter === 'learner' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            As Learner
          </button>
          <button
            onClick={() => setRoleFilter('instructor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              roleFilter === 'instructor' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            As Mentor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Loading session records...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No session bookings found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Book any mentor directly from the Explore catalog in INR (₹).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isStudent = b.isStudent;
            const price = Number(b.session_price_inr);
            const needsPayment = b.status === 'awaiting_payment' && isStudent;
            const canComplete = b.status === 'confirmed';
            const canReview = b.status === 'completed' && isStudent && !b.user_review_id;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Booking #{b.id} • {isStudent ? 'Learning Session' : 'Teaching Session'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{b.listing_title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 font-mono">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'awaiting_payment'
                        ? 'bg-amber-100 text-amber-800'
                        : b.status === 'completed'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Session Participants & Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Mentor / Teacher</span>
                    <p className="font-semibold text-slate-900">{b.instructor_name}</p>
                    <p className="text-slate-500 text-[11px]">{b.instructor_email}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Student Learner</span>
                    <p className="font-semibold text-slate-900">{b.student_name}</p>
                    <p className="text-slate-500 text-[11px]">{b.student_email}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Scheduled Timing</span>
                    <p className="font-semibold text-indigo-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {b.scheduled_at}
                    </p>
                    <p className="text-slate-500 text-[11px]">{b.duration_minutes || 60} mins duration</p>
                  </div>
                </div>

                {b.student_notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Student Note: "{b.student_notes}"
                  </p>
                )}

                {/* Bottom Bar: Action buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {b.meeting_link && b.status === 'confirmed' && (
                      <a
                        href={b.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 text-teal-600" />
                        Join Interactive Classroom
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {needsPayment && (
                      <button
                        onClick={() => setPaymentBooking(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay ₹{price.toLocaleString('en-IN')}
                      </button>
                    )}

                    {canComplete && (
                      <button
                        onClick={() => handleComplete(b.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => setReviewBooking(b)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        Leave Review
                      </button>
                    )}

                    {b.status !== 'completed' && b.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {paymentBooking && (
        <DemoPaymentModal
          isOpen={!!paymentBooking}
          onClose={() => setPaymentBooking(null)}
          type="booking"
          referenceId={paymentBooking.id}
          amountInr={Number(paymentBooking.session_price_inr)}
          title={paymentBooking.listing_title}
          recipientName={paymentBooking.instructor_name}
          onSuccess={() => {
            setPaymentBooking(null);
            loadBookings();
          }}
        />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Rate Your Learning Experience</h3>
            <p className="text-xs text-slate-500">
              For session with {reviewBooking.instructor_name} ({reviewBooking.listing_title})
            </p>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-700 text-xs font-semibold text-center">
                Review submitted successfully! Thank you.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Feedback & Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe how the session went, clarity of explanations, and recommendations..."
                    rows={3}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="px-4 py-2 text-xs text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
