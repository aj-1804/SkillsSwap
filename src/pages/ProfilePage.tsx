import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.ts';
import { 
  User, 
  MapPin, 
  Languages, 
  Calendar, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || 'India');
  const [languages, setLanguages] = useState(user?.languages || 'English, Hindi');
  const [skillsOffered, setSkillsOffered] = useState(user?.skills_offered || '');
  const [skillsWanted, setSkillsWanted] = useState(user?.skills_wanted || '');
  const [availability, setAvailability] = useState(user?.availability || 'Flexible');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMsg(null);
    try {
      const res = await api.put('/users/me', {
        name,
        bio,
        location,
        languages,
        skills_offered: skillsOffered,
        skills_wanted: skillsWanted,
        availability,
        avatar_url: avatarUrl,
      });
      if (res.data.success) {
        setProfileSuccess(true);
        refreshUser();
        setTimeout(() => setProfileSuccess(false), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setErrorMsg(null);
    try {
      const res = await api.patch('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (res.data.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordSuccess(false), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Student Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure skills you can teach and skills you want to learn to improve peer recommendations
        </p>
      </div>

      {profileSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Registered)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Languages Spoken</label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Short Biography</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-indigo-700 mb-1">
              Skills You Can Offer to Teach
            </label>
            <input
              type="text"
              value={skillsOffered}
              onChange={(e) => setSkillsOffered(e.target.value)}
              placeholder="e.g. Java, SQL, Python"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Comma-separated skills</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-teal-700 mb-1">
              Skills You Want to Learn
            </label>
            <input
              type="text"
              value={skillsWanted}
              onChange={(e) => setSkillsWanted(e.target.value)}
              placeholder="e.g. React.js, UI/UX Design, C++ DSA"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Helps our recommendation system pair you</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            General Availability & Preferred Hours
          </label>
          <input
            type="text"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Security & Password
        </h3>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-semibold">
            Password changed successfully!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
          >
            {savingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};
