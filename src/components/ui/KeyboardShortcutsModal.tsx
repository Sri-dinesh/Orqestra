'use client';

import React, { useState, useMemo } from 'react';
import { Keyboard, X, Search } from 'lucide-react';

export interface ShortcutItem {
  id: string;
  keys: string[];
  description: string;
  category: 'Navigation' | 'Workstation Editing' | 'Mouse & Touch';
}

export const KEYBOARD_SHORTCUTS: ShortcutItem[] = [
  // Navigation & Palette
  {
    id: 'cmd-k',
    keys: ['⌘', 'K'],
    description: 'Open Command Palette & Omnibox switcher',
    category: 'Navigation',
  },
  {
    id: 'search-slash',
    keys: ['/'],
    description: 'Focus timetable search and entity filter',
    category: 'Navigation',
  },
  {
    id: 'help-question',
    keys: ['?'],
    description: 'Open this Keyboard Shortcuts cheat sheet',
    category: 'Navigation',
  },
  {
    id: 'escape',
    keys: ['Esc'],
    description: 'Deselect active entry or close modal',
    category: 'Navigation',
  },

  // Editing & History
  {
    id: 'undo',
    keys: ['⌘', 'Z'],
    description: 'Undo previous timetable action',
    category: 'Workstation Editing',
  },
  {
    id: 'redo',
    keys: ['⌘', 'Shift', 'Z'],
    description: 'Redo undone action (or Ctrl+Y)',
    category: 'Workstation Editing',
  },
  {
    id: 'edit-slot',
    keys: ['E'],
    description: 'Edit the selected timetable session',
    category: 'Workstation Editing',
  },
  {
    id: 'substitute-slot',
    keys: ['S'],
    description: 'Find qualified substitute for selected faculty',
    category: 'Workstation Editing',
  },
  {
    id: 'clear-slot',
    keys: ['Del'],
    description: 'Clear / delete the selected timetable session',
    category: 'Workstation Editing',
  },

  // Mouse & Touch Gestures
  {
    id: 'click-select',
    keys: ['Click'],
    description: 'Select an entry or empty slot',
    category: 'Mouse & Touch',
  },
  {
    id: 'drag-drop',
    keys: ['Drag & Drop'],
    description: 'Move to free slot, or drop on another entry to swap',
    category: 'Mouse & Touch',
  },
  {
    id: 'right-click-swap',
    keys: ['Right-Click'],
    description: 'Swap right-clicked entry with currently selected entry',
    category: 'Mouse & Touch',
  },
  {
    id: 'dbl-click-edit',
    keys: ['Double-Click'],
    description: 'Directly open the slot edit dialog',
    category: 'Mouse & Touch',
  },
];

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredShortcuts = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return KEYBOARD_SHORTCUTS;
    return KEYBOARD_SHORTCUTS.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q)),
    );
  }, [filterQuery]);

  const categories = useMemo(() => {
    const set = new Set(filteredShortcuts.map((s) => s.category));
    return Array.from(set);
  }, [filteredShortcuts]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#18181a] rounded-xl shadow-2xl border border-[#e1e4e8] dark:border-[#2a2a2d] overflow-hidden flex flex-col max-h-[85vh] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7]">
              <Keyboard className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#121417] dark:text-[#ececec]">
                Keyboard Shortcuts &amp; Gestures
              </h2>
              <p className="text-xs text-[#5b616b] dark:text-[#8c9199]">
                Workstation hotkeys and navigation shortcuts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] cursor-pointer"
            title="Close shortcuts guide"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="px-6 py-3 border-b border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8c9199]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-[#121417] dark:text-[#ececec] placeholder:text-[#8c9199] focus:outline-none focus:border-[#3b6fe0] dark:focus:border-[#7aa2f7]"
            />
          </div>
        </div>

        {/* Shortcuts List by Category */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {categories.length === 0 ? (
            <p className="text-center text-sm text-[#5b616b] dark:text-[#8c9199] py-8">
              No shortcuts found matching &ldquo;{filterQuery}&rdquo;
            </p>
          ) : (
            categories.map((cat) => {
              const items = filteredShortcuts.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#5b616b] dark:text-[#8c9199]">
                    {cat}
                  </h3>
                  <div className="rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] divide-y divide-[#e1e4e8] dark:divide-[#2a2a2d] overflow-hidden">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="px-3.5 py-2.5 bg-white dark:bg-[#18181a] flex items-center justify-between gap-4"
                      >
                        <span className="text-xs text-[#121417] dark:text-[#ececec]">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k) => (
                            <kbd
                              key={k}
                              className="px-2 py-1 text-[11px] font-mono font-medium rounded border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-[#121417] dark:text-[#ececec] shadow-xs"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-xs text-[#5b616b] dark:text-[#8c9199]">
          <span>Tip: Press &ldquo;?&rdquo; anytime to toggle this helper</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#121417] dark:bg-[#ececec] text-white dark:text-[#111112] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
