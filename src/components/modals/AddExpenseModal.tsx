import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Envelope, BudgetMonth, RecurringFrequency } from '../../types';
import { formatCurrency } from '../../utils';
import LucideIcon from '../LucideIcon';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null;
  activeMonth: BudgetMonth;
  onSave: (expenses: { envelopeId: string, amount: number, description: string }[], date: string) => void;
  onSavePlanned?: (data: {
    type: 'expense';
    description: string;
    amount: number;
    date: string;
    envelopeId: string;
    envelopeName: string;
    frequency: RecurringFrequency;
  }) => void;
}

export function AddExpenseModal({ isOpen, onClose, envelope, activeMonth, onSave, onSavePlanned }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPlanned, setIsPlanned] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('one_time');
  const [splits, setSplits] = useState<{ id: string, envelopeId: string, amount: string, description: string }[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const quick = (envelope as any)?._quickAmount;
      setAmount(quick ? quick.toString() : '');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsPlanned(false);
      setFrequency('one_time');
      setSplits([]);
      setIsSplitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !envelope) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (isPlanned && onSavePlanned) {
      onSavePlanned({
        type: 'expense',
        description: description.trim() || envelope.name,
        amount: amountNum,
        date,
        envelopeId: envelope.id,
        envelopeName: envelope.name,
        frequency,
      });
    } else {
      const expensesToSave: { envelopeId: string, amount: number, description: string }[] = [];
      let remainingAmount = amountNum;
      
      if (isSplitting) {
        for (const s of splits) {
          const splitAmt = parseFloat(s.amount);
          if (!isNaN(splitAmt) && splitAmt > 0 && s.envelopeId) {
            expensesToSave.push({
              envelopeId: s.envelopeId,
              amount: splitAmt,
              description: s.description.trim() || description.trim() || activeMonth.envelopes.find(e => e.id === s.envelopeId)?.name || 'Wydatek'
            });
            remainingAmount -= splitAmt;
          }
        }
      }
      
      if (remainingAmount < 0) {
        alert("Suma podziałów jest większa niż całkowita kwota wydatku!");
        return;
      }
      
      if (remainingAmount > 0) {
        expensesToSave.push({
          envelopeId: envelope.id,
          amount: remainingAmount,
          description: description.trim() || envelope.name
        });
      }
      
      if (expensesToSave.length > 0) {
        onSave(expensesToSave, date);
      }
    }
    onClose();
  };

  const quickPresets = [10, 20, 50, 100, 200];
  const available = envelope.rollover + envelope.allocated - envelope.spent;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
        id="modal-add-expense"
      >
        <div className={`p-6 border-b border-white/50 flex justify-between items-center bg-${envelope.color}-500/10 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${envelope.color}-500/15 text-${envelope.color}-700 flex items-center justify-center`}>
              <LucideIcon name={envelope.icon} size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isPlanned ? 'Zaplanuj wydatek' : 'Dodaj wydatek'}</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Koperta: <strong className="text-slate-700">{envelope.name}</strong>
                {!isPlanned && <span className="ml-2 text-emerald-600 font-bold">({formatCurrency(available)} dostępne)</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-add-expense">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kwota wydatku</label>
            <div className="relative">
              <input
                type="number" required
                placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full text-2xl font-black bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-2xl px-5 py-4 transition-all pr-16 font-mono text-slate-800 shadow-inner text-center"
                step="1" min="0"
                id="input-expense-amount"
              />
              <span className="absolute right-5 top-5 text-sm font-bold text-slate-400">PLN</span>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Szybkie kwoty:</span>
            <div className="flex justify-center flex-wrap gap-2">
              {quickPresets.map(preset => (
                <button key={preset} type="button" onClick={() => setAmount(preset.toString())}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  id={`btn-preset-${preset}`}
                >
                  +{preset} zł
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Opis wydatku (opcjonalnie)</label>
            <input
              type="text"
              placeholder="np. Biedronka, restauracja, bilet"
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all text-slate-700"
              id="input-expense-desc"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Data</label>
            <input
              type="date"
              value={date} onChange={e => setDate(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all"
              id="input-expense-date"
            />
          </div>

          {!isPlanned && (
            <div className="border border-slate-200/60 bg-slate-50/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Podziel wydatek</p>
                  <p className="text-[10px] text-slate-500">Rozbij kwotę na kilka różnych kopert</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSplitting(!isSplitting)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSplitting ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  {isSplitting ? 'Anuluj podział' : 'Podziel'}
                </button>
              </div>
              
              {isSplitting && (
                <div className="space-y-3 mt-3 pt-3 border-t border-slate-200/60">
                  {splits.map((split, index) => (
                    <div key={split.id} className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl relative">
                      <button type="button" onClick={() => setSplits(splits.filter(s => s.id !== split.id))} className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full text-slate-400 flex items-center justify-center hover:text-rose-500 shadow-sm cursor-pointer z-10">
                        <LucideIcon name="X" size={12} />
                      </button>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-rose-300"
                          value={split.envelopeId}
                          onChange={e => {
                            const newSplits = [...splits];
                            newSplits[index].envelopeId = e.target.value;
                            setSplits(newSplits);
                          }}
                        >
                          <option value="" disabled>Wybierz kopertę...</option>
                          {activeMonth.envelopes.filter(e => !e.isArchived && e.id !== envelope.id).map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </select>
                        <input
                          type="number" step="0.01" min="0" placeholder="Kwota"
                          className="w-24 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-rose-300 text-right"
                          value={split.amount}
                          onChange={e => {
                            const newSplits = [...splits];
                            newSplits[index].amount = e.target.value;
                            setSplits(newSplits);
                          }}
                        />
                      </div>
                      <input
                        type="text" placeholder="Nazwa transakcji (opcjonalnie)"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-rose-300"
                        value={split.description}
                        onChange={e => {
                          const newSplits = [...splits];
                          newSplits[index].description = e.target.value;
                          setSplits(newSplits);
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSplits([...splits, { id: Math.random().toString(36).substring(2, 9), envelopeId: '', amount: '', description: '' }])}
                    className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <LucideIcon name="Plus" size={14} /> Dodaj pozycję
                  </button>
                  
                  {(() => {
                    const totalAmt = parseFloat(amount) || 0;
                    const splitSum = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                    const remaining = totalAmt - splitSum;
                    return (
                      <div className={`text-xs font-bold text-right mt-2 ${remaining < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                        Pozostało dla {envelope.name}: {remaining < 0 ? 'Przekroczono o ' : ''}{Math.abs(remaining).toFixed(2)} PLN
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {onSavePlanned && (
            <div className={`rounded-2xl border p-4 transition-all ${isPlanned ? 'bg-amber-50/80 border-amber-200/60' : 'bg-slate-50/60 border-slate-200/40'}`}>
              <label className="flex items-center gap-3 cursor-pointer" htmlFor="toggle-expense-planned">
                <div
                  onClick={() => setIsPlanned(!isPlanned)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${isPlanned ? 'bg-amber-500' : 'bg-slate-200'}`}
                  id="toggle-expense-planned"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isPlanned ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Zaplanuj na przyszłość</p>
                  <p className="text-[10px] text-slate-500">Wydatek trafi do listy planowanych — potwierdź go gdy faktycznie nastąpi</p>
                </div>
              </label>
              {isPlanned && (
                <div className="mt-3 pt-3 border-t border-amber-200/50">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Powtarzalność</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-white border border-amber-200/60 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                    id="select-expense-frequency"
                  >
                    <option value="one_time">Jednorazowo</option>
                    <option value="weekly">Co tydzień</option>
                    <option value="biweekly">Co dwa tygodnie</option>
                    <option value="monthly">Co miesiąc</option>
                    <option value="yearly">Co rok</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-white/50">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/30 hover:bg-white/50 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer" id="btn-cancel-expense-save">
              Anuluj
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${isPlanned ? 'bg-amber-500 hover:bg-amber-600' : `bg-${envelope.color}-600 hover:bg-${envelope.color}-700`}`}
              id="btn-confirm-expense-save"
            >
              {isPlanned ? 'Zaplanuj' : 'Dodaj Wydatek'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
