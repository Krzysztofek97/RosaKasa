import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BudgetMonth, Transaction } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface PieChartSummaryProps {
  months: BudgetMonth[];
  envelopes: { id: string; name: string; color: string; icon: string; }[];
  savingGoals?: { id: string; name: string; color?: string; icon?: string; }[];
  globalSelectedMonthId: string;
}

export default function PieChartSummary({ months, envelopes, savingGoals = [], globalSelectedMonthId }: PieChartSummaryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Stan do wyboru konkretnego miesiąca z historii dla tego widoku (albo całego roku)
  const [localScope, setLocalScope] = useState<string>(globalSelectedMonthId);

  // Kiedy użytkownik zmieni globalny miesiąc na górze aplikacji, nadpisz i zresetuj lokalny scope
  useEffect(() => {
    setLocalScope(globalSelectedMonthId);
    setActiveIndex(null);
  }, [globalSelectedMonthId]);

  // Ustalanie roku
  const year = globalSelectedMonthId ? globalSelectedMonthId.split('-')[0] : '';
  
  // Znajdźmy wszystkie miesiące z tego samego roku
  const currentYearMonths = useMemo(() => {
    return months.filter(m => m.id.startsWith(year)).sort((a, b) => b.id.localeCompare(a.id));
  }, [months, year]);

  // Wybieramy pulę transakcji (dla 1 miesiąca lub dla całego roku)
  const activeTxList = useMemo(() => {
    if (localScope === 'year') {
      return currentYearMonths.flatMap(m => m.transactions || []);
    } else {
      const active = currentYearMonths.find(m => m.id === localScope);
      return active ? active.transactions || [] : [];
    }
  }, [currentYearMonths, localScope]);

  const chartData = useMemo(() => {
    const expenses = activeTxList.filter(t => {
      if (t.isSystem || t.description.startsWith('Inicjalizacja celu') || t.description.startsWith('Korekta salda celu')) return false;
      return t.type === 'expense' || (t.type === 'saving_transfer' && !t.isWithdrawal);
    });
    
    const aggregated = new Map<string, { amount: number; originalName: string; isSavingGroup: boolean }>();
    expenses.forEach(t => {
      let envelopeName = t.envelopeName || 'Nieznana';
      let key = envelopeName.toLowerCase().trim();
      
      if (t.type === 'saving_transfer') {
        envelopeName = 'Oszczędności';
        key = 'oszczędności_grupa';
      }
      
      const current = aggregated.get(key) || { amount: 0, originalName: envelopeName, isSavingGroup: false };
      aggregated.set(key, { amount: current.amount + t.amount, originalName: envelopeName, isSavingGroup: current.isSavingGroup || t.type === 'saving_transfer' });
    });

    const data = Array.from(aggregated.entries()).map(([key, info]) => {
      if (info.isSavingGroup) {
        return {
          name: 'Oszczędności',
          value: info.amount,
          colorClass: 'blue',
          envKey: 'oszczędności_grupa',
          icon: 'PiggyBank',
        };
      }

      const env = envelopes.find(e => e.name.toLowerCase().trim() === key);
      
      return {
        name: env?.name || info.originalName,
        value: info.amount,
        colorClass: env?.color || 'slate',
        envKey: key,
        icon: env?.icon || 'Folder',
      };
    });

    return data
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeTxList, envelopes, savingGoals]);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const selectedData = activeIndex !== null ? chartData[activeIndex] : null;

  const activeTransactions = useMemo(() => {
    if (!selectedData) return [];
    
    if (selectedData.envKey === 'oszczędności_grupa') {
      return activeTxList
        .filter(t => t.type === 'saving_transfer' && !t.isWithdrawal && !t.isSystem && !t.description.startsWith('Inicjalizacja celu') && !t.description.startsWith('Korekta salda celu'))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return activeTxList
      .filter(t => t.type === 'expense' && (t.envelopeName || 'Nieznana').toLowerCase().trim() === selectedData.envKey)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTxList, selectedData]);

  const getHexColor = (colorName: string) => {
    switch (colorName) {
      case 'amber': return '#f59e0b';
      case 'orange': return '#f97316';
      case 'yellow': return '#eab308';
      case 'lime': return '#84cc16';
      case 'green': return '#22c55e';
      case 'emerald': return '#10b981';
      case 'teal': return '#14b8a6';
      case 'cyan': return '#06b6d4';
      case 'sky': return '#0ea5e9';
      case 'blue': return '#3b82f6';
      case 'indigo': return '#6366f1';
      case 'purple': return '#a855f7';
      case 'violet': return '#8b5cf6';
      case 'fuchsia': return '#d946ef';
      case 'pink': return '#ec4899';
      case 'rose': return '#f43f5e';
      case 'stone': return '#78716c';
      case 'zinc': return '#71717a';
      default: return '#64748b';
    }
  };

  const getTailwindBg = (colorName: string) => {
    switch (colorName) {
      case 'amber': return 'bg-amber-500 text-amber-50';
      case 'orange': return 'bg-orange-500 text-orange-50';
      case 'yellow': return 'bg-yellow-400 text-yellow-950';
      case 'lime': return 'bg-lime-500 text-lime-50';
      case 'green': return 'bg-green-500 text-green-50';
      case 'emerald': return 'bg-emerald-500 text-emerald-50';
      case 'teal': return 'bg-teal-500 text-teal-50';
      case 'cyan': return 'bg-cyan-500 text-cyan-50';
      case 'sky': return 'bg-sky-500 text-sky-50';
      case 'blue': return 'bg-blue-500 text-blue-50';
      case 'indigo': return 'bg-indigo-500 text-indigo-50';
      case 'purple': return 'bg-purple-500 text-purple-50';
      case 'violet': return 'bg-violet-500 text-violet-50';
      case 'fuchsia': return 'bg-fuchsia-500 text-fuchsia-50';
      case 'pink': return 'bg-pink-500 text-pink-50';
      case 'rose': return 'bg-rose-500 text-rose-50';
      case 'stone': return 'bg-stone-500 text-stone-50';
      case 'zinc': return 'bg-zinc-500 text-zinc-50';
      default: return 'bg-slate-500 text-slate-50';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-2xl text-xs font-sans relative z-50">
          <p className="font-bold text-slate-100 text-sm mb-2">{data.name}</p>
          <div className="flex flex-col gap-1">
            <p className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Kwota:</span>
              <span className="font-mono text-amber-300 font-extrabold">{formatCurrency(data.value)}</span>
            </p>
            <p className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Udział:</span>
              <span className="font-mono text-teal-300 font-extrabold">{pct}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100 w-full" id="panel-piechart">
      {/* NAGŁÓWEK */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              Struktura wydatków
            </h3>
            <div className="text-sm font-bold text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              Szczegóły z:
              
              {/* Natywny select do wyboru dowolnego miesiąca lub całego roku */}
              <div className="relative">
                <select 
                  value={localScope}
                  onChange={(e) => { setLocalScope(e.target.value); setActiveIndex(null); }}
                  className="appearance-none bg-slate-100 hover:bg-slate-200 text-indigo-700 font-bold border border-slate-200/80 rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors shadow-sm cursor-pointer"
                >
                  <option value="year" className="font-bold text-slate-700">Cały rok {year}</option>
                  {currentYearMonths.map(m => (
                    <option key={m.id} value={m.id} className="text-slate-700 font-medium">
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
                  <LucideIcon name="ChevronDown" size={14} />
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl text-center self-start shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Suma wydatków ({localScope === 'year' ? 'Rok' : 'Miesiąc'})</div>
          <div className="text-xl font-black text-slate-800 font-mono leading-none mt-1.5">
            {formatCurrency(totalValue)}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
            <LucideIcon name="PieChart" size={32} />
          </div>
          <h4 className="text-lg font-bold text-slate-700">
            Brak zarejestrowanych wydatków
          </h4>
          <p className="text-sm text-slate-500 max-w-sm mt-2 font-medium">
            W tym zakresie czasu nie odnotowano jeszcze żadnych wydatków z Twoich kopert.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* LEWA KOLUMNA: POTĘŻNY WYKRES KOŁOWY */}
          <div className="h-[350px] md:h-[420px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={140}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(_, index) => setActiveIndex(prev => prev === index ? null : index)}
                  className="cursor-pointer focus:outline-none"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => {
                    const isSelected = activeIndex === index;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getHexColor(entry.colorClass)} 
                        stroke={isSelected ? '#0f172a' : '#ffffff'}
                        strokeWidth={isSelected ? 4 : 2}
                        opacity={activeIndex === null || isSelected ? 1 : 0.3}
                        className="transition-all duration-300 ease-out"
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="select-none pointer-events-none">
                  <tspan x="50%" dy="-10" className="text-[11px] font-bold uppercase fill-slate-400">Suma</tspan>
                  <tspan x="50%" dy="22" className="text-2xl font-black fill-slate-800 font-mono">
                    {formatCurrency(totalValue)}
                  </tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* PRAWA KOLUMNA: PROGRESYWNA LISTA KATEGORII */}
          <div className="flex flex-col gap-3 p-2 lg:max-h-[420px] overflow-y-auto custom-scrollbar -mx-2">
            {chartData.map((item, index) => {
              const isSelected = activeIndex === index;
              const pctRaw = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              const pct = pctRaw.toFixed(1);
              
              return (
                <button
                  key={item.envKey}
                  onClick={() => setActiveIndex(isSelected ? null : index)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group ${
                    isSelected 
                      ? 'bg-slate-50 border-slate-300 shadow-md scale-[1.02] ring-2 ring-slate-200 z-10' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 hover:shadow-sm'
                  } ${activeIndex !== null && !isSelected ? 'opacity-50 grayscale-[30%]' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className={`p-2.5 rounded-xl shadow-sm ${getTailwindBg(item.colorClass)}`}>
                      <LucideIcon name={item.icon} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate pr-2 text-sm md:text-base">
                        {item.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-800 font-mono text-sm md:text-base">
                        {formatCurrency(item.value)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400">
                        {pct}% udziału
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pctRaw}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ backgroundColor: getHexColor(item.colorClass) }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DOLNY PANEL: SZCZEGÓŁY TRANSAKCJI DLA WYBRANEJ KATEGORII */}
      <AnimatePresence>
        {selectedData && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
            className="mt-8 pt-8 border-t border-slate-200/60"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getHexColor(selectedData.colorClass) }} />
                Transakcje z: {selectedData.name}
              </h4>
              <button 
                onClick={() => setActiveIndex(null)}
                className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
              >
                Zamknij detale
              </button>
            </div>
            
            <div className="bg-slate-50/50 rounded-2xl p-2 md:p-4 border border-slate-100">
              {activeTransactions.length === 0 ? (
                <div className="py-6 text-center text-sm font-bold text-slate-400">
                  Brak przypisanych transakcji (kwota zaimportowana manualnie lub jest wynikiem oszczędności)
                </div>
              ) : (
                <ul className="divide-y divide-slate-100/60">
                  {activeTransactions.map(t => (
                    <li key={t.id} className="py-3 px-2 flex justify-between items-center hover:bg-white/60 transition-colors rounded-xl">
                      <div className="pr-4 min-w-0">
                        <div className="font-bold text-slate-700 text-sm truncate">
                          {t.description || 'Wydatek bez nazwy'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {new Date(t.date).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                      <div className="font-black font-mono text-rose-600 text-sm md:text-base whitespace-nowrap">
                        -{formatCurrency(t.amount)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
