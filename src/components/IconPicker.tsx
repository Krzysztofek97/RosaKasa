import React, { useState } from 'react';
import { CATEGORIZED_ICONS } from '../data';
import LucideIcon from './LucideIcon';

interface IconPickerProps {
  selectedIcon: string;
  onChange: (iconName: string) => void;
}

export default function IconPicker({ selectedIcon, onChange }: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIZED_ICONS[0].id);

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none flex-nowrap">
        {CATEGORIZED_ICONS.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/20'
                  : 'bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-white/60'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Icons Grid */}
      <div className="grid grid-cols-6 gap-2 bg-white/30 backdrop-blur-xs p-3 rounded-2xl border border-white/50 max-h-[140px] overflow-y-auto shadow-inner">
        {CATEGORIZED_ICONS.find((cat) => cat.id === activeCategory)?.icons.map((ico) => {
          const isSelected = selectedIcon.toLowerCase() === ico.name.toLowerCase();
          return (
            <button
              key={ico.name}
              type="button"
              onClick={() => onChange(ico.name)}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md scale-105'
                  : 'bg-white/40 text-slate-600 hover:bg-white/70 border border-white/65'
              }`}
              title={ico.label}
              id={`btn-icon-select-${ico.name}`}
            >
              <LucideIcon name={ico.name} size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
