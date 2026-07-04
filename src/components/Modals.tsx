import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Envelope, SavingGoal, BudgetMonth, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { AVAILABLE_COLORS, getColorConfig } from '../data';
import LucideIcon from './LucideIcon';
import IconPicker from './IconPicker';

// ==========================================
// 1. EDIT / CREATE ENVELOPE MODAL
// ==========================================
interface EditEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null;
  onSave: (envelopeData: any) => void;
  savingGoals: SavingGoal[];
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  canDelete?: boolean;
}

export function EditEnvelopeModal({ isOpen, onClose, envelope, onSave, savingGoals, onDelete, onArchive, canDelete = true }: EditEnvelopeModalProps) {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('amber');
  const [rolloverTarget, setRolloverTarget] = useState('envelope');

  useEffect(() => {
    if (envelope) {
      setName(envelope.name);
      setLimit(envelope.limit.toString());
      setIcon(envelope.icon);
      setColor(envelope.color);
      setRolloverTarget(envelope.rolloverTarget ?? 'envelope');
    } else {
      setName('');
      setLimit('');
      setIcon('Utensils');
      setColor('amber');
      setRolloverTarget('envelope');
    }
  }, [envelope, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let quickSpends = [10, 20, 50];

    onSave({
      id: envelope?.id,
      name: name.trim(),
      limit: 0,
      allocated: envelope?.allocated ?? 0,
      icon,
      color,
      quickSpends,
      rolloverTarget,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        id="modal-edit-envelope"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {envelope ? 'Edytuj kopertę' : 'Dodaj nową kopertę'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {envelope ? 'Zmień parametry koperty' : 'Utwórz nową kopertę wydatków'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-edit-env">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nazwa koperty</label>
            <input
              type="text"
              required
              placeholder="np. Kosmetyki, Rachunki, Subskrypcje"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all"
              id="input-env-name"
            />
          </div>



          {/* Rollover target */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Przenoszenie niewydanych środków
            </label>
            <p className="text-[10px] text-slate-500 mb-2">Co zrobić z niewydan­ymi środkami po zamknięciu miesiąca?</p>
            <select
              value={rolloverTarget}
              onChange={e => setRolloverTarget(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all cursor-pointer"
              id="select-env-rollover-target"
            >
              <option value="envelope">↩ Przenieś do tej samej koperty</option>
              {savingGoals.map(g => (
                <option key={g.id} value={g.id}>🎯 Przekaż do celu: {g.name}</option>
              ))}
            </select>
          </div>

          {/* Select Icon */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Wybierz ikonę</label>
            <IconPicker selectedIcon={icon} onChange={setIcon} />
          </div>

          {/* Select Color */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kolor wyróżniający</label>
            <div className="flex flex-wrap gap-2.5 bg-white/30 backdrop-blur-xs p-3 rounded-2xl border border-white/50 shadow-inner">
              {AVAILABLE_COLORS.map(col => (
                <button
                  key={col.class}
                  type="button"
                  onClick={() => setColor(col.class)}
                  className={`w-7 h-7 rounded-full ${col.bg} transition-all relative flex items-center justify-center cursor-pointer hover:scale-110`}
                  title={col.class}
                  id={`btn-color-select-${col.class}`}
                >
                  {color === col.class && <span className="w-2.5 h-2.5 rounded-full bg-white block shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          {envelope && (
            <div className="pt-4 border-t border-white/50 space-y-3">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onArchive && envelope.id) {
                      onArchive(envelope.id);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <LucideIcon name="Archive" size={16} />
                  Zarchiwizuj kopertę
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Zarchiwizowane koperty nie będą się pojawiać w nowych miesiącach.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!canDelete}
                  onClick={() => {
                    if (canDelete && onDelete && envelope.id) {
                      onDelete(envelope.id);
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    canDelete
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <LucideIcon name="Trash2" size={16} />
                  Usuń kopertę
                </button>
                {!canDelete && (
                  <p className="text-[10px] text-rose-500 text-center font-medium">
                    Nie można usunąć koperty, ponieważ są do niej przypisane transakcje. Usuń je najpierw.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-white/50">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-white/80 bg-white/30 hover:bg-white/55 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer"
              id="btn-cancel-env-save"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              id="btn-confirm-env-save"
            >
              {envelope ? 'Zapisz' : 'Dodaj'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


// ==========================================
// 2. ADD SAVING GOAL MODAL
// ==========================================
interface AddSavingGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any) => void;
  goal?: SavingGoal | null;
  onDelete?: () => void;
}

export function AddSavingGoalModal({ isOpen, onClose, onSave, goal = null, onDelete }: AddSavingGoalModalProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('indigo');

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTarget(goal.target !== null ? goal.target.toString() : '');
      setInitialSaved(goal.current.toString());
      setIcon(goal.icon || 'PiggyBank');
      setColor(goal.color || 'indigo');
    } else {
      setName('');
      setTarget('');
      setInitialSaved('');
      setIcon('PiggyBank');
      setColor('indigo');
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = target.trim() === '' ? null : parseFloat(target);
    const currentNum = parseFloat(initialSaved) || 0;
    if (!name.trim()) return;
    if (targetNum !== null && (isNaN(targetNum) || targetNum <= 0)) return;
    onSave({ id: goal?.id, name: name.trim(), target: targetNum, current: currentNum, icon, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        id="modal-add-goal"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">{goal ? 'Edytuj cel' : 'Nowy cel oszczędzania'}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Określ na co oszczędzasz</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-goal">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nazwa celu</label>
            <input
              type="text" required
              placeholder="np. Poduszka bezpieczeństwa, Wakacje, Smartfon"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all"
              id="input-goal-name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kwota docelowa (PLN) - opcjonalnie</label>
            <div className="relative">
              <input
                type="number"
                placeholder="np. 5000 (zostaw puste jeśli brak)"
                value={target} onChange={e => setTarget(e.target.value)}
                className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all pr-12 font-mono"
                min="1" id="input-goal-target"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">PLN</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {goal ? 'Aktualny stan oszczędności' : 'Aktualnie zaoszczędzone (PLN)'}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={initialSaved} onChange={e => setInitialSaved(e.target.value)}
                className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all pr-12 font-mono"
                min="0" id="input-goal-initial"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">PLN</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Wybierz ikonę</label>
            <IconPicker selectedIcon={icon} onChange={setIcon} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kolor</label>
            <div className="flex flex-wrap gap-2.5 bg-white/30 p-3 rounded-2xl border border-white/50">
              {AVAILABLE_COLORS.map(col => (
                <button
                  key={col.class} type="button"
                  onClick={() => setColor(col.class)}
                  className={`w-7 h-7 rounded-full ${col.bg} transition-all relative flex items-center justify-center cursor-pointer hover:scale-110`}
                  id={`btn-goal-color-select-${col.class}`}
                >
                  {color === col.class && <span className="w-2.5 h-2.5 rounded-full bg-white block shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 pt-3 border-t border-white/50">
            {goal && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                id="btn-delete-goal-modal"
              >
                <LucideIcon name="Trash2" size={14} />
                Usuń cel
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/30 hover:bg-white/50 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer" id="btn-cancel-goal-save">
                Anuluj
              </button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase transition-all shadow-md bg-slate-900 hover:bg-slate-800 cursor-pointer" id="btn-submit-goal-save">
                {goal ? 'Zapisz zmiany' : 'Dodaj cel'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


// ==========================================
// 4. MONTH CLOSURE MODAL
// ==========================================
interface MonthClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonth: BudgetMonth;
  onConfirm: () => void;
}

export function MonthClosureModal({ isOpen, onClose, activeMonth, onConfirm }: MonthClosureModalProps) {
  if (!isOpen) return null;

  const { envelopes, savingGoals, freeFunds } = activeMonth;

  // Rollover info dla każdej koperty
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
          {/* Podsumowanie */}
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

          {/* Co stanie się z rolloverami */}
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

          {/* Info portfel */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-700">
            <strong className="block">Portfel ({formatCurrency(freeFunds)})</strong>
            <span className="opacity-80">przejdzie jako środki przeniesione do portfela następnego miesiąca.</span>
          </div>

          {/* Info o zamknięciu */}
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


// ==========================================
// 5. ADD EXPENSE MODAL
// ==========================================
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
    frequency: import('../types').RecurringFrequency;
  }) => void;
}

export function AddExpenseModal({ isOpen, onClose, envelope, activeMonth, onSave, onSavePlanned }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPlanned, setIsPlanned] = useState(false);
  const [frequency, setFrequency] = useState<import('../types').RecurringFrequency>('one_time');
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
                step="1" min="0" autoFocus
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

          {/* Opcja podziału transakcji */}
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
                    onClick={() => setSplits([...splits, { id: Math.random().toString(36).substr(2, 9), envelopeId: '', amount: '', description: '' }])}
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

          {/* Toggle Planowanie */}
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
                    onChange={e => setFrequency(e.target.value as import('../types').RecurringFrequency)}
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

// ==========================================
// 6. CHANGELOG MODAL
// ==========================================
export function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const logs = [
    {
      version: 'v2.0 (Aktualna)',
      date: '2026-06-29',
      badge: 'Przebudowa logiki budżetu',
      badgeColor: 'bg-indigo-600 text-white',
      items: [
        { title: 'Usunięcie limitów kopert', description: 'Koperty nie mają już sztucznych limitów (planów wydatków). Teraz w kopercie jest dokładnie tyle, ile przydzielisz z portfela.' },
        { title: 'Portfel jako sejf', description: 'Portfel to specjalny "sejf" z pieniędzmi do rozdysponowania. Wpadają tu przychody po odhaczyciu, a Ty decydujesz gdzie je przydzielić.' },
        { title: 'Przenoszenie per koperta', description: 'Każda koperta ma własne ustawienie przenoszenia — możesz wybrać czy niewydane środki wracają do tej samej koperty lub trafiają do wybranego celu oszczędnościowego.' },
        { title: 'Rachunki zawsze z kopertą', description: 'Każdy stały rachunek musi być przypisany do koperty. Opłacenie rachunku pobiera bezpośrednio z koperty — portfel nie jest dotykany.' },
        { title: 'Przydziel / Wycofaj środki', description: 'Nowy modal do elastycznego zarządzania środkami między portfelem a kopertami — w obie strony.' },
      ]
    },
    {
      version: 'v1.7',
      date: '2026-06-25',
      badge: 'Zamykanie Miesiąca & Przenoszenie',
      badgeColor: 'bg-emerald-600 text-white',
      items: [
        { title: 'Automatyczne przenoszenie środków', description: 'Niewykorzystane środki przechodzą automatycznie na kolejny miesiąc.' },
        { title: 'Kompaktowy przycisk zamknięcia', description: 'Elegancki przycisk zamknięcia w nagłówku zamiast dużego panelu.' },
      ]
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
        id="modal-changelog"
      >
        <div className="p-6 border-b border-white/50 bg-gradient-to-r from-amber-500/10 to-rose-500/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
              <LucideIcon name="History" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Historia zmian w RosaKasa</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Dowiedz się, co się zmieniło</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-changelog">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
          {logs.map((log, logIdx) => (
            <div key={log.version} className="relative">
              {logIdx !== logs.length - 1 && <div className="absolute left-4 top-10 bottom-[-32px] w-0.5 bg-slate-200" />}
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold font-mono flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm">✓</div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-display font-extrabold text-sm text-slate-900">{log.version}</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${log.badgeColor}`}>{log.badge}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5 block">{log.date}</span>
                </div>
              </div>
              <div className="pl-11 space-y-4">
                {log.items.map((item, i) => (
                  <div key={i} className="bg-white/70 border border-slate-100 p-4 rounded-2xl shadow-xs hover:border-slate-200 hover:bg-white transition-all space-y-1">
                    <h5 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal pl-3">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/50 bg-white/40 backdrop-blur-xs flex justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RosaKasa v2.0.0</p>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer" id="btn-confirm-changelog-close">
            Zamknij
          </button>
        </div>
      </motion.div>
    </div>
  );
}


// ==========================================
// 7. ADD INCOME MODAL
// ==========================================
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
    frequency: import('../types').RecurringFrequency;
  }) => void;
}

export function AddIncomeModal({ isOpen, onClose, activeMonth, onSave, onSavePlanned }: AddIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isPlanned, setIsPlanned] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<import('../types').RecurringFrequency>('one_time');

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
                id="input-income-amount" autoFocus
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

          {/* Toggle Planowanie */}
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
                      onChange={e => setFrequency(e.target.value as import('../types').RecurringFrequency)}
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



interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onClearData?: () => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, onResetData, onClearData }: SettingsModalProps) {
  const [currency, setCurrency] = useState<'PLN' | 'EUR' | 'USD' | 'GBP'>('PLN');
  const [showDecimals, setShowDecimals] = useState(false);
  const [enableRollover, setEnableRollover] = useState(true);
  const [hideClosedMonths, setHideClosedMonths] = useState(false);

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
      setShowDecimals(settings.showDecimals);
      setEnableRollover(settings.enableRollover);
      setHideClosedMonths(settings.hideClosedMonths);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ currency, showDecimals, enableRollover, hideClosedMonths });
    onClose();
  };

  const ToggleRow = ({ label, desc, value, onChange, id }: { label: string; desc: string; value: boolean; onChange: () => void; id: string }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-slate-800">{label}</h4>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button type="button" onClick={onChange} id={id}
        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
        id="modal-settings"
      >
        <div className="p-6 border-b border-white/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
                <LucideIcon name="Settings" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ustawienia aplikacji</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Konfiguracja budżetu i preferencji</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-settings">
              <LucideIcon name="X" size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Waluta i Formatowanie</label>
            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Domyślna waluta</h4>
                  <p className="text-[10px] text-slate-500">Waluta wyświetlana w aplikacji</p>
                </div>
                <select value={currency} onChange={e => setCurrency(e.target.value as any)}
                  className="bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
                  id="select-settings-currency"
                >
                  <option value="PLN">PLN (zł)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <ToggleRow label="Pokazuj grosze / centy" desc="Włącz wyświetlanie miejsc po przecinku" value={showDecimals} onChange={() => setShowDecimals(!showDecimals)} id="toggle-settings-decimals" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Wygląd i Filtry</label>
            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-4 shadow-sm">
              <ToggleRow label="Ukryj zamknięte miesiące" desc="Nie pokazuj zamkniętych miesięcy w selektorze" value={hideClosedMonths} onChange={() => setHideClosedMonths(!hideClosedMonths)} id="toggle-settings-hideclosed" />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-red-500">Strefa Niebezpieczna</label>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-red-900">Wyczyść wszystkie dane</h4>
                <p className="text-[10px] text-red-700/80 leading-normal">Trwale usuwa wszystkie koperty, cele, transakcje i rachunki.</p>
              </div>
              <button type="button" onClick={() => { if (onClearData) { onClearData(); onClose(); } }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm flex items-center justify-center gap-1.5"
                id="btn-settings-clear-all"
              >
                <LucideIcon name="Trash2" size={13} />
                <span>Wyczyść dane</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-500/5 rounded-2xl p-3 border border-blue-500/10 flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
              <LucideIcon name="Info" size={12} />
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">
              Wszystkie dane są bezpiecznie przechowywane lokalnie w pamięci Twojej przeglądarki.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer uppercase tracking-wider" id="btn-settings-cancel">
              Anuluj
            </button>
            <button type="submit" className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/15 transition-all cursor-pointer uppercase tracking-wider" id="btn-settings-save">
              Zapisz ustawienia
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
