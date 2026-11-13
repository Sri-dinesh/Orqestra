'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState<boolean>(false);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
    applyTheme(newTheme);
    setResolvedTheme(resolveTheme(newTheme));
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  }, []);

  // Sync client-side state on mount and subscribe to changes
  useEffect(() => {
    setMounted(true);

    let initialTheme: Theme = 'system';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        initialTheme = stored;
      }
    } catch {
      // fallback
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setResolvedTheme(resolveTheme(initialTheme));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const next = e.newValue as Theme;
        if (next === 'dark' || next === 'light' || next === 'system') {
          setThemeState(next);
          applyTheme(next);
          setResolvedTheme(resolveTheme(next));
        }
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
        applyTheme(customEvent.detail);
        setResolvedTheme(resolveTheme(customEvent.detail));
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('theme-change', handleCustomChange);

    // Listen to media query changes if system theme is selected
    let mediaQuery: MediaQueryList | null = null;
    let handleMedia: (() => void) | null = null;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        handleMedia = () => {
          setThemeState((current) => {
            if (current === 'system') {
              applyTheme('system');
              setResolvedTheme(getSystemTheme());
            }
            return current;
          });
        };
        mediaQuery.addEventListener('change', handleMedia);
      } catch {
        // Ignore mediaQuery errors in synthetic test environments
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('theme-change', handleCustomChange);
      if (mediaQuery && handleMedia) {
        try {
          mediaQuery.removeEventListener('change', handleMedia);
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return { theme, resolvedTheme, setTheme, mounted };
}
