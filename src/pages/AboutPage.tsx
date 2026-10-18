import React from 'react';
import { 
  GraduationCap, 
  Database, 
  Server, 
  ShieldCheck, 
  Repeat, 
  CheckCircle2, 
  Code2, 
  Layers,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
          College Final Year MCA Project
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About SkillSwap Global
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          A full-stack, database-backed platform designed for sharing skills globally with peer-to-peer barter algorithms, differential pricing in INR, and administrator governance.
        </p>
      </div>

      {/* Project Overview & Problem Statement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          Problem Statement & Academic Objectives
        </h2>
        <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Traditional tutoring platforms are expensive, one-way commercial transactions that create a financial barrier for college students. Meanwhile, many students possess valuable skills in coding, design, communication, or data analytics that they could readily barter in exchange for skills they need.
          </p>
          <p>
            <strong>SkillSwap Global</strong> solves this with a three-pronged mathematical exchange model:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium">
            <li><strong>Rule 1 (Equal-Level Exchange):</strong> Pure peer-to-peer barter where students with equal session valuations learn for free.</li>
            <li><strong>Rule 2 (Unequal-Level Exchange):</strong> Automatic differential calculation where the student receiving greater valuation covers the exact INR price difference.</li>
            <li><strong>Rule 3 (Direct Paid Learning):</strong> Allows beginners with zero skills to directly book sessions without forcing artificial listings.</li>
          </ul>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Implemented Technology Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Frontend Layer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              React 19, TypeScript, React Router v7, Axios, Tailwind CSS, Lucide icons, responsive dashboards.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Backend API</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Node.js, Express.js REST APIs, JWT Bearer verification, bcrypt password hashing, centralized error handling.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Relational Database</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              MySQL 8.0 schema with mysql2 connection pool, persistent fallback engine, foreign keys, constraints, and audit tables.
            </p>
          </div>
        </div>
      </div>

      {/* Administration & Supervision */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          Project Administration & Oversight
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Platform Administrator: <strong>Amit Jha</strong>. The admin portal features dynamic database statistics, student account activation/suspension, transaction ledgers, listing review, and user content moderation.
        </p>
      </div>
    </div>
  );
};
