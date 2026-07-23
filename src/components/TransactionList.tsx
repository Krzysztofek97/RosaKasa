import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, PlannedTransaction, Envelope, SavingGoal, BudgetMonth } from '../types';
import { formatCurrency } from '../utils';
import { getColorConfig } from '../data';
import LucideIcon from './LucideIcon';
import { ReadOnlyContext } from '../App';
import { useContext } from 'react';

interface TransactionListProps {
  transactions: Transaction[];
  plannedTransactions: PlannedTransaction[];
  envelopes: Envelope[];
  savingGoals?: SavingGoal[];
  isClosed: boolean;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onConfirmPlanned: (id: string) => void;
  onDeletePlanned: (id: string) => void;
  months?: BudgetMonth[];
  selectedMonthId?: string;
  onSelectMonth?: (id: string) => void;
}

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function TransactionList({
  transactions,
  plannedTransactions,
  envelopes,
  savingGoals = [],
  isClosed,
  onDeleteTransaction,
  onEditTransaction,
  onConfirmPlanned,
  onDeletePlanned,
  months = [],
  selectedMonthId,
  onSelectMonth,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'saving_transfer' | 'interest'>('all');
  const [activeSection, setActiveSection] = useState<'history' | 'planned'>('history');
  const isReadOnly = useContext(ReadOnlyContext);
  
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeYear = selectedMonthId ? selectedMonthId.split('-')[0] : '2026';
  const allMonthsOfYear = months.filter(m => m.id.startsWith(activeYear));
  const currentMonthNum = selectedMonthId ? parseInt(selectedMonthId.split('-')[1]) : 1;

  const today = new Date().toISOString().split('T')[0];

  // Pending planned (not confirmed)
  const pendingPlanned = plannedTransactions.filter(p => !p.isConfirmed);
  const confirmedCount = plannedTransactions.filter(p => p.isConfirmed).length;

  // Filter real transactions
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch =
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.envelopeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm);
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      const getTimestamp = (id: string) => {
        const match = id.match(/\d{13}/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const timeA = getTimestamp(a.id);
      const timeB = getTimestamp(b.id);
      if (timeA !== timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'expense':
        return { label: 'Wydatek', bg: 'bg-rose-500/10 text-rose-700 border-rose-500/25', icon: 'ArrowDownRight', iconColor: 'text-rose-600' };
      case 'saving_transfer':
        return { label: 'Oszczędności', bg: 'bg-amber-500/10 text-amber-700 border-amber-500/25', icon: 'PiggyBank', iconColor: 'text-amber-600' };
      case 'income':
        return { label: 'Wpływy', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25', icon: 'TrendingUp', iconColor: 'text-emerald-600' };
      case 'interest':
        return { label: 'Odsetki 🌱', bg: 'bg-teal-500/10 text-teal-700 border-teal-500/25', icon: 'Sprout', iconColor: 'text-teal-600' };
      case 'goal_correction':
        return { label: 'Korekta', bg: 'bg-slate-500/10 text-slate-600 border-slate-500/25', icon: 'SlidersHorizontal', iconColor: 'text-slate-500' };
      default:
        return { label: 'Inny', bg: 'bg-slate-500/10 text-slate-700 border-slate-500/25', icon: 'CreditCard', iconColor: 'text-slate-600' };
    }
  };

  const getTransactionIconInfo = (t: Transaction | PlannedTransaction) => {
    let mainIcon = '';
    let mainColorClass = '';
    let bgClass = '';
    let tinyIcon: string | null = null;
    let tinyIconColor = '';

    const badge = getTypeBadge(t.type);

    if (t.type === 'expense') {
      const envelope = t.envelopeId ? envelopes.find(e => e.id === t.envelopeId) : null;
      if (envelope) {
        mainIcon = envelope.icon;
        const colConfig = getColorConfig(envelope.color);
        mainColorClass = colConfig.text;
        bgClass = `${colConfig.bgLight} ${colConfig.border}`;
      } else {
        mainIcon = badge.icon;
        mainColorClass = badge.iconColor;
        bgClass = badge.bg;
      }
      tinyIcon = 'ArrowDownRight';
      tinyIconColor = 'text-rose-600';
    } else if (t.type === 'saving_transfer') {
      const goal = t.savingGoalId ? savingGoals.find(g => g.id === t.savingGoalId) : null;
      const isWithdrawal = (t as Transaction).isWithdrawal;
      if (goal && goal.icon && goal.color) {
        mainIcon = goal.icon;
        const colConfig = getColorConfig(goal.color);
        mainColorClass = colConfig.text;
        bgClass = `${colConfig.bgLight} ${colConfig.border}`;
      } else {
        mainIcon = badge.icon;
        mainColorClass = badge.iconColor;
        bgClass = badge.bg;
      }
      tinyIcon = isWithdrawal ? 'ArrowDownRight' : 'ArrowUpRight';
      tinyIconColor = isWithdrawal ? 'text-rose-600' : 'text-amber-500';
    } else if (t.type === 'income') {
      mainIcon = 'CreditCard';
      mainColorClass = 'text-emerald-600';
      bgClass = 'bg-emerald-500/10 border-emerald-500/25';
      tinyIcon = 'ArrowUpRight';
      tinyIconColor = 'text-emerald-600';
    } else {
      mainIcon = badge.icon;
      mainColorClass = badge.iconColor;
      bgClass = badge.bg;
    }

    return { mainIcon, mainColorClass, bgClass, tinyIcon, tinyIconColor };
  };


  const getDaysLabel = (date: string) => {
    if (date === today) return { label: 'Dziś', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (date < today) {
      const diff = Math.round((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
      return { label: `${diff} dni temu`, color: 'text-rose-600 bg-rose-50 border-rose-200' };
    }
    const diff = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000);
    return { label: `Za ${diff} dni`, color: 'text-sky-600 bg-sky-50 border-sky-200' };
  };

  return (
    <div className="glass-card rounded-[2rem] p-6 flex flex-col" id="panel-transactions">
      {/* Section switcher */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex bg-white/30 backdrop-blur-xs border border-white/50 p-1 rounded-2xl gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSection('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'history' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="btn-section-history"
          >
            <LucideIcon name="History" size={13} />
            Historia
            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeSection === 'history' ? 'bg-white/20' : 'bg-slate-100'}`}>
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('planned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'planned' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="btn-section-planned"
          >
            <LucideIcon name="CalendarClock" size={13} />
            Planowane
            {pendingPlanned.length > 0 && (
              <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                activeSection === 'planned' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-700'
              }`}>
                {pendingPlanned.length}
              </span>
            )}
          </button>
        </div>

        {activeSection === 'history' && (
          <span className="text-xs font-semibold bg-white/40 text-slate-600 py-1 sm:py-1.5 px-2.5 rounded-lg border border-white/60 font-mono">
            {filteredTransactions.length} / {transactions.length}
          </span>
        )}
      </div>

      {/* ---- HISTORIA ---- */}
      {activeSection === 'history' && (
        <>
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 border-b border-white/40 pb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Szukaj operacji..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-white/50 border border-white/60 rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-rose-400/50 focus:bg-white transition-all"
                id="input-search-transactions"
              />
              <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                <LucideIcon name="Search" size={14} />
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-all cursor-pointer p-0.5 rounded-full hover:bg-white/50"
                  id="btn-clear-search"
                >
                  <LucideIcon name="X" size={12} />
                </button>
              )}
            </div>
            <div className="flex bg-white/30 backdrop-blur-xs border border-white/50 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
              {(['all', 'expense', 'income', 'saving_transfer'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                  id={`btn-filter-${type}`}
                >
                  {type === 'all' && 'Wszystkie'}
                  {type === 'expense' && 'Wydatki'}
                  {type === 'income' && 'Wpływy'}
                  {type === 'saving_transfer' && 'Oszczędności'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center text-slate-400 mb-2 border border-white/50">
                  <LucideIcon name="FileText" size={20} />
                </div>
                <h4 className="text-xs font-semibold text-slate-500">Brak dopasowanych operacji</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Spróbuj zmienić parametry wyszukiwania lub filtry.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {filteredTransactions.map((t) => {
                    const badge = getTypeBadge(t.type);
                    const iconInfo = getTransactionIconInfo(t);
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 rounded-2xl border border-white/40 bg-white/20 hover:bg-white/40 backdrop-blur-xs transition-all gap-4 shadow-xs"
                        id={`transaction-row-${t.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <div className={`p-1.5 rounded-lg border flex items-center justify-center ${iconInfo.bgClass}`}>
                              <LucideIcon name={iconInfo.mainIcon} size={14} className={iconInfo.mainColorClass} />
                            </div>
                            {iconInfo.tinyIcon && (
                              <div className={`absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-[2px] shadow-sm ${iconInfo.tinyIconColor}`}>
                                <LucideIcon name={iconInfo.tinyIcon} size={10} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{t.description}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-sans mt-0.5 font-medium flex-wrap">
                              <span className="whitespace-nowrap">{t.date}</span>
                              <span className="shrink-0">•</span>
                              <span className="font-bold text-slate-700 bg-white/50 border border-white/60 px-1.5 py-0.2 rounded truncate max-w-[100px] sm:max-w-none">{t.envelopeName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <p className={`text-xs font-extrabold ${
                              t.type === 'expense'
                                ? 'text-rose-600' 
                                : t.type === 'income' 
                                  ? 'text-emerald-600' 
                                  : 'text-amber-600'
                            }`}>
                              {t.type === 'expense' || (t.type === 'saving_transfer' && !t.isWithdrawal) ? '-' : '+'}{formatCurrency(t.amount)}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{badge.label}</p>
                          </div>
                          {!isClosed && !isReadOnly && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onEditTransaction(t)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white/50 transition-all cursor-pointer shrink-0"
                                title="Edytuj tę operację"
                                id={`btn-edit-transaction-${t.id}`}
                              >
                                <LucideIcon name="Edit3" size={13} />
                              </button>
                              <button
                                onClick={() => onDeleteTransaction(t.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white/50 transition-all cursor-pointer shrink-0"
                                title="Usuń tę operację"
                                id={`btn-undo-transaction-${t.id}`}
                              >
                                <LucideIcon name="Trash2" size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---- PLANOWANE ---- */}
      {activeSection === 'planned' && (
        <div className="space-y-3">
          {pendingPlanned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center text-slate-400 mb-2 border border-white/50">
                <LucideIcon name="CalendarCheck" size={20} />
              </div>
              <h4 className="text-xs font-semibold text-slate-500">Brak planowanych operacji</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                Przy dodawaniu wydatku lub wpływu włącz opcję "Zaplanuj na przyszłość".
              </p>
              {confirmedCount > 0 && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                  ✓ {confirmedCount} {confirmedCount === 1 ? 'operacja potwierdzona' : 'operacje potwierdzone'}
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-[10px] text-slate-400 font-medium mb-1">
                {pendingPlanned.length} {pendingPlanned.length === 1 ? 'operacja oczekuje' : 'operacji oczekuje'} na potwierdzenie
              </p>
              <AnimatePresence>
                {pendingPlanned
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(pt => {
                    const envelope = pt.envelopeId ? envelopes.find(e => e.id === pt.envelopeId) : null;
                    const daysInfo = getDaysLabel(pt.date);
                    const freqLabels: Record<string, string> = {
                      one_time: 'Jednorazowo',
                      weekly: 'Co tydzień',
                      biweekly: 'Co 2 tygodnie',
                      monthly: 'Co miesiąc',
                      yearly: 'Co rok',
                    };
                    const iconInfo = getTransactionIconInfo(pt);

                    return (
                      <motion.div
                        key={pt.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="rounded-2xl border border-white/50 bg-white/30 backdrop-blur-xs p-4 flex items-center justify-between gap-3"
                        id={`planned-row-${pt.id}`}
                      >
                        {/* Icon + details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <div className={`p-2 rounded-xl flex items-center justify-center border ${iconInfo.bgClass}`}>
                              <LucideIcon name={iconInfo.mainIcon} size={15} className={iconInfo.mainColorClass} />
                            </div>
                            {iconInfo.tinyIcon && (
                              <div className={`absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-[2px] shadow-sm ${iconInfo.tinyIconColor}`}>
                                <LucideIcon name={iconInfo.tinyIcon} size={11} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{pt.description}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${daysInfo.color}`}>
                                {daysInfo.label}
                              </span>
                              {envelope && (
                                <span className="text-[10px] font-semibold text-slate-600 bg-white/60 border border-slate-200 px-1.5 py-0.5 rounded-md truncate max-w-[100px] sm:max-w-none">
                                  {envelope.name}
                                </span>
                              )}
                              {pt.frequency !== 'one_time' && (
                                <span className="text-[10px] text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                  <LucideIcon name="Repeat2" size={9} />
                                  {freqLabels[pt.frequency]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount + actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-mono font-extrabold text-sm ${pt.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {pt.type === 'expense' ? '-' : '+'}{formatCurrency(pt.amount)}
                          </span>
                          {!isClosed && !isReadOnly && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onConfirmPlanned(pt.id)}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                                title="Potwierdź wykonanie"
                                id={`btn-confirm-planned-list-${pt.id}`}
                              >
                                <LucideIcon name="CheckCircle2" size={11} />
                                Potwierdź
                              </button>
                              <button
                                onClick={() => onDeletePlanned(pt.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Usuń planowaną operację"
                                id={`btn-delete-planned-list-${pt.id}`}
                              >
                                <LucideIcon name="Trash2" size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
              {confirmedCount > 0 && (
                <p className="text-[11px] text-emerald-600 font-semibold text-center pt-2">
                  ✓ {confirmedCount} {confirmedCount === 1 ? 'operacja już potwierdzona' : 'operacji już potwierdzonych'}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
