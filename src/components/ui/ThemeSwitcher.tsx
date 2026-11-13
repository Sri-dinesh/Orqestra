'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/useTheme';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * /dev/null Design System Theme Switch:
 * A bordered segmented group (8px outer, 6px inner) whose selected option
 * uses the active-nav treatment (Primary Blue text on Blue Wash / Dark Primary on Dark Wash).
 */
export function ThemeSwitcher({ className = '', size = 'md' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
  ];

  const paddingCls = size === 'sm' ? 'p-0.5' : 'p-1';
  const itemCls = size === 'sm' ? 'px-2 py-1 text-xs gap-1.5' : 'px-2.5 py-1.5 text-xs gap-1.5';

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`inline-flex items-center rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] ${paddingCls} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 cursor-pointer ${itemCls} ${
              isSelected
                ? 'bg-[#e8effc] text-[#3b6fe0] dark:bg-[#18233a] dark:text-[#7aa2f7] shadow-xs'
                : 'text-[#5b616b] dark:text-[#a1a1a6] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326]'
            }`}
            title={`Switch to ${opt.label} theme`}
            aria-pressed={isSelected}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact 1-click theme toggle for top navbar / tight headers
 */
export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] text-[#5b616b] dark:text-[#a1a1a6] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] transition-colors focus-visible:outline-2 focus-visible:outline-[#3b6fe0] dark:focus-visible:outline-[#7aa2f7] cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark Graphite theme'}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark Graphite theme'}
    >
      {isDark ? <Sun className="w-4 h-4 text-[#7aa2f7]" /> : <Moon className="w-4 h-4 text-[#3b6fe0]" />}
    </button>
  );
}
