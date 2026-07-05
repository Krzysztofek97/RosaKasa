import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Envelope, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface SummaryCardsProps {
  freeFunds: number;
  freeFundsRollover: number;
  totalAllocated: number;
  totalSpent: number;
  totalIncome: number;
  totalSavings: number;
  totalEnvelopeFunds: number;
  envelopes: Envelope[];
  settings?: AppSettings;
  onAddIncome?: () => void;
  isClosed?: boolean;
  onTouchDragStart?: (x: number, y: number) => void;
  onTouchDragMove?: (x: number, y: number) => void;
  onTouchDragEnd?: () => void;
  onDropEnvelope?: (envelopeId: string) => void;
}

export default function SummaryCards({
  freeFunds,
  freeFundsRollover,
  totalSavings,
  totalEnvelopeFunds,
  onAddIncome,
  isClosed = false,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onDropEnvelope,
}: SummaryCardsProps) {
  const totalAccountBalance = freeFunds + totalEnvelopeFunds + totalSavings;
  const [showBreakdown, setShowBreakdown] = useState(false);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef<boolean>(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // --- Drag & Drop (portfel) ---
  const handleDragStart = (e: React.DragEvent) => {
    if (isClosed || freeFunds <= 0) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', 'free-funds');
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (isClosed) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDragEnter = (e: React.DragEvent) => {
    if (isClosed) return;
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    if (isClosed) return;
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('envelope:') && onDropEnvelope) {
      onDropEnvelope(data.replace('envelope:', ''));
    }
  };

  // --- Touch drag (portfel) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isClosed || freeFunds <= 0) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;
    touchTimer.current = setTimeout(() => {
      isDragging.current = true;
      if (onTouchDragStart) onTouchDragStart(touch.clientX, touch.clientY);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 300);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    if (touchTimer.current && !isDragging.current) {
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        clearTimeout(touchTimer.current);
        touchTimer.current = null;
      }
    }
    if (isDragging.current) {
      if (e.cancelable) e.preventDefault();
      if (onTouchDragMove) onTouchDragMove(touch.clientX, touch.clientY);
    }
  };
  const handleTouchEnd = () => {
    if (touchTimer.current) { clearTimeout(touchTimer.current); touchTimer.current = null; }
    touchStartPos.current = null;
    if (isDragging.current) {
      isDragging.current = false;
      if (onTouchDragEnd) onTouchDragEnd();
    }
  };

  const isDraggable = !isClosed && freeFunds > 0;

  const breakdownRows = [
    { label: 'Portfel', value: freeFunds, icon: 'Vault', colorClass: 'text-white/80' },
    { label: 'Koperty', value: totalEnvelopeFunds, icon: 'Mail', colorClass: 'text-amber-300' },
    { label: 'Oszczędności', value: totalSavings, icon: 'PiggyBank', colorClass: 'text-teal-300' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-2xl text-white shadow-md w-full sm:w-auto min-w-[260px] border transition-all duration-300 ${
        isDragOver
          ? 'border-emerald-500 ring-4 ring-emerald-500/25 scale-[1.02] z-30'
          : 'border-slate-700'
      }`}
      style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
    >
      {/* Dekoracje */}
      <div className="absolute -left-4 -top-4 w-16 h-16 bg-violet-500/15 rounded-full pointer-events-none" />
      <div className="absolute -right-3 -bottom-5 w-14 h-14 bg-teal-500/10 rounded-full pointer-events-none" />

      {/* Górna sekcja: Stan konta */}
      <button
        onClick={() => setShowBreakdown(v => !v)}
        className="relative w-full flex items-center gap-2.5 px-3.5 pt-2.5 pb-2 text-left cursor-pointer group"
        aria-label="Rozbicie stanu konta"
      >
        <div className="p-1.5 rounded-lg bg-violet-500/30 flex items-center justify-center shrink-0 group-hover:bg-violet-500/45 transition-colors">
          <LucideIcon name="Landmark" size={14} className="text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider leading-none">Stan konta</p>
          <span className="text-lg font-black leading-none">{formatCurrency(totalAccountBalance)}</span>
        </div>
        <motion.div
          animate={{ rotate: showBreakdown ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-white/30 group-hover:text-white/60 transition-colors"
        >
          <LucideIcon name="ChevronDown" size={12} />
        </motion.div>
      </button>

      {/* Rozbicie */}
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
            <div className="px-3.5 pb-2 space-y-1">
              {breakdownRows.map(row => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <LucideIcon name={row.icon} size={10} className={row.colorClass} />
                    <span className="text-[10px] text-white/45 font-medium">{row.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold tabular-nums ${row.colorClass}`}>
                    {formatCurrency(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separator */}
      <div className="mx-3.5 border-t border-white/10" />

      {/* Dolna sekcja: Portfel */}
      <div className="relative flex items-center justify-between gap-3 px-3.5 py-2.5">
        <div
          draggable={isDraggable}
          onDragStart={handleDragStart}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`flex items-center gap-2.5 select-none transition-all duration-200 ${
            isDraggable
              ? 'cursor-grab active:cursor-grabbing hover:bg-white/5 active:bg-white/10 p-1.5 -m-1.5 rounded-xl border border-dashed border-transparent hover:border-white/10'
              : ''
          }`}
        >
          <div className="p-1.5 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <LucideIcon name="Vault" size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider leading-none">Portfel</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black leading-none">{formatCurrency(freeFunds)}</span>
              {freeFundsRollover > 0 && (
                <span className="text-[9px] text-white/50 font-medium">({formatCurrency(freeFundsRollover)})</span>
              )}
            </div>
          </div>
        </div>

        {onAddIncome && (
          <button
            onClick={onAddIncome}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <LucideIcon name="Plus" size={10} />
            <span>Dodaj wpływ</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
