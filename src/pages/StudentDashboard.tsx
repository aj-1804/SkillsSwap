import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.ts';
import { 
  Repeat, 
  Calendar, 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle, 
  Bell, 
  User, 
  Star,
  ExternalLink,
  Loader2
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [recRes, notifRes, bookRes] = await Promise.all([
        api.get('/recommendations'),
        api.get('/notifications'),
        api.get('/bookings/me'),
      ]);

      if (recRes.data.success) {
        setRecommendations(recRes.data.data);
      }
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data.slice(0, 5));
      }
      if (bookRes.data.success) {
        setUpcomingSessions(
          bookRes.data.data.filter((b: any) => b.status === 'confirmed').slice(0, 3)
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Welcome back, {user.name}!
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 font-semibold">
                  Student Learner
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                {user.bio || 'Ready to exchange skills and connect with peers globally.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-indigo-200">
                <span>📍 {user.location || 'India'}</span>
                <span>•</span>
                <span>🗣️ {user.languages || 'English, Hindi'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/my-listings"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Teach a Skill
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs border border-white/20 transition-colors"
            >
              <User className="w-4 h-4" /> Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Skills Profile Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skills Offered */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Skills You Offer to Teach
            </span>
            <Link to="/my-listings" className="text-xs text-indigo-600 hover:underline font-semibold">
              Manage Listings →
            </Link>
          </div>
          <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
            {user.skills_offered || 'No skills listed yet. Add skills you can teach to unlock free swaps!'}
          </p>
        </div>

        {/* Skills Wanted */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Skills You Want to Learn
            </span>
            <Link to="/explore" className="text-xs text-teal-600 hover:underline font-semibold">
              Explore Catalog →
            </Link>
          </div>
          <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
            {user.skills_wanted || 'No target skills set. Edit your profile to get personalized swap recommendations!'}
          </p>
        </div>
      </div>

      {/* Main Grid: Recommendations & Notifications / Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: AI-Free Matching & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Recommended Student Mentors & Exchanges
                </h2>
                <p className="text-xs text-slate-500">
                  Algorithmic matching based on skills compatibility, ratings, and exchange pricing
                </p>
              </div>
              <Link to="/explore" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs">Computing skill synergies...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6">
                No active recommendations at the moment. Browse the explore page to discover skills!
              </p>
            ) : (
              <div className="space-y-4">
                {recommendations.slice(0, 4).map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {rec.category_name}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {rec.skill_name} ({rec.proficiency_level})
                        </span>
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          • ₹{rec.price_inr}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
                        {rec.title}
                      </h4>

                      {/* Explanation Sentence (Rule 10 Requirement) */}
                      <p className="text-xs text-teal-800 font-medium bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 flex items-start gap-1.5">
                        <span className="shrink-0 font-bold">💡</span>
                        <span>{rec.recommendationReason}</span>
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                        <img
                          src={rec.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rec.user_name}`}
                          alt={rec.user_name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{rec.user_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" /> {rec.rating_avg}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link
                        to={`/skill/${rec.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                      >
                        <span>View / Swap</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Notifications & Upcoming Sessions */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                Recent Alerts
              </h3>
              <button
                onClick={markAllRead}
                className="text-[11px] text-slate-400 hover:text-indigo-600 cursor-pointer"
              >
                Mark all read
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No new notifications.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link || '/dashboard'}
                    className={`block p-2.5 rounded-xl text-xs transition-colors ${
                      n.is_read ? 'bg-slate-50 hover:bg-slate-100 text-slate-600' : 'bg-indigo-50/70 text-indigo-950 font-medium'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed / Upcoming Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Upcoming Sessions
              </h3>
              <Link to="/bookings" className="text-[11px] text-teal-600 hover:underline font-semibold">
                All Bookings
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 italic">No scheduled sessions today.</p>
                <Link
                  to="/explore"
                  className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Book or Swap a Skill →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{s.listing_title}</p>
                    <p className="text-slate-500">Instructor: {s.instructor_name}</p>
                    <p className="text-indigo-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.scheduled_at}
                    </p>
                    {s.meeting_link && (
                      <a
                        href={s.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline pt-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Join Classroom
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
