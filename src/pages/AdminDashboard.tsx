import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Repeat, 
  Calendar, 
  DollarSign, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  TrendingUp,
  Loader2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'exchanges' | 'bookings' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);

  // Users tab state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Exchanges tab state
  const [exchangesList, setExchangesList] = useState<any[]>([]);

  // Bookings tab state
  const [bookingsList, setBookingsList] = useState<any[]>([]);

  // Reports tab state
  const [reportsList, setReportsList] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'exchanges') loadExchanges();
      if (activeTab === 'bookings') loadBookings();
      if (activeTab === 'reports') loadReports();
    }
  }, [activeTab, user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${userSearch}&status=${userStatusFilter}`);
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadExchanges = async () => {
    try {
      const res = await api.get('/admin/exchanges');
      if (res.data.success) {
        setExchangesList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/admin/bookings');
      if (res.data.success) {
        setBookingsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      if (res.data.success) {
        setReportsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (targetUser: any) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to change ${targetUser.name}'s account status to ${nextStatus}?`)) return;

    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/status`, { status: nextStatus });
      if (res.data.success) {
        loadUsers();
        loadStats();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResolveReport = async (reportId: number, status: string) => {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`, {
        status,
        admin_notes: `Reviewed and actioned by Amit Jha on ${new Date().toLocaleDateString()}`,
      });
      loadReports();
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-xs text-slate-500 mt-1">
          This portal is reserved for Amit Jha (Platform Administrator). Please switch to the admin demo account.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">Admin Management Portal</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-400 text-slate-950 uppercase">
                Amit Jha (Super Admin)
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              Live database metrics, student account activation, exchange verification, and compliance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-purple-100 text-purple-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Platform Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-100 text-purple-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Users Management
        </button>
        <button
          onClick={() => setActiveTab('exchanges')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'exchanges'
              ? 'bg-purple-100 text-purple-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Skill Exchanges
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-purple-100 text-purple-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Paid Bookings & Payments
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer relative ${
            activeTab === 'reports'
              ? 'bg-purple-100 text-purple-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reported Content
          {stats?.stats?.pendingReportsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
              {stats.stats.pendingReportsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dynamic Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Students</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">
                {stats?.stats?.totalStudents || 12}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Active accounts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Listings</span>
                <BookOpen className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">
                {stats?.stats?.activeListings || 13}
              </span>
              <span className="text-[11px] text-teal-600 font-semibold">Ready for swap</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Confirmed Swaps</span>
                <Repeat className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">
                {stats?.stats?.completedExchanges || 4}
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">Equal & unequal</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Platform Revenue</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">
                ₹{Number(stats?.stats?.totalRevenueInr || 1100).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold">Verified transactions</span>
            </div>
          </div>

          {/* Recent Payments and Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Recent Platform Payments</span>
                <span className="text-xs text-slate-400 font-normal">INR Gateway</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {stats?.recentPayments?.map((p: any) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{p.user_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{p.transaction_id}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono">
                        ₹{Number(p.amount_inr).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-600 block capitalize">
                        {p.payment_method} • {p.gateway_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Recently Registered Students</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {stats?.recentUsers?.map((u: any) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email} • {u.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Registered Users & Mentors</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name/email..."
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
              <button
                onClick={loadUsers}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Listings</th>
                  <th className="p-3">Exchanges</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.location || 'India'}</td>
                    <td className="p-3 font-semibold">{u.listing_count || 0}</td>
                    <td className="p-3 font-semibold">{u.exchange_count || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Exchanges */}
      {activeTab === 'exchanges' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">All Platform Skill Exchanges</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Initiator & Skill</th>
                  <th className="p-3">Recipient & Skill</th>
                  <th className="p-3">Fee Diff (INR)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exchangesList.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-400">#{ex.id}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{ex.initiator_name}</p>
                      <p className="text-[11px] text-slate-500">{ex.initiator_listing_title}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{ex.recipient_name}</p>
                      <p className="text-[11px] text-slate-500">{ex.recipient_listing_title}</p>
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {Number(ex.additional_payment_amount) === 0 ? (
                        <span className="text-emerald-700 font-semibold">₹0 (Free Swap)</span>
                      ) : (
                        `₹${ex.additional_payment_amount}`
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {ex.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(ex.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Bookings */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Direct Paid Learning Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Booking ID</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Instructor</th>
                  <th className="p-3">Skill</th>
                  <th className="p-3">Price (INR)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingsList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-400">#{b.id}</td>
                    <td className="p-3 font-semibold">{b.student_name}</td>
                    <td className="p-3 font-semibold">{b.instructor_name}</td>
                    <td className="p-3 text-slate-700">{b.skill_name}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ₹{Number(b.session_price_inr).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{b.scheduled_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Reported Content Moderation</h3>
          </div>
          {reportsList.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400 italic">No reports submitted.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reportsList.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Report #{r.id} by {r.reporter_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    Reason: "{r.reason}"
                  </p>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                        className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, 'action_taken')}
                        className="px-3 py-1 bg-rose-600 text-white text-xs rounded-lg font-semibold cursor-pointer"
                      >
                        Take Moderation Action
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
