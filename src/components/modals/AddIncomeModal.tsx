import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BudgetMonth, RecurringFrequency } from '../../types';
import LucideIcon from '../LucideIcon';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonth: BudgetMonth;
  onSave: (targetId: string, amount: number, description: string) => void;
  onSavePlanned?: (data: {
    type: 'income';
    description: string;
    amount: number;
    date: string;
    frequency: RecurringFrequency;
  }) => void;
}

export function AddIncomeModal({ isOpen, onClose, onSave, onSavePlanned }: AddIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isPlanned, setIsPlanned] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<RecurringFrequency>('one_time');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setIsPlanned(false);
      setDate(new Date().toISOString().split('T')[0]);
      setFrequency('one_time');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (isPlanned && onSavePlanned) {
      onSavePlanned({
        type: 'income',
        description: description.trim() || 'Oczekiwany wpływ',
        amount: amountNum,
        date,
        frequency,
      });
    } else {
      onSave('free_funds', amountNum, description.trim());
    }
    onClose();
  };

  const quickPresets = [10, 50, 100, 200, 500];

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden"
        id="modal-add-income"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <LucideIcon name="TrendingUp" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isPlanned ? 'Zaplanuj wpływ' : 'Zarejestruj wpływ'}</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {isPlanned ? 'Wpływ pojawi się w liście planowanych' : 'Środki trafią do portfela'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-add-income">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">Kwota (PLN)</label>
            <div className="relative">
              <input
                type="number" step="0.01" min="0.01" required
                placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full text-sm font-extrabold text-emerald-700 bg-white/60 border border-slate-200/60 rounded-xl pl-3.5 pr-12 py-3 focus:outline-none focus:border-emerald-400/50 focus:bg-white transition-all font-mono"
                id="input-income-amount"
              />
              <span className="absolute right-4 top-3 text-xs font-extrabold text-emerald-600 font-mono">PLN</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map(val => (
              <button key={val} type="button" onClick={() => setAmount(val.toString())}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/30 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                id={`btn-preset-income-${val}`}
              >
                +{val} zł
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">Opis wpływu (opcjonalnie)</label>
            <input
              type="text"
              placeholder="np. Pensja, premia, zwrot podatku"
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full text-xs bg-white/60 border border-slate-200/60 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-400/50 focus:bg-white transition-all text-slate-800 font-medium"
              id="input-income-description"
            />
          </div>

          {onSavePlanned && (
            <div className={`rounded-2xl border p-4 transition-all ${isPlanned ? 'bg-sky-50/80 border-sky-200/60' : 'bg-slate-50/60 border-slate-200/40'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPlanned(!isPlanned)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${isPlanned ? 'bg-sky-500' : 'bg-slate-200'}`}
                  id="toggle-income-planned"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isPlanned ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Oczekiwany wpływ</p>
                  <p className="text-[10px] text-slate-500">Wpływ jest planowany — potwierdź go, gdy pieniądze faktycznie wpłyną</p>
                </div>
              </label>
              {isPlanned && (
                <div className="mt-3 pt-3 border-t border-sky-200/50 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data wpływu</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-200/60 rounded-xl text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
                      id="input-income-planned-date"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Powtarzalność</label>
                    <select
                      value={frequency}
                      onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                      className="w-full px-3 py-2 bg-white border border-sky-200/60 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-sky-400 cursor-pointer"
                      id="select-income-frequency"
                    >
                      <option value="one_time">Jednorazowo</option>
                      <option value="weekly">Co tydzień</option>
                      <option value="biweekly">Co dwa tygodnie</option>
                      <option value="monthly">Co miesiąc</option>
                      <option value="yearly">Co rok</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer uppercase tracking-wider" id="btn-cancel-add-income">
              Anuluj
            </button>
            <button type="submit" className={`flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider ${isPlanned ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/15' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15'}`} id="btn-submit-add-income">
              {isPlanned ? 'Zaplanuj' : 'Dodaj wpływ'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
