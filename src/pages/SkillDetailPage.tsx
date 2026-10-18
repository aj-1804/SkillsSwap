import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ExchangeProposalModal } from '../components/ExchangeProposalModal.tsx';
import { DirectBookingModal } from '../components/DirectBookingModal.tsx';
import { DemoPaymentModal } from '../components/DemoPaymentModal.tsx';
import { 
  Star, 
  Clock, 
  MapPin, 
  Calendar, 
  Repeat, 
  CreditCard, 
  MessageSquare, 
  Flag, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';

export const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    bookingId?: number;
    amountInr: number;
    title: string;
  } | null>(null);

  // Report state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Success toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/listings/${id}`);
      if (res.data.success) {
        setListing(res.data.listing);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Skill listing not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeSwap = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsExchangeModalOpen(true);
  };

  const handleBookSession = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleStartChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages?userId=${listing.user_id}`);
  };

  const handleBookingCreated = (data: { bookingId: number; sessionPrice: number }) => {
    if (data.sessionPrice > 0) {
      setPaymentData({
        bookingId: data.bookingId,
        amountInr: data.sessionPrice,
        title: listing.title,
      });
      setIsPaymentModalOpen(true);
    } else {
      setSuccessToast('Booking confirmed successfully!');
      setTimeout(() => navigate('/bookings'), 1500);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccessToast('Payment verified successfully! Session confirmed.');
    setTimeout(() => navigate('/bookings'), 1500);
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/reports', {
        listing_id: listing.id,
        reported_user_id: listing.user_id,
        reason: reportReason,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportReason('');
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500">Loading skill details...</p>
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Skill Listing Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
        <Link
          to="/explore"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/explore" className="hover:text-slate-800">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{listing.category_name}</span>
        <span>/</span>
        <span className="text-slate-900 truncate max-w-xs font-semibold">{listing.skill_name}</span>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {listing.category_name}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${
                  listing.proficiency_level === 'Beginner'
                    ? 'bg-emerald-100 text-emerald-800'
                    : listing.proficiency_level === 'Intermediate'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {listing.proficiency_level} Level
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {listing.title}
              </h1>

              {/* Rating and Reviews Counter */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{listing.rating_avg}</span>
                  <span className="text-slate-400 font-normal">
                    ({listing.total_reviews} verified reviews)
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{listing.session_duration_minutes || 60} mins per session</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">What You Will Learn & Cover</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Teaching Availability */}
            <div className="border-t border-slate-100 pt-6 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Teaching Schedule & Availability
              </h3>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {listing.teaching_availability}
              </p>
            </div>

            {/* Supporting link */}
            {listing.supporting_link && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Portfolio / Reference Material</h3>
                <a
                  href={listing.supporting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>{listing.supporting_link}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Student Reviews Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Reviews & Ratings</h3>
                <p className="text-xs text-slate-500">Feedback from peer exchanges and completed sessions</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-base">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{listing.rating_avg}</span>
              </div>
            </div>

            {listing.reviews && listing.reviews.length > 0 ? (
              <div className="divide-y divide-slate-100 space-y-4">
                {listing.reviews.map((rev: any) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.reviewer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rev.reviewer_name}`}
                          alt={rev.reviewer_name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-900">{rev.reviewer_name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No reviews yet for this listing. Be the first to exchange or learn from {listing.user_name}!
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Instructor Profile & Booking Actions */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Session Listed Value</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  ₹{Number(listing.price_inr).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-medium">INR / Session</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwner ? (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 text-center">
                This is your own skill listing.
                <div className="pt-2">
                  <Link
                    to="/my-listings"
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    Manage My Listings →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Propose Skill Swap Button */}
                <button
                  onClick={handleProposeSwap}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Propose Skill Swap</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Equal proficiency = 100% Free • Unequal = Pay difference only
                </p>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-semibold">
                    Or Learn Directly
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* 2. Direct Paid Booking Button (Rule 3) */}
                <button
                  onClick={handleBookSession}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Book Paid Session (₹{Number(listing.price_inr).toLocaleString('en-IN')})</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Rule 3: No skill to offer needed! Learn directly.
                </p>

                {/* Send message button */}
                <button
                  onClick={handleStartChat}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message {listing.user_name}</span>
                </button>
              </div>
            )}

            {/* Mentor Bio Snapshot */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Instructor Profile
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={listing.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${listing.user_name}`}
                  alt={listing.user_name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{listing.user_name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{listing.user_location}</span>
                  </p>
                </div>
              </div>

              {listing.user_bio && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{listing.user_bio}"
                </p>
              )}

              {listing.user_skills_wanted && (
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-indigo-700">Wants to learn:</span>{' '}
                  {listing.user_skills_wanted}
                </div>
              )}
            </div>

            {/* Moderation link */}
            <div className="pt-2 text-center">
              <button
                onClick={() => setIsReportOpen(true)}
                className="text-[11px] text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer"
              >
                <Flag className="w-3 h-3" /> Report this listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExchangeProposalModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        targetListing={listing}
        onSuccess={() => {
          setSuccessToast('Skill swap proposal sent successfully!');
          setTimeout(() => navigate('/exchanges'), 1500);
        }}
      />

      <DirectBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        listing={listing}
        onSuccess={handleBookingCreated}
      />

      {paymentData && (
        <DemoPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          type="booking"
          referenceId={paymentData.bookingId!}
          amountInr={paymentData.amountInr}
          title={paymentData.title}
          recipientName={listing.user_name}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Report Inappropriate Listing</h3>
            {reportSuccess ? (
              <p className="text-xs text-emerald-600 font-semibold">Report submitted to Amit Jha (Admin).</p>
            ) : (
              <form onSubmit={submitReport} className="space-y-3">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for reporting (e.g. spam, off-platform payment solicit, misleading)..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded-lg font-semibold"
                  >
                    Submit Report
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
