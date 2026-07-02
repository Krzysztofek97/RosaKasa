import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlannedTransaction, Envelope } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface PlannedTransactionsBannerProps {
  plannedTransactions: PlannedTransaction[];
  envelopes: Envelope[];
  isClosed: boolean;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PlannedTransactionsBanner({
  plannedTransactions,
  envelopes,
  isClosed,
  onConfirm,
  onDelete,
}: PlannedTransactionsBannerProps) {
  const today = new Date().toISOString().split('T')[0];

  // Pokaż tylko niezatwierdzone na dziś (lub przeterminowane)
  const todayItems = plannedTransactions.filter(
    (pt) => !pt.isConfirmed && pt.date <= today
  );

  if (todayItems.length === 0) return null;

  const overdue = todayItems.filter((pt) => pt.date < today);
  const dueToday = todayItems.filter((pt) => pt.date === today);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="rounded-2xl overflow-hidden shadow-md border border-amber-200/60"
        id="planned-transactions-banner"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white/20">
            <LucideIcon name="Bell" size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-xs">
              {overdue.length > 0
                ? `Masz ${todayItems.length} planowanych operacji do potwierdzenia`
                : `${dueToday.length} operacja zaplanowana na dzisiaj`}
            </p>
            <p className="text-white/70 text-[10px]">
              Potwierdź wykonanie lub usuń, jeśli nie jest już aktualna.
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-amber-50/80 divide-y divide-amber-100/60">
          {todayItems.map((pt) => {
            const envelope = pt.envelopeId
              ? envelopes.find((e) => e.id === pt.envelopeId)
              : null;
            const isOverdue = pt.date < today;

            return (
              <div
                key={pt.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
                id={`banner-planned-${pt.id}`}
              >
                {/* Icon + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      pt.type === 'expense'
                        ? 'bg-rose-100 text-rose-600'
                        : pt.type === 'income'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    <LucideIcon
                      name={pt.type === 'expense' ? 'ArrowDownRight' : pt.type === 'income' ? 'ArrowUpRight' : 'PiggyBank'}
                      size={14}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {pt.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                      {envelope && (
                        <>
                          <span className="font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                            {envelope.name}
                          </span>
                          <span className="text-slate-300">•</span>
                        </>
                      )}
                      <span
                        className={`flex items-center gap-0.5 font-semibold ${
                          isOverdue ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      >
                        <LucideIcon name="Calendar" size={10} />
                        {isOverdue ? `Przeterminowane (${pt.date})` : 'Dziś'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono font-extrabold text-sm ${
                      pt.type === 'expense' ? 'text-rose-600' : pt.type === 'income' ? 'text-emerald-600' : 'text-indigo-600'
                    }`}
                  >
                    {pt.type === 'expense' ? '-' : pt.type === 'income' ? '+' : '-'}
                    {formatCurrency(pt.amount)}
                  </span>

                  {!isClosed && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onConfirm(pt.id)}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                        title="Potwierdź wykonanie"
                        id={`btn-confirm-planned-${pt.id}`}
                      >
                        <LucideIcon name="CheckCircle2" size={11} />
                        Potwierdź
                      </button>
                      <button
                        onClick={() => onDelete(pt.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Usuń planowaną operację"
                        id={`btn-dismiss-planned-${pt.id}`}
                      >
                        <LucideIcon name="X" size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
