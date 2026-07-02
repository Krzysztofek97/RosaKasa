import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Envelope, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { getColorConfig } from '../data';
import LucideIcon from './LucideIcon';

interface EnvelopeCardProps {
  key?: string;
  envelope: Envelope;
  isClosed: boolean;
  settings: AppSettings;
  onClick: (envelope: Envelope) => void;
  onDropFreeFunds?: (envelope: Envelope) => void;
  onDropEnvelope?: (sourceId: string, targetEnvelope: Envelope) => void;
  isTouchHovered?: boolean;
}

export default function EnvelopeCard({
  envelope,
  isClosed,
  settings,
  onClick,
  onDropFreeFunds,
  onDropEnvelope,
  isTouchHovered = false,
}: EnvelopeCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const colorCfg = getColorConfig(envelope.color);

  const available = envelope.rollover + envelope.allocated - envelope.spent;
  const totalBudget = envelope.rollover + envelope.allocated;
  const availablePct = totalBudget > 0 ? Math.max(0, Math.min(100, (available / totalBudget) * 100)) : 0;
  const isOverspent = available < 0;
  const isWarning = settings.limitWarnings && availablePct <= 20 && !isOverspent && (envelope.allocated > 0 || envelope.rollover > 0);

  const handleDragStart = (e: React.DragEvent) => {
    if (isClosed) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', `envelope:${envelope.id}`);
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
    if (data === 'free-funds' && onDropFreeFunds) {
      onDropFreeFunds(envelope);
    } else if (data.startsWith('envelope:') && onDropEnvelope) {
      const sourceId = data.replace('envelope:', '');
      if (sourceId !== envelope.id) {
        onDropEnvelope(sourceId, envelope);
      }
    }
  };

  const isHighlighted = isDragOver || isTouchHovered;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => {
        if (!isClosed) {
          onClick(envelope);
        }
      }}
      draggable={!isClosed}
      onDragStart={handleDragStart}
      data-envelope-id={envelope.id}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative h-28 sm:h-32 xl:h-28 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        isHighlighted
          ? 'border-emerald-500 ring-4 ring-emerald-500/25 scale-[1.04] shadow-lg z-30'
          : isOverspent
          ? 'border-rose-300 shadow-sm'
          : isWarning
          ? 'border-amber-200 shadow-sm'
          : `${colorCfg.border} shadow-sm`
      } ${colorCfg.bgLight} ${
        !isClosed ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''
      }`}
    >
      {/* Wzór zagięć koperty (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Lewa zakładka */}
        <polygon points="0,0 48,42 0,100" className="fill-current text-black/[0.03]" />
        {/* Prawa zakładka */}
        <polygon points="100,0 52,42 100,100" className="fill-current text-black/[0.03]" />
        {/* Dolna zakładka */}
        <polygon points="0,100 50,42 100,100" className="fill-current text-black/[0.06]" />
        {/* Górna klapa (składana w dół) */}
        <polygon points="0,0 50,42 100,0" className="fill-current text-white/50 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]" />
      </svg>

      {/* Znaczek pocztowy z ikoną kategorii w prawym górnym rogu (z-20, aby nie chował się pod białe tło) */}
      <div className="absolute top-2 right-2 w-8 h-8 bg-white border border-dashed border-slate-400 rounded-sm shadow-sm flex items-center justify-center rotate-6 z-20 select-none pointer-events-none">
        <LucideIcon name={envelope.icon} size={14} className={colorCfg.text} />
      </div>

      {/* Naklejka adresowa (Label z nazwą i środkami) na środku (z-10) */}
      <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 w-[84%] bg-white rounded-xl shadow-md border border-slate-100/80 p-2.5 xl:p-2 text-center z-10 transition-all pointer-events-none">
        <div className="text-[10px] xl:text-[9px] font-bold text-slate-600 tracking-wider uppercase px-1 line-clamp-2 leading-tight">
          {envelope.name}
        </div>
        <div className={`text-base xl:text-sm font-black tracking-tight mt-0.5 ${isOverspent ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(available)}
        </div>
      </div>
    </motion.div>
  );
}
