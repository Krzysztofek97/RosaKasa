import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetMonth } from '../types';
import LucideIcon from './LucideIcon';

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

interface MonthScopeSelectorProps {
  months: BudgetMonth[];
  selectedMonthId: string;
  onSelectMonth: (id: string) => void;
  timeScope: 'month' | 'year' | 'all';
  onSetTimeScope: (scope: 'month' | 'year' | 'all') => void;
  isClosed: boolean;
}

export default function MonthScopeSelector({
  months,
  selectedMonthId,
  onSelectMonth,
  timeScope,
  onSetTimeScope,
  isClosed
}: MonthScopeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeYear = selectedMonthId ? selectedMonthId.split('-')[0] : '2026';
  const currentYearMonths = months.filter(m => m.id.startsWith(activeYear)).sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="flex justify-center mb-6 px-2 relative z-50">
      <div className="flex items-center bg-white/80 backdrop-blur-sm border border-slate-200/80 p-2 rounded-xl shadow-xs gap-3">
        <span className="text-sm font-bold text-slate-500 hidden sm:inline-block">Szczegóły z:</span>
        
        <div className="relative">
          <select 
            value={timeScope === 'month' ? selectedMonthId : timeScope}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'year' || val === 'all') {
                onSetTimeScope(val as 'year' | 'all');
              } else {
                onSelectMonth(val);
                onSetTimeScope('month');
              }
            }}
            className="appearance-none bg-slate-100 hover:bg-slate-200 text-indigo-700 font-bold border border-slate-200/80 rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors shadow-sm cursor-pointer"
          >
            <option value="year" className="font-bold text-slate-700">Cały rok {activeYear}</option>
            <option value="all" className="font-bold text-slate-700">Od początku</option>
            <optgroup label="Miesiące">
              {currentYearMonths.map(m => (
                <option key={m.id} value={m.id} className="text-slate-700 font-medium">
                  {m.name} {m.isClosed ? '(Zamknięty)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500">
            <LucideIcon name="ChevronDown" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
