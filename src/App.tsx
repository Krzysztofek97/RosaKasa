import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BudgetMonth, Envelope, SavingGoal, Transaction, PlannedTransaction,
  AppSettings, RecurringFrequency, BudgetAccount
} from './types';
import { INITIAL_BUDGET_MONTHS, createEmptyMonth } from './data';
import { formatCurrency } from './utils';
// Component imports
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import EnvelopeCard from './components/EnvelopeCard';
import SavingGoalCard from './components/SavingGoalCard';
import StatsView from './components/StatsView';
import TransactionList from './components/TransactionList';
import MonthScopeSelector from './components/MonthScopeSelector';
import LucideIcon from './components/LucideIcon';

import PlannedTransactionsBanner from './components/PlannedTransactionsBanner';
import {
  EditEnvelopeModal,
  EnvelopeHistoryModal,
  AddSavingGoalModal,
  AddExpenseModal,
  ChangelogModal,
  AddIncomeModal,
  SettingsModal
} from './components/Modals';
import { EditTransactionModal } from './components/EditTransactionModal';
import AllocateModal from './components/AllocateModal';
import EnvelopeActionsModal from './components/EnvelopeActionsModal';
import TransferModal from './components/TransferModal';
import ReorderEnvelopesModal from './components/ReorderEnvelopesModal';
import InterestModal from './components/InterestModal';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginScreen from './components/LoginScreen';

// ---------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------
const LOCAL_STORAGE_KEY = 'rosakasa_budget_data';
const BUDGETS_STORAGE_KEY = 'rosakasa_budgets_v2';
const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------
function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
}

function getAdjustedDateForMonth(originalDate: string, targetMonthId: string): string {
  const parts = originalDate.split('-');
  if (parts.length !== 3) return `${targetMonthId}-01`;
  const day = parts[2];
  const year = parseInt(targetMonthId.split('-')[0]);
  const month = parseInt(targetMonthId.split('-')[1]);
  const lastDay = new Date(year, month, 0).getDate();
  const adjustedDay = Math.min(parseInt(day), lastDay).toString().padStart(2, '0');
  return `${targetMonthId}-${adjustedDay}`;
}

