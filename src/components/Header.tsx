import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetMonth, BudgetAccount } from '../types';
import LucideIcon from './LucideIcon';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ReadOnlyContext } from '../App';

interface HeaderProps {
  budgets?: BudgetAccount[];
  activeBudgetId?: string;
  onSwitchBudget?: (id: string) => void;
  onAddBudget?: (name: string) => void;
  onRenameBudget?: (id: string, newName: string) => void;
  onDeleteBudget?: (id: string) => void;
  months: BudgetMonth[];
  selectedMonthId: string;
  onSelectMonth: (id: string) => void;
  onOpenChangelog?: () => void;
  onOpenSettings?: () => void;
  hideClosedMonths?: boolean;
  showControls?: boolean;
}

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function Header({
  budgets,
  activeBudgetId,
  onSwitchBudget,
  onAddBudget,
  onRenameBudget,
  onDeleteBudget,
  months,
  selectedMonthId,
  onSelectMonth,
  onOpenChangelog,
  onOpenSettings,
  hideClosedMonths = false,
  showControls = true
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const budgetDropdownRef = useRef<HTMLDivElement>(null);
  const isReadOnly = useContext(ReadOnlyContext);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (budgetDropdownRef.current && !budgetDropdownRef.current.contains(event.target as Node)) {
        setIsBudgetOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeYear = selectedMonthId ? selectedMonthId.split('-')[0] : '2026';
  const currentMonthNum = selectedMonthId ? parseInt(selectedMonthId.split('-')[1]) : 6;

  const activeMonthObj = months.find(m => m.id === selectedMonthId);
  const activeMonthIsClosed = activeMonthObj ? activeMonthObj.isClosed : false;
  const activeMonthExists = !!activeMonthObj;

  // Generate all 12 months for the current year
  const allMonthsOfYear = Array.from({ length: 12 }, (_, i) => {
    const monthNum = (i + 1).toString().padStart(2, '0');
    const id = `${activeYear}-${monthNum}`;
    const name = `${POLISH_MONTHS[i]} ${activeYear}`;
    const existing = months.find(m => m.id === id);
    return {
      id,
      name,
      isClosed: existing?.isClosed || false,
      exists: !!existing
    };
  }).filter(m => !hideClosedMonths || !m.isClosed || m.id === selectedMonthId);

  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-white/80 text-slate-800 sticky top-0 z-40 shadow-xs">
      <div className="w-full max-w-none px-4 md:px-8 xl:px-12 py-2 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
      
      {/* Branding and Budget Selector */}
      <div className="flex items-center gap-2 md:gap-3 justify-between md:justify-start">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex lg:hidden items-center">
            <img src="/logo_simple.png" alt="RosaKasa logo" className="h-14 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-102" />
          </div>
          
          {budgets && budgets.length > 0 && activeBudgetId && (
            <div className="relative ml-2 flex items-center gap-2" ref={budgetDropdownRef}>
              <button
                onClick={() => setIsBudgetOpen(!isBudgetOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                <LucideIcon name="Landmark" size={14} className="text-emerald-600" />
                <span className="max-w-[100px] truncate">
                  {budgets.find(b => b.id === activeBudgetId)?.name || 'Budżet'}
                </span>
                <LucideIcon name="ChevronDown" size={14} className={`text-slate-400 transition-transform ${isBudgetOpen ? 'rotate-180' : ''}`} />
              </button>

              {isReadOnly && (
                <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 shadow-sm shrink-0">
                  <LucideIcon name="Eye" size={10} /> Tryb podglądu
                </span>
              )}

              <AnimatePresence>
                {isBudgetOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2"
                  >
                    <div className="px-3 pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Twoje budżety
                    </div>
                    {budgets.map(b => (
                      <div key={b.id} className="flex items-center justify-between px-2 py-1 mx-1 rounded-lg hover:bg-slate-50 group">
                        <button
                          onClick={() => {
                            if (onSwitchBudget) onSwitchBudget(b.id);
                            setIsBudgetOpen(false);
                          }}
                          className={`flex-1 text-left flex items-center gap-2 px-2 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
                            b.id === activeBudgetId ? 'text-emerald-600' : 'text-slate-700'
                          }`}
                        >
                          {b.name}
                        </button>
                        
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const newName = prompt('Podaj nową nazwę budżetu:', b.name);
                              if (newName && newName.trim() !== '' && onRenameBudget) {
                                onRenameBudget(b.id, newName.trim());
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            title="Zmień nazwę"
                          >
                            <LucideIcon name="Edit2" size={14} />
                          </button>
                          {!isReadOnly && (
                            <>
                              <button
                                onClick={() => {
                                  const newName = prompt('Zmień nazwę budżetu:', b.name);
                                  if (newName && newName.trim() !== '' && onRenameBudget) {
                                    onRenameBudget(b.id, newName.trim());
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                title="Zmień nazwę"
                              >
                                <LucideIcon name="Edit2" size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (onDeleteBudget) onDeleteBudget(b.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                                title="Usuń"
                              >
                                <LucideIcon name="Trash2" size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {!isReadOnly && (
                      <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                        <button
                          onClick={() => {
                            const newName = prompt('Podaj nazwę nowego budżetu (np. "Wyjazd na narty", "Oszczędności Firmowe"):');
                            if (newName && newName.trim() !== '' && onAddBudget) {
                              onAddBudget(newName.trim());
                              setIsBudgetOpen(false);
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LucideIcon name="PlusCircle" size={16} />
                          Utwórz nowy budżet
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {onOpenChangelog && (
            <button
              onClick={onOpenChangelog}
              className="lg:hidden flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 hover:text-amber-900 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-0.5 rounded border border-amber-500/20 transition-all cursor-pointer relative ml-1"
              title="Co nowego w RosaKasa?"
              id="btn-header-changelog"
            >
              <LucideIcon name="History" size={10} className="text-amber-600 animate-spin-slow" />
              <span className="hidden sm:inline">Co nowego?</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-[6px] md:text-[7px] text-white px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-full font-mono scale-75 font-extrabold flex items-center justify-center animate-pulse">
                NEW
              </span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="lg:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold px-2 py-1 md:px-2.5 md:py-1 rounded-lg transition-all cursor-pointer ml-1"
              title="Ustawienia"
              id="btn-header-settings"
            >
              <LucideIcon name="Settings" size={12} className="text-slate-600" />
              <span className="hidden sm:inline">Ustawienia</span>
            </button>
          )}

          <button
            onClick={() => signOut(auth)}
            className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1 md:ml-2"
            title="Wyloguj się"
          >
            <LucideIcon name="LogOut" size={14} />
            <span className="hidden md:inline">Wyloguj</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between md:justify-end gap-1.5 md:gap-3 flex-wrap">
          
          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-white/60 border border-white/80 rounded-xl p-0.5 md:p-1 shadow-2xs backdrop-blur-sm grow sm:grow-0 justify-between">
            <button
              onClick={() => {
                if (currentMonthNum > 1) {
                  const prevNum = (currentMonthNum - 1).toString().padStart(2, '0');
                  onSelectMonth(`${activeYear}-${prevNum}`);
                }
              }}
              disabled={currentMonthNum === 1}
              className="p-1 md:p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/60 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Poprzedni miesiąc"
              id="btn-prev-month"
            >
              <LucideIcon name="ChevronLeft" className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-slate-800 hover:bg-white/60 transition-all cursor-pointer select-none font-sans"
                id="select-active-month-trigger"
              >
                {activeMonthObj && activeMonthObj.isClosed && (
                  <LucideIcon name="Lock" size={13} className="text-slate-500 shrink-0" />
                )}
                <span className="min-w-[130px] md:min-w-[150px] text-center inline-block">
                  {POLISH_MONTHS[currentMonthNum - 1]} {activeYear}
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1.5 max-h-80 overflow-y-auto scrollbar-thin"
                  >
                    {allMonthsOfYear.map(m => {
                      const monthIndex = parseInt(m.id.split('-')[1]) - 1;
                      const name = `${POLISH_MONTHS[monthIndex]} ${activeYear}`;
                      const isSelected = m.id === selectedMonthId;

                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            onSelectMonth(m.id);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-xs md:text-sm font-semibold transition-all cursor-pointer font-sans ${
                            isSelected ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-700'
                          }`}
                        >
                          {m.exists ? (
                            m.isClosed ? (
                              <LucideIcon name="Lock" size={13} className="text-slate-500 shrink-0" />
                            ) : (
                              <div className="w-[13px] h-[13px] shrink-0" /> // Spacer for alignment
                            )
                          ) : (
                            <div className="w-[13px] h-[13px] shrink-0" /> // Spacer for alignment
                          )}
                          <span className="flex-1">{name}</span>
                          {!m.exists && (
                            <span className="text-[9px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                              Utwórz
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                if (currentMonthNum < 12) {
                  const nextNum = (currentMonthNum + 1).toString().padStart(2, '0');
                  onSelectMonth(`${activeYear}-${nextNum}`);
                }
              }}
              disabled={currentMonthNum === 12}
              className="p-1 md:p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/60 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Następny miesiąc"
              id="btn-next-month"
            >
              <LucideIcon name="ChevronRight" className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      </div>
    </header>
  );
}
