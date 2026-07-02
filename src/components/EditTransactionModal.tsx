import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../types';
import LucideIcon from './LucideIcon';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (id: string, updatedData: { amount: number; description: string; date: string }) => void;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSave
}: EditTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!description.trim() || isNaN(amountNum) || amountNum <= 0 || !date) return;
    
    onSave(transaction.id, {
      description: description.trim(),
      amount: amountNum,
      date
    });
    onClose();
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'expense': return 'Wydatek';
      case 'income': return 'Wpływ';
      case 'saving_transfer': return 'Przelew na cele';
      default: return 'Inny';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden"
        id="modal-edit-transaction"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Edytuj operację
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Zmień szczegóły wybranej transakcji
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50" id="btn-close-edit-tx">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Metadata info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Typ operacji</p>
              <p className="font-bold text-slate-700 mt-0.5">{getTypeText(transaction.type)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Przypisanie</p>
              <p className="font-bold text-slate-700 mt-0.5">{transaction.envelopeName}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Opis operacji</label>
            <input
              type="text"
              required
              placeholder="np. Zakupy spożywcze"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-indigo-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all"
              id="input-edit-tx-desc"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kwota (PLN)</label>
            <div className="relative">
              <input
                type="number"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-indigo-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all pr-12 font-mono"
                min="0.01"
                step="any"
                id="input-edit-tx-amount"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">PLN</span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Data operacji</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-indigo-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all font-mono"
              id="input-edit-tx-date"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-white/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/30 hover:bg-white/50 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all shadow-xs"
              id="btn-cancel-tx-edit"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase transition-all shadow-md bg-slate-900 hover:bg-slate-800 cursor-pointer"
              id="btn-submit-tx-edit"
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