function generateDatesForFrequency(
  startDateStr: string,
  frequency: 'weekly' | 'biweekly'
): { monthId: string; date: string }[] {
  const dates: { monthId: string; date: string }[] = [];
  const current = new Date(startDateStr);
  const intervalDays = frequency === 'weekly' ? 7 : 14;
  while (true) {
    current.setDate(current.getDate() + intervalDays);
    const year = current.getFullYear();
    if (year !== 2026) break;
    const monthStr = (current.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = current.getDate().toString().padStart(2, '0');
    const mId = `2026-${monthStr}`;
    const dStr = `2026-${monthStr}-${dayStr}`;
    dates.push({ monthId: mId, date: dStr });
  }
  return dates;
}

/** Migracja starego formatu danych */
function migrateMonth(raw: any): BudgetMonth {
  const freeFunds = raw.freeFunds !== undefined ? raw.freeFunds : (raw.unallocated ?? 0);
  const freeFundsRollover = raw.freeFundsRollover ?? 0;

  const envelopes: Envelope[] = (raw.envelopes || []).map((e: any): Envelope => ({
    id: e.id,
    name: e.name,
    limit: e.limit ?? 0,
    allocated: e.allocated ?? 0,
    spent: e.spent ?? 0,
    rollover: e.rollover ?? 0,
    rolloverTarget: e.rolloverTarget ?? 'envelope',
    icon: e.icon === 'Wallet' ? 'Folder' : (e.icon ?? 'Folder'),
    color: e.color ?? 'blue',
    quickSpends: e.quickSpends ?? [],
  }));

  // Migruj incomeStreams → plannedTransactions (income)
  const migratedFromStreams: PlannedTransaction[] = (raw.incomeStreams || []).map((s: any): PlannedTransaction => ({
    id: s.id ?? genId('pt-migrated'),
    type: 'income',
    description: s.source ?? 'Wpływ',
    amount: s.amount ?? 0,
    date: s.date ?? `${raw.id}-01`,
    frequency: s.frequency ?? 'one_time',
    isConfirmed: s.isReceived ?? false,
  }));

  // Migruj istniejące plannedTransactions (jeśli już były w nowym formacie)
  const existingPlanned: PlannedTransaction[] = (raw.plannedTransactions || []).map((pt: any): PlannedTransaction => ({
    id: pt.id,
    type: pt.type ?? 'expense',
    description: pt.description ?? '',
    amount: pt.amount ?? 0,
    date: pt.date ?? `${raw.id}-01`,
    envelopeId: pt.envelopeId,
    envelopeName: pt.envelopeName,
    savingGoalId: pt.savingGoalId,
    frequency: pt.frequency ?? 'one_time',
    isConfirmed: pt.isConfirmed ?? false,
  }));

  // Scalaj — unikaj duplikatów po id
  const allIds = new Set(existingPlanned.map(p => p.id));
  const merged = [...existingPlanned, ...migratedFromStreams.filter(p => !allIds.has(p.id))];

  return {
    id: raw.id,
    name: raw.name,
    freeFunds,
    freeFundsRollover,
    envelopes,
    savingGoals: (raw.savingGoals || []).map((g: any): SavingGoal => ({
      id: g.id,
      name: g.name,
      target: g.target !== undefined ? g.target : 0,
      current: g.current ?? 0,
      icon: g.icon,
      color: g.color,
      autoTransferAmount: g.autoTransferAmount,
      autoTransferDay: g.autoTransferDay,
    })),
    transactions: (raw.transactions || [])
      .filter((t: any) => t.type !== 'allocation' && t.type !== 'withdrawal')
      .map((t: any): Transaction => {
        let savedGoalId = t.savingGoalId;
        // Auto-recovery for corrupted saving_transfer transactions
        if (!savedGoalId && t.type === 'saving_transfer' && typeof t.description === 'string' && t.description.startsWith('Cel: ')) {
           const goalName = t.description.substring(5).trim();
           const goal = (raw.savingGoals || []).find((g:any) => g.name === goalName);
           if (goal) savedGoalId = goal.id;
        }

        return {
          id: t.id,
          envelopeId: t.envelopeId === 'unallocated' ? 'free_funds' : t.envelopeId,
          envelopeName: t.envelopeName ?? '',
          amount: t.amount ?? 0,
          description: t.description ?? '',
          date: t.date ?? `${raw.id}-01`,
          type: t.type ?? 'expense',
          savingGoalId: savedGoalId,
          isWithdrawal: t.isWithdrawal,
        };
      }),
    isClosed: raw.isClosed ?? false,
    plannedTransactions: merged,
  };
}


/** Upewnia się że wszystkie 12 miesięcy 2026 istnieje */
function ensureAllMonths(existing: BudgetMonth[]): BudgetMonth[] {
  const map = new Map(existing.map(m => [m.id, m]));
  const today = new Date();
  const currentMonthNum = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear(); // np. 2026

  for (let m = 1; m <= 12; m++) {
    const monthId = `2026-${m.toString().padStart(2, '0')}`;
    if (!map.has(monthId)) {
      map.set(monthId, createEmptyMonth(monthId));
    }
    
    // Automatyczne zamykanie miesięcy
    const budgetMonthObj = map.get(monthId)!;
    
    let shouldBeClosed = false;
    if (2026 < currentYear) {
      shouldBeClosed = true; // Cały rok 2026 zamknięty
    } else if (2026 === currentYear && m < currentMonthNum) {
      shouldBeClosed = true; // Minione miesiące tego roku zamknięte
    }

    if (budgetMonthObj.isClosed !== shouldBeClosed) {
      map.set(monthId, { ...budgetMonthObj, isClosed: shouldBeClosed });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Automatycznie leczy rollovery: jeśli poprzedni miesiąc jest otwarty,
 * to następny nie może mieć z niego przeniesionych środków ani rolloverów celów.
 */
function healRollovers(monthsList: BudgetMonth[]): BudgetMonth[] {
  const sorted = [...monthsList].sort((a, b) => a.id.localeCompare(b.id));

  // 1. Zsynchronizuj szablony celów oszczędnościowych we wszystkich miesiącach
  const allGoalIds = new Set<string>();
  const goalTemplates = new Map<string, SavingGoal>();

  sorted.forEach(m => {
    (m.savingGoals || []).forEach(g => {
      allGoalIds.add(g.id);
      goalTemplates.set(g.id, g);
    });
  });

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    const updatedGoals: SavingGoal[] = [];
    allGoalIds.forEach(id => {
      const template = goalTemplates.get(id)!;
      const existing = m.savingGoals.find(g => g.id === id);
      if (existing) {
        const updatedGoal = {
          ...existing,
          name: template.name,
          target: template.target,
          color: template.color,
        };
        if (template.icon !== undefined) updatedGoal.icon = template.icon;
        
        if (template.autoTransferAmount !== undefined) {
          updatedGoal.autoTransferAmount = template.autoTransferAmount;
        } else {
          delete updatedGoal.autoTransferAmount;
        }
        
        if (template.autoTransferDay !== undefined) {
          updatedGoal.autoTransferDay = template.autoTransferDay;
        } else {
          delete updatedGoal.autoTransferDay;
        }
        
        updatedGoals.push(updatedGoal);
      } else {
        const newGoal = {
          ...template,
          current: 0,
        };
        if (newGoal.autoTransferAmount === undefined) delete newGoal.autoTransferAmount;
        if (newGoal.autoTransferDay === undefined) delete newGoal.autoTransferDay;
        updatedGoals.push(newGoal);
      }
    });
    sorted[i] = {
      ...m,
      savingGoals: updatedGoals,
    };
  }

  // Helper do sumowania transakcji celu w danym miesiącu
  const getGoalTransactionsSum = (month: BudgetMonth, goalId: string, goalName: string): number => {
    let sum = 0;
    (month.transactions || []).forEach(t => {
      if (t.type === 'saving_transfer' && !t.id.startsWith('tx-rollover-')) {
        const matchesGoal = t.savingGoalId === goalId || (t.envelopeName || '').toLowerCase().trim() === goalName.toLowerCase().trim();
        if (matchesGoal) {
          if (t.isWithdrawal) {
            sum -= t.amount;
          } else {
            sum += t.amount;
          }
        }
      }
    });
    return sum;
  };

  // 2. Chronologiczne przeliczanie sald celów oszczędnościowych
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const updatedGoals = curr.savingGoals.map(goal => {
      const txSum = getGoalTransactionsSum(curr, goal.id, goal.name);

      let prevValue = 0;
      if (i > 0) {
        const prev = sorted[i - 1];
        const prevGoal = prev.savingGoals.find(g => g.id === goal.id);
        prevValue = prevGoal ? prevGoal.current : 0;
      }

      // Rollover jest dodawany do celu w miesiącu, w którym zamykamy koperty
      let rolloverAmount = 0;
      if (curr.isClosed) {
        curr.envelopes.forEach(env => {
          const isTargetMatch = env.rolloverTarget === goal.id || 
                                (typeof env.rolloverTarget === 'string' && env.rolloverTarget.toLowerCase().trim() === goal.name.toLowerCase().trim());
          if (isTargetMatch) {
            const leftover = env.rollover + env.allocated - env.spent;
            if (leftover > 0) {
              rolloverAmount += leftover;
            }
          }
        });
      }

      const rolloverTxId = `tx-rollover-${goal.id}-${curr.id}`;
      if (rolloverAmount > 0) {
        let tx = curr.transactions.find(t => t.id === rolloverTxId);
        if (tx) {
           tx.amount = rolloverAmount;
        } else {
           curr.transactions = [...curr.transactions, {
             id: rolloverTxId,
             type: 'saving_transfer',
             envelopeId: 'free_funds',
             envelopeName: 'Z zamkniętych kopert',
             amount: rolloverAmount,
             description: 'Przeniesienie z zamkniętego miesiąca',
             date: `${curr.id}-01`,
             savingGoalId: goal.id,
             isWithdrawal: false,
           } as any]; // cast to any to bypass strict type if needed, but the structure matches Transaction
        }
      } else {
        curr.transactions = curr.transactions.filter(t => t.id !== rolloverTxId);
      }

      if (i === 0) {
        const hasTx = curr.transactions.some(t =>
          t.type === 'saving_transfer' &&
          (t.savingGoalId === goal.id || (t.envelopeName || '').toLowerCase().trim() === goal.name.toLowerCase().trim())
        );
        const baseVal = hasTx ? Math.max(0, txSum) : goal.current;
        return {
          ...goal,
          current: Math.max(0, baseVal + rolloverAmount),
        };
      } else {
        return {
          ...goal,
          current: Math.max(0, prevValue + rolloverAmount + txSum),
        };
      }
    });

    sorted[i] = {
      ...curr,
      savingGoals: updatedGoals,
    };
  }

  // 3. Dynamiczne rollovery kopert i wolnych środków
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (prev.isClosed) {
      let changed = false;
      
      const updatedEnvelopes = curr.envelopes.map(env => {
        const prevEnv = prev.envelopes.find(e => e.name.toLowerCase().trim() === env.name.toLowerCase().trim());
        if (!prevEnv) return env;

        const leftover = prevEnv.rollover + prevEnv.allocated - prevEnv.spent;
        const rolloverAmount = Math.max(0, leftover);

        const prevTarget = prevEnv.rolloverTarget || 'envelope';
        let targetRollover = rolloverAmount;
        if (rolloverAmount > 0 && prevTarget !== 'envelope') {
          targetRollover = 0;
        }

        if (env.rollover !== targetRollover || env.limit !== prevEnv.limit) {
          changed = true;
          return { ...env, rollover: targetRollover, limit: prevEnv.limit };
        }
        return env;
      });

      // Normalne przenoszenie wolnych środków z poprzedniego miesiąca
      const newFreeFundsRollover = Math.max(0, prev.freeFunds);
      const freeFundsDiff = newFreeFundsRollover - curr.freeFundsRollover;
      
      if (freeFundsDiff !== 0) {
        changed = true;
      }

      // Dodaj brakujące koperty z poprzedniego miesiąca (nowe koperty utworzone w poprzednim)
      const existingNames = updatedEnvelopes.map(e => e.name.toLowerCase().trim());
      const missingEnvelopes = prev.envelopes
        .filter(e => !existingNames.includes(e.name.toLowerCase().trim()))
        .map(e => {
          changed = true;
          const leftover = e.rollover + e.allocated - e.spent;
          const rolloverAmount = Math.max(0, leftover);
          const rTarget = e.rolloverTarget || 'envelope';
          return {
            id: `${e.id}-copied`,
            name: e.name,
            limit: e.limit,
            allocated: 0,
            spent: 0,
            rollover: rTarget === 'envelope' ? rolloverAmount : 0,
            rolloverTarget: rTarget,
            icon: e.icon,
            color: e.color,
            quickSpends: e.quickSpends || [],
          };
        });

      if (changed || missingEnvelopes.length > 0) {
        sorted[i] = {
          ...curr,
          envelopes: [...updatedEnvelopes, ...missingEnvelopes],
          freeFundsRollover: newFreeFundsRollover,
          freeFunds: Math.max(0, curr.freeFunds + freeFundsDiff),
        };
      }
    } else {
      let changed = false;

      const updatedEnvelopes = curr.envelopes.map(env => {
        if (env.rollover > 0) {
          changed = true;
          return { ...env, rollover: 0 };
        }
        return env;
      });

      let updatedFreeFunds = curr.freeFunds;
      let updatedFreeFundsRollover = curr.freeFundsRollover;
      if (curr.freeFundsRollover > 0) {
        changed = true;
        updatedFreeFunds = Math.max(0, curr.freeFunds - curr.freeFundsRollover);
        updatedFreeFundsRollover = 0;
      }

      if (changed) {
        sorted[i] = {
          ...curr,
          envelopes: updatedEnvelopes,
          freeFunds: updatedFreeFunds,
          freeFundsRollover: updatedFreeFundsRollover,
        };
      }
    }
  }

  return sorted;
}

// ---------------------------------------------------------------
// APP COMPONENT
// ---------------------------------------------------------------
export default function App() {
  // ---- AUTH STATE ----
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ---- STATE ----
  const [budgets, setBudgets] = useState<BudgetAccount[]>([]);
  const [activeBudgetId, setActiveBudgetId] = useState<string>('default');
  const [months, setMonths] = useState<BudgetMonth[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    return `${today.getFullYear()}-${m.toString().padStart(2, '0')}`;
  });

  // Modal state
  const [isEditEnvOpen, setIsEditEnvOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
  const [goalToEdit, setGoalToEdit] = useState<SavingGoal | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [envelopeForExpense, setEnvelopeForExpense] = useState<Envelope | null>(null);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isEditTxOpen, setIsEditTxOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [allocateEnvelope, setAllocateEnvelope] = useState<{ envelope: Envelope; initialMode: 'allocate' | 'withdraw' } | null>(null);
  const [transferSourceEnvelope, setTransferSourceEnvelope] = useState<Envelope | null>(null);
  const [transferTargetEnvelope, setTransferTargetEnvelope] = useState<Envelope | null>(null);
  const [actionsEnvelope, setActionsEnvelope] = useState<Envelope | null>(null);
  const [isHistoryEnvOpen, setIsHistoryEnvOpen] = useState(false);
  const [envelopeForHistory, setEnvelopeForHistory] = useState<Envelope | null>(null);
  // Stan przeciągania dotykowego na urządzeniach mobilnych
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchDragPos, setTouchDragPos] = useState<{ x: number; y: number } | null>(null);
  const [activeTouchHoverEnvelopeId, setActiveTouchHoverEnvelopeId] = useState<string | null>(null);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaults: AppSettings = {
      currency: 'PLN',
      showDecimals: false,
      enableRollover: true,
      hideClosedMonths: false,
    };
    try {
      const saved = localStorage.getItem('rosakasa_settings');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });

  const [activeTab, setActiveTab] = useState<'envelopes' | 'savings' | 'stats' | 'transactions'>('envelopes');
  const [timeScope, setTimeScope] = useState<'month' | 'year' | 'all'>('month');



  // Custom dialog
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert' | 'prompt';
    title: string;
    message: string;
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
  } | null>(null);
  const [dialogInputValue, setDialogInputValue] = useState('');

  // ---- HELPERS ----
  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setCustomDialog({
      isOpen: true, type: 'confirm', title, message,
      onConfirm: () => { onConfirm(); setCustomDialog(null); },
      onCancel: () => { if (onCancel) onCancel(); setCustomDialog(null); }
    });
  };
  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setCustomDialog({
      isOpen: true, type: 'alert', title, message,
      onConfirm: () => { if (onConfirm) onConfirm(); setCustomDialog(null); }
    });
  };
  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setDialogInputValue(defaultValue);
    setCustomDialog({
      isOpen: true, type: 'prompt', title, message, defaultValue,
      onConfirm: (val) => { onConfirm(val || ''); setCustomDialog(null); },
      onCancel: () => setCustomDialog(null)
    });
  };

  // ---- CLOUD SYNC HELPER ----
  const syncBudgetsToCloud = (newBudgets: BudgetAccount[]) => {
    setBudgets(newBudgets);
    const currentUser = auth.currentUser;
    if (currentUser) {
      setDoc(doc(db, 'budgets', currentUser.uid), { budgets: newBudgets }, { merge: true });
    }
  };

  // ---- LIFECYCLE ----
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setMonths([]);
      return;
    }

    const budgetRef = doc(db, 'budgets', user.uid);
    const unsubscribeDb = onSnapshot(budgetRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        let loadedBudgets = data.budgets as BudgetAccount[];
        
        loadedBudgets = loadedBudgets.map(budget => {
          const filled = ensureAllMonths(budget.months);
          return { ...budget, months: healRollovers(filled) };
        });

        setBudgets(loadedBudgets);
        
        const savedActive = localStorage.getItem('rosakasa_active_budget');
        const targetBudgetId = savedActive && loadedBudgets.some(b => b.id === savedActive) 
          ? savedActive 
          : loadedBudgets[0].id;
          
        setActiveBudgetId(targetBudgetId);
        const activeBudget = loadedBudgets.find(b => b.id === targetBudgetId) || loadedBudgets[0];
        setMonths(activeBudget.months);
      } else {
        const filled = ensureAllMonths(INITIAL_BUDGET_MONTHS);
        const initialBudget: BudgetAccount = {
          id: 'default',
          name: 'Główny budżet',
          months: healRollovers(filled)
        };
        setBudgets([initialBudget]);
        setActiveBudgetId('default');
        setMonths(initialBudget.months);
        setDoc(budgetRef, { budgets: [initialBudget] });
        localStorage.setItem('rosakasa_active_budget', 'default');
      }
    });

    return () => unsubscribeDb();
  }, [user]);

  const saveToStorage = (updatedMonths: BudgetMonth[]) => {
    const healed = healRollovers(updatedMonths);
    setMonths(healed);
    
    setBudgets(prev => {
      const newBudgets = prev.map(b => b.id === activeBudgetId ? { ...b, months: healed } : b);
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Usuwamy rekursywnie wszystkie wartości undefined, aby Firebase nie zwracał błędów Unsupported field value: undefined
        const cleanBudgets = JSON.parse(JSON.stringify(newBudgets));
        setDoc(doc(db, 'budgets', currentUser.uid), { budgets: cleanBudgets }, { merge: true });
      }
      return newBudgets;
    });
  };

  // ---- COMPUTED MONTHS ----
  // Oblicza available dla każdej koperty oraz propaguje rollover
  const computedMonths = useMemo(() => {
    if (months.length === 0) return [];
    const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
    return sorted.map(m => {
      const updatedEnvelopes = m.envelopes.map(env => {
        const available = env.rollover + env.allocated - env.spent;
        return { ...env, available };
      });
      return { ...m, envelopes: updatedEnvelopes };
    });
  }, [months]);

  const activeMonth = computedMonths.find(m => m.id === selectedMonthId)
    ?? computedMonths[computedMonths.length - 1];


  // filter months based on timeScope
  const scopedMonths = useMemo(() => {
    if (timeScope === 'month') return [activeMonth].filter(Boolean) as BudgetMonth[];
    if (timeScope === 'year') {
      const activeYear = selectedMonthId.split('-')[0];
      return computedMonths.filter(m => m.id.startsWith(activeYear));
    }
    return computedMonths;
  }, [timeScope, activeMonth, computedMonths, selectedMonthId]);

  const scopedTransactions = useMemo(() => {
    return scopedMonths.flatMap(m => m.transactions);
  }, [scopedMonths]);

  const scopedPlannedTransactions = useMemo(() => {
    return scopedMonths.flatMap(m => m.plannedTransactions || []);
  }, [scopedMonths]);

  // Dla PieChart zbieramy unikalne koperty, żeby mieć kolory
  const scopedEnvelopes = useMemo(() => {
    const map = new Map<string, Envelope>();
    scopedMonths.forEach(m => {
      m.envelopes.forEach(e => {
        const key = (e.name || 'Nieznana').toLowerCase().trim();
        if (!map.has(key)) map.set(key, e);
      });
    });
    return Array.from(map.values());
  }, [scopedMonths]);

  if (authLoading) {
    return <div className="bg-slate-950 flex items-center justify-center h-screen text-slate-400">Ładowanie RosaKasa...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!activeMonth) {
    return <div className="bg-slate-950 flex items-center justify-center h-screen text-slate-400">Inicjalizowanie budżetu...</div>;
  }

  // ---- TOUCH DRAG HANDLERS ----
  const handleTouchDragStart = (x: number, y: number) => {
    setTouchDragging(true);
    setTouchDragPos({ x, y });
  };

  const handleTouchDragMove = (x: number, y: number) => {
    if (!touchDragging) return;
    setTouchDragPos({ x, y });

    const element = document.elementFromPoint(x, y);
    const envelopeElement = element?.closest('[data-envelope-id]');
    const envelopeId = envelopeElement?.getAttribute('data-envelope-id');

    if (envelopeId) {
      setActiveTouchHoverEnvelopeId(envelopeId);
    } else {
      setActiveTouchHoverEnvelopeId(null);
    }
  };

  const handleTouchDragEnd = () => {
    if (!touchDragging) return;

    if (activeTouchHoverEnvelopeId) {
      const envelope = activeMonth.envelopes.find(e => e.id === activeTouchHoverEnvelopeId);
      if (envelope) {
        setAllocateEnvelope({ envelope, initialMode: 'allocate' });
      }
    }

    setTouchDragging(false);
    setTouchDragPos(null);
    setActiveTouchHoverEnvelopeId(null);
  };

  // ---- BUDGET HANDLERS ----
  const handleSwitchBudget = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      setActiveBudgetId(budgetId);
      setMonths(budget.months);
      localStorage.setItem('rosakasa_active_budget', budgetId);
    }
  };

  const handleAddBudget = (name: string) => {
    const filled = ensureAllMonths(INITIAL_BUDGET_MONTHS);
    const newBudget: BudgetAccount = {
      id: genId('budget'),
      name,
      months: healRollovers(filled),
    };
    const newBudgets = [...budgets, newBudget];
    syncBudgetsToCloud(newBudgets);
    handleSwitchBudget(newBudget.id);
  };

  const handleRenameBudget = (budgetId: string, newName: string) => {
    const newBudgets = budgets.map(b => b.id === budgetId ? { ...b, name: newName } : b);
    syncBudgetsToCloud(newBudgets);
  };

  const handleDeleteBudget = (budgetId: string) => {
    if (budgets.length <= 1) {
      showAlert('Błąd', 'Nie możesz usunąć ostatniego budżetu.');
      return;
    }
    showConfirm(
      'Usuń budżet',
      'Czy na pewno chcesz usunąć ten budżet? Wszystkie dane, koperty i transakcje przepadną bezpowrotnie!',
      () => {
        const newBudgets = budgets.filter(b => b.id !== budgetId);
        syncBudgetsToCloud(newBudgets);
        if (activeBudgetId === budgetId) {
          handleSwitchBudget(newBudgets[0].id);
        }
      }
    );
  };

  // ---- HANDLERS ----

  /** Resetuje wszystkie dane do stanu fabrycznego */
  const handleResetToSeeds = () => {
    showConfirm(
      'Resetowanie danych',
      'Czy na pewno chcesz zresetować wszystkie dane? Ta operacja jest nieodwracalna.',
      () => {
        const fresh = ensureAllMonths(INITIAL_BUDGET_MONTHS);
        saveToStorage(fresh);
        setSelectedMonthId('2026-06');
        showAlert('Zresetowano', 'Dane zostały wyczyszczone.');
      }
    );
  };

  const handleClearAllData = handleResetToSeeds;

  // ---- ENVELOPE HANDLERS ----

  /** Dodaje lub edytuje kopertę */
  const handleSaveEnvelope = (envData: Omit<Envelope, 'id' | 'spent' | 'rollover' | 'available'> & { id?: string }) => {
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      if (envData.id) {
        // Edycja
        return {
          ...m,
          envelopes: m.envelopes.map(e =>
            e.id === envData.id
              ? { ...e, ...envData, id: e.id }
              : e
          )
        };
      } else {
        // Nowa koperta
        const newEnv: Envelope = {
          id: genId('env'),
          name: envData.name,
          limit: envData.limit,
          allocated: envData.allocated ?? 0,
          spent: 0,
          rollover: 0,
          rolloverTarget: envData.rolloverTarget ?? 'envelope',
          icon: envData.icon,
          color: envData.color,
          quickSpends: envData.quickSpends,
        };
        return { ...m, envelopes: [...m.envelopes, newEnv] };
      }
    });
    saveToStorage(updatedMonths);
  };

  /** Usuwa kopertę i zwraca pozostałe środki do Wolnych Środków */
  const handleReorderEnvelopes = (newOrderIds: string[]) => {
    const orderedNames = newOrderIds.map(id => {
      const env = activeMonth.envelopes.find(e => e.id === id);
      return env ? env.name.toLowerCase().trim() : '';
    }).filter(Boolean);

    const updatedMonths = months.map(m => {
      const newEnvelopes = [...m.envelopes].sort((a, b) => {
        const aName = a.name.toLowerCase().trim();
        const bName = b.name.toLowerCase().trim();
        const aIndex = orderedNames.indexOf(aName);
        const bIndex = orderedNames.indexOf(bName);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      return { ...m, envelopes: newEnvelopes };
    });
    
    saveToStorage(updatedMonths);
  };

  const handleDeleteEnvelope = (envelopeId: string) => {
    const env = activeMonth.envelopes.find(e => e.id === envelopeId);
    if (!env) return;
    const targetName = env.name.toLowerCase().trim();
    const returnAmount = env.rollover + env.allocated - env.spent; // Zwróć pozostałe środki do freeFunds
    showConfirm(
      'Usuń kopertę',
      `Czy na pewno usunąć kopertę "${env.name}" w tym i kolejnych miesiącach? ${returnAmount > 0 ? `Pozostałe środki w kwocie ${formatCurrency(returnAmount)} wrócą do portfela.` : ''}`,
      () => {
        const updatedMonths = months.map(m => {
          if (m.id === selectedMonthId) {
            return {
              ...m,
              envelopes: m.envelopes.filter(e => e.id !== envelopeId),
              freeFunds: m.freeFunds + returnAmount,
            };
          }
          if (m.id > selectedMonthId) {
            const futureEnv = m.envelopes.find(e => e.name.toLowerCase().trim() === targetName);
            if (futureEnv) {
              const futureReturn = futureEnv.rollover + futureEnv.allocated - futureEnv.spent;
              return {
                ...m,
                envelopes: m.envelopes.filter(e => e.name.toLowerCase().trim() !== targetName),
                freeFunds: m.freeFunds + futureReturn,
              };
            }
          }
          return m;
        });
        saveToStorage(updatedMonths);
      }
    );
  };

  /** Archiwizuje kopertę, ukrywając ją w kolejnych miesiącach */
  const handleArchiveEnvelope = (envelopeId: string) => {
    const env = activeMonth.envelopes.find(e => e.id === envelopeId);
    if (!env) return;
    const targetName = env.name.toLowerCase().trim();
    showConfirm(
      'Archiwizuj kopertę',
      `Czy na pewno zarchiwizować kopertę "${env.name}"? Pozostanie ona widoczna w bieżącym miesiącu, ale zniknie z kolejnych. Wszelkie transakcje zostaną zachowane.`,
      () => {
        const updatedMonths = months.map(m => {
          if (m.id > selectedMonthId) {
            return {
              ...m,
              envelopes: m.envelopes.map(e => e.name.toLowerCase().trim() === targetName ? { ...e, isArchived: true } : e)
            };
          }
          return m;
        });
        saveToStorage(updatedMonths);
      }
    );
  };

  /** Rejestruje jeden lub więcej wydatków (podział paragonu) */
  const handleAddExpense = (expenses: { envelopeId: string, amount: number, description: string }[], date: string) => {
    const performAdd = () => {
      const todayStr = date || new Date().toISOString().split('T')[0];
      
      let totalAdded = 0;
      
      const updatedMonths = months.map(m => {
        if (m.id !== selectedMonthId) return m;
        
        let updatedEnvelopes = [...m.envelopes];
        let newTransactions: Transaction[] = [];
        
        expenses.forEach(exp => {
          const env = updatedEnvelopes.find(e => e.id === exp.envelopeId);
          if (!env) return;
          
          totalAdded += exp.amount;
          
          const newTx: Transaction = {
            id: genId('tx'),
            envelopeId: exp.envelopeId,
            envelopeName: env.name,
            amount: exp.amount,
            description: exp.description || 'Wydatek',
            date: todayStr,
            type: 'expense',
          };
          
          newTransactions.push(newTx);
          
          updatedEnvelopes = updatedEnvelopes.map(e =>
            e.id === exp.envelopeId ? { ...e, spent: e.spent + exp.amount } : e
          );
        });
        
        return {
          ...m,
          envelopes: updatedEnvelopes,
          transactions: [...newTransactions, ...m.transactions],
        };
      });
      
      saveToStorage(updatedMonths);
      if (expenses.length === 1) {
        showAlert('Zarejestrowano wydatek', `${formatCurrency(totalAdded)} zostało zapisane.`);
      } else if (expenses.length > 1) {
        showAlert('Zarejestrowano podział', `Rozbito wydatki na łączną kwotę ${formatCurrency(totalAdded)}.`);
      }
    };

    const isPast = computedMonths.find(m => m.id === selectedMonthId)?.isClosed;
    if (isPast) {
      showConfirm(
        'Edycja w przeszłości',
        'Próbujesz dodać wydatek do minionego miesiąca. Wpłynie to na środki przeniesione do kolejnych miesięcy. Czy na pewno chcesz to zrobić?',
        performAdd
      );
    } else {
      performAdd();
    }
  };

  // ---- ALLOCATION HANDLERS ----

  /** Przydziela środki z Wolnych Środków do koperty */
  const handleAllocateToEnvelope = (envelopeId: string, amount: number) => {
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      const env = m.envelopes.find(e => e.id === envelopeId);
      if (!env) return m;
      if (amount > m.freeFunds) {
        showAlert('Brak środków', `Masz tylko ${formatCurrency(m.freeFunds)} w Wolnych Środkach.`);
        return m;
      }
      return {
        ...m,
        freeFunds: m.freeFunds - amount,
        envelopes: m.envelopes.map(e =>
          e.id === envelopeId ? { ...e, allocated: e.allocated + amount } : e
        ),
      };
    });
    saveToStorage(updatedMonths);
  };

  const handleWithdrawFromEnvelope = (envelopeId: string, amount: number) => {
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      const env = m.envelopes.find(e => e.id === envelopeId);
      if (!env) return m;
      const maxWithdraw = env.allocated - env.spent;
      if (amount > maxWithdraw) {
        showAlert('Za dużo', `Możesz wycofać maksymalnie ${formatCurrency(maxWithdraw)} z tej koperty.`);
        return m;
      }
      return {
        ...m,
        freeFunds: m.freeFunds + amount,
        envelopes: m.envelopes.map(e =>
          e.id === envelopeId ? { ...e, allocated: e.allocated - amount } : e
        ),
      };
    });
    saveToStorage(updatedMonths);
  };

  const handleTransferBetweenEnvelopes = (sourceId: string, targetId: string, amount: number) => {
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      const sourceEnv = m.envelopes.find(e => e.id === sourceId);
      const targetEnv = m.envelopes.find(e => e.id === targetId);
      if (!sourceEnv || !targetEnv) return m;
      
      const maxTransfer = sourceEnv.allocated - sourceEnv.spent;
      if (amount > maxTransfer) {
        showAlert('Błąd', `Możesz przenieść maksymalnie ${formatCurrency(maxTransfer)}.`);
        return m;
      }
      
      return {
        ...m,
        envelopes: m.envelopes.map(e => {
          if (e.id === sourceId) return { ...e, allocated: e.allocated - amount };
          if (e.id === targetId) return { ...e, allocated: e.allocated + amount };
          return e;
        }),
      };
    });
    saveToStorage(updatedMonths);
    showAlert('Przeniesiono', `Przelano ${formatCurrency(amount)} z koperty na kopertę.`);
  };

  // ---- PLANNED TRANSACTION HANDLERS ----

  const handleAddPlannedTransaction = (data: {
    type: 'expense' | 'income';
    description: string;
    amount: number;
    date: string;
    envelopeId?: string;
    envelopeName?: string;
    frequency: RecurringFrequency;
  }) => {
    const performAdd = () => {
      const pt: PlannedTransaction = {
        id: genId('pt'),
        isConfirmed: false,
        ...data,
      };
      
      // Usuwamy undefined aby Firestore nie wywalił błędu
      if (pt.envelopeId === undefined) delete pt.envelopeId;
      if (pt.envelopeName === undefined) delete pt.envelopeName;

      let updatedMonths = months.map(m => {
        if (m.id !== selectedMonthId) return m;
        return {
          ...m,
          plannedTransactions: [...(m.plannedTransactions || []), pt],
        };
      });

      // Propagacja cykliczna
      if (pt.frequency && pt.frequency !== 'one_time') {
        if (pt.frequency === 'monthly') {
          updatedMonths = updatedMonths.map(m => {
            if (m.id <= selectedMonthId) return m;
            // Dopasuj kopertę po nazwie w przyszłym miesiącu
            let futureEnvelopeId = pt.envelopeId;
            let futureEnvelopeName = pt.envelopeName;
            if (pt.envelopeId) {
              const origEnv = activeMonth.envelopes.find(e => e.id === pt.envelopeId);
              if (origEnv) {
                const matchEnv = m.envelopes.find(e => e.name.toLowerCase().trim() === origEnv.name.toLowerCase().trim());
                if (matchEnv) { futureEnvelopeId = matchEnv.id; futureEnvelopeName = matchEnv.name; }
              }
            }
            const futurePt: PlannedTransaction = {
              ...pt,
              id: genId('pt'),
              date: getAdjustedDateForMonth(pt.date, m.id),
              isConfirmed: false,
              envelopeId: futureEnvelopeId,
              envelopeName: futureEnvelopeName,
            };
            if (futurePt.envelopeId === undefined) delete futurePt.envelopeId;
            if (futurePt.envelopeName === undefined) delete futurePt.envelopeName;
            return { ...m, plannedTransactions: [...(m.plannedTransactions || []), futurePt] };
          });
        } else if (pt.frequency === 'weekly' || pt.frequency === 'biweekly') {
          generateDatesForFrequency(pt.date, pt.frequency).forEach(fd => {
            updatedMonths = updatedMonths.map(m => {
              if (m.id !== fd.monthId) return m;
              let futureEnvelopeId = pt.envelopeId;
              let futureEnvelopeName = pt.envelopeName;
              if (pt.envelopeId) {
                const origEnv = activeMonth.envelopes.find(e => e.id === pt.envelopeId);
                if (origEnv) {
                  const matchEnv = m.envelopes.find(e => e.name.toLowerCase().trim() === origEnv.name.toLowerCase().trim());
                  if (matchEnv) { futureEnvelopeId = matchEnv.id; futureEnvelopeName = matchEnv.name; }
                }
              }
              const futurePt: PlannedTransaction = {
                ...pt,
                id: genId('pt'),
                date: fd.date,
                isConfirmed: false,
                envelopeId: futureEnvelopeId,
                envelopeName: futureEnvelopeName,
              };
              if (futurePt.envelopeId === undefined) delete futurePt.envelopeId;
              if (futurePt.envelopeName === undefined) delete futurePt.envelopeName;
              return { ...m, plannedTransactions: [...(m.plannedTransactions || []), futurePt] };
            });
          });
        }
      }

      saveToStorage(updatedMonths);
      showAlert(
        pt.type === 'expense' ? 'Zaplanowano wydatek' : 'Zaplanowano wpływ',
        `"${pt.description}" — ${formatCurrency(pt.amount)} dodano do listy planowanych.`
      );
    };

    const isPast = computedMonths.find(m => m.id === selectedMonthId)?.isClosed;
    if (isPast) {
      showConfirm(
        'Edycja w przeszłości',
        'Próbujesz dodać operację planowaną w minionym miesiącu. Może to wpłynąć na statystyki i rozliczenia. Czy na pewno chcesz to zrobić?',
        performAdd
      );
    } else {
      performAdd();
    }
  };

  const handleConfirmPlannedTransaction = (id: string) => {
    const performConfirm = () => {
      const monthContainingPt = computedMonths.find(m => m.plannedTransactions?.some(p => p.id === id));
      if (!monthContainingPt) return;
      const pt = monthContainingPt.plannedTransactions?.find(p => p.id === id)!;

      if (pt.type === 'saving_transfer') {
        if (monthContainingPt.freeFunds < pt.amount) {
          showAlert('Brak środków', `Nie masz wystarczających wolnych środków (${formatCurrency(monthContainingPt.freeFunds)}) aby wykonać zaplanowany przelew na kwotę ${formatCurrency(pt.amount)}.`);
          return;
        }
      }

      const updatedMonths = months.map(m => {
        if (m.id !== monthContainingPt.id) return m;

        let updatedEnvelopes = [...m.envelopes];
        let updatedFreeFunds = m.freeFunds;
        let updatedSavingGoals = [...m.savingGoals];

        let txEnvelopeName = 'Portfel';
        if (pt.type === 'expense') {
          txEnvelopeName = pt.envelopeName || 'Portfel';
        } else if (pt.type === 'saving_transfer') {
          const goal = m.savingGoals.find(g => g.id === pt.savingGoalId);
          txEnvelopeName = goal ? goal.name : 'Cel';
        }

        const newTx: Transaction = {
          id: genId('tx'),
          envelopeId: pt.type === 'expense' ? (pt.envelopeId || 'free_funds') : 'free_funds',
          envelopeName: txEnvelopeName,
          amount: pt.amount,
          description: pt.description,
          date: new Date().toISOString().split('T')[0],
          type: pt.type,
          savingGoalId: pt.savingGoalId,
        };

        if (pt.type === 'expense' && pt.envelopeId) {
          updatedEnvelopes = updatedEnvelopes.map(e =>
            e.id === pt.envelopeId ? { ...e, spent: e.spent + pt.amount } : e
          );
        } else if (pt.type === 'income') {
          updatedFreeFunds += pt.amount;
        } else if (pt.type === 'saving_transfer') {
          updatedFreeFunds -= pt.amount;
          updatedSavingGoals = updatedSavingGoals.map(g =>
            g.id === pt.savingGoalId ? { ...g, current: g.current + pt.amount } : g
          );
        }

        return {
          ...m,
          envelopes: updatedEnvelopes,
          freeFunds: updatedFreeFunds,
          savingGoals: updatedSavingGoals,
          transactions: [newTx, ...m.transactions],
          plannedTransactions: (m.plannedTransactions || []).map(p =>
            p.id === id ? { ...p, isConfirmed: true } : p
          ),
        };
      });
      saveToStorage(updatedMonths);
    };

    const monthContainingPt = computedMonths.find(m => m.plannedTransactions?.some(p => p.id === id));
    if (monthContainingPt?.isClosed) {
      showConfirm(
        'Zamknięty miesiąc',
        'Ten miesiąc jest już zamknięty. Czy na pewno chcesz zatwierdzić planowaną operację w minionym okresie?',
        performConfirm
      );
    } else {
      performConfirm();
    }
  };

  const handleDeletePlannedTransaction = (id: string) => {
    const monthContainingPt = computedMonths.find(m => m.plannedTransactions?.some(p => p.id === id));
    if (!monthContainingPt) return;
    const pt = monthContainingPt.plannedTransactions?.find(p => p.id === id)!;

    const performDelete = (deleteAllFuture: boolean) => {
      const updatedMonths = months.map(m => {
        const isCurrentMonth = m.id === monthContainingPt.id;
        const isFutureMonth = m.id > monthContainingPt.id;
        if (!isCurrentMonth && !(deleteAllFuture && isFutureMonth)) return m;
        const toDelete = isCurrentMonth
          ? (m.plannedTransactions || []).find(p => p.id === id)
          : (m.plannedTransactions || []).find(p =>
              (p.description || '').toLowerCase().trim() === (pt.description || '').toLowerCase().trim() &&
              p.type === pt.type && !p.isConfirmed
            );
        if (!toDelete) return m;
        return {
          ...m,
          plannedTransactions: (m.plannedTransactions || []).filter(p => p.id !== toDelete.id),
        };
      });
      saveToStorage(updatedMonths);
    };

    if (pt.frequency && pt.frequency !== 'one_time') {
      showConfirm(
        'Usuń cyklicznie?',
        `Usunąć "${pt.description}" ze wszystkich przyszłych miesięcy? Anuluj = tylko bieżący.`,
        () => performDelete(true),
        () => performDelete(false)
      );
    } else {
      performDelete(false);
    }
  };

  // ---- SAVING GOAL HANDLERS ----

  const handleSaveSavingGoal = (goalData: Omit<SavingGoal, 'id'> & { id?: string }) => {
    const goalId = goalData.id || genId('goal');
    const targetCurrent = goalData.current ?? 0;

    const currentMonth = months.find(m => m.id === selectedMonthId);
    const existingGoalInCurrent = currentMonth?.savingGoals.find(g => g.id === goalId);
    const oldCurrent = existingGoalInCurrent ? existingGoalInCurrent.current : 0;
    const diff = targetCurrent - oldCurrent;

    const updatedMonths = months.map(m => {
      const exists = m.savingGoals.some(g => g.id === goalId);
      if (exists) {
        return {
          ...m,
          savingGoals: m.savingGoals.map(g => {
            if (g.id !== goalId) return g;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { current: _current, ...restGoalData } = goalData;
            return { ...g, ...restGoalData };
          })
        };
      } else {
        const newGoal: SavingGoal = {
          id: goalId,
          name: goalData.name || '',
          target: goalData.target !== undefined ? goalData.target : null,
          current: m.id === selectedMonthId ? targetCurrent : 0,
          icon: goalData.icon,
          color: goalData.color,
        };
        if (goalData.autoTransferAmount !== undefined) newGoal.autoTransferAmount = goalData.autoTransferAmount;
        if (goalData.autoTransferDay !== undefined) newGoal.autoTransferDay = goalData.autoTransferDay;

        return {
          ...m,
          savingGoals: [...m.savingGoals, newGoal]
        };
      }
    });

    if (diff !== 0) {
      const isNew = !existingGoalInCurrent;
      const desc = isNew ? `Inicjalizacja celu: ${goalData.name}` : `Korekta salda celu: ${goalData.name}`;
      const newTx: Transaction = {
        id: genId(diff < 0 ? 'tx-save-out' : 'tx-save'),
        envelopeId: 'free_funds',
        envelopeName: goalData.name || '',
        amount: Math.abs(diff),
        description: desc,
        date: new Date().toISOString().split('T')[0],
        type: 'saving_transfer',
        savingGoalId: goalId,
        isWithdrawal: diff < 0,
        isSystem: true
      };

      const finalMonths = updatedMonths.map(m => {
        if (m.id !== selectedMonthId) return m;
        return {
          ...m,
          freeFunds: m.freeFunds - diff,
          transactions: [newTx, ...m.transactions]
        };
      });
      saveToStorage(finalMonths);
    } else {
      saveToStorage(updatedMonths);
    }
  };

  const handleDeleteSavingGoal = (goalId: string) => {
    const goal = activeMonth.savingGoals.find(g => g.id === goalId);
    if (!goal) return;
    showConfirm(
      'Usuń cel',
      `Czy na pewno usunąć cel "${goal.name}"? Zgromadzone środki (${formatCurrency(goal.current)}) trafią do portfela.`,
      () => {
        const updatedMonths = months.map(m => {
          const newGoals = m.savingGoals.filter(g => g.id !== goalId);
          const newEnvelopes = m.envelopes.map(e => {
            const isTargetMatch = e.rolloverTarget === goalId || 
                                  (typeof e.rolloverTarget === 'string' && e.rolloverTarget.toLowerCase().trim() === goal.name.toLowerCase().trim());
            return isTargetMatch ? { ...e, rolloverTarget: 'envelope' } : e;
          });
          if (m.id !== selectedMonthId) {
            return {
              ...m,
              savingGoals: newGoals,
              envelopes: newEnvelopes,
              plannedTransactions: (m.plannedTransactions || []).filter(pt => !(pt.type === 'saving_transfer' && pt.savingGoalId === goalId))
            };
          }
          return {
            ...m,
            savingGoals: newGoals,
            envelopes: newEnvelopes,
            freeFunds: m.freeFunds + goal.current,
            plannedTransactions: (m.plannedTransactions || []).filter(pt => !(pt.type === 'saving_transfer' && pt.savingGoalId === goalId))
          };
        });
        saveToStorage(updatedMonths);
      }
    );
  };

  const handleSetAutoTransfer = (goalId: string, amount?: number, day?: number, rolloverEnvelopeIds?: string[]) => {
    const activeGoal = activeMonth.savingGoals.find(g => g.id === goalId);
    if (!activeGoal) return;
    
    const activeMonthNum = parseInt(selectedMonthId.split('-')[1]);
    
    const updatedMonths = months.map(m => {
      const monthNum = parseInt(m.id.split('-')[1]);
      
      const updatedSavingGoals = m.savingGoals.map(g =>
        g.id === goalId ? { ...g, autoTransferAmount: amount, autoTransferDay: day } : g
      );
      
      let updatedPlanned = [...(m.plannedTransactions || [])];
      
      // Remove all unconfirmed saving_transfer planned transactions for this goal
      updatedPlanned = updatedPlanned.filter(
        pt => !(pt.type === 'saving_transfer' && pt.savingGoalId === goalId && !pt.isConfirmed)
      );
      
      if (amount !== undefined && day !== undefined && monthNum >= activeMonthNum) {
        const dateStr = `${m.id}-${day.toString().padStart(2, '0')}`;
        updatedPlanned.push({
          id: genId('pt-saving'),
          type: 'saving_transfer',
          description: `Cel: ${activeGoal.name}`,
          amount: amount,
          date: dateStr,
          savingGoalId: goalId,
          frequency: 'monthly',
          isConfirmed: false
        });
      }
      
      let updatedEnvelopes = [...m.envelopes];
      if (rolloverEnvelopeIds && m.id === selectedMonthId) {
        updatedEnvelopes = updatedEnvelopes.map(e => {
          const shouldBeLinked = rolloverEnvelopeIds.includes(e.id);
          const isLinked = e.rolloverTarget === goalId || (typeof e.rolloverTarget === 'string' && e.rolloverTarget.toLowerCase().trim() === activeGoal.name.toLowerCase().trim());
          if (shouldBeLinked && !isLinked) return { ...e, rolloverTarget: goalId };
          if (!shouldBeLinked && isLinked) return { ...e, rolloverTarget: 'envelope' };
          return e;
        });
      }

      return {
        ...m,
        savingGoals: updatedSavingGoals,
        plannedTransactions: updatedPlanned,
        envelopes: updatedEnvelopes,
      };
    });
    
    saveToStorage(updatedMonths);
    if (amount && rolloverEnvelopeIds && rolloverEnvelopeIds.length > 0) {
      showAlert('Ustawienia zapisane', `Auto-przelew (${formatCurrency(amount)}) oraz przenoszenie nadwyżek aktywne.`);
    } else if (amount) {
      showAlert('Auto-przelew ustawiony', `Kwota ${formatCurrency(amount)} będzie automatycznie przelewana ${day}. dnia każdego miesiąca.`);
    } else if (rolloverEnvelopeIds && rolloverEnvelopeIds.length > 0) {
      showAlert('Przenoszenie nadwyżek aktywne', `Nadwyżki z wybranych kopert zasilą cel.`);
    } else {
      showAlert('Zasilanie wyłączone', `Automatyczne zasilanie dla celu ${activeGoal.name} zostało anulowane.`);
    }
  };

  const handleTransferToSavingGoal = (goalId: string, amount: number) => {
    const goal = activeMonth.savingGoals.find(g => g.id === goalId);
    if (!goal) return;
    if (amount > activeMonth.freeFunds) {
      showAlert('Brak środków', `Masz tylko ${formatCurrency(activeMonth.freeFunds)} w Wolnych Środkach.`);
      return;
    }
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      const newTx: Transaction = {
        id: genId('tx-save'),
        envelopeId: 'free_funds',
        envelopeName: goal.name,
        amount,
        description: `Transfer do celu: ${goal.name}`,
        date: new Date().toISOString().split('T')[0],
        type: 'saving_transfer',
        savingGoalId: goalId,
        isWithdrawal: false,
      };
      return {
        ...m,
        freeFunds: m.freeFunds - amount,
        savingGoals: m.savingGoals.map(g => g.id === goalId ? { ...g, current: g.current + amount } : g),
        transactions: [newTx, ...m.transactions],
      };
    });
    saveToStorage(updatedMonths);
  };

  const handleWithdrawFromSavingGoal = (goalId: string, amount: number) => {
    const goal = activeMonth.savingGoals.find(g => g.id === goalId);
    if (!goal || amount > goal.current) {
      showAlert('Błąd', 'Nie można wycofać więcej niż zgromadzono.');
      return;
    }
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      const newTx: Transaction = {
        id: genId('tx-save-out'),
        envelopeId: 'free_funds',
        envelopeName: goal.name,
        amount,
        description: `Wypłata z celu: ${goal.name}`,
        date: new Date().toISOString().split('T')[0],
        type: 'saving_transfer',
        savingGoalId: goalId,
        isWithdrawal: true,
      };
      return {
        ...m,
        freeFunds: m.freeFunds + amount,
        savingGoals: m.savingGoals.map(g => g.id === goalId ? { ...g, current: g.current - amount } : g),
        transactions: [newTx, ...m.transactions],
      };
    });
    saveToStorage(updatedMonths);
  };

  const handleDistributeInterest = (entries: { goalId: string; amount: number }[]) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedMonths = months.map(m => {
      if (m.id !== selectedMonthId) return m;
      let updatedGoals = [...m.savingGoals];
      const newTransactions: Transaction[] = [];
      for (const entry of entries) {
        const goal = updatedGoals.find(g => g.id === entry.goalId);
        if (!goal || entry.amount <= 0) continue;
        updatedGoals = updatedGoals.map(g =>
          g.id === entry.goalId ? { ...g, current: g.current + entry.amount } : g
        );
        newTransactions.push({
          id: genId('tx-interest'),
          envelopeId: 'free_funds',
          envelopeName: goal.name,
          amount: entry.amount,
          description: `Odsetki: ${goal.name}`,
          date: today,
          type: 'interest',
          savingGoalId: entry.goalId,
          isWithdrawal: false,
        });
      }
      return {
        ...m,
        savingGoals: updatedGoals,
        transactions: [...newTransactions, ...m.transactions],
      };
    });
    saveToStorage(updatedMonths);
    showAlert('Odsetki dodane', `Zysk z konta oszczędnościowego został zaksięgowany dla ${entries.length} ${entries.length === 1 ? 'celu' : 'celów'}.`);
  };

  // ---- TRANSACTION HANDLERS ----

  const handleSaveIncome = (targetId: string, amount: number, description: string) => {
    const performSave = () => {
      // Bezpośredni wpływ do wolnych środków (ręczny, spoza strumieni)
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedMonths = months.map(m => {
        if (m.id !== selectedMonthId) return m;
        const newTx: Transaction = {
          id: genId('tx-income'),
          envelopeId: 'free_funds',
          envelopeName: 'Portfel',
          amount,
          description: description || 'Dodatkowy wpływ',
          date: todayStr,
          type: 'income',
        };
        return {
          ...m,
          freeFunds: m.freeFunds + amount,
          transactions: [newTx, ...m.transactions],
        };
      });
      saveToStorage(updatedMonths);
      showAlert('Dodano wpływ', `${formatCurrency(amount)} trafiło do portfela.`);
    };

    const isPast = computedMonths.find(m => m.id === selectedMonthId)?.isClosed;
    if (isPast) {
      showConfirm(
        'Edycja w przeszłości',
        'Próbujesz dodać wpływ w minionym miesiącu. Wpłynie to na środki w kolejnych miesiącach. Czy na pewno chcesz to zrobić?',
        performSave
      );
    } else {
      performSave();
    }
  };

  const handleEditTransaction = (txId: string, updatedData: Partial<Transaction>) => {
    const monthContainingTx = computedMonths.find(m => m.transactions.some(t => t.id === txId));
    const performEdit = () => {
      const updatedMonths = months.map(m => {
        const original = m.transactions.find(t => t.id === txId);
        if (!original) return m;

        let updatedEnvelopes = [...m.envelopes];
        let updatedFreeFunds = m.freeFunds;
        const diff = (updatedData.amount ?? original.amount) - original.amount;

        if (original.type === 'expense') {
          updatedEnvelopes = updatedEnvelopes.map(e =>
            e.id === original.envelopeId ? { ...e, spent: e.spent + diff } : e
          );
        } else if (original.type === 'income') {
          updatedFreeFunds += diff;
        } else if (original.type === 'saving_transfer') {
          if (original.isWithdrawal) {
            updatedFreeFunds += diff;
          } else {
            updatedFreeFunds -= diff;
          }
        }

        return {
          ...m,
          envelopes: updatedEnvelopes,
          freeFunds: updatedFreeFunds,
          transactions: m.transactions.map(t => t.id === txId ? { ...t, ...updatedData } : t),
        };
      });
      saveToStorage(updatedMonths);
    };

    if (monthContainingTx?.isClosed) {
      showConfirm(
        'Edycja w przeszłości',
        'Próbujesz edytować transakcję w minionym miesiącu. Wpłynie to na środki w kolejnych miesiącach. Czy na pewno chcesz to zrobić?',
        performEdit
      );
    } else {
      performEdit();
    }
  };

  const handleDeleteTransaction = (txId: string) => {
    const monthContainingTx = computedMonths.find(m => m.transactions.some(t => t.id === txId));
    
    showConfirm('Usuń transakcję', 'Czy na pewno usunąć tę transakcję?' + (monthContainingTx?.isClosed ? ' Uwaga: usunięcie transakcji z minionego miesiąca wpłynie na kolejne miesiące.' : ''), () => {
      const updatedMonths = months.map(m => {
        const tx = m.transactions.find(t => t.id === txId);
        if (!tx) return m;

        let updatedEnvelopes = [...m.envelopes];
        let updatedFreeFunds = m.freeFunds;

        if (tx.type === 'expense') {
          updatedEnvelopes = updatedEnvelopes.map(e =>
            e.id === tx.envelopeId ? { ...e, spent: Math.max(0, e.spent - tx.amount) } : e
          );
        } else if (tx.type === 'income') {
          updatedFreeFunds = Math.max(0, updatedFreeFunds - tx.amount);
        } else if (tx.type === 'saving_transfer') {
          if (tx.isWithdrawal) {
            updatedFreeFunds = Math.max(0, updatedFreeFunds - tx.amount);
          } else {
            updatedFreeFunds = updatedFreeFunds + tx.amount;
          }
        }

        return {
          ...m,
          envelopes: updatedEnvelopes,
          freeFunds: updatedFreeFunds,
          transactions: m.transactions.filter(t => t.id !== txId),
        };
      });
      saveToStorage(updatedMonths);
    });
  };

  // ---- SETTINGS ----
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rosakasa_settings', JSON.stringify(newSettings));
  };

  // ---- RENDER HELPERS ----

  const totalIncome = (activeMonth.incomeStreams || [])
    .filter(s => s.isReceived)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalAllocated = activeMonth.envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const totalSpent = activeMonth.envelopes.reduce((sum, e) => sum + e.spent, 0);
  // Łączny stan kopert: available = rollover + allocated - spent (wszystkie aktywne)
  const totalEnvelopeFunds = activeMonth.envelopes
    .filter(e => !e.isArchived)
    .reduce((sum, e) => sum + Math.max(0, (e.available ?? (e.rollover + e.allocated - e.spent))), 0);
  // Łączny stan celów oszczędnościowych
  const totalSavings = activeMonth.savingGoals.reduce((sum, g) => sum + g.current, 0);

  // ---- JSX ----
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      <div className="flex">
        {/* Sidebar desktop */}
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenChangelog={() => setIsChangelogOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={() => signOut(auth)}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:ml-56 pb-24 lg:pb-8">
          <Header
            budgets={budgets}
            activeBudgetId={activeBudgetId}
            onSwitchBudget={handleSwitchBudget}
            onAddBudget={handleAddBudget}
            onRenameBudget={handleRenameBudget}
            onDeleteBudget={handleDeleteBudget}
            months={computedMonths}
            selectedMonthId={selectedMonthId}
            onSelectMonth={setSelectedMonthId}
            onOpenChangelog={() => setIsChangelogOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            showControls={activeTab === 'envelopes'}
          />

          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            <AnimatePresence mode="wait">
              {/* ---- TAB: ENVELOPES ---- */}
              {activeTab === 'envelopes' && (
                <motion.div key="envelopes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <SummaryCards
                      freeFunds={activeMonth.freeFunds}
                      freeFundsRollover={activeMonth.freeFundsRollover || 0}
                      totalAllocated={totalAllocated}
                      totalSpent={totalSpent}
                      totalIncome={totalIncome}
                      totalEnvelopeFunds={totalEnvelopeFunds}
                      totalSavings={totalSavings}
                      envelopes={activeMonth.envelopes.filter(e => !e.isArchived)}
                      onAddIncome={() => setIsAddIncomeOpen(true)}
                      isClosed={activeMonth.isClosed}
                      onTouchDragStart={handleTouchDragStart}
                      onTouchDragMove={handleTouchDragMove}
                      onTouchDragEnd={handleTouchDragEnd}
                      onDropEnvelope={(envelopeId) => {
                        const env = activeMonth.envelopes.find(e => e.id === envelopeId);
                        if (env) setAllocateEnvelope({ envelope: env, initialMode: 'withdraw' });
                      }}
                    />
                    {!activeMonth.isClosed && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsReorderOpen(true)}
                          className="flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-2xl cursor-pointer hover:bg-slate-200 transition-all self-start md:self-auto shadow-sm"
                        >
                          <LucideIcon name="ArrowUpDown" size={14} />
                          Zmień kolejność
                        </button>
                        <button
                          onClick={() => { setEnvelopeToEdit(null); setIsEditEnvOpen(true); }}
                          className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-2xl cursor-pointer hover:bg-slate-700 transition-all self-start md:self-auto shadow-sm"
                        >
                          <LucideIcon name="Plus" size={14} />
                          Nowa koperta
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Baner planowanych transakcji */}
                  <PlannedTransactionsBanner
                    plannedTransactions={activeMonth.plannedTransactions || []}
                    envelopes={activeMonth.envelopes.filter(e => !e.isArchived)}
                    isClosed={activeMonth.isClosed}
                    onConfirm={handleConfirmPlannedTransaction}
                    onDelete={handleDeletePlannedTransaction}
                  />

                  {activeMonth.envelopes.filter(e => !e.isArchived).length === 0 ? (
                    <EmptyEnvelopesPlaceholder
                      isClosed={activeMonth.isClosed}
                      onAdd={() => { setEnvelopeToEdit(null); setIsEditEnvOpen(true); }}
                    />
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-4 md:gap-4">
                      {activeMonth.envelopes.filter(e => !e.isArchived).map(env => (
                        <EnvelopeCard
                          key={env.id}
                          envelope={env}
                          isClosed={activeMonth.isClosed}
                          settings={settings}
                          onClick={(e) => setActionsEnvelope(e)}
                          onDropFreeFunds={(envelope) => setAllocateEnvelope({ envelope, initialMode: 'allocate' })}
                          onDropEnvelope={(sourceId, targetEnvelope) => {
                            const sourceEnv = activeMonth.envelopes.find(e => e.id === sourceId);
                            if (sourceEnv) {
                              setTransferSourceEnvelope(sourceEnv);
                              setTransferTargetEnvelope(targetEnvelope);
                            }
                          }}
                          isTouchHovered={activeTouchHoverEnvelopeId === env.id}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ---- TAB: SAVINGS ---- */}
              {activeTab === 'savings' && (
                <motion.div key="savings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Cele oszczędnościowe</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsInterestModalOpen(true)}
                        className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-emerald-100 transition-all"
                        title="Dodaj odsetki z konta oszczędnościowego"
                        id="btn-open-interest-modal"
                      >
                        <LucideIcon name="TrendingUp" size={13} />
                        Odsetki
                      </button>
                      <button
                        onClick={() => { setGoalToEdit(null); setIsAddGoalOpen(true); }}
                        className="flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-teal-700 transition-all"
                      >
                        <LucideIcon name="Plus" size={14} />
                        Nowy cel
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeMonth.savingGoals.length === 0 ? (
                      <EmptyGoalsPlaceholder
                        isClosed={false}
                        onAdd={() => { setGoalToEdit(null); setIsAddGoalOpen(true); }}
                      />
                    ) : (
                      activeMonth.savingGoals.map(goal => (
                        <SavingGoalCard
                          key={goal.id}
                          goal={goal}
                          isClosed={false}
                          unallocatedFunds={activeMonth.freeFunds}
                          allEnvelopes={activeMonth.envelopes}
                          onEditGoal={(g) => { setGoalToEdit(g); setIsAddGoalOpen(true); }}
                          onDeleteGoal={handleDeleteSavingGoal}
                          onDeposit={handleTransferToSavingGoal}
                          onWithdraw={handleWithdrawFromSavingGoal}
                          onSetAutoTransfer={handleSetAutoTransfer}
                        />
                      ))
                    )}
                  </div>

                </motion.div>
              )}

              {/* ---- TAB: STATS ---- */}
              {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                  <StatsView
                    months={computedMonths}
                    selectedMonthId={selectedMonthId}
                    envelopes={scopedEnvelopes}
                    savingGoals={activeMonth.savingGoals}
                  />
                </motion.div>
              )}

              {/* ---- TAB: TRANSACTIONS ---- */}
              {activeTab === 'transactions' && (
                <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  {/* Time scope selector for Transactions */}
                  <MonthScopeSelector
                    months={computedMonths}
                    selectedMonthId={selectedMonthId}
                    onSelectMonth={setSelectedMonthId}
                    timeScope={timeScope}
                    onSetTimeScope={setTimeScope}
                    isClosed={activeMonth.isClosed}
                  />

                  <TransactionList
                    transactions={scopedTransactions}
                    plannedTransactions={scopedPlannedTransactions}
                    envelopes={scopedEnvelopes}
                    savingGoals={activeMonth.savingGoals}
                    isClosed={activeMonth.isClosed}
                    months={computedMonths}
                    selectedMonthId={selectedMonthId}
                    onSelectMonth={setSelectedMonthId}
                    onDeleteTransaction={handleDeleteTransaction}
                    onEditTransaction={(tx) => { setTransactionToEdit(tx); setIsEditTxOpen(true); }}
                    onConfirmPlanned={handleConfirmPlannedTransaction}
                    onDeletePlanned={handleDeletePlannedTransaction}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile nav */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ---- MODALS ---- */}
      <ReorderEnvelopesModal
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        envelopes={activeMonth.envelopes}
        onSave={handleReorderEnvelopes}
      />

      {isEditEnvOpen && (
        <EditEnvelopeModal
          isOpen={isEditEnvOpen}
          onClose={() => setIsEditEnvOpen(false)}
          onSave={handleSaveEnvelope}
          envelope={envelopeToEdit}
          savingGoals={activeMonth.savingGoals}
          transactions={activeMonth.transactions}
          onDelete={handleDeleteEnvelope}
          onArchive={handleArchiveEnvelope}
          canDelete={envelopeToEdit ? !months.some(m => m.transactions.some(t => t.type === 'expense' && t.envelopeName.toLowerCase().trim() === envelopeToEdit.name.toLowerCase().trim())) : true}
        />
      )}

      {isHistoryEnvOpen && envelopeForHistory && (
        <EnvelopeHistoryModal
          isOpen={isHistoryEnvOpen}
          onClose={() => setIsHistoryEnvOpen(false)}
          envelope={envelopeForHistory}
          transactions={activeMonth.transactions}
        />
      )}

      {isAddGoalOpen && (
        <AddSavingGoalModal
          isOpen={isAddGoalOpen}
          onClose={() => setIsAddGoalOpen(false)}
          onSave={handleSaveSavingGoal}
          goal={goalToEdit}
          onDelete={goalToEdit ? () => { handleDeleteSavingGoal(goalToEdit.id); setIsAddGoalOpen(false); } : undefined}
        />
      )}

      {isAddExpenseOpen && envelopeForExpense && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          onSave={handleAddExpense}
          onSavePlanned={handleAddPlannedTransaction}
          envelope={envelopeForExpense}
          activeMonth={activeMonth}
        />
      )}

      {isAddIncomeOpen && (
        <AddIncomeModal
          isOpen={isAddIncomeOpen}
          onClose={() => setIsAddIncomeOpen(false)}
          onSave={handleSaveIncome}
          onSavePlanned={handleAddPlannedTransaction}
          activeMonth={activeMonth}
        />
      )}


      {isEditTxOpen && transactionToEdit && (
        <EditTransactionModal
          isOpen={isEditTxOpen}
          onClose={() => setIsEditTxOpen(false)}
          transaction={transactionToEdit}
          onSave={handleEditTransaction}
        />
      )}

      {allocateEnvelope && (
        <AllocateModal
          isOpen={!!allocateEnvelope}
          onClose={() => setAllocateEnvelope(null)}
          envelope={allocateEnvelope.envelope}
          freeFunds={activeMonth.freeFunds}
          onAllocate={handleAllocateToEnvelope}
          onWithdraw={handleWithdrawFromEnvelope}
          initialMode={allocateEnvelope.initialMode}
        />
      )}

      {transferSourceEnvelope && transferTargetEnvelope && (
        <TransferModal
          isOpen={true}
          onClose={() => {
            setTransferSourceEnvelope(null);
            setTransferTargetEnvelope(null);
          }}
          sourceEnvelope={transferSourceEnvelope}
          targetEnvelope={transferTargetEnvelope}
          onTransfer={handleTransferBetweenEnvelopes}
        />
      )}

      {actionsEnvelope && (
        <EnvelopeActionsModal
          isOpen={!!actionsEnvelope}
          onClose={() => setActionsEnvelope(null)}
          envelope={actionsEnvelope}
          onAddExpense={(e) => { setEnvelopeForExpense(e); setIsAddExpenseOpen(true); }}
          onAllocate={(e) => setAllocateEnvelope({ envelope: e, initialMode: 'allocate' })}
          onEdit={(e) => { setEnvelopeToEdit(e); setIsEditEnvOpen(true); }}
          onHistory={(e) => { setEnvelopeForHistory(e); setIsHistoryEnvOpen(true); }}
          onDelete={handleDeleteEnvelope}
        />
      )}

      {isChangelogOpen && (
        <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      )}

      <InterestModal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
        onSave={handleDistributeInterest}
        goals={activeMonth.savingGoals}
      />

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
          onResetData={handleResetToSeeds}
          onClearData={handleClearAllData}
        />
      )}



      {/* Custom dialog */}
      <InteractiveDialog
        dialog={customDialog}
        setDialog={setCustomDialog}
        inputValue={dialogInputValue}
        setInputValue={setDialogInputValue}
      />

      {/* Floating touch drag preview for mobile */}
      {touchDragging && touchDragPos && (
        <div
          style={{
            position: 'fixed',
            left: touchDragPos.x,
            top: touchDragPos.y,
            transform: 'translate(-50%, -50%) scale(1.08)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="bg-slate-900 border border-slate-700 text-white rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-2 animate-pulse"
        >
          <div className="p-1 rounded-md bg-white/20">
            <LucideIcon name="Vault" size={12} className="text-white" />
          </div>
          <span className="text-xs font-black">{formatCurrency(activeMonth.freeFunds)}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// SUB-COMPONENTS (inline helpers)
// ---------------------------------------------------------------

interface NavProps {
  activeTab: 'envelopes' | 'savings' | 'stats' | 'transactions';
  setActiveTab: (tab: 'envelopes' | 'savings' | 'stats' | 'transactions') => void;
  onOpenChangelog?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

const TABS = [
  { id: 'envelopes' as const, name: 'Budżet', icon: 'LayoutDashboard' },
  { id: 'savings' as const, name: 'Cele', icon: 'PiggyBank' },
  { id: 'stats' as const, name: 'Wykresy', icon: 'PieChart' },
  { id: 'transactions' as const, name: 'Transakcje', icon: 'History' },
];

function DesktopSidebar({ activeTab, setActiveTab, onOpenChangelog, onOpenSettings, onLogout }: NavProps) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-slate-100 z-30 py-6 px-3">
      <div className="px-3 mb-6 flex justify-center">
        <img src="/logo_cropped.png" alt="RosaKasa" className="w-full max-w-[240px] h-auto object-contain transition-all duration-300" />
      </div>

      <nav className="flex-1 space-y-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LucideIcon name={tab.icon} size={16} />
            {tab.name}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        {onOpenChangelog && (
          <button
            onClick={onOpenChangelog}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-50 transition-all cursor-pointer relative"
          >
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
              <LucideIcon name="History" size={14} />
            </div>
            <span>Co nowego?</span>
            <span className="absolute right-3 top-2 bg-red-500 text-[7px] text-white px-1 py-0.5 rounded-full font-bold animate-pulse">NEW</span>
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-slate-100">
              <LucideIcon name="Settings" size={14} />
            </div>
            Ustawienia
          </button>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:text-rose-600">
              <LucideIcon name="LogOut" size={14} />
            </div>
            Wyloguj się
          </button>
        )}
      </div>
    </aside>
  );
}

function MobileNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: any) => void }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-100 z-40 flex items-center justify-around px-2 py-2 shadow-xl">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
            activeTab === tab.id ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
            <LucideIcon name={tab.icon} size={18} />
          </div>
          <span className="text-[10px] mt-0.5">{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}

function LockedBanner({ isClosed, onReopen }: { isClosed: boolean; onReopen: () => void }) {
  if (!isClosed) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 text-white rounded-2xl px-5 py-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg"
    >
      <div>
        <p className="font-bold text-sm">Ten miesiąc jest zamknięty 🔒</p>
        <p className="text-slate-400 text-xs mt-0.5">Niewydane środki zostały przeliczone i przekazane do kolejnego miesiąca.</p>
      </div>
      <button onClick={onReopen} className="shrink-0 text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
        Otwórz ponownie
      </button>
    </motion.div>
  );
}

function EmptyEnvelopesPlaceholder({ isClosed, onAdd }: { isClosed: boolean; onAdd: () => void }) {
  return (
    <div className="col-span-full text-center py-16 text-slate-400">
      <LucideIcon name="FolderOpen" size={40} className="mx-auto mb-3 opacity-30" />
      <p className="font-bold text-slate-600">Brak kopert wydatków</p>
      <p className="text-sm mt-1">Stwórz swoją pierwszą kopertę, aby zacząć planować budżet.</p>
      {!isClosed && (
        <button onClick={onAdd} className="mt-4 text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-800 transition-all">
          Dodaj pierwszą kopertę
        </button>
      )}
    </div>
  );
}

function EmptyGoalsPlaceholder({ isClosed, onAdd }: { isClosed: boolean; onAdd: () => void }) {
  return (
    <div className="col-span-full text-center py-16 text-slate-400">
      <LucideIcon name="PiggyBank" size={40} className="mx-auto mb-3 opacity-30" />
      <p className="font-bold text-slate-600">Brak celów oszczędzania</p>
      <p className="text-sm mt-1">Dodaj cel (np. wakacje, poduszka bezpieczeństwa).</p>
      {!isClosed && (
        <button onClick={onAdd} className="mt-4 text-xs font-bold text-white bg-teal-600 px-4 py-2 rounded-xl cursor-pointer hover:bg-teal-700 transition-all">
          Stwórz cel
        </button>
      )}
    </div>
  );
}


interface DialogProps {
  dialog: {
    isOpen: boolean;
    type: 'confirm' | 'alert' | 'prompt';
    title: string;
    message: string;
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
  } | null;
  setDialog: (d: any) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
}

function InteractiveDialog({ dialog, setDialog, inputValue, setInputValue }: DialogProps) {
  if (!dialog || !dialog.isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 border border-white/60 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden"
      >
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${dialog.type === 'alert' ? 'bg-rose-500' : dialog.type === 'prompt' ? 'bg-amber-500' : 'bg-sky-500'}`} />
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${dialog.type === 'alert' ? 'bg-rose-50 text-rose-500' : dialog.type === 'prompt' ? 'bg-amber-50 text-amber-500' : 'bg-sky-50 text-sky-500'}`}>
            <LucideIcon name={dialog.type === 'alert' ? 'AlertCircle' : dialog.type === 'prompt' ? 'Calculator' : 'Info'} size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{dialog.title}</p>
            <p className="text-slate-500 text-xs mt-1">{dialog.message}</p>
          </div>
        </div>
        {dialog.type === 'prompt' && (
          <input
            type="number"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="w-full text-center text-sm font-bold font-mono bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:bg-white"
            placeholder="Wprowadź kwotę..."
            autoFocus
          />
        )}
        <div className="flex justify-end gap-3 pt-2">
          {dialog.type !== 'alert' && (
            <button
              onClick={() => { if (dialog.onCancel) dialog.onCancel(); setDialog(null); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-50"
            >
              Anuluj
            </button>
          )}
          <button
            onClick={() => dialog.onConfirm(inputValue)}
            className={`px-5 py-2 rounded-xl text-white text-xs font-bold uppercase transition-all shadow-md cursor-pointer ${
              dialog.type === 'alert' ? 'bg-rose-500' : dialog.type === 'prompt' ? 'bg-amber-500' : 'bg-slate-900'
            }`}
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
}
