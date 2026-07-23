import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../../types';
import LucideIcon from '../LucideIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onClearData?: () => void;
  uid?: string;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, onResetData, onClearData, uid }: SettingsModalProps) {
  const [currency, setCurrency] = useState<'PLN' | 'EUR' | 'USD' | 'GBP'>('PLN');
  const [showDecimals, setShowDecimals] = useState(false);
  const [enableRollover, setEnableRollover] = useState(true);
  const [hideClosedMonths, setHideClosedMonths] = useState(false);
  const [includeSavingsInTotal, setIncludeSavingsInTotal] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
      setShowDecimals(settings.showDecimals);
      setEnableRollover(settings.enableRollover);
      setHideClosedMonths(settings.hideClosedMonths);
      setIncludeSavingsInTotal(settings.includeSavingsInTotal ?? true);
      setTheme(settings.theme ?? 'light');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ currency, showDecimals, enableRollover, hideClosedMonths, includeSavingsInTotal, theme });
    onClose();
  };

  const ToggleRow = ({ label, desc, value, onChange, id }: { label: string; desc: string; value: boolean; onChange: () => void; id: string }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-slate-800">{label}</h4>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button type="button" onClick={onChange} id={id}
        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-modal rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
        id="modal-settings"
      >
        <div className="p-6 border-b border-white/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
                <LucideIcon name="Settings" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ustawienia aplikacji</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Konfiguracja budżetu i preferencji</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer" id="btn-close-settings">
              <LucideIcon name="X" size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Waluta i Formatowanie</label>
            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Domyślna waluta</h4>
                  <p className="text-[10px] text-slate-500">Waluta wyświetlana w aplikacji</p>
                </div>
                <select value={currency} onChange={e => setCurrency(e.target.value as any)}
                  className="bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
                  id="select-settings-currency"
                >
                  <option value="PLN">PLN (zł)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <ToggleRow label="Pokazuj grosze / centy" desc="Włącz wyświetlanie miejsc po przecinku" value={showDecimals} onChange={() => setShowDecimals(!showDecimals)} id="toggle-settings-decimals" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Wygląd</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-theme-light"
                onClick={() => setTheme('light')}
                className={`relative rounded-2xl p-3 border-2 transition-all cursor-pointer overflow-hidden ${
                  theme === 'light'
                    ? 'border-indigo-500 shadow-lg shadow-indigo-200/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="rounded-xl overflow-hidden mb-2 h-16" style={{ background: 'linear-gradient(135deg, #ffe4e6 0%, #e0e7ff 50%, #f0fdfa 100%)' }}>
                  <div className="flex h-full">
                    <div className="w-8 h-full" style={{ background: 'rgba(255,255,255,0.9)' }} />
                    <div className="flex-1 p-1.5 space-y-1">
                      <div className="rounded" style={{ height: '8px', background: 'rgba(255,255,255,0.7)' }} />
                      <div className="rounded" style={{ height: '8px', background: 'rgba(255,255,255,0.5)', width: '70%' }} />
                      <div className="rounded" style={{ height: '8px', background: 'rgba(255,255,255,0.5)', width: '50%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 text-left">Jasny</p>
                    <p className="text-[10px] text-slate-400 text-left">Różowo-fioletowy</p>
                  </div>
                  {theme === 'light' && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              </button>

              <button
                type="button"
                id="btn-theme-dark"
                onClick={() => setTheme('dark')}
                className={`relative rounded-2xl p-3 border-2 transition-all cursor-pointer overflow-hidden ${
                  theme === 'dark'
                    ? 'border-violet-500 shadow-lg shadow-violet-900/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="rounded-xl overflow-hidden mb-2 h-16" style={{ background: 'linear-gradient(135deg, #0f0c1e 0%, #1a1035 40%, #0d1b2a 100%)' }}>
                  <div className="flex h-full">
                    <div className="w-8 h-full" style={{ background: 'rgba(13,10,28,0.97)' }} />
                    <div className="flex-1 p-1.5 space-y-1">
                      <div className="rounded" style={{ height: '8px', background: 'rgba(255,255,255,0.07)' }} />
                      <div className="rounded" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', width: '70%' }} />
                      <div className="rounded" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', width: '50%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 text-left">Ciemny</p>
                    <p className="text-[10px] text-slate-400 text-left">Granatowo-fioletowy</p>
                  </div>
                  {theme === 'dark' && (
                    <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Wygląd i Filtry</label>
            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-4 shadow-sm space-y-4">
              <ToggleRow label="Ukryj zamknięte miesiące" desc="Nie pokazuj zamkniętych miesięcy w selektorze" value={hideClosedMonths} onChange={() => setHideClosedMonths(!hideClosedMonths)} id="toggle-settings-hideclosed" />
              <div className="border-t border-slate-100 pt-3">
                <ToggleRow label="Uwzględniaj oszczędności" desc="Sumuj oszczędności ze stanem portfela i kopert w głównym saldzie" value={includeSavingsInTotal} onChange={() => setIncludeSavingsInTotal(!includeSavingsInTotal)} id="toggle-settings-include-savings" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-red-500">Strefa Niebezpieczna</label>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-red-900">Wyczyść wszystkie dane</h4>
                <p className="text-[10px] text-red-700/80 leading-normal">Trwale usuwa wszystkie koperty, cele, transakcje i rachunki.</p>
              </div>
              <button type="button" onClick={() => { if (onClearData) { onClearData(); onClose(); } }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm flex items-center justify-center gap-1.5"
                id="btn-settings-clear-all"
              >
                <LucideIcon name="Trash2" size={13} />
                <span>Wyczyść dane</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-500/5 rounded-2xl p-3 border border-blue-500/10 flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
              <LucideIcon name="Info" size={12} />
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">
              Wszystkie dane są bezpiecznie przechowywane lokalnie w pamięci Twojej przeglądarki.
            </p>
          </div>

          {uid && (
            <div className="bg-slate-100/50 rounded-2xl p-3 border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Twój unikalny ID konta (UID)</span>
              <code className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md break-all select-all">{uid}</code>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer uppercase tracking-wider" id="btn-settings-cancel">
              Anuluj
            </button>
            <button type="submit" className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/15 transition-all cursor-pointer uppercase tracking-wider" id="btn-settings-save">
              Zapisz ustawienia
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
