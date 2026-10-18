import React from 'react';
import { Link } from 'react-router-dom';
import { Repeat, ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold">
                <Repeat className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">SkillSwap Global</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform for sharing skills globally where students can teach, learn, exchange skills at equal value for free, or pay the difference when necessary.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-teal-300">
              <span className="font-semibold">Currency:</span> Indian Rupee (INR ₹)
            </div>
          </div>

          {/* Col 2: Core Learning Models */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Exchange Models
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Rule 1: Equal-Level Free Swap</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>Rule 2: Unequal Differential Fee</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Rule 3: Direct Paid Learning</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Hub */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Skill Catalog
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How Skill Swapping Works
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Project Documentation & SRS
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Help & Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Project Scope */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              College MCA Project
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed as a comprehensive Master of Computer Applications (MCA) Final Year Project. Features normalized relational database, JWT security, differential pricing algorithms, and an admin portal for Amit Jha.
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal (Amit Jha)
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} SkillSwap Global. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-500">
            Learn Together • Share Skills • Grow Globally
          </p>
        </div>
      </div>
    </footer>
  );
};
