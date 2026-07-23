# Zasady Agenta: Projekt RosaKasa

> Plik wygenerowany automatycznie. Obowiązuje od pierwszego promptu po jego utworzeniu.

---

## 🧑‍💻 Zasady współpracy

### 1. Użytkownik nie jest programistą
Wszystkie instrukcje muszą być **jasne, proste i podane krok po kroku**.  
Nie zakładaj wiedzy technicznej. Jeśli coś wymaga działania po stronie użytkownika, opisz to precyzyjnie (np. „Uruchom serwer i wejdź na stronę...").

### 2. Cicha praca w tle
Wszystkie poprawki i zmiany w kodzie wprowadzaj **bezpośrednio do plików w projekcie**. Nie oczekuj, że użytkownik sam naniesie zmiany w kodzie.

### 3. Całkowity zakaz kodu w czacie
**NIGDY** nie umieszczaj w oknie czatu żadnych bloków kodu, wycinków (diffów) ani fragmentów funkcji podczas modyfikowania plików. Czat ma być w 100% wolny od kodu.

### 4. Zwięzłe podsumowanie tekstowe
Szczegóły zmian podawaj jedynie w pliku `walkthrough.md`. Na czacie podawaj jedynie krótką informację (1-2 zdania) o pomyślnym wprowadzeniu zmian.

### 5. Obowiązkowa aktualizacja changelogu po zmianach
Po każdych modyfikacjach lub poprawkach w kodzie **ZAWSZE zaktualizuj changelog w aplikacji** (`ChangelogModal.tsx`). Opisy zmian muszą być napisane w sposób przyjazny i prosty dla użytkowników-laików (bez wyliczy technicznych, np. o refaktoryzacji struktur plików czy modyfikacjach hooków). Mniejsze poprawki należy opisywać w sposób ogólny i zwięzły (np. „Poprawa płynności i stabilności”).

### 6. Nowe komponenty = nowe pliki
Jeśli nowa funkcja wymaga **więcej niż 40 linii kodu**, wydziel ją do nowego, osobnego pliku komponentu w `src/components/`. Nie zaśmiecaj pliku `App.tsx` długim kodem — tylko import i użycie komponentu.

### 7. Język odpowiedzi
Odpowiadaj zawsze **po polsku**, chyba że użytkownik wyraźnie poprosi o inny język.

### 8. Kontrola pamięci czatu
Monitoruj na bieżąco długość naszej rozmowy. Jeśli zauważysz, że historia czatu robi się zbyt długa i zaczyna drastycznie zużywać tokeny kontekstu, masz **OBOWIĄZEK** ostrzec mnie w swojej odpowiedzi i wprost napisać:  
> „Nasza rozmowa jest już bardzo długa. Otwórzmy nowe okno czatu, żeby oszczędzać tokeny."

### 9. Zakaz nagrywania wideo, używania przeglądarki i testów UI
NIGDY nie uruchamiaj przeglądarki, nie nagrywaj wideo, ani nie rób testów UI bez wyraźnego polecenia użytkownika. Skup się wyłącznie na bezpośredniej analizie i modyfikacji kodu w celu oszczędzania tokenów oraz limitów.

---

## 🗺️ Mapa architektury RosaKasa

### Stack technologiczny
| Element | Technologia |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Styling | TailwindCSS v4 (`@tailwindcss/vite`) |
| Animacje | `motion/react` (Framer Motion) |
| Ikony | Lucide (custom wrapper `LucideIcon.tsx`) |
| AI | `@google/genai` (zintegrowany) |
| Persist | `localStorage` (klucz: `rosakasa_budget_data`) |

### Struktura plików
```
RosaKasa/
├── src/
│   ├── App.tsx                  ← Główny plik: state, handlery, routing tabów
│   ├── main.tsx                 ← Punkt wejścia React
│   ├── types.ts                 ← Definicje typów TypeScript
│   ├── data.ts                  ← Dane startowe, ikony, kolory, szablony
│   ├── utils.ts                 ← Funkcje pomocnicze (formatCurrency itp.)
│   ├── index.css                ← Style globalne
│   └── components/
│       ├── Header.tsx           ← Nagłówek: selektor miesiąca, nawigacja
│       ├── SummaryCards.tsx     ← Karty podsumowania (przychód, wydatki, wolne)
│       ├── EnvelopeCard.tsx     ← Pojedyncza karta koperty budżetowej
│       ├── SavingGoalCard.tsx   ← Karta celu oszczędnościowego
│       ├── BillsAndIncome.tsx   ← Zakładka: rachunki + strumienie przychodów
│       ├── PieChartSummary.tsx  ← Wykres kołowy wydatków
│       ├── SavingsTrendChart.tsx← Wykres trendu oszczędności
│       ├── SavingsSimulator.tsx ← Kalkulator/symulator oszczędności
│       ├── TransactionList.tsx  ← Historia transakcji
│       ├── Modals.tsx           ← WSZYSTKIE modale aplikacji
│       └── LucideIcon.tsx       ← Dynamiczny loader ikon Lucide
├── assets/                      ← Zasoby statyczne
├── package.json
├── vite.config.ts
└── agents.md                    ← Ten plik
```

### Typy danych (types.ts)
```typescript
BudgetMonth {
  id: string;               // Format: "2026-06"
  name: string;             // "Czerwiec 2026"
  income: number;           // Suma przychodów miesiąca
  unallocated: number;      // Wolne środki (nieprzypisane do kopert)
  envelopes: Envelope[];
  savingGoals: SavingGoal[];
  transactions: Transaction[];
  isClosed: boolean;
  incomeStreams: IncomeStream[];
  recurringBills: RecurringBill[];
}

Envelope {
  id, name, limit, spent, icon, color, quickSpends,
  allocated?,   // Faktycznie przypisana kwota (może różnić się od limitu)
  rollover?,    // Przeniesienie z poprzedniego miesiąca
  available?    // rollover + allocated - spent
}

SavingGoal { id, name, target, current, autoTransfer }
Transaction { id, envelopeId, envelopeName, amount, description, date, type: 'expense'|'income' }
IncomeStream { id, source, amount, date, isReceived, category }
RecurringBill { id, name, amount, dueDate, isPaid, category }
AppSettings { currency, showDecimals, enableRollover, hideClosedMonths, limitWarnings }
```

### Logika stanu (App.tsx)
- **Stan główny**: tablica `months: BudgetMonth[]` — wszystkie 12 miesięcy 2026
- **`computedMonths`** (useMemo): przelicza `rollover` i `available` dla każdej koperty przechodząc przez miesiące chronologicznie
- **`selectedMonthId`**: aktywny miesiąc (domyślnie `2026-06`)
- **`saveToStorage()`**: zapisuje stan do `localStorage` + aktualizuje React state
- Inicjalizacja: `ensureAllMonthsOf2026Exist()` zapewnia istnienie wszystkich 12 miesięcy
- **Zakładki (activeTab)**: `'envelopes' | 'savings' | 'bills' | 'stats' | 'transactions'`

### Modale (Modals.tsx — ~71KB, najcięższy plik)
| Modal | Funkcja |
|---|---|
| `EditEnvelopeModal` | Tworzenie/edycja koperty |
| `AddSavingGoalModal` | Dodawanie celu oszczędnościowego |
| `AllocationWizardModal` | Rozdzielanie budżetu między koperty |
| `MonthClosureModal` | Zamknięcie miesiąca |
| `AddExpenseModal` | Rejestrowanie wydatku |
| `AddIncomeModal` | Rejestrowanie przychodu |
| `ChangelogModal` | Historia zmian aplikacji |
| `SettingsModal` | Ustawienia aplikacji |

### Przepływ danych
```
localStorage
    ↓ (useEffect on mount)
months[] (raw state)
    ↓ (useMemo: computedMonths)
Rollover calculation → available, rollover per Envelope
    ↓
activeMonth (aktualnie wybrany miesiąc)
    ↓ (props do komponentów)
Header → SummaryCards → EnvelopeCard[] → SavingGoalCard[] → BillsAndIncome → Charts → TransactionList
    ↑ (callbacki: handlery w App.tsx)
Wszystkie zmiany → saveToStorage() → localStorage
```

### Kluczowe zależności
- Rollover kopert: obliczany w `computedMonths` sekwencyjnie (miesiąc po miesiącu), włączany przez `settings.enableRollover`
- Dialog systemowy: własny system dialogów (`showConfirm`, `showAlert`, `showPrompt`) — bez browser `alert()`
- Kolor kopert: zdefiniowany jako string (`'amber'`, `'rose'`...) → lookup w `AVAILABLE_COLORS` z `data.ts`
- Ikony: dynamicznie importowane w `LucideIcon.tsx` przez `lazy()` + `React.Suspense`

---

## ⚠️ Pułapki techniczne (znane problemy)

1. **App.tsx jest ogromny** (~50KB) — nie dodawaj tam nowych bloków logiki; wydzielaj do komponentów
2. **Modals.tsx jest największy** (~71KB) — przy edycji podawaj bardzo precyzyjne frazy-kotwice
3. **Tailwind v4** — konfiguracja przez `@tailwindcss/vite`, NIE przez `tailwind.config.js`
4. **`allocated` vs `limit`**: to NIE jest to samo — `limit` to plan, `allocated` to faktycznie przypisane środki
5. **IDs kopert**: generowane dynamicznie `env-${Date.now()}-${random}` — nie są stabilne między sesjami; grupowanie przez `env.name.toLowerCase().trim()`

---

*Zasady obowiązują od: 2026-06-26*
