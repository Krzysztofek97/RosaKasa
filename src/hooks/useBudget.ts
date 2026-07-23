import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  BudgetMonth, Envelope, SavingGoal, Transaction, PlannedTransaction,
  AppSettings, RecurringFrequency, BudgetAccount
} from '../types';
import { INITIAL_BUDGET_MONTHS, createEmptyMonth } from '../data';
import { invalidateCurrencyCache } from '../utils';

const READ_ONLY_USERS: Record<string, string> = {
  'podglad@budzet.pl': 'lW4Fj3p9q2g8aIgyMmL78IayvUv1'
};

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/** Upewnia się że wszystkie 12 miesięcy 2026 istnieje */
function ensureAllMonths(existing: BudgetMonth[]): BudgetMonth[] {
  const map = new Map(existing.map(m => [m.id, m]));
  const today = new Date();
  const currentMonthNum = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  for (let m = 1; m <= 12; m++) {
    const monthId = `2026-${m.toString().padStart(2, '0')}`;
    if (!map.has(monthId)) {
      map.set(monthId, createEmptyMonth(monthId));
    }
    
    const budgetMonthObj = map.get(monthId)!;
    let shouldBeClosed = false;
    if (2026 < currentYear) {
      shouldBeClosed = true;
    } else if (2026 === currentYear && m < currentMonthNum) {
      shouldBeClosed = true;
    }

    if (budgetMonthObj.isClosed !== shouldBeClosed) {
      map.set(monthId, { ...budgetMonthObj, isClosed: shouldBeClosed });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/** Automatycznie leczy rollovery bez bezpośredniej mutacji pętli */
function healRollovers(monthsList: BudgetMonth[]): BudgetMonth[] {
  const sorted = monthsList.map(m => ({ ...m, envelopes: [...m.envelopes], savingGoals: [...m.savingGoals], transactions: [...m.transactions] }))
    .sort((a, b) => a.id.localeCompare(b.id));

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
        if (template.autoTransferAmount !== undefined) updatedGoal.autoTransferAmount = template.autoTransferAmount;
        if (template.autoTransferDay !== undefined) updatedGoal.autoTransferDay = template.autoTransferDay;
        updatedGoals.push(updatedGoal);
      } else {
        const newGoal = { ...template, current: 0 };
        updatedGoals.push(newGoal);
      }
    });
    sorted[i] = { ...m, savingGoals: updatedGoals };
  }

  const getGoalTransactionsSum = (month: BudgetMonth, goalId: string, goalName: string): number => {
    let sum = 0;
    (month.transactions || []).forEach(t => {
      const isSavingTransfer = t.type === 'saving_transfer' && !t.id.startsWith('tx-rollover-');
      const isInterest = t.type === 'interest';
      const isCorrection = t.type === 'goal_correction';
      if (isSavingTransfer || isInterest || isCorrection) {
        const matchesGoal = t.savingGoalId === goalId || (t.envelopeName || '').toLowerCase().trim() === goalName.toLowerCase().trim();
        if (matchesGoal) {
          if (t.isWithdrawal) sum -= t.amount;
          else sum += t.amount;
        }
      }
    });
    return sum;
  };

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    let monthTransactions = [...curr.transactions];

    const updatedGoals = curr.savingGoals.map(goal => {
      const txSum = getGoalTransactionsSum(curr, goal.id, goal.name);

      let prevValue = 0;
      if (i > 0) {
        const prev = sorted[i - 1];
        const prevGoal = prev.savingGoals.find(g => g.id === goal.id);
        prevValue = prevGoal ? prevGoal.current : 0;
      }

      let rolloverAmount = 0;
      if (curr.isClosed) {
        curr.envelopes.forEach(env => {
          const isTargetMatch = env.rolloverTarget === goal.id || 
                                (typeof env.rolloverTarget === 'string' && env.rolloverTarget.toLowerCase().trim() === goal.name.toLowerCase().trim());
          if (isTargetMatch) {
            const leftover = env.rollover + env.allocated - env.spent;
            if (leftover > 0) rolloverAmount += leftover;
          }
        });
      }

      const rolloverTxId = `tx-rollover-${goal.id}-${curr.id}`;
      if (rolloverAmount > 0) {
        const existingTxIdx = monthTransactions.findIndex(t => t.id === rolloverTxId);
        if (existingTxIdx >= 0) {
          monthTransactions[existingTxIdx] = { ...monthTransactions[existingTxIdx], amount: rolloverAmount };
        } else {
          monthTransactions.push({
            id: rolloverTxId,
            type: 'saving_transfer',
            envelopeId: 'free_funds',
            envelopeName: 'Z zamkniętych kopert',
            amount: rolloverAmount,
            description: 'Przeniesienie z zamkniętego miesiąca',
            date: `${curr.id}-01`,
            savingGoalId: goal.id,
            isWithdrawal: false,
          });
        }
      } else {
        monthTransactions = monthTransactions.filter(t => t.id !== rolloverTxId);
      }

      if (i === 0) {
        const hasTx = monthTransactions.some(t =>
          t.type === 'saving_transfer' &&
          (t.savingGoalId === goal.id || (t.envelopeName || '').toLowerCase().trim() === goal.name.toLowerCase().trim())
        );
        const baseVal = hasTx ? Math.max(0, txSum) : goal.current;
        return { ...goal, current: Math.max(0, baseVal + rolloverAmount) };
      } else {
        return { ...goal, current: Math.max(0, prevValue + rolloverAmount + txSum) };
      }
    });

    sorted[i] = {
      ...curr,
      savingGoals: updatedGoals,
      transactions: monthTransactions,
    };
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    let changed = false;

    const updatedEnvelopes = curr.envelopes.map(env => {
      const prevEnv = prev.envelopes.find(e => e.name.toLowerCase().trim() === env.name.toLowerCase().trim());
      if (!prevEnv) return env;

      let targetRollover = 0;
      if (prev.isClosed) {
        const leftover = prevEnv.rollover + prevEnv.allocated - prevEnv.spent;
        const rolloverAmount = Math.max(0, leftover);
        const prevTarget = prevEnv.rolloverTarget || 'envelope';
        targetRollover = (rolloverAmount > 0 && prevTarget === 'envelope') ? rolloverAmount : 0;
      }

      if (env.rollover !== targetRollover || env.limit !== prevEnv.limit) {
        changed = true;
        return { ...env, rollover: targetRollover, limit: prevEnv.limit };
      }
      return env;
    });

    const existingNames = updatedEnvelopes.map(e => e.name.toLowerCase().trim());
    const missingEnvelopes = prev.envelopes
      .filter(e => !existingNames.includes(e.name.toLowerCase().trim()) && !e.isArchived)
      .map(e => {
        changed = true;
        let rolloverAmount = 0;
        if (prev.isClosed) {
          const leftover = e.rollover + e.allocated - e.spent;
          const raw = Math.max(0, leftover);
          const rTarget = e.rolloverTarget || 'envelope';
          rolloverAmount = rTarget === 'envelope' ? raw : 0;
        }
        return {
          id: `${e.id}-copied`,
          name: e.name,
          limit: e.limit,
          allocated: 0,
          spent: 0,
          rollover: rolloverAmount,
          rolloverTarget: e.rolloverTarget,
          icon: e.icon,
          color: e.color,
          quickSpends: e.quickSpends || [],
        };
      });

    let newFreeFundsRollover = curr.freeFundsRollover;
    let freeFundsDiff = 0;
    if (prev.isClosed) {
      newFreeFundsRollover = Math.max(0, prev.freeFunds);
      freeFundsDiff = newFreeFundsRollover - curr.freeFundsRollover;
      if (freeFundsDiff !== 0) changed = true;
    } else if (curr.freeFundsRollover > 0) {
      freeFundsDiff = -curr.freeFundsRollover;
      newFreeFundsRollover = 0;
      changed = true;
    }

    if (changed || missingEnvelopes.length > 0) {
      sorted[i] = {
        ...curr,
        envelopes: [...updatedEnvelopes, ...missingEnvelopes],
        freeFundsRollover: newFreeFundsRollover,
        freeFunds: Math.max(0, curr.freeFunds + freeFundsDiff),
      };
    }
  }

  return sorted;
}

