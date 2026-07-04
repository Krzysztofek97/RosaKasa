import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetMonth } from '../types';
import PieChartSummary from './PieChartSummary';
import FinancialHistoryChart from './FinancialHistoryChart';
import LucideIcon from './LucideIcon';

interface StatsViewProps {
  months: BudgetMonth[];
  selectedMonthId: string;
  envelopes: { id: string; name: string; color: string; icon: string; }[];
  savingGoals: { id: string; name: string; color?: string; icon?: string; }[];
}

type StatTab = 'flow' | 'structure';

export default function StatsView({ months, selectedMonthId, envelopes, savingGoals }: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<StatTab>('flow');

  return (
    <div className="space-y-6">
      {/* Zakładki */}
      <div className="flex justify-center mb-6 px-2">
        <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'flow' 
                ? 'bg-white text-indigo-600 shadow-sm scale-100' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
            }`}
          >
            <LucideIcon name="Activity" size={18} />
            Przepływ pieniędzy
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'structure' 
                ? 'bg-white text-indigo-600 shadow-sm scale-100' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
            }`}
          >
            <LucideIcon name="PieChart" size={18} />
            Struktura wydatków
          </button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'flow' && (
            <motion.div key="flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <FinancialHistoryChart months={months} selectedMonthId={selectedMonthId} />
            </motion.div>
          )}
          {activeTab === 'structure' && (
            <motion.div key="structure" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <PieChartSummary 
                months={months} 
                envelopes={envelopes} 
                savingGoals={savingGoals}
                globalSelectedMonthId={selectedMonthId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
