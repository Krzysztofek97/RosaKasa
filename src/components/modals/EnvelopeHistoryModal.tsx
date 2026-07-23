import React from 'react';
import { motion } from 'motion/react';
import { Envelope, Transaction } from '../../types';
import { formatCurrency } from '../../utils';
import LucideIcon from '../LucideIcon';

interface EnvelopeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null;
  transactions: Transaction[];
}

export function EnvelopeHistoryModal({ isOpen, onClose, envelope, transactions }: EnvelopeHistoryModalProps) {
  if (!isOpen || !envelope) return null;

  const envTransactions = transactions
    .filter(t => t.envelopeName.toLowerCase().trim() === envelope.name.toLowerCase().trim())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        id="modal-history-envelope"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Historia: {envelope.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Transakcje w bieżącym miesiącu
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-history-env">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {envTransactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 text-slate-400">
               <LucideIcon name="History" size={48} className="mb-4 opacity-20" />
               <p className="text-sm font-medium">Brak transakcji w tym miesiącu.</p>
             </div>
          ) : (
            <div className="flex flex-col gap-2">
              {envTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-white/40 border border-white/50 rounded-xl hover:bg-white/60 transition-colors shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">{t.description}</span>
                    <span className="text-[11px] text-slate-500">{t.date}</span>
                  </div>
                  <span className={`font-bold ${t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            Zamknij
          </button>
        </div>
      </motion.div>
    </div>
  );
}
