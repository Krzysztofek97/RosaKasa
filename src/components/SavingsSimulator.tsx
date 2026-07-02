import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  PiggyBank, ArrowRight, Sparkles, TrendingUp, HelpCircle, 
  Calendar, Award, Flame, ShieldAlert, Target
} from 'lucide-react';
import { BudgetMonth, SavingGoal } from '../types';
import { formatCurrency } from '../utils';

interface SavingsSimulatorProps {
  activeMonth: BudgetMonth;
}

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function SavingsSimulator({ activeMonth }: SavingsSimulatorProps) {
  const goals = activeMonth.savingGoals || [];

  // Active goal selected for simulation
  const [selectedGoalId, setSelectedGoalId] = useState<string>(() => {
    return goals.length > 0 ? goals[0].id : '';
  });

  // Simulator Parameters
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [initialDeposit, setInitialDeposit] = useState<number>(0);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(6); // in % e.g. 6%

  // Get active goal details
  const activeGoal = useMemo(() => {
    return goals.find(g => g.id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  // If active goal changes, let's keep selectedGoalId updated
  React.useEffect(() => {
    if (goals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  // Compute month names starting from current month
  const getFutureMonthLabel = (offset: number) => {
    // Offset is month index offset from activeMonth.id
    const [startYearStr, startMonthStr] = activeMonth.id.split('-');
    const startYear = parseInt(startYearStr);
    const startMonth = parseInt(startMonthStr); // 1-indexed

    const totalMonths = (startYear * 12 + (startMonth - 1)) + offset;
    const year = Math.floor(totalMonths / 12);
    const monthIndex = totalMonths % 12;

    return `${POLISH_MONTHS[monthIndex]} ${year}`;
  };

  // Run Monthly Simulation
  const simulationData = useMemo(() => {
    if (!activeGoal) return [];

    const target = activeGoal.target;
    const current = activeGoal.current;
    
    let balance = current + initialDeposit;
    let totalInvested = current + initialDeposit;
    let totalInterest = 0;
    const monthlyRate = (annualInterestRate / 100) / 12;

    const dataPoints = [];
    
    // Day 0
    dataPoints.push({
      monthIndex: 0,
      name: getFutureMonthLabel(0),
      capital: Math.round(totalInvested),
      interest: 0,
      total: Math.round(balance),
    });

    // Simulate month by month
    let m = 1;
    const maxMonths = 60; // 5 years max projection

    while (m <= maxMonths) {
      // Calculate interest on starting balance
      const interestEarned = balance * monthlyRate;
      totalInterest += interestEarned;
      
      // Add interest and monthly contribution
      balance = balance + interestEarned + monthlyContribution;
      totalInvested += monthlyContribution;

      dataPoints.push({
        monthIndex: m,
        name: getFutureMonthLabel(m),
        capital: Math.round(totalInvested),
        interest: Math.round(totalInterest),
        total: Math.round(balance),
      });

      // Stop simulating early if we significantly exceed target (e.g. 150% of target)
      if (balance >= target && m >= 12 && balance >= target * 1.3) {
        break;
      }
      m++;
    }

    return dataPoints;
  }, [activeGoal, monthlyContribution, initialDeposit, annualInterestRate]);

  // Compute timeline results
  const simResults = useMemo(() => {
    if (!activeGoal || simulationData.length === 0) return null;

    const target = activeGoal.target;
    const current = activeGoal.current;

    // Find the first month where balance meets or exceeds target
    const targetMetIndex = simulationData.findIndex(dp => dp.total >= target);
    const isAchievable = targetMetIndex !== -1;
    
    // Standard simulation outcome
    const monthsNeeded = isAchievable ? targetMetIndex : 60;
    const finishLabel = isAchievable ? getFutureMonthLabel(targetMetIndex) : 'Poza zakresem 5 lat';
    const totalInterestEarned = isAchievable ? simulationData[targetMetIndex].interest : simulationData[simulationData.length - 1].interest;

    // What-If Scenario 1: Aggressive saving (+20% contribution)
    const runScenario = (contrib: number) => {
      let balance = current + initialDeposit;
      const monthlyRate = (annualInterestRate / 100) / 12;
      let m = 0;
      while (m < 60) {
        if (balance >= target) return m;
        const interest = balance * monthlyRate;
        balance = balance + interest + contrib;
        m++;
      }
      return 60;
    };

    const aggressiveContrib = Math.round(monthlyContribution * 1.25);
    const aggressiveMonths = runScenario(aggressiveContrib);

    const conservativeContrib = Math.round(monthlyContribution * 0.75);
    const conservativeMonths = runScenario(conservativeContrib);

    return {
      monthsNeeded,
      finishLabel,
      totalInterestEarned,
      isAchievable,
      aggressiveMonths,
      aggressiveContrib,
      conservativeMonths,
      conservativeContrib,
    };
  }, [activeGoal, simulationData, monthlyContribution, initialDeposit, annualInterestRate]);

  // Check if no goals are present
  if (goals.length === 0) {
    return (
      <div className="glass-card rounded-[2rem] p-8 text-center border-2 border-dashed border-slate-150" id="savings-simulator-empty">
        <PiggyBank className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="font-display font-bold text-slate-800 text-lg">Symulator Celów Oszczędnościowych</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2">
          Nie zdefiniowałeś jeszcze żadnych celów oszczędnościowych w tym miesiącu. Dodaj cel w sekcji "Skarbonka i Cele", aby uruchomić symulator i prognozę!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2rem] p-6 space-y-6" id="savings-simulator">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} />
            Inteligentny Symulator Celów Oszczędnościowych
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Zobacz, jak Twoje regularne oszczędności i oprocentowanie procentu składanego wpłyną na czas realizacji marzeń.
          </p>
        </div>

        {/* Goal Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans shrink-0">Wybierz cel:</label>
          <select
            value={selectedGoalId}
            onChange={e => setSelectedGoalId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none cursor-pointer"
          >
            {goals.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({Math.round((g.current / g.target) * 100)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeGoal && simResults && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: PARAMETERS & INPUTS (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
              <Target className="w-4 h-4 text-slate-500" />
              Konfiguracja Symulacji
            </h4>

            {/* Current status display */}
            <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Wybrany Cel:</span>
                <span className="font-bold text-slate-800">{activeGoal.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-medium block">Brakująca Kwota:</span>
                <span className="font-mono font-extrabold text-slate-900">
                  {formatCurrency(Math.max(0, activeGoal.target - activeGoal.current))}
                </span>
              </div>
            </div>

            {/* Slider 1: Monthly contribution */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  Miesięczna Wpłata
                </label>
                <span className="text-xs font-extrabold text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded-md">
                  {formatCurrency(monthlyContribution)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="5000"
                step="10"
                value={monthlyContribution}
                onChange={e => setMonthlyContribution(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                <span>10 PLN</span>
                <span>2 500 PLN</span>
                <span>5 000 PLN</span>
              </div>
            </div>

            {/* Slider 2: Initial deposit bump */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">
                  Wpłata Jednorazowa (Dodatkowy Bonus)
                </label>
                <span className="text-xs font-extrabold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  {formatCurrency(initialDeposit)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={initialDeposit}
                onChange={e => setInitialDeposit(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                <span>0 PLN</span>
                <span>5 000 PLN</span>
                <span>10 000 PLN</span>
              </div>
            </div>

            {/* Slider 3: Annual Interest rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  Oprocentowanie Lokaty/Konta
                  <span className="text-[10px] font-medium text-slate-400">(Roczne, składane miesięcznie)</span>
                </label>
                <span className="text-xs font-extrabold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-md">
                  {annualInterestRate}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={annualInterestRate}
                onChange={e => setAnnualInterestRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                <span>0% (Skarbonka)</span>
                <span>7.5% (Lokata)</span>
                <span>15% (Agresywne)</span>
              </div>
            </div>

            {/* Summary projection card */}
            <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Wynik Projekcji</span>
              </div>

              {simResults.isAchievable ? (
                <div>
                  <p className="text-xs text-slate-600">
                    Osiągniesz swój cel <strong className="text-slate-800">{activeGoal.name}</strong> za:
                  </p>
                  <h4 className="text-xl md:text-2xl font-display font-extrabold text-amber-700 mt-1">
                    {simResults.monthsNeeded} {simResults.monthsNeeded === 1 ? 'miesiąc' : simResults.monthsNeeded < 5 ? 'miesiące' : 'miesięcy'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Przewidywana data: <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 font-bold">{simResults.finishLabel}</span>
                  </p>
                  {simResults.totalInterestEarned > 0 && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      W tym darmowe odsetki bankowe: <strong className="font-mono">{formatCurrency(simResults.totalInterestEarned)}</strong>!
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Zwiększ oszczędności!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-normal">
                    Przy obecnym tempie oszczędzania ({formatCurrency(monthlyContribution)} / miesięcznie) cel nie zostanie osiągnięty w ciągu najbliższych 5 lat (60 miesięcy).
                  </p>
                  <p className="text-xs text-amber-800 font-bold mt-2">
                    Zwiększ kwotę odkładaną co miesiąc, by przyspieszyć proces!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: CHART & SCENARIOS (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visual Chart */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                Wykres wzrostu oszczędności (Prognoza)
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={simulationData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val} zł`}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <ReferenceLine 
                      y={activeGoal.target} 
                      stroke="#f59e0b" 
                      strokeDasharray="4 4" 
                      label={{ value: 'CEL', fill: '#d97706', fontSize: 9, fontWeight: 'bold', position: 'top' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Łączny kapitał + odsetki" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="capital" 
                      name="Własne wpłaty" 
                      stroke="#94a3b8" 
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      fillOpacity={1} 
                      fill="url(#colorCapital)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* What-If Scenarios */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-400" />
                Porównanie Scenariuszy Oszczędzania
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Slow */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Scenariusz Oszczędny</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      {formatCurrency(simResults.conservativeContrib)} / msc
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-sans">(-25%)</span>
                  </div>
                  <h5 className="text-base font-extrabold text-slate-700 mt-2">
                    {simResults.conservativeMonths === 60 ? 'Ponad 5 lat' : `${simResults.conservativeMonths} miesięcy`}
                  </h5>
                  <p className="text-[9.5px] text-slate-400 leading-normal">
                    Wolniejsza realizacja celu, mniejsze obciążenie Twojego miesięcznego budżetu.
                  </p>
                </div>

                {/* Standard */}
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-1 ring-1 ring-amber-500/5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 font-sans block flex items-center gap-1">
                    Scenariusz Twój <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-amber-800 font-mono">
                      {formatCurrency(monthlyContribution)} / msc
                    </span>
                  </div>
                  <h5 className="text-base font-extrabold text-amber-700 mt-2">
                    {simResults.monthsNeeded === 60 && !simResults.isAchievable ? 'Ponad 5 lat' : `${simResults.monthsNeeded} miesięcy`}
                  </h5>
                  <p className="text-[9.5px] text-slate-500 leading-normal">
                    Obecnie skonfigurowany plan oszczędnościowy z procentem składanym.
                  </p>
                </div>

                {/* Aggressive */}
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 font-sans block flex items-center gap-1">
                    Scenariusz Szybki <Flame className="w-3 h-3 text-emerald-500" />
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-emerald-800 font-mono">
                      {formatCurrency(simResults.aggressiveContrib)} / msc
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 font-sans">(+25%)</span>
                  </div>
                  <h5 className="text-base font-extrabold text-emerald-700 mt-2">
                    {simResults.aggressiveMonths === 60 ? 'Ponad 5 lat' : `${simResults.aggressiveMonths} miesięcy`}
                  </h5>
                  <p className="text-[9.5px] text-emerald-600 leading-normal font-medium">
                    {simResults.isAchievable && simResults.monthsNeeded - simResults.aggressiveMonths > 0 ? (
                      `Osiągniesz cel o ${simResults.monthsNeeded - simResults.aggressiveMonths} msc szybciej!`
                    ) : (
                      'Szybsza kumulacja kapitału na lokacie.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