export function useBudget() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isReadOnly = user?.email ? !!READ_ONLY_USERS[user.email.toLowerCase()] : false;

  const [budgets, setBudgets] = useState<BudgetAccount[]>([]);
  const [activeBudgetId, setActiveBudgetId] = useState<string>('default');
  const [months, setMonths] = useState<BudgetMonth[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    return `${today.getFullYear()}-${m.toString().padStart(2, '0')}`;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaults: AppSettings = {
      currency: 'PLN',
      showDecimals: false,
      enableRollover: true,
      hideClosedMonths: false,
      includeSavingsInTotal: true,
      theme: 'light',
    };
    try {
      const saved = localStorage.getItem('rosakasa_settings');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });

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

    const targetUid = user.email && READ_ONLY_USERS[user.email.toLowerCase()] ? READ_ONLY_USERS[user.email.toLowerCase()] : user.uid;
    const budgetRef = doc(db, 'budgets', targetUid);
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
      if (currentUser && !isReadOnly) {
        const cleanBudgets = JSON.parse(JSON.stringify(newBudgets));
        setDoc(doc(db, 'budgets', currentUser.uid), { budgets: cleanBudgets }, { merge: true });
      }
      return newBudgets;
    });
  };

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

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rosakasa_settings', JSON.stringify(newSettings));
    invalidateCurrencyCache();
  };

  return {
    user,
    authLoading,
    isReadOnly,
    budgets,
    activeBudgetId,
    months,
    selectedMonthId,
    setSelectedMonthId,
    settings,
    computedMonths,
    activeMonth,
    saveToStorage,
    updateSettings,
    setActiveBudgetId,
    setMonths,
  };
}
