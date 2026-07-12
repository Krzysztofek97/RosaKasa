import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SavingGoal, SavingGoalStorageType } from '../types';
import { formatCurrency, calculatePercentage } from '../utils';
import LucideIcon from './LucideIcon';
import { ReadOnlyContext } from '../App';
import { useContext } from 'react';

const goalThemes: Record<string, { ring: string, border: string, bg: string, text: string, textLight: string, progressBg: string }> = {
  amber: { ring: 'ring-amber-500/15', border: 'border-amber-500/30', bg: 'bg-amber-500', text: 'text-amber-700', textLight: 'text-amber-950', progressBg: 'bg-amber-100' },
  orange: { ring: 'ring-orange-500/15', border: 'border-orange-500/30', bg: 'bg-orange-500', text: 'text-orange-700', textLight: 'text-orange-950', progressBg: 'bg-orange-100' },
  yellow: { ring: 'ring-yellow-500/15', border: 'border-yellow-500/30', bg: 'bg-yellow-500', text: 'text-yellow-700', textLight: 'text-yellow-950', progressBg: 'bg-yellow-100' },
  lime: { ring: 'ring-lime-500/15', border: 'border-lime-500/30', bg: 'bg-lime-500', text: 'text-lime-700', textLight: 'text-lime-950', progressBg: 'bg-lime-100' },
  green: { ring: 'ring-green-500/15', border: 'border-green-500/30', bg: 'bg-green-500', text: 'text-green-700', textLight: 'text-green-950', progressBg: 'bg-green-100' },
  emerald: { ring: 'ring-emerald-500/15', border: 'border-emerald-500/30', bg: 'bg-emerald-500', text: 'text-emerald-700', textLight: 'text-emerald-950', progressBg: 'bg-emerald-100' },
  teal: { ring: 'ring-teal-500/15', border: 'border-teal-500/30', bg: 'bg-teal-500', text: 'text-teal-700', textLight: 'text-teal-950', progressBg: 'bg-teal-100' },
  cyan: { ring: 'ring-cyan-500/15', border: 'border-cyan-500/30', bg: 'bg-cyan-500', text: 'text-cyan-700', textLight: 'text-cyan-950', progressBg: 'bg-cyan-100' },
  sky: { ring: 'ring-sky-500/15', border: 'border-sky-500/30', bg: 'bg-sky-500', text: 'text-sky-700', textLight: 'text-sky-950', progressBg: 'bg-sky-100' },
  blue: { ring: 'ring-blue-500/15', border: 'border-blue-500/30', bg: 'bg-blue-500', text: 'text-blue-700', textLight: 'text-blue-950', progressBg: 'bg-blue-100' },
  indigo: { ring: 'ring-indigo-500/15', border: 'border-indigo-500/30', bg: 'bg-indigo-500', text: 'text-indigo-700', textLight: 'text-indigo-950', progressBg: 'bg-indigo-100' },
  purple: { ring: 'ring-purple-500/15', border: 'border-purple-500/30', bg: 'bg-purple-500', text: 'text-purple-700', textLight: 'text-purple-950', progressBg: 'bg-purple-100' },
  violet: { ring: 'ring-violet-500/15', border: 'border-violet-500/30', bg: 'bg-violet-500', text: 'text-violet-700', textLight: 'text-violet-950', progressBg: 'bg-violet-100' },
  fuchsia: { ring: 'ring-fuchsia-500/15', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500', text: 'text-fuchsia-700', textLight: 'text-fuchsia-950', progressBg: 'bg-fuchsia-100' },
  pink: { ring: 'ring-pink-500/15', border: 'border-pink-500/30', bg: 'bg-pink-500', text: 'text-pink-700', textLight: 'text-pink-950', progressBg: 'bg-pink-100' },
  rose: { ring: 'ring-rose-500/15', border: 'border-rose-500/30', bg: 'bg-rose-500', text: 'text-rose-700', textLight: 'text-rose-950', progressBg: 'bg-rose-100' },
  stone: { ring: 'ring-stone-500/15', border: 'border-stone-500/30', bg: 'bg-stone-500', text: 'text-stone-700', textLight: 'text-stone-950', progressBg: 'bg-stone-100' },
  zinc: { ring: 'ring-zinc-500/15', border: 'border-zinc-500/30', bg: 'bg-zinc-500', text: 'text-zinc-700', textLight: 'text-zinc-950', progressBg: 'bg-zinc-100' }
};

const STORAGE_LABELS: Record<SavingGoalStorageType, { icon: string; label: string }> = {
  shared_account: { icon: 'Building2', label: 'Wspólne konto' },
  own_account:    { icon: 'CreditCard', label: 'Osobne konto' },
  cash:           { icon: 'Banknote',   label: 'Gotówka' },
  other:          { icon: 'Box',        label: 'Inne' },
};

interface SavingGoalCardProps {
  key?: string;
  goal: SavingGoal;
  isClosed: boolean;
  unallocatedFunds: number;
  allEnvelopes?: import('../types').Envelope[];
  onDeposit: (id: string, amount: number) => void;
  onWithdraw: (id: string, amount: number) => void;
  onSetAutoTransfer: (id: string, amount?: number, day?: number, rolloverEnvelopeIds?: string[]) => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: SavingGoal) => void;
}

