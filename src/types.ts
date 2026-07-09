export interface Envelope {
  id: string;
  name: string;
  limit: number;          // Plan wydatków (ile chcę wydać w danym miesiącu)
  allocated: number;      // Faktycznie przydzielone z Wolnych Środków
  spent: number;          // Suma wydatków zarejestrowanych w kopercie
  rollover: number;       // Przeniesienie z poprzedniego miesiąca
  rolloverTarget: 'envelope' | string; // 'envelope' = zostaje w kopercie, string = ID celu oszczędnościowego
  icon: string;           // Lucide icon name
  color: string;          // Tailwind color category (e.g. 'rose', 'emerald')
  quickSpends: number[];  // Szybkie kwoty wydatku
  isArchived?: boolean;   // Czy koperta jest zarchiwizowana (nie pokazujemy w nowych miesiącach)
  // Computed (obliczane w useMemo, nie zapisywane):
  available?: number;     // rollover + allocated - spent
}

export type SavingGoalStorageType = 'shared_account' | 'own_account' | 'cash' | 'other';

export interface SavingGoal {
  id: string;
  name: string;
  target: number | null;  // Cel kwotowy (null = brak celu)
  current: number;        // Aktualne oszczędności
  icon?: string;
  color?: string;
  autoTransferAmount?: number;
  autoTransferDay?: number; // 1-31
  storageType?: SavingGoalStorageType; // Gdzie fizycznie trzymane są środki
  storageNote?: string;                // Opcjonalny opis (np. "PKO BP Misja Oszczędzanie")
}

export interface Transaction {
  id: string;
  envelopeId: string | 'free_funds';  // ID koperty lub 'free_funds' dla wolnych środków
  envelopeName: string;               // Nazwa koperty (dla historii)
  amount: number;
  description: string;
  date: string;           // format YYYY-MM-DD
  type: 'expense' | 'income' | 'saving_transfer' | 'rollover' | 'interest' | 'goal_correction';
  savingGoalId?: string;              // Powiązany cel oszczędnościowy
  isWithdrawal?: boolean;             // Czy wypłata z celu
  isSystem?: boolean;                 // Czy transakcja wygenerowana automatycznie (np. inicjalizacja)
}

export type RecurringFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/** Planowana transakcja — wydatek lub wpływ zaplanowany na przyszłość */
export interface PlannedTransaction {
  id: string;
  type: 'expense' | 'income' | 'saving_transfer';
  description: string;         // np. "Czynsz", "Pensja", "Przelew na cel"
  amount: number;
  date: string;                // YYYY-MM-DD — planowana data realizacji
  envelopeId?: string;         // Tylko dla wydatków — powiązana koperta
  envelopeName?: string;       // Nazwa koperty (dla wyświetlania)
  savingGoalId?: string;       // Tylko dla saving_transfer
  frequency: RecurringFrequency;
  isConfirmed: boolean;        // Czy użytkownik potwierdził wykonanie
}

export interface BudgetMonth {
  id: string;             // e.g. "2026-06"
  name: string;           // e.g. "Czerwiec 2026"
  freeFunds: number;      // Wolne środki — pieniądze dostępne do przydzielenia
  freeFundsRollover: number; // Wolne środki przeniesione z poprzedniego miesiąca
  envelopes: Envelope[];
  savingGoals: SavingGoal[];
  transactions: Transaction[];
  isClosed: boolean;
  plannedTransactions: PlannedTransaction[];
}

export interface AppSettings {
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP';
  showDecimals: boolean;
  enableRollover: boolean;
  hideClosedMonths: boolean;
  includeSavingsInTotal?: boolean;
}

export interface BudgetAccount {
  id: string;
  name: string;
  months: BudgetMonth[];
}
