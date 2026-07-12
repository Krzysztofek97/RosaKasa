import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Envelope, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import LucideIcon from './LucideIcon';
import { ReadOnlyContext } from '../App';
import { useContext } from 'react';

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
  onCorrectFreeFunds?: (newAmount: number) => void;
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
  onCorrectFreeFunds,
  isClosed = false,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onDropEnvelope,
  settings,
}: SummaryCardsProps) {
  const includeSavings = settings?.includeSavingsInTotal ?? true;
  const totalAccountBalance = freeFunds + totalEnvelopeFunds + (includeSavings ? totalSavings : 0);
  const isReadOnly = useContext(ReadOnlyContext);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef<boolean>(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState('');

  // --- Drag & Drop ---
  const handleDragStart = (e: React.DragEvent) => {
    if (isClosed || freeFunds <= 0 || isReadOnly) { e.preventDefault(); return; }
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

  // --- Touch Drag ---
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

  const chips = [
    {
      label: 'Portfel',
      value: freeFunds,
      sub: freeFundsRollover > 0 ? formatCurrency(freeFundsRollover) : null,
      icon: 'Wallet',
      draggable: isDraggable,
      accent: 'bg-slate-100 hover:bg-slate-200 border-slate-200',
      iconClass: 'text-slate-600',
      labelClass: 'text-slate-400',
      valueClass: 'text-slate-800',
      correctable: !isClosed && !isReadOnly && !!onCorrectFreeFunds,
    },
    {
      label: 'Koperty',
      value: totalEnvelopeFunds,
      sub: null,
      icon: 'Mail',
      draggable: false,
      accent: 'bg-amber-50 border-amber-200',
      iconClass: 'text-amber-500',
      labelClass: 'text-amber-400',
      valueClass: 'text-amber-700',
      correctable: false,
    },
    {
      label: 'Oszczędności',
      value: totalSavings,
      sub: null,
      icon: 'PiggyBank',
      draggable: false,
      accent: 'bg-teal-50 border-teal-200',
      iconClass: 'text-teal-500',
      labelClass: 'text-teal-400',
      valueClass: 'text-teal-700',
      correctable: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-2xl p-4 shadow-sm w-full sm:w-auto border transition-all duration-300 bg-white ${
        isDragOver
          ? 'border-emerald-400 ring-4 ring-emerald-400/20 scale-[1.01] z-30'
          : 'border-slate-200'
      }`}
    >

      {/* Nagłówek: Stan konta + przycisk */}
      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <LucideIcon name="Landmark" size={11} className="text-violet-500" />
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none">Stan konta</p>
          </div>
          <span className="text-2xl font-black leading-none tracking-tight text-slate-800">
            {formatCurrency(totalAccountBalance)}
          </span>
        </div>

        {onAddIncome && !isReadOnly && (
          <button
            onClick={onAddIncome}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm mt-0.5"
          >
            <LucideIcon name="Plus" size={10} />
            <span>Dodaj wpływ</span>
          </button>
        )}
      </div>

      {/* Chipy: Portfel / Koperty / Oszczędności */}
      <div className="flex gap-2 flex-wrap">
        {chips.map(chip => (
          <div
            key={chip.label}
            draggable={chip.draggable}
            onDragStart={chip.draggable ? handleDragStart : undefined}
            onTouchStart={chip.draggable ? handleTouchStart : undefined}
            onTouchMove={chip.draggable ? handleTouchMove : undefined}
            onTouchEnd={chip.draggable ? handleTouchEnd : undefined}
            onTouchCancel={chip.draggable ? handleTouchEnd : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border select-none transition-all duration-200 ${chip.accent} ${
              chip.draggable
                ? 'cursor-grab active:cursor-grabbing active:scale-95 border-dashed hover:border-slate-300'
                : ''
            }`}
          >
            <LucideIcon name={chip.icon} size={14} className={chip.iconClass} />
            <div className="flex flex-col leading-none gap-0.5">
              <span className={`text-[10px] font-semibold ${chip.labelClass}`}>
                {chip.label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-sm font-bold ${chip.valueClass}`}>
                  {formatCurrency(chip.value)}
                </span>
                {chip.sub && (
                  <span className="text-[9px] text-slate-400 font-medium">+{chip.sub}</span>
                )}
              </div>
            </div>
            {chip.correctable && (
              <button
                onClick={() => { setIsEditingWallet(v => !v); setWalletInput(String(freeFunds)); }}
                className="ml-1 p-0.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Koryguj saldo portfela"
                id="btn-wallet-correct"
              >
                <LucideIcon name="Pencil" size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Inline korekta portfela */}
      {isEditingWallet && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">Korekta salda portfela</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                autoFocus
                step="0.01"
                placeholder={String(freeFunds)}
                value={walletInput}
                onChange={e => setWalletInput(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all"
                id="input-correct-free-funds"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = parseFloat(walletInput);
                    if (!isNaN(v) && onCorrectFreeFunds) { onCorrectFreeFunds(v); setIsEditingWallet(false); setWalletInput(''); }
                  }
                  if (e.key === 'Escape') { setIsEditingWallet(false); setWalletInput(''); }
                }}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">zł</span>
            </div>
            <button
              onClick={() => {
                const v = parseFloat(walletInput);
                if (!isNaN(v) && onCorrectFreeFunds) { onCorrectFreeFunds(v); }
                setIsEditingWallet(false);
                setWalletInput('');
              }}
              className="text-xs font-bold px-3 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
              id="btn-confirm-correct-funds"
            >Ok</button>
            <button
              onClick={() => { setIsEditingWallet(false); setWalletInput(''); }}
              className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
              id="btn-cancel-correct-funds"
            >
              <LucideIcon name="X" size={14} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Korekta techniczna — nie wpływa na statystyki przychodów/wydatków</p>
        </div>
      )}
    </motion.div>
  );
}
