import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Envelope } from '../types';
import LucideIcon from './LucideIcon';
import { getColorConfig } from '../data';

interface ReorderEnvelopesModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopes: Envelope[];
  onSave: (newOrderIds: string[]) => void;
}

export default function ReorderEnvelopesModal({
  isOpen,
  onClose,
  envelopes,
  onSave,
}: ReorderEnvelopesModalProps) {
  const [items, setItems] = useState<Envelope[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(envelopes.filter(e => !e.isArchived));
    }
  }, [isOpen, envelopes]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full sm:w-[480px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex-none flex items-center justify-between p-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Zmień kolejność</h2>
              <p className="text-xs text-slate-500 mt-1">Przeciągnij elementy, aby ustalić nową kolejność.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <LucideIcon name="X" size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6">
            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3">
              {items.map((env) => {
                const colorCfg = getColorConfig(env.color);
                return (
                  <Reorder.Item 
                    key={env.id} 
                    value={env} 
                    className="relative flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-300 transition-colors select-none"
                  >
                    <div className="text-slate-400 p-1">
                      <LucideIcon name="GripVertical" size={20} />
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${colorCfg.bgLight} ${colorCfg.text} flex items-center justify-center`}>
                      <LucideIcon name={env.icon} size={20} />
                    </div>
                    <div className="flex-1 text-sm font-bold text-slate-800">
                      {env.name}
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>

          {/* Footer */}
          <div className="flex-none p-6 pt-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Anuluj
            </button>
            <button
              onClick={() => {
                onSave(items.map(i => i.id));
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md"
            >
              Zapisz
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
