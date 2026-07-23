import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SavingGoal, SavingGoalStorageType } from '../../types';
import { AVAILABLE_COLORS } from '../../data';
import LucideIcon from '../LucideIcon';
import IconPicker from '../IconPicker';

interface AddSavingGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any) => void;
  goal?: SavingGoal | null;
  onDelete?: () => void;
}

export function AddSavingGoalModal({ isOpen, onClose, onSave, goal = null, onDelete }: AddSavingGoalModalProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('indigo');
  const [storageType, setStorageType] = useState<SavingGoalStorageType | undefined>(undefined);
  const [storageNote, setStorageNote] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTarget(goal.target !== null ? goal.target.toString() : '');
      setInitialSaved(goal.current.toString());
      setIcon(goal.icon || 'PiggyBank');
      setColor(goal.color || 'indigo');
      setStorageType(goal.storageType);
      setStorageNote(goal.storageNote || '');
    } else {
      setName('');
      setTarget('');
      setInitialSaved('');
      setIcon('PiggyBank');
      setColor('indigo');
      setStorageType(undefined);
      setStorageNote('');
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = target.trim() === '' ? null : parseFloat(target);
    const currentNum = parseFloat(initialSaved) || 0;
    if (!name.trim()) return;
    if (targetNum !== null && (isNaN(targetNum) || targetNum <= 0)) return;
    onSave({ id: goal?.id, name: name.trim(), target: targetNum, current: currentNum, icon, color, storageType, storageNote: storageNote.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        id="modal-add-goal"
      >
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xs shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">{goal ? 'Edytuj cel' : 'Nowy cel oszczędzania'}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Określ na co oszczędzasz</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-goal">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nazwa celu</label>
            <input
              type="text" required
              placeholder="np. Poduszka bezpieczeństwa, Wakacje, Smartfon"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all"
              id="input-goal-name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kwota docelowa (PLN) - opcjonalnie</label>
            <div className="relative">
              <input
                type="number"
                placeholder="np. 5000 (zostaw puste jeśli brak)"
                value={target} onChange={e => setTarget(e.target.value)}
                className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all pr-12 font-mono"
                min="1" id="input-goal-target"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">PLN</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {goal ? 'Aktualny stan oszczędności' : 'Aktualnie zaoszczędzone (PLN)'}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={initialSaved} onChange={e => setInitialSaved(e.target.value)}
                className="w-full text-sm bg-white/60 border border-white/60 focus:bg-white focus:border-rose-400/50 focus:outline-none rounded-xl px-4 py-3 transition-all pr-12 font-mono"
                min="0" id="input-goal-initial"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">PLN</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Wybierz ikonę</label>
            <IconPicker selectedIcon={icon} onChange={setIcon} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kolor</label>
            <div className="flex flex-wrap gap-2.5 bg-white/30 p-3 rounded-2xl border border-white/50">
              {AVAILABLE_COLORS.map(col => (
                <button
                  key={col.class} type="button"
                  onClick={() => setColor(col.class)}
                  className={`w-7 h-7 rounded-full ${col.bg} transition-all relative flex items-center justify-center cursor-pointer hover:scale-110`}
                  id={`btn-goal-color-select-${col.class}`}
                >
                  {color === col.class && <span className="w-2.5 h-2.5 rounded-full bg-white block shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Gdzie trzymasz pieniądze?</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'shared_account' as SavingGoalStorageType, icon: 'Building2', label: 'Wspólne konto', desc: 'Jedno konto dla wszystkich' },
                { value: 'own_account' as SavingGoalStorageType, icon: 'CreditCard', label: 'Osobne konto', desc: 'Dedykowane konto' },
                { value: 'cash' as SavingGoalStorageType, icon: 'Banknote', label: 'Gotówka', desc: 'Skarpetka / portfel' },
                { value: 'other' as SavingGoalStorageType, icon: 'Box', label: 'Inne', desc: 'Inne miejsce' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStorageType(storageType === opt.value ? undefined : opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    storageType === opt.value
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-white/40 border-white/60 text-slate-600 hover:bg-white/60'
                  }`}
                  id={`btn-goal-storage-${opt.value}`}
                >
                  <LucideIcon name={opt.icon} size={15} className={storageType === opt.value ? 'text-indigo-500' : 'text-slate-400'} />
                  <div>
                    <p className="text-xs font-bold leading-none">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {storageType && (
              <input
                type="text"
                placeholder={storageType === 'shared_account' ? 'Nazwa banku (opcjonalnie)' : storageType === 'own_account' ? 'Nazwa konta / banku' : 'Opis (opcjonalnie)'}
                value={storageNote}
                onChange={e => setStorageNote(e.target.value)}
                className="mt-2 w-full text-xs bg-white/60 border border-white/60 focus:bg-white focus:border-indigo-400/50 focus:outline-none rounded-xl px-3 py-2 transition-all"
                id="input-goal-storage-note"
              />
            )}
          </div>

          <div className="flex justify-between items-center gap-3 pt-3 border-t border-white/50">
            {goal && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                id="btn-delete-goal-modal"
              >
                <LucideIcon name="Trash2" size={14} />
                Usuń cel
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/30 hover:bg-white/50 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer" id="btn-cancel-goal-save">
                Anuluj
              </button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase transition-all shadow-md bg-slate-900 hover:bg-slate-800 cursor-pointer" id="btn-submit-goal-save">
                {goal ? 'Zapisz zmiany' : 'Dodaj cel'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
