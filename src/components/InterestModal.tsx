import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SavingGoal } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface InterestEntry {
  goalId: string;
  amount: number;
}

interface InterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entries: InterestEntry[]) => void;
  goals: SavingGoal[];
}

type ModalTab = 'proportional' | 'manual';

export default function InterestModal({ isOpen, onClose, onSave, goals }: InterestModalProps) {
  const [tab, setTab] = useState<ModalTab>('proportional');
  const [totalAmount, setTotalAmount] = useState('');
  const [onlyShared, setOnlyShared] = useState(true);
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});

  const activeGoals = goals.filter(g => g.current > 0);

  // Cele uwzględnione w podziale proporcjonalnym
  const eligibleGoals = useMemo(() => {
    if (!onlyShared) return activeGoals;
    const shared = activeGoals.filter(g => g.storageType === 'shared_account');
    // Jeśli nikt nie ma ustawionego storageType lub brak celów shared → pokaż wszystkich
    return shared.length > 0 ? shared : activeGoals;
  }, [activeGoals, onlyShared]);

  const totalBalance = eligibleGoals.reduce((s, g) => s + g.current, 0);

  // Podział proporcjonalny
  const proportionalEntries = useMemo((): InterestEntry[] => {
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0 || totalBalance === 0) return [];
    return eligibleGoals.map(g => ({
      goalId: g.id,
      amount: Math.round((g.current / totalBalance) * total * 100) / 100,
    }));
  }, [totalAmount, eligibleGoals, totalBalance]);

  const manualTotal = Object.values(manualAmounts).reduce<number>((s, v) => {
    const n = parseFloat(String(v));
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  const handleSave = () => {
    if (tab === 'proportional') {
      if (proportionalEntries.length === 0) return;
      onSave(proportionalEntries);
    } else {
      const entries: InterestEntry[] = goals
        .map(g => ({ goalId: g.id, amount: parseFloat(manualAmounts[g.id] || '0') || 0 }))
        .filter(e => e.amount > 0);
      if (entries.length === 0) return;
      onSave(entries);
    }
    // Reset
    setTotalAmount('');
    setManualAmounts({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <LucideIcon name="TrendingUp" size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Dodaj odsetki / zysk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Zewnętrzny zysk z konta oszczędnościowego</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                id="btn-close-interest-modal"
              >
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setTab('proportional')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${tab === 'proportional' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                id="btn-tab-proportional"
              >
                📊 Proporcjonalnie
              </button>
              <button
                onClick={() => setTab('manual')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${tab === 'manual' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                id="btn-tab-manual"
              >
                ✏️ Ręcznie
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
            {tab === 'proportional' ? (
              <>
                {/* Info */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-800">
                  <p className="font-semibold mb-1">Jak to działa?</p>
                  <p>Wpisz łączną kwotę odsetek z wyciągu bankowego. Aplikacja podzieli ją proporcjonalnie do aktualnego salda każdego celu.</p>
                </div>

                {/* Kwota łączna */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Łączna kwota odsetek</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                      id="input-interest-total"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">zł</span>
                  </div>
                </div>

                {/* Filtr: tylko wspólne konto */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none" id="label-only-shared">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${onlyShared ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    onClick={() => setOnlyShared(v => !v)}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute ${onlyShared ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-slate-700 font-medium">
                    Tylko cele na <span className="font-bold">wspólnym koncie</span>
                    <span className="text-slate-400 ml-1">(ignoruj gotówkę i osobne konta)</span>
                  </span>
                </label>

                {/* Podgląd podziału */}
                {proportionalEntries.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Podgląd podziału</p>
                    {proportionalEntries.map(entry => {
                      const goal = goals.find(g => g.id === entry.goalId);
                      if (!goal) return null;
                      return (
                        <div key={entry.goalId} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <LucideIcon name={goal.icon || 'PiggyBank'} size={13} className="text-slate-500" />
                            <span className="text-xs text-slate-700 font-medium">{goal.name}</span>
                            <span className="text-[10px] text-slate-400">({formatCurrency(goal.current)})</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700">+{formatCurrency(entry.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : totalBalance === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Brak celów z saldem większym niż 0.</p>
                ) : null}
              </>
            ) : (
              <>
                {/* Tryb ręczny */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-800">
                  <p className="font-semibold mb-1">Tryb ręczny</p>
                  <p>Wpisz dokładne odsetki dla każdego celu osobno — idealne gdy masz osobne konta z różnym oprocentowaniem.</p>
                </div>

                {goals.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Brak celów oszczędnościowych.</p>
                ) : (
                  <div className="space-y-2">
                    {goals.map(goal => (
                      <div key={goal.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                        <LucideIcon name={goal.icon || 'PiggyBank'} size={14} className="text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{goal.name}</p>
                          <p className="text-[10px] text-slate-400">{formatCurrency(goal.current)}</p>
                        </div>
                        <div className="relative w-28">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={manualAmounts[goal.id] || ''}
                            onChange={e => setManualAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            step="0.01"
                            min="0"
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                            id={`input-interest-manual-${goal.id}`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">zł</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {manualTotal > 0 && (
                  <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-800">Łącznie do dodania:</span>
                    <span className="text-sm font-bold text-emerald-700">+{formatCurrency(manualTotal)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              id="btn-cancel-interest"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={tab === 'proportional' ? proportionalEntries.length === 0 : manualTotal <= 0}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
              id="btn-save-interest"
            >
              <LucideIcon name="TrendingUp" size={14} />
              Dodaj zysk
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
