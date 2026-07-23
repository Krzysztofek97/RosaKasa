import React from 'react';
import { motion } from 'motion/react';
import { BudgetMonth } from '../../types';
import { formatCurrency } from '../../utils';
import LucideIcon from '../LucideIcon';

interface MonthClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonth: BudgetMonth;
  onConfirm: () => void;
}

export function MonthClosureModal({ isOpen, onClose, activeMonth, onConfirm }: MonthClosureModalProps) {
  if (!isOpen) return null;

  const { envelopes, savingGoals, freeFunds } = activeMonth;

  const envelopeRollovers = envelopes.map(e => {
    const leftover = e.rollover + e.allocated - e.spent;
    const rolloverAmt = Math.max(0, leftover);
    const goalName = e.rolloverTarget !== 'envelope'
      ? savingGoals.find(g => g.id === e.rolloverTarget || (typeof e.rolloverTarget === 'string' && (e.rolloverTarget || '').toLowerCase().trim() === g.name.toLowerCase().trim()))?.name
      : null;
    return { env: e, rolloverAmt, goalName };
  }).filter(r => r.rolloverAmt > 0);

  const totalEnvRollover = envelopeRollovers.reduce((sum, r) => sum + r.rolloverAmt, 0);
  const totalSpent = envelopes.reduce((sum, e) => sum + e.spent, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
        id="modal-month-closure"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <LucideIcon name="Lock" className="text-rose-600" size={18} />
              Zamknij miesiąc
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Finalizuj budżet: <strong className="text-slate-700">{activeMonth.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-closure">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-2 bg-white/30 border border-white/50 p-4 rounded-2xl">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Portfel:</span>
              <span className="font-bold text-indigo-600">{formatCurrency(freeFunds)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Wydano z kopert:</span>
              <span className="font-bold text-rose-600">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-white/50 pt-2">
              <span className="text-slate-700 font-bold">Przeniesione z kopert:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalEnvRollover)}</span>
            </div>
          </div>

          {envelopeRollovers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Przeniesione z kopert:</h4>
              <div className="space-y-1.5">
                {envelopeRollovers.map(({ env, rolloverAmt, goalName }) => (
                  <div key={env.id} className="flex justify-between items-center text-xs px-3 py-2 rounded-xl bg-white/40 border border-white/50">
                    <div className="flex items-center gap-1.5">
                      <LucideIcon name={goalName ? 'ArrowRight' : 'RotateCcw'} size={12} className={goalName ? 'text-amber-500' : 'text-slate-400'} />
                      <span className="font-medium text-slate-700">{env.name}</span>
                      {goalName && <span className="text-amber-600 font-semibold">→ {goalName}</span>}
                    </div>
                    <span className="font-bold text-emerald-600">+{formatCurrency(rolloverAmt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-700">
            <strong className="block">Portfel ({formatCurrency(freeFunds)})</strong>
            <span className="opacity-80">przejdzie jako środki przeniesione do portfela następnego miesiąca.</span>
          </div>

          <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl flex gap-3 text-[11px] leading-normal text-slate-700">
            <div className="p-1 rounded bg-slate-200 text-slate-500 h-fit shrink-0">
              <LucideIcon name="Info" size={14} />
            </div>
            <div>
              <strong className="block font-bold">Zamknięcie miesiąca</strong>
              Zablokuje edycję w tym miesiącu. Możesz go otworzyć ponownie z nagłówka aplikacji.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/50 bg-white/20 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/30 hover:bg-white/50 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer" id="btn-cancel-closure">
            Anuluj
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            id="btn-confirm-closure"
          >
            <LucideIcon name="Lock" size={14} />
            <span>Zamknij miesiąc</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
