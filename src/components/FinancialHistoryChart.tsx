import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { BudgetMonth } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface FinancialHistoryChartProps {
  months: BudgetMonth[];
  selectedMonthId: string;
}

export default function FinancialHistoryChart({ months, selectedMonthId }: FinancialHistoryChartProps) {
  // Przetwarzanie danych do wykresu i tabeli
  const chartData = useMemo(() => {
    let filtered = [...months].sort((a, b) => a.id.localeCompare(b.id));
    
    if (selectedMonthId) {
      const year = selectedMonthId.split('-')[0];
      filtered = filtered.filter(m => m.id.startsWith(year) && m.id.localeCompare(selectedMonthId) <= 0);
    }

    let mapped = filtered.map(m => {
      let mInc = 0;
      let mExp = 0;
      (m.transactions || []).forEach(t => {
        if (t.type === 'income') mInc += t.amount;
        if (t.type === 'expense') mExp += t.amount;
      });
      return {
        id: m.id,
        fullName: m.name,
        name: m.name.split(' ')[0],
        income: mInc,
        expense: mExp,
        expenseNeg: -mExp, // Wykorzystane do rysowania wykresu pod osią 0
        balance: mInc - mExp,
        hasActivity: mInc > 0 || mExp > 0
      };
    });

    // Ucinamy wszystkie puste miesiące PRZED pierwszą aktywnością
    const firstActiveIndex = mapped.findIndex(m => m.hasActivity);
    if (firstActiveIndex > 0) {
      mapped = mapped.slice(firstActiveIndex);
    }

    return mapped;
  }, [months, selectedMonthId]);

  // Podsumowanie roczne
  const summary = useMemo(() => {
    return chartData.reduce((acc, curr) => ({
      income: acc.income + curr.income,
      expense: acc.expense + curr.expense,
      balance: acc.balance + curr.balance
    }), { income: 0, expense: 0, balance: 0 });
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden">
      
      {/* NAGŁÓWEK Z PODSUMOWANIEM */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
        
        {/* Tytuł */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Przepływ pieniędzy</h2>
            <p className="text-sm font-bold text-slate-500">
              Podsumowanie roku {selectedMonthId ? selectedMonthId.split('-')[0] : ''}
            </p>
          </div>
        </div>

        {/* Kafelki podsumowujące rocznie */}
        <div className="flex flex-wrap md:flex-nowrap gap-3 md:gap-4">
          <div className="bg-emerald-50/80 border border-emerald-100 p-3 px-5 rounded-2xl flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-emerald-600 mb-1 tracking-wider">Przychód (Rok)</span>
            <span className="text-lg font-black text-emerald-700 font-mono">{formatCurrency(summary.income)}</span>
          </div>
          <div className="bg-rose-50/80 border border-rose-100 p-3 px-5 rounded-2xl flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-rose-600 mb-1 tracking-wider">Wydatek (Rok)</span>
            <span className="text-lg font-black text-rose-700 font-mono">{formatCurrency(summary.expense)}</span>
          </div>
          <div className={`border p-3 px-5 rounded-2xl flex flex-col items-center min-w-[130px] shadow-sm ${summary.balance >= 0 ? 'bg-white border-emerald-200 shadow-emerald-500/10' : 'bg-white border-rose-200 shadow-rose-500/10'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Bilans Roku</span>
            <span className={`text-xl font-black font-mono ${summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.balance > 0 ? '+' : ''}{formatCurrency(summary.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* WYKRES (COMPOSED) */}
      <div className="h-[340px] w-full mb-10 mt-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
              dy={15} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(val) => `${val} zł`}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc', opacity: 0.6 }}
              contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px', fontSize: '14px', textTransform: 'capitalize' }}
              formatter={(value: any, name: string) => {
                if (name === 'Wydatek' || name === 'expenseNeg') return [formatCurrency(Math.abs(Number(value))), 'Wydatek'];
                if (name === 'Przychód' || name === 'income') return [formatCurrency(Number(value)), 'Przychód'];
                if (name === 'Bilans' || name === 'balance') return [formatCurrency(Number(value)), 'Bilans'];
                return [value, name];
              }}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
            
            {/* Słupki stacked w jednym paśmie (na i pod osią zero) */}
            <Bar dataKey="income" name="Przychód" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} stackId="a" />
            <Bar dataKey="expenseNeg" name="Wydatek" fill="#fb7185" radius={[0, 0, 4, 4]} maxBarSize={32} stackId="a" />
            
            {/* Liniowy trend bilansu z "kółkami" na wierzchołkach */}
            <Line 
              type="monotone" 
              dataKey="balance" 
              name="Bilans" 
              stroke="#0f172a" 
              strokeWidth={3} 
              dot={{ stroke: '#0f172a', strokeWidth: 3, fill: '#ffffff', r: 5 }} 
              activeDot={{ r: 8, stroke: '#0f172a', strokeWidth: 2, fill: '#3b82f6' }}
            />
            
            <Legend 
              iconType="circle" 
              iconSize={8} 
              wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }} 
              formatter={(value) => value === 'expenseNeg' ? 'Wydatek' : value}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* TABELA ZESTAWIENIOWA MIESIĘCY */}
      <div className="mt-4 border border-slate-200/60 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm relative z-10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase text-slate-500 font-extrabold bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Miesiąc</th>
                <th className="px-6 py-4 text-right">Przychód</th>
                <th className="px-6 py-4 text-right">Wydatek</th>
                <th className="px-6 py-4 text-right">Bilans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[...chartData].reverse().map((row) => (
                <tr key={row.id} className="hover:bg-white/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-bold">
                    {row.fullName}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-mono">
                    {formatCurrency(row.income)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-mono">
                    {row.expense > 0 ? '-' : ''}{formatCurrency(row.expense)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold">
                    <span className={row.balance > 0 ? 'text-emerald-600' : row.balance < 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {row.balance > 0 ? '+' : ''}{formatCurrency(row.balance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
