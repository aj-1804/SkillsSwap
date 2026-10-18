import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.ts';
import { X, Users, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface DemoUserSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoUserSwitcher: React.FC<DemoUserSwitcherProps> = ({ isOpen, onClose }) => {
  const { user: currentUser, switchUser } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/demo-accounts');
      if (res.data.success) {
        setAccounts(res.data.accounts);
      }
    } catch (err) {
      console.error('Failed to load demo accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (email: string) => {
    setSwitchingEmail(email);
    const success = await switchUser(email);
    setSwitchingEmail(null);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Quick Demo Account Switcher</h3>
              <p className="text-xs text-slate-500">
                Switch personas to test skill swaps, unequal fee calculation, or admin portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of accounts */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading demo student and admin profiles...</p>
            </div>
          ) : (
            accounts.map((acc) => {
              const isCurrent = currentUser?.email === acc.email;
              const isSwitching = switchingEmail === acc.email;

              return (
                <div
                  key={acc.id}
                  className={`pt-3 first:pt-0 flex items-center justify-between gap-4 p-2.5 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/70 border border-indigo-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={acc.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${acc.name}`}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{acc.name}</span>
                        {acc.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Student
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                      {acc.skills_offered && (
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          <span className="font-medium text-indigo-600">Teaches:</span> {acc.skills_offered}
                          {acc.skills_wanted ? ` • Wants: ${acc.skills_wanted}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="text-xs font-semibold text-indigo-700 px-3 py-1 bg-white rounded-lg border border-indigo-200 shadow-xs">
                        Current
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelectUser(acc.email)}
                        disabled={isSwitching}
                        className="inline-flex items-center gap-1 text-xs font-medium text-white bg-slate-800 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSwitching ? 'Switching...' : 'Switch'}
                        {!isSwitching && <ArrowRight className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          Default password for all demo accounts is <code className="font-mono font-semibold text-slate-700 bg-slate-200 px-1 py-0.5 rounded">Password@123</code>
        </div>
      </div>
    </div>
  );
};
