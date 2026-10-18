import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Repeat, 
  Search, 
  Calendar, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  Menu, 
  X,
  Sparkles,
  Users
} from 'lucide-react';

interface NavbarProps {
  onOpenDemoSwitcher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemoSwitcher }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                SkillSwap
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 ml-1.5 px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200/60">
                Global
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/explore"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/explore')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Explore Skills
            </Link>

            <Link
              to="/how-it-works"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/how-it-works')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              How It Works
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/exchanges"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
                    isActive('/exchanges')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  Exchanges
                  {user.pendingExchangesCount && user.pendingExchangesCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : null}
                </Link>

                <Link
                  to="/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/bookings')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Bookings
                </Link>

                <Link
                  to="/messages"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/messages')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/admin')
                        ? 'bg-purple-100 text-purple-800'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Admin Portal
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Demo Switcher trigger button */}
            <button
              onClick={onOpenDemoSwitcher}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              title="Switch demo accounts (Amit Jha, Brijlal, Mohit, etc.)"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Demo Accounts</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/my-listings"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Teach a Skill
                </Link>

                {/* Notifications Link */}
                <Link
                  to="/dashboard"
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {user.unreadNotifications && user.unreadNotifications > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                  ) : null}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-md">
                            Administrator
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile & Skills
                      </Link>

                      <Link
                        to="/my-listings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-400" />
                        My Skill Listings
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Join SkillSwap
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenDemoSwitcher}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg"
            >
              Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore Skills
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            How It Works
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Student Dashboard
              </Link>
              <Link
                to="/exchanges"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Skill Exchanges
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Bookings
              </Link>
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Messages
              </Link>
              <Link
                to="/my-listings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                My Skill Listings
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Profile & Settings
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-purple-700 bg-purple-50"
                >
                  Admin Portal (Amit Jha)
                </Link>
              )}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg"
              >
                Join SkillSwap
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
