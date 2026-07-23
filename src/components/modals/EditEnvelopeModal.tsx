import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Envelope, SavingGoal, Transaction } from '../../types';
import { AVAILABLE_COLORS } from '../../data';
import LucideIcon from '../LucideIcon';
import IconPicker from '../IconPicker';

interface EditEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null;
  onSave: (envelopeData: any) => void;
  savingGoals: SavingGoal[];
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  canDelete?: boolean;
  transactions?: Transaction[];
}

export function EditEnvelopeModal({
  isOpen, onClose, envelope, onSave, savingGoals, onDelete, onArchive, canDelete = true
}: EditEnvelopeModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('amber');
  const [rolloverTarget, setRolloverTarget] = useState('envelope');

  useEffect(() => {
    if (envelope) {
      setName(envelope.name);
      setIcon(envelope.icon);
      setColor(envelope.color);
      setRolloverTarget(envelope.rolloverTarget ?? 'envelope');
    } else {
      setName('');
      setIcon('Utensils');
      setColor('amber');
      setRolloverTarget('envelope');
    }
  }, [envelope, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let quickSpends = [10, 20, 50];

    onSave({
      id: envelope?.id,
      name: name.trim(),
      limit: 0,
      allocated: envelope?.allocated ?? 0,
      icon,
      color,
      quickSpends,
      rolloverTarget,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        id="modal-edit-envelope"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {envelope ? 'Edytuj kopertę' : 'Dodaj nową kopertę'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {envelope ? 'Zmień parametry koperty' : 'Utwórz nową kopertę wydatków'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-edit-env">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nazwa koperty</label>
            <input
              type="text"
              required
              placeholder="np. Kosmetyki, Rachunki, Subskrypcje"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all"
              id="input-env-name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Przenoszenie niewydanych środków
            </label>
            <p className="text-[10px] text-slate-500 mb-2">Co zrobić z niewydanymi środkami po zamknięciu miesiąca?</p>
            <select
              value={rolloverTarget}
              onChange={e => setRolloverTarget(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all cursor-pointer"
              id="select-env-rollover-target"
            >
              <option value="envelope">↩ Przenieś do tej samej koperty</option>
              {savingGoals.map(g => (
                <option key={g.id} value={g.id}>🎯 Przekaż do celu: {g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Wybierz ikonę</label>
            <IconPicker selectedIcon={icon} onChange={setIcon} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kolor wyróżniający</label>
            <div className="flex flex-wrap gap-2.5 bg-white/30 backdrop-blur-xs p-3 rounded-2xl border border-white/50 shadow-inner">
              {AVAILABLE_COLORS.map(col => (
                <button
                  key={col.class}
                  type="button"
                  onClick={() => setColor(col.class)}
                  className={`w-7 h-7 rounded-full ${col.bg} transition-all relative flex items-center justify-center cursor-pointer hover:scale-110`}
                  title={col.class}
                  id={`btn-color-select-${col.class}`}
                >
                  {color === col.class && <span className="w-2.5 h-2.5 rounded-full bg-white block shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          {envelope && (
            <div className="pt-4 border-t border-white/50 space-y-3">
              <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-white/30">
                <button
                  type="button"
                  onClick={() => {
                    if (onArchive && envelope.id) {
                      onArchive(envelope.id);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <LucideIcon name="Archive" size={16} />
                  Zarchiwizuj kopertę
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Zarchiwizowane koperty nie będą się pojawiać w nowych miesiącach.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!canDelete}
                  onClick={() => {
                    if (canDelete && onDelete && envelope.id) {
                      onDelete(envelope.id);
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    canDelete
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <LucideIcon name="Trash2" size={16} />
                  Usuń kopertę
                </button>
                {!canDelete && (
                  <p className="text-[10px] text-rose-500 text-center font-medium">
                    Nie można usunąć koperty, ponieważ są do niej przypisane transakcje. Usuń je najpierw.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-white/50">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-white/80 bg-white/30 hover:bg-white/55 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer"
              id="btn-cancel-env-save"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              id="btn-confirm-env-save"
            >
              {envelope ? 'Zapisz' : 'Dodaj'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
