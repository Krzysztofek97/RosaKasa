import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Envelope } from '../types';
import { formatCurrency } from '../utils';
import { getColorConfig } from '../data';
import LucideIcon from './LucideIcon';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceEnvelope: Envelope;
  targetEnvelope: Envelope;
  onTransfer: (sourceId: string, targetId: string, amount: number) => void;
}

export default function TransferModal({ isOpen, onClose, sourceEnvelope, targetEnvelope, onTransfer }: TransferModalProps) {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const sourceColorCfg = getColorConfig(sourceEnvelope.color);
  const targetColorCfg = getColorConfig(targetEnvelope.color);
  
  const numAmount = parseFloat(amount) || 0;
  // Maximum we can withdraw from source envelope (includes rollover)
  const sourceAvailable = (sourceEnvelope.rollover ?? 0) + (sourceEnvelope.allocated ?? 0) - sourceEnvelope.spent;
  // Round to 2 decimal places to avoid floating-point comparison issues (e.g. 0.01 > 0.01000000001)
  const maxTransfer = Math.round(Math.max(0, sourceAvailable) * 100) / 100;
  const roundedAmount = Math.round(numAmount * 100) / 100;
  const targetAvailable = targetEnvelope.rollover + targetEnvelope.allocated - targetEnvelope.spent;

  const isValid = roundedAmount > 0 && roundedAmount <= maxTransfer;

  const handleSubmit = () => {
    if (!isValid) return;
    onTransfer(sourceEnvelope.id, targetEnvelope.id, numAmount);
    onClose();
  };

  const quickAmounts = [50, 100, 200, 500].filter(a => a <= maxTransfer);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-lg">Przenieś środki</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 transition-all cursor-pointer text-slate-400">
              <LucideIcon name="X" size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Source */}
            <div className={`flex-1 rounded-2xl p-3 border ${sourceColorCfg.border} ${sourceColorCfg.bgLight} text-center`}>
              <div className="flex justify-center mb-1">
                <LucideIcon name={sourceEnvelope.icon} size={16} className={sourceColorCfg.text} />
              </div>
              <p className="text-[10px] font-bold text-slate-600 truncate">{sourceEnvelope.name}</p>
              <p className={`font-bold text-sm ${sourceAvailable >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(sourceAvailable)}
              </p>
            </div>

            {/* Arrow */}
            <div className="shrink-0 p-2 text-slate-300">
              <LucideIcon name="ArrowRight" size={20} />
            </div>

            {/* Target */}
            <div className={`flex-1 rounded-2xl p-3 border ${targetColorCfg.border} ${targetColorCfg.bgLight} text-center`}>
              <div className="flex justify-center mb-1">
                <LucideIcon name={targetEnvelope.icon} size={16} className={targetColorCfg.text} />
              </div>
              <p className="text-[10px] font-bold text-slate-600 truncate">{targetEnvelope.name}</p>
              <p className={`font-bold text-sm ${targetAvailable >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(targetAvailable)}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info */}
          <div className="p-3 rounded-2xl text-xs bg-blue-50 text-blue-700">
            <span className="font-bold">Maksymalnie: {formatCurrency(maxTransfer)}</span>
            <span className="block mt-0.5 opacity-70">Przenosisz środki z jednej koperty do drugiej. Zmniejszy to budżet przydzielony w kopercie źródłowej i zwiększy w docelowej.</span>
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
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-2xl font-black text-center bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
              autoFocus
            />
            {numAmount > 0 && !isValid && (
              <p className="text-xs text-rose-500 mt-1.5 text-center font-medium">
                Maksymalnie możesz przenieść {formatCurrency(maxTransfer)}
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
                  ? 'bg-slate-900 hover:bg-slate-800 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Przenieś
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
