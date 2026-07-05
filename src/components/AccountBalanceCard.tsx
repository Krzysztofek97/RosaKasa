import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface AccountBalanceCardProps {
  totalAccountBalance: number;
  freeFunds: number;
  totalEnvelopeFunds: number;
  totalSavings: number;
}

export default function AccountBalanceCard({
  totalAccountBalance,
  freeFunds,
  totalEnvelopeFunds,
  totalSavings,
}: AccountBalanceCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const rows = [
    { label: 'Portfel', value: freeFunds, icon: 'Vault', color: 'text-white/80' },
    { label: 'Koperty', value: totalEnvelopeFunds, icon: 'Mail', color: 'text-amber-300' },
    { label: 'Oszczędności', value: totalSavings, icon: 'PiggyBank', color: 'text-teal-300' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-2.5 px-3.5 text-white shadow-md w-full sm:w-auto min-w-[200px] border border-slate-700"
      style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
    >
      {/* Dekoracja */}
      <div className="absolute -left-4 -top-4 w-14 h-14 bg-violet-500/20 rounded-full pointer-events-none" />
      <div className="absolute -right-2 -bottom-4 w-10 h-10 bg-teal-500/15 rounded-full pointer-events-none" />

      <button
        onClick={() => setShowBreakdown(v => !v)}
        className="relative flex items-center gap-2.5 w-full text-left cursor-pointer group"
        aria-label="Pokaż rozbicie stanu konta"
      >
        <div className="p-1.5 rounded-lg bg-violet-500/30 flex items-center justify-center shrink-0 group-hover:bg-violet-500/40 transition-colors">
          <LucideIcon name="Landmark" size={14} className="text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider leading-none">Stan konta</p>
          <span className="text-lg font-black leading-none">{formatCurrency(totalAccountBalance)}</span>
        </div>
        <motion.div
          animate={{ rotate: showBreakdown ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-white/40 group-hover:text-white/70 transition-colors"
        >
          <LucideIcon name="ChevronDown" size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
              {rows.map(row => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <LucideIcon name={row.icon} size={10} className={row.color} />
                    <span className="text-[10px] text-white/50 font-medium">{row.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold tabular-nums ${row.color}`}>
                    {formatCurrency(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
