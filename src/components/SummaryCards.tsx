import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Envelope, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';

interface SummaryCardsProps {
  freeFunds: number;
  freeFundsRollover: number;
  totalAllocated: number;
  totalSpent: number;
  totalIncome: number;
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
  onAddIncome,
  isClosed = false,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onDropEnvelope,
}: SummaryCardsProps) {
  const label = 'Portfel';
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef<boolean>(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (isClosed || freeFunds <= 0) {
      e.preventDefault();
      return;
    }
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

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isClosed) return;
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('envelope:') && onDropEnvelope) {
      const sourceId = data.replace('envelope:', '');
      onDropEnvelope(sourceId);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isClosed || freeFunds <= 0) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;

    // Detekcja dłuższego przytrzymania (300ms) zapobiegająca dragowaniu przy przewijaniu
    touchTimer.current = setTimeout(() => {
      isDragging.current = true;
      if (onTouchDragStart) {
        onTouchDragStart(touch.clientX, touch.clientY);
      }
      if (navigator.vibrate) {
        navigator.vibrate(40); // Delikatna wibracja na telefonie
      }
    }, 300);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];

    if (touchTimer.current && !isDragging.current) {
      // Jeśli użytkownik przesunął palec za daleko, anulujemy timer (to jest scroll)
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        clearTimeout(touchTimer.current);
        touchTimer.current = null;
      }
    }

    if (isDragging.current) {
      // Zapobiegamy scrollowaniu strony w trakcie aktywnego przeciągania
      if (e.cancelable) {
        e.preventDefault();
      }
      if (onTouchDragMove) {
        onTouchDragMove(touch.clientX, touch.clientY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
    touchStartPos.current = null;
    if (isDragging.current) {
      isDragging.current = false;
      if (onTouchDragEnd) {
        onTouchDragEnd();
      }
    }
  };

  const isDraggable = !isClosed && freeFunds > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-900 rounded-2xl p-2.5 px-3.5 text-white shadow-md relative overflow-hidden flex items-center justify-between gap-3 w-full sm:w-auto min-w-[280px] max-w-sm border transition-all duration-300 ${
        isDragOver ? 'border-emerald-500 ring-4 ring-emerald-500/25 scale-[1.02] z-30' : 'border-slate-800'
      }`}
    >
      {/* Dekoracja */}
      <div className="absolute -right-6 -top-6 w-16 h-16 bg-white/10 rounded-full pointer-events-none" />

      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`relative flex items-center gap-2.5 select-none transition-all duration-200 ${
          isDraggable
            ? 'cursor-grab active:cursor-grabbing hover:bg-white/5 active:bg-white/10 p-1.5 -m-1.5 rounded-xl border border-dashed border-transparent hover:border-white/10'
            : ''
        }`}
      >
        <div className="p-1.5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <LucideIcon name="Vault" size={14} className="text-white" />
        </div>
        <div>
          <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider leading-none">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-black leading-none">{formatCurrency(freeFunds)}</span>
            {freeFundsRollover > 0 && (
              <span className="text-[9px] text-white/60 font-medium">({formatCurrency(freeFundsRollover)})</span>
            )}
          </div>
        </div>
      </div>

      {onAddIncome && (
        <button
          onClick={onAddIncome}
          className="relative z-10 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
        >
          <LucideIcon name="Plus" size={10} />
          <span>Dodaj wpływ</span>
        </button>
      )}
    </motion.div>
  );
}