export default function SavingGoalCard({
  goal,
  isClosed,
  unallocatedFunds,
  allEnvelopes = [],
  onDeposit,
  onWithdraw,
  onSetAutoTransfer,
  onDeleteGoal,
  onEditGoal
}: SavingGoalCardProps) {
  const { id, name, target, current, autoTransferAmount, autoTransferDay, icon, color } = goal;
  const activeColor = color || 'amber';
  const theme = goalThemes[activeColor] || goalThemes.amber;
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const isReadOnly = useContext(ReadOnlyContext);
  const [isAutoSetupOpen, setIsAutoSetupOpen] = useState(false);
  const [autoAmountInput, setAutoAmountInput] = useState(autoTransferAmount ? String(autoTransferAmount) : '');
  const [autoDayInput, setAutoDayInput] = useState(autoTransferDay ? String(autoTransferDay) : '1');
  
  const linkedEnvelopes = allEnvelopes.filter(e => e.rolloverTarget === id || (typeof e.rolloverTarget === 'string' && e.rolloverTarget.toLowerCase().trim() === name.toLowerCase().trim()));
  const [selectedEnvelopesInput, setSelectedEnvelopesInput] = useState<string[]>(linkedEnvelopes.map(e => e.id));

  useEffect(() => {
    setSelectedEnvelopesInput(linkedEnvelopes.map(e => e.id));
  }, [allEnvelopes, goal.id, goal.name]);

  const percent = target !== null ? calculatePercentage(current, target) : 0;
  const isGoalReached = target !== null ? current >= target : false;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > unallocatedFunds) {
      return;
    }

    onDeposit(id, amount);
    setDepositAmount('');
    setIsDepositOpen(false);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > current) {
      return;
    }

    onWithdraw(id, amount);
    setWithdrawAmount('');
    setIsWithdrawOpen(false);
  };

  return (
    <motion.div
      layout
      className={`glass-card rounded-[2rem] p-5 transition-all ${
        isGoalReached 
          ? `${theme.border} ring-2 ${theme.ring}` 
          : 'hover:scale-[1.01] hover:shadow-lg hover:border-white/90'
      } overflow-hidden relative`}
      id={`saving-goal-${id}`}
    >
      {/* Decorative background circle for achieved goals */}
      {isGoalReached && (
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-slate-900/5 rounded-full flex items-center justify-center -z-0 opacity-20" />
      )}

      {/* Goal Header */}
      <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl flex items-center justify-center ${
            isGoalReached 
              ? `${theme.bg} text-white shadow-lg` 
              : `${theme.progressBg} ${theme.text}`
          }`}>
            <LucideIcon name={icon || (isGoalReached ? "Sparkles" : "PiggyBank")} size={20} />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-900 text-sm md:text-base tracking-tight leading-tight flex items-center gap-1.5">
              {name}
              {isGoalReached && (
                <span className={`text-[10px] font-sans font-bold bg-white/80 ${theme.text} px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-white/50`}>
                  Cel Osiągnięty! 🎉
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5 font-medium">
              Cel oszczędnościowy
            </p>
            {/* Badge lokalizacji */}
            {goal.storageType && (() => {
              const sl = STORAGE_LABELS[goal.storageType];
              return (
                <div className="flex items-center gap-1 mt-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60 border border-white/70 text-slate-600`}>
                    <LucideIcon name={sl.icon} size={9} />
                    {goal.storageNote ? goal.storageNote : sl.label}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Actions (Edit) */}
        {!isClosed && !isReadOnly && (
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onEditGoal(goal)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-all opacity-50 hover:opacity-100 cursor-pointer"
              title="Edytuj cel oszczędności"
              id={`btn-edit-goal-${id}`}
            >
              <LucideIcon name="Edit3" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Saving Balance */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mb-4 bg-white/30 backdrop-blur-xs rounded-2xl p-3 border border-white/50 shadow-inner">
        <div>
          <p className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider`}>
            Zaoszczędzone
          </p>
          <p className={`text-sm font-bold ${theme.textLight}`}>
            {formatCurrency(current)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            {target !== null ? 'Kwota docelowa' : 'Brak celu'}
          </p>
          <p className="text-sm font-bold text-slate-900">
            {target !== null ? formatCurrency(target) : '---'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {target !== null ? (
        <div className="relative z-10 space-y-1.5 mb-4">
          <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden relative border border-white/20">
            <div
              className={`h-full rounded-full transition-all duration-500 ${theme.bg}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>{percent}% ukończenia</span>
            <span>Pozostało: {formatCurrency(Math.max(0, target - current))}</span>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mb-4 bg-white/20 p-2.5 rounded-xl border border-white/40">
          <p className="text-xs text-slate-600 text-center font-medium flex items-center justify-center gap-1.5">
            <LucideIcon name="Infinity" size={14} className={theme.text} />
            Oszczędzasz bez limitu końcowego
          </p>
        </div>
      )}

      {/* Auto-Transfer Configuration Indicator */}
      <div className="relative z-10 border-t border-white/50 pt-3 pb-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <LucideIcon name="RotateCcw" className="text-slate-500" size={13} />
            <span>Auto-przelew i Nadwyżki</span>
            <span className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
              <LucideIcon name="Info" size={12} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 leading-normal z-50">
                Ustal comiesięczną dopłatę z portfela lub przypisz koperty, z których reszta środków ma trafić do tego celu na koniec miesiąca.
              </span>
            </span>
          </div>

          <button
            onClick={() => !isClosed && !isReadOnly && setIsAutoSetupOpen(!isAutoSetupOpen)}
            disabled={isClosed || isReadOnly}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
              autoTransferAmount || linkedEnvelopes.length > 0
                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                : 'bg-white/40 text-slate-500 border border-white/60'
            }`}
          >
            {autoTransferAmount || linkedEnvelopes.length > 0 ? 'Aktywny' : (isReadOnly ? 'Brak' : 'Ustaw')}
          </button>
        </div>
        
        {linkedEnvelopes.length > 0 && !isAutoSetupOpen && (
           <div className="mt-2 flex flex-wrap gap-1.5">
             <span className="text-[10px] text-slate-500 font-medium flex items-center">
               <LucideIcon name="ArrowRight" size={10} className="mr-1 inline-block" /> Nadwyżki z:
             </span>
             {linkedEnvelopes.map(e => (
               <span key={e.id} className="text-[10px] bg-white/40 px-1.5 py-0.5 rounded-md border border-white/60 text-slate-700 flex items-center gap-1">
                 <LucideIcon name={e.icon} size={10} className={theme.text} />
                 {e.name}
               </span>
             ))}
           </div>
        )}

        {/* Formularz konfiguracji auto-przelewu i rolloveru */}
        {isAutoSetupOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = autoAmountInput ? parseFloat(autoAmountInput) : undefined;
              const day = autoDayInput ? parseInt(autoDayInput) : undefined;
              
              if ((amt !== undefined && isNaN(amt)) || (day !== undefined && isNaN(day))) return;
              
              onSetAutoTransfer(id, amt, day, selectedEnvelopesInput);
              setIsAutoSetupOpen(false);
            }}
            className="mt-3 bg-white/30 p-2.5 rounded-2xl border border-white/50 space-y-3 backdrop-blur-xs"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Miesięczna dopłata z portfela</p>
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <label className="block text-[10px] text-slate-500 mb-1">Kwota przelewu (opcjonalnie)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={autoAmountInput}
                      onChange={(e) => setAutoAmountInput(e.target.value)}
                      className="w-full text-xs bg-white/65 border border-white/60 rounded-xl py-1 pl-2.5 pr-6 focus:outline-none focus:border-slate-400/50 focus:bg-white transition-all"
                      step="any"
                      min="0"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">zł</span>
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] text-slate-500 mb-1">Dzień m-ca</label>
                  <input
                    type="number"
                    placeholder="np. 1"
                    value={autoDayInput}
                    onChange={(e) => setAutoDayInput(e.target.value)}
                    className="w-full text-xs bg-white/65 border border-white/60 rounded-xl py-1 px-2.5 focus:outline-none focus:border-slate-400/50 focus:bg-white transition-all"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/40 pt-2">
              <p className="text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Przenoszenie z kopert na koniec miesiąca</p>
              {allEnvelopes.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">Brak dostępnych kopert</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                  {allEnvelopes.filter(e => !e.isArchived).map(e => {
                    const isSelected = selectedEnvelopesInput.includes(e.id);
                    return (
                      <label key={e.id} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white/50 border-white/60 text-slate-600 hover:bg-white/80'}`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={(ev) => {
                            if (ev.target.checked) setSelectedEnvelopesInput([...selectedEnvelopesInput, e.id]);
                            else setSelectedEnvelopesInput(selectedEnvelopesInput.filter(idx => idx !== e.id));
                          }}
                        />
                        <LucideIcon name={e.icon} size={10} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                        {e.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 justify-end mt-1 pt-2 border-t border-white/40">
              <button
                type="button"
                onClick={() => {
                  onSetAutoTransfer(id, undefined, undefined, []);
                  setAutoAmountInput('');
                  setAutoDayInput('1');
                  setSelectedEnvelopesInput([]);
                  setIsAutoSetupOpen(false);
                }}
                className="text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer hover:bg-white/50"
              >
                Wyłącz wszystko
              </button>
              <button
                type="submit"
                className={`text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer ${theme.bg} hover:brightness-95`}
              >
                Zapisz
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Manual Actions (Deposit / Withdraw) */}
      {!isClosed && !isReadOnly && (
        <div className="relative z-10 grid grid-cols-2 gap-2 mt-2">
          {/* Deposit action */}
          {!isDepositOpen ? (
            <button
              onClick={() => {
                setIsDepositOpen(true);
                setIsWithdrawOpen(false);
              }}
              disabled={unallocatedFunds <= 0}
              className={`py-2 rounded-xl text-xs font-semibold ${theme.bg} hover:brightness-95 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed shadow-md`}
              title={unallocatedFunds <= 0 ? "Brak środków w portfelu do wpłaty" : "Wpłać środki"}
              id={`btn-open-deposit-${id}`}
            >
              <LucideIcon name="Plus" size={13} />
              <span>Wpłać</span>
            </button>
          ) : (
            <form onSubmit={handleDepositSubmit} className="col-span-2 bg-white/30 p-2.5 rounded-2xl border border-white/50 space-y-2 backdrop-blur-xs">
              <p className={`text-[10px] font-bold ${theme.text} uppercase tracking-wider`}>
                Wpłata z portfela (maks: {formatCurrency(unallocatedFunds)})
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  required
                  placeholder="Kwota"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full text-xs bg-white/65 border border-white/60 rounded-xl py-1 px-2.5 focus:outline-none focus:border-slate-400/50 focus:bg-white transition-all"
                  max={unallocatedFunds}
                  step="any"
                  min="0.01"
                  autoFocus
                  id={`input-deposit-${id}`}
                />
                <button
                  type="submit"
                  className={`text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer ${theme.bg} hover:brightness-95`}
                  id={`btn-submit-deposit-${id}`}
                >
                  Ok
                </button>
                <button
                  type="button"
                  onClick={() => setIsDepositOpen(false)}
                  className="text-slate-500 hover:text-slate-800 p-1"
                  id={`btn-cancel-deposit-${id}`}
                >
                  <LucideIcon name="X" size={14} />
                </button>
              </div>
            </form>
          )}

          {/* Withdraw action */}
          {!isWithdrawOpen && !isDepositOpen && (
            <button
              onClick={() => {
                setIsWithdrawOpen(true);
                setIsDepositOpen(false);
              }}
              disabled={current <= 0}
              className="py-2 rounded-xl text-xs font-semibold border border-white/80 bg-white/30 hover:bg-white/50 text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed shadow-xs"
              id={`btn-open-withdraw-${id}`}
            >
              <LucideIcon name="Minus" size={13} />
              <span>Wycofaj</span>
            </button>
          )}

          {isWithdrawOpen && (
            <form onSubmit={handleWithdrawSubmit} className="col-span-2 bg-white/30 p-2.5 rounded-2xl border border-white/50 space-y-2 backdrop-blur-xs">
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Wycofaj do portfela (maks: {formatCurrency(current)})
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  required
                  placeholder="Kwota"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full text-xs bg-white/65 border border-white/60 rounded-xl py-1 px-2.5 focus:outline-none focus:border-rose-400/50 focus:bg-white transition-all"
                  max={current}
                  step="any"
                  min="0.01"
                  autoFocus
                  id={`input-withdraw-${id}`}
                />
                <button
                  type="submit"
                  className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer"
                  id={`btn-submit-withdraw-${id}`}
                >
                  Ok
                </button>
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="text-slate-500 hover:text-slate-800 p-1"
                  id={`btn-cancel-withdraw-${id}`}
                >
                  <LucideIcon name="X" size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </motion.div>
  );
}
