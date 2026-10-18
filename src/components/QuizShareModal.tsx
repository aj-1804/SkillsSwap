import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Twitter, Globe, Sparkles } from 'lucide-react';

interface QuizShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: {
    id: number;
    title: string;
    skill_category: string;
    share_code: string;
    reward_points?: number;
  } | null;
}

export const QuizShareModal: React.FC<QuizShareModalProps> = ({ isOpen, onClose, quiz }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !quiz) return null;

  const quizUrl = `${window.location.origin}/quiz/${quiz.id}`;
  const shareMessage = `🧠 Test your ${quiz.skill_category} skills with this interactive peer quiz: "${quiz.title}" on SkillSwap Global! Earn ${quiz.reward_points || 50} learning points. Play here: ${quizUrl} (Code: ${quiz.share_code})`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(quizUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(quiz.share_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 text-white">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-200" />
            <h3 className="font-bold text-base">Share Interactive Quiz</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quiz Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                {quiz.skill_category}
              </span>
              <span className="flex items-center gap-1 font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                <Sparkles className="w-3 h-3 text-teal-600" />
                +{quiz.reward_points || 50} pts reward
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">{quiz.title}</h4>
            <p className="text-xs text-slate-500">
              Interactive peer learning quiz. Challenge your classmates & study buddies!
            </p>
          </div>

          {/* Share Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Quiz Unique Share Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 tracking-wider">
                {quiz.share_code}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Direct Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Direct Shareable Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={quizUrl}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 select-all font-mono"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* 1-Click Social Shares */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">
              Share directly with classmates
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleTwitter}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Twitter className="w-4 h-4 text-sky-600" />
                <span>Twitter / X</span>
              </button>
            </div>
          </div>

          {/* Peer Learning Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>Peer Learning Perk:</strong> Every time a student passes your shared quiz with 70%+, you earn <strong>+10 Royalty Reward Points</strong> in your wallet!
          </div>
        </div>
      </div>
    </div>
  );
};
