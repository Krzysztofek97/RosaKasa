import React, { useContext } from 'react';
import { motion } from 'motion/react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils';
import { getColorConfig } from '../data';
import LucideIcon from './LucideIcon';
import { ReadOnlyContext } from '../App';

interface EnvelopeActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null;
  onAddExpense: (envelope: Envelope) => void;
  onAllocate: (envelope: Envelope) => void;
  onEdit: (envelope: Envelope) => void;
  onHistory: (envelope: Envelope) => void;
  onDelete?: (envelopeId: string) => void;
}

export default function EnvelopeActionsModal({
  isOpen,
  onClose,
  envelope,
  onAddExpense,
  onAllocate,
  onEdit,
  onHistory,
}: EnvelopeActionsModalProps) {
  const isReadOnly = useContext(ReadOnlyContext);

  if (!isOpen || !envelope) return null;

  const colorCfg = getColorConfig(envelope.color);
  const available = envelope.rollover + envelope.allocated - envelope.spent;
  const isOverspent = available < 0;

  return (
    <div
      className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Info */}
        <div className={`${colorCfg.bgLight} p-6 border-b border-white/50 text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer"
          >
            <LucideIcon name="X" size={16} />
          </button>

          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-2xl ${colorCfg.bg} shadow-md mb-3`}>
              <LucideIcon name={envelope.icon} size={24} className="text-white" />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-wide uppercase truncate max-w-full px-4">
              {envelope.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Stan koperty</p>
            <p className={`text-2xl font-black tracking-tight mt-1 ${isOverspent ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(available)}
            </p>
          </div>
        </div>

        {/* Action List */}
        <div className="p-4 space-y-2 bg-white/40">
          {!isReadOnly && (
            <>
              {/* 1. Dodaj wydatek */}
              <button
                onClick={() => {
                  onAddExpense(envelope);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/70 hover:bg-rose-50 border border-white/60 hover:border-rose-100 transition-all duration-200 cursor-pointer group shadow-sm text-left font-sans"
              >
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 group-hover:scale-110 transition-transform">
                  <LucideIcon name="TrendingDown" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Dodaj wydatek</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Zarejestruj nowy koszt z tej koperty</p>
                </div>
                <LucideIcon name="ChevronRight" size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Zasil (Wpływ / Przydział środków) */}
              <button
                onClick={() => {
                  onAllocate(envelope);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/70 hover:bg-emerald-50 border border-white/60 hover:border-emerald-100 transition-all duration-200 cursor-pointer group shadow-sm text-left font-sans"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                  <LucideIcon name="TrendingUp" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Zasil kopertę / Wpływ</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Przydziel lub wycofaj środki z Portfela</p>
                </div>
                <LucideIcon name="ChevronRight" size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Edytuj kopertę */}
              <button
                onClick={() => {
                  onEdit(envelope);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/70 hover:bg-blue-50 border border-white/60 hover:border-blue-100 transition-all duration-200 cursor-pointer group shadow-sm text-left font-sans"
              >
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                  <LucideIcon name="Pencil" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Edytuj kopertę</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Zmień nazwę, ikonę, kolor lub przenoszenie środków</p>
                </div>
                <LucideIcon name="ChevronRight" size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          {/* 4. Historia transakcji */}
          <button
            onClick={() => {
              onHistory(envelope);
              onClose();
            }}
            className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/70 hover:bg-amber-50 border border-white/60 hover:border-amber-100 transition-all duration-200 cursor-pointer group shadow-sm text-left font-sans"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
              <LucideIcon name="History" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">Historia transakcji</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Zobacz listę wydatków i wpływów tej koperty</p>
            </div>
            <LucideIcon name="ChevronRight" size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <LucideIcon name="Pencil" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">Edytuj kopertę</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Zmień nazwę, ikonę, kolor lub przenoszenie środków</p>
            </div>
            <LucideIcon name="ChevronRight" size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Footer/Cancel */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            Anuluj
          </button>
        </div>
      </motion.div>
    </div>
  );
}
