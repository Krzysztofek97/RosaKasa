import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils';
import { getColorConfig } from '../data';
import LucideIcon from './LucideIcon';

interface AllocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope;
  freeFunds: number;
  onAllocate: (envelopeId: string, amount: number) => void;
  onWithdraw?: (envelopeId: string, amount: number) => void;
  initialMode?: 'allocate' | 'withdraw';
}

export default function AllocateModal({ isOpen, onClose, envelope, freeFunds, onAllocate, onWithdraw, initialMode = 'allocate' }: AllocateModalProps) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'allocate' | 'withdraw'>(initialMode);

  if (!isOpen) return null;

  const colorCfg = getColorConfig(envelope.color);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const numAmount = round2(parseFloat(amount) || 0);
  const maxAllocate = round2(freeFunds);
  const maxWithdraw = round2(Math.max(0, envelope.rollover + envelope.allocated - envelope.spent));
  const available = round2(envelope.rollover + envelope.allocated - envelope.spent);

  const isValid = numAmount > 0 && (
    mode === 'allocate' ? numAmount <= maxAllocate : numAmount <= maxWithdraw
  );

  const handleSubmit = () => {
    if (!isValid) return;
    if (mode === 'allocate') {
      onAllocate(envelope.id, numAmount);
    } else if (mode === 'withdraw' && onWithdraw) {
      onWithdraw(envelope.id, numAmount);
    }
    onClose();
  };

  const quickAmounts = [100, 200, 500, 1000].filter(a =>
    mode === 'allocate' ? a <= maxAllocate : a <= maxWithdraw
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className={`${colorCfg.bgLight} p-6 border-b ${colorCfg.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${colorCfg.bg}`}>
                <LucideIcon name={envelope.icon} size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">{envelope.name}</h2>
                <p className="text-xs text-slate-500">Zarządzaj środkami koperty</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 transition-all cursor-pointer text-slate-400">
              <LucideIcon name="X" size={18} />
            </button>
          </div>

          {/* Status koperty */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Przydzielone</p>
              <p className={`font-bold text-sm ${colorCfg.text}`}>{formatCurrency(envelope.allocated)}</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Dostępne</p>
              <p className={`font-bold text-sm ${available >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(available)}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Tryb: Przydziel / Wycofaj */}
          <div className="flex rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setMode('allocate')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                mode === 'allocate' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              Przydziel środki
            </button>
            <button
              onClick={() => setMode('withdraw')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                mode === 'withdraw' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              Wycofaj środki
            </button>
          </div>

          {/* Info */}
          <div className={`p-3 rounded-2xl text-xs ${mode === 'allocate' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
            {mode === 'allocate' ? (
              <>
                <span className="font-bold">Środki dostępne w portfelu: {formatCurrency(maxAllocate)}</span>
                <span className="block mt-0.5 opacity-70">Przydzielone środki zasilą kopertę i pomniejszą portfel.</span>
              </>
            ) : (
              <>
                <span className="font-bold">Możesz wycofać max: {formatCurrency(maxWithdraw)}</span>
                <span className="block mt-0.5 opacity-70">Wycofane środki wrócą do portfela. Nie możesz wycofać środków już wydanych.</span>
              </>
            )}
          </div>

          {/* Quick amounts */}
          {quickAmounts.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(a.toString())}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                    parseFloat(amount) === a
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {formatCurrency(a)}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Kwota (PLN)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-2xl font-black text-center bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
              autoFocus
            />
            {numAmount > 0 && !isValid && (
              <p className="text-xs text-rose-500 mt-1.5 text-center font-medium">
                {mode === 'allocate'
                  ? `Masz tylko ${formatCurrency(maxAllocate)} w portfelu`
                  : `Możesz wycofać max ${formatCurrency(maxWithdraw)}`
                }
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 cursor-pointer hover:bg-slate-50 transition-all"
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all cursor-pointer ${
                isValid
                  ? `${colorCfg.bg} hover:opacity-90 shadow-md`
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {mode === 'allocate' ? 'Przydziel' : 'Wycofaj'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
