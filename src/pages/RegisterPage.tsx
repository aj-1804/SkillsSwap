import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Repeat, Mail, Lock, User, MapPin, Languages, Sparkles, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('New Delhi, India');
  const [languages, setLanguages] = useState('English, Hindi');
  const [skillsOffered, setSkillsOffered] = useState('');
  const [skillsWanted, setSkillsWanted] = useState('');
  const [availability, setAvailability] = useState('Mon-Fri 6:00 PM - 9:00 PM');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await register({
      name,
      email,
      password,
      location,
      languages,
      skills_offered: skillsOffered,
      skills_wanted: skillsWanted,
      availability,
    });

    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
          <Repeat className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create Student Account
        </h1>
        <p className="text-xs text-slate-500">
          Join the global college skill barter community
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@college.edu"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Password * (Min 6 chars)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location / State</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, Karnataka"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Languages Spoken</label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Hindi"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-semibold text-indigo-700 mb-1">
              Skills You Offer to Teach (Optional)
            </label>
            <input
              type="text"
              value={skillsOffered}
              onChange={(e) => setSkillsOffered(e.target.value)}
              placeholder="e.g. Java, Python, SQL"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-teal-700 mb-1">
              Skills You Want to Learn (Optional)
            </label>
            <input
              type="text"
              value={skillsWanted}
              onChange={(e) => setSkillsWanted(e.target.value)}
              placeholder="e.g. React.js, UI/UX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Availability</label>
          <input
            type="text"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Weekends 10:00 AM - 2:00 PM"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? 'Creating Student Account...' : 'Complete Registration'}
        </button>

        <p className="text-center text-xs text-slate-500 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};
