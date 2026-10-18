import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Repeat, 
  Scale, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  Calculator 
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  // Interactive Differential Calculator Widget
  const [sessionValA, setSessionValA] = useState(500);
  const [sessionValB, setSessionValB] = useState(300);

  const diff = Math.abs(sessionValA - sessionValB);
  const isEqual = sessionValA === sessionValB;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          Core Exchange Logic & Rules
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How Skill Swapping Works on SkillSwap Global
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          A transparent, student-centric marketplace built around peer fairness, equitable barter, and accessible direct tutoring.
        </p>
      </div>

      {/* 3 Core Rules Detailed Cards */}
      <div className="space-y-8">
        {/* Rule 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                Rule 1
              </span>
              <h3 className="text-lg font-bold text-slate-900">Equal-Level Skill Exchange (100% Free)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If two students have similar proficiency in the skills they offer and want to learn, they can exchange sessions without any payment whatsoever.
            </p>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
              <strong>College Example:</strong> Brijlal teaches basic SQL (valued at ₹300) and wants to learn JavaScript basics. Mohit Verma teaches JavaScript basics (valued at ₹300) and wants to learn SQL. Because both sessions are valued equally at ₹300, the system sets the differential fee to <strong>₹0</strong>. Both students accept and the meeting link is instantly confirmed.
            </div>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded">
                Rule 2
              </span>
              <h3 className="text-lg font-bold text-slate-900">Unequal-Level Skill Exchange (Differential Fee in INR)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If one student offers a higher level of expertise than the other student offers in return, the less-skilled student pays a fair differential fee to balance the exchange.
            </p>
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 space-y-2">
              <p className="font-mono font-bold">
                Additional Payment = max(0, Higher Session Price - Lower Session Price)
              </p>
              <p className="leading-relaxed">
                <strong>Demonstration:</strong> Isha Bhati teaches intermediate UI/UX Design (₹500). Komal Saroj offers beginner Python (₹300). The difference is ₹200. Komal simply pays ₹200 to confirm the exchange. Both students see this exact breakdown before confirming.
              </p>
            </div>
          </div>
        </div>

        {/* Rule 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded">
                Rule 3
              </span>
              <h3 className="text-lg font-bold text-slate-900">Direct Paid Learning (No Skill to Offer)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Students who do not have any skill to offer are never excluded. They can browse available skills and directly book a paid learning session at the mentor's listed price in Indian Rupees.
            </p>
            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900">
              <strong>College Example:</strong> A junior student wants to learn React.js from Mohit Verma. Mohit has listed a price of ₹400. The student simply pays ₹400 via the demo payment gateway and books the session directly.
            </div>
          </div>
        </div>

        {/* Interactive Differential Calculator */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Interactive Differential Calculator</h3>
              <p className="text-xs text-indigo-200">Test the backend mathematical formula right here</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Mentor A Session Price (₹ INR): <span className="text-white font-mono font-bold">₹{sessionValA}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={sessionValA}
                onChange={(e) => setSessionValA(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Mentor B Session Price (₹ INR): <span className="text-white font-mono font-bold">₹{sessionValB}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={sessionValB}
                onChange={(e) => setSessionValB(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-indigo-200 block text-[11px]">Backend Calculated Additional Payment:</span>
              <span className={`text-2xl font-bold font-mono ${isEqual ? 'text-emerald-400' : 'text-teal-400'}`}>
                {isEqual ? '₹0 (Free Swap)' : `₹${diff}`}
              </span>
            </div>
            <div className="text-right text-indigo-100">
              {isEqual ? (
                <span className="text-emerald-300 font-semibold">
                  Values are equal. Rule 1 Free Barter applies!
                </span>
              ) : sessionValA > sessionValB ? (
                <span>
                  Mentor B pays <strong className="text-white">₹{diff}</strong> to Mentor A
                </span>
              ) : (
                <span>
                  Mentor A pays <strong className="text-white">₹{diff}</strong> to Mentor B
                </span>
              )}
            </div>
          </div>
        </div>

        {/* End of Core Exchange Rules */}
      </div>

      <div className="text-center pt-4">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
        >
          <span>Explore Skills and Start Swapping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
