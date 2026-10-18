import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.ts';
import { 
  Repeat, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Scale, 
  CreditCard, 
  CheckCircle2, 
  Star, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  GraduationCap, 
  ArrowRightLeft,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 12,
    activeListings: 13,
    completedExchanges: 4,
    totalBookings: 3,
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [listingsRes, catRes] = await Promise.all([
        api.get('/listings?limit=6&sort=rating_desc'),
        api.get('/categories'),
      ]);
      if (listingsRes.data.success) {
        setFeaturedListings(listingsRes.data.data);
      }
      if (catRes.data.success) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load homepage data', err);
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>MCA Final Year Project • Skill Exchange & Paid Learning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Learn Together. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Share Skills.
              </span> Grow Globally.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Connect with fellow students to exchange knowledge at equal value for free, pay the difference for unequal levels, or learn directly in Indian Rupees (₹).
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                Browse Skills Catalog
              </Link>
              <Link
                to="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all hover:border-slate-300"
              >
                <span>How Skill Swapping Works</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-2xl font-bold text-slate-900 font-mono">13+</span>
                <p className="text-xs text-slate-500 mt-0.5">Indian Student Mentors</p>
              </div>
              <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-2xl font-bold text-slate-900 font-mono">100%</span>
                <p className="text-xs text-slate-500 mt-0.5">Free Equal-Level Swaps</p>
              </div>
              <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-2xl font-bold text-slate-900 font-mono">₹ INR</span>
                <p className="text-xs text-slate-500 mt-0.5">Fair Difference Calculator</p>
              </div>
              <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-2xl font-bold text-slate-900 font-mono">Verified</span>
                <p className="text-xs text-slate-500 mt-0.5">MCA Admin Moderated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Rules Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            Skill Exchange Business Rules
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Designed for Realistic Student Learning
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            SkillSwap eliminates the friction of traditional tutoring with 3 realistic exchange models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Rule 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mb-2">
              Rule 1: Equal-Level Swap
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">100% Free Peer Exchange</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Students with matching proficiency and equivalent session valuations swap lessons directly with zero fees.
            </p>
            <div className="p-3 bg-emerald-50/60 rounded-xl text-[11px] text-emerald-800 border border-emerald-100">
              <strong>Example:</strong> Brijlal teaches basic SQL (₹300) to Mohit Verma in exchange for beginner JavaScript (₹300). Difference is ₹0!
            </div>
          </div>

          {/* Rule 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mb-2">
              Rule 2: Unequal-Level Exchange
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Pay Only the Differential Fee</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              If one student provides advanced skills, the less-skilled peer pays the backend-calculated difference in INR.
            </p>
            <div className="p-3 bg-indigo-50/60 rounded-xl text-[11px] text-indigo-800 border border-indigo-100 font-mono">
              Additional Fee = max(0, Price A - Price B)
              <br />
              <span className="font-sans text-[11px]">
                Isha (₹500 UI/UX) & Komal (₹300 Python) = Komal pays ₹200.
              </span>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded mb-2">
              Rule 3: No Skill to Offer?
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Direct Paid Learning</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Learners who do not have any skill to offer can directly book any mentor's listed price in Indian Rupees (₹).
            </p>
            <div className="p-3 bg-teal-50/60 rounded-xl text-[11px] text-teal-800 border border-teal-100">
              <strong>Example:</strong> A first-year student books Mohit Verma for React.js at ₹400 without offering any skill in return.
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Skill Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Top Student Skill Listings
            </h2>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {item.category_name}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{item.rating_avg}</span>
                    <span className="text-slate-400 font-normal text-[11px]">({item.total_reviews})</span>
                  </div>
                </div>

                <Link to={`/skill/${item.id}`} className="block group">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </Link>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <img
                    src={item.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_name}`}
                    alt={item.user_name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.user_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.user_location}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{Number(item.price_inr).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/ {item.session_duration_minutes || 60} mins</span>
                </div>
                <Link
                  to={`/skill/${item.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Explore by Subject Category</h2>
          <p className="text-xs text-slate-500 mt-1">Browse skills across computer science, creative design, and communication</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/explore?category=${cat.slug}`}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center mx-auto mb-2.5 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{cat.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{cat.active_listings_count || 2} listings</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Join SkillSwap Global Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Swap Knowledge and Build Real Projects?
            </h2>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Register as a student, list what you know, request a peer exchange, or book a mentor session in seconds.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-colors"
              >
                Create Student Account
              </Link>
              <Link
                to="/explore"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition-colors"
              >
                Browse All Skills
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
