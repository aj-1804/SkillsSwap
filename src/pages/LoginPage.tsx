import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Lock, 
  Mail, 
  Repeat, 
  ArrowRight, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Login failed');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setLoading(true);
    setErrorMsg(null);

    const res = await login(demoEmail, 'Password@123');
    setLoading(false);

    if (res.success) {
      if (demoEmail === 'admin@skillswap.in') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setErrorMsg(res.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
          <Repeat className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sign In to SkillSwap Global
        </h1>
        <p className="text-xs text-slate-500">
          Access your student exchanges, bookings, and mentor classroom
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. brijlal@skillswap.in"
              required
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register as Student
          </Link>
        </p>
      </form>

      {/* Quick Demo Logins for Examiner / Tester */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            One-Click Demo Personas (College Project Demo)
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Select any persona below to test free swaps, unequal differential fees, or admin oversight:
        </p>

        <div className="space-y-1.5 pt-1">
          {/* Admin */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('admin@skillswap.in')}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span>Amit Jha (Super Administrator)</span>
            </div>
            <ArrowRight className="w-3 h-3 text-purple-600" />
          </button>

          {/* Student 1 */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('brijlal@skillswap.in')}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Brijlal (Offers Java & SQL • Wants JS)</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          {/* Student 2 */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('mohit@skillswap.in')}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Mohit Verma (Teaches React.js • ₹400)</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          {/* Student 3 */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('isha@skillswap.in')}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Isha Bhati (Teaches UI/UX Figma • ₹500)</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          {/* Student 4 */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('komal@skillswap.in')}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Komal Saroj (Offers Python • ₹300)</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
