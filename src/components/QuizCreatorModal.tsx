import React, { useState } from 'react';
import { X, Plus, Trash2, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface QuestionDraft {
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quizId: number, shareCode: string) => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { refreshUser } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('React.js');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [timeLimit, setTimeLimit] = useState(5);
  const [rewardPoints, setRewardPoints] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      explanation: '',
    },
    {
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      explanation: '',
    },
  ]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 2) {
      setError('A quiz must have at least 2 questions.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index: number, val: string) => {
    const updated = [...questions];
    updated[index].question_text = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = val;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correct_option_index = optIndex;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].explanation = val;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a quiz title.');
      return;
    }

    if (!category.trim()) {
      setError('Please select or specify a skill category.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question #${i + 1} is missing its question statement.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j]?.trim()) {
          setError(`Question #${i + 1} option ${String.fromCharCode(65 + j)} cannot be empty.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/quizzes', {
        title: title.trim(),
        description: description.trim(),
        skill_category: category.trim(),
        difficulty,
        time_limit_minutes: timeLimit,
        reward_points: rewardPoints,
        questions,
      });

      if (res.data.success) {
        await refreshUser();
        onSuccess(res.data.quizId, res.data.shareCode);
      } else {
        setError(res.data.message || 'Failed to create quiz.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error creating quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-400 text-slate-900 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Create Interactive Learning Quiz</h3>
              <p className="text-xs text-indigo-200">Share knowledge, challenge peers, and earn reward points!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quiz Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Quiz Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Modern React 19: State, Hooks & Server Actions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Skill Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="React.js">React.js & Frontend</option>
                <option value="SQL & Databases">SQL & Relational Databases</option>
                <option value="UI/UX Design">UI/UX Design & Prototyping</option>
                <option value="Python & Scripting">Python & Scripting</option>
                <option value="Java & OOP">Java & OOP Fundamentals</option>
                <option value="Node.js & APIs">Node.js & Backend APIs</option>
                <option value="Cyber Security">Cyber Security & OWASP</option>
                <option value="DSA & Algorithms">Data Structures & C++</option>
                <option value="Communication">Spoken English & Interview Prep</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="beginner">Beginner Friendly</option>
                <option value="intermediate">Intermediate Core</option>
                <option value="advanced">Advanced Mastery</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Time Limit (Minutes)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Student Reward Points on Pass (≥70%)</label>
              <input
                type="number"
                min="20"
                max="200"
                step="10"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Short Description & Learning Objectives</label>
              <textarea
                rows={2}
                placeholder="What key concepts will students practice and master with this quiz?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Question Builder */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Quiz Questions ({questions.length})</h4>
                <p className="text-xs text-slate-500">Provide 4 choices for each question and mark the correct option.</p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-100/70 px-2.5 py-0.5 rounded-lg">
                    Question #{qIndex + 1}
                  </span>
                  {questions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. Which React hook memoizes an expensive calculation?`}
                    value={q.question_text}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* 4 Choices */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Choices (Select the radio button for the CORRECT answer):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl transition-all ${
                          q.correct_option_index === optIndex
                            ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={q.correct_option_index === optIndex}
                          onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                          className="accent-emerald-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + optIndex)}:</span>
                        <input
                          type="text"
                          required
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          className="w-full text-xs bg-transparent focus:outline-hidden"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Explanation (Reinforces learning after submission)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. useMemo caches calculated values across renders until dependencies change."
                    value={q.explanation}
                    onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>You earn <strong>+50 Community Points</strong> on publishing!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Publish & Get Share Link</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
