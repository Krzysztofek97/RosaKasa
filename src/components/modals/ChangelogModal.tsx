import React from 'react';
import { motion } from 'motion/react';
import LucideIcon from '../LucideIcon';

export function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const logs = [
    {
      version: 'v1.0 (Aktualna)',
      date: '2026-07-16',
      badge: 'Nowy początek',
      badgeColor: 'bg-indigo-600 text-white',
      items: [
        { title: 'Wersja bazowa', description: 'Od teraz oficjalnie rejestrujemy nowe funkcje, ważne usprawnienia oraz kluczowe poprawki w aplikacji.' },
        { title: 'Usprawnienia mobilne', description: 'Dostosowano karty kopert do małych ekranów (wyeliminowano problem nachodzenia etykiet na ikony) oraz wyłączono automatyczne wysuwanie klawiatury w modalach z formularzami.' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
        id="modal-changelog"
      >
        <div className="p-6 border-b border-white/50 bg-gradient-to-r from-amber-500/10 to-rose-500/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
              <LucideIcon name="History" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Historia zmian w RosaKasa</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Dowiedz się, co się zmieniło</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-changelog">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
          {logs.map((log, logIdx) => (
            <div key={log.version} className="relative">
              {logIdx !== logs.length - 1 && <div className="absolute left-4 top-10 bottom-[-32px] w-0.5 bg-slate-200" />}
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold font-mono flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm">✓</div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-display font-extrabold text-sm text-slate-900">{log.version}</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${log.badgeColor}`}>{log.badge}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5 block">{log.date}</span>
                </div>
              </div>
              <div className="pl-11 space-y-4">
                {log.items.map((item, i) => (
                  <div key={i} className="bg-white/70 border border-slate-100 p-4 rounded-2xl shadow-xs hover:border-slate-200 hover:bg-white transition-all space-y-1">
                    <h5 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal pl-3">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/50 bg-white/40 backdrop-blur-xs flex justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RosaKasa v1.0</p>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer" id="btn-confirm-changelog-close">
            Zamknij
          </button>
        </div>
      </motion.div>
    </div>
  );
}
