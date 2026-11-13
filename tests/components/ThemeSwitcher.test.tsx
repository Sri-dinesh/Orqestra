import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSwitcher, ThemeToggleCompact } from '@/components/ui/ThemeSwitcher';

describe('ThemeSwitcher and Dark Graphite Support', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
      },
      writable: true,
    });
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('renders ThemeSwitcher with Light, Dark, and System buttons', () => {
    render(<ThemeSwitcher />);

    expect(screen.getByRole('button', { name: /^light$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^dark$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^system$/i })).toBeDefined();
  });

  it('switches to light theme when Light button is clicked', () => {
    render(<ThemeSwitcher />);

    const lightBtn = screen.getByRole('button', { name: /^light$/i });
    fireEvent.click(lightBtn);

    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('switches to dark graphite theme when Dark button is clicked', () => {
    render(<ThemeSwitcher />);

    const darkBtn = screen.getByRole('button', { name: /^dark$/i });
    fireEvent.click(darkBtn);

    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles theme with ThemeToggleCompact', () => {
    render(<ThemeToggleCompact />);

    const toggle = screen.getByRole('button', { name: /switch to light theme|switch to dark graphite theme/i });
    fireEvent.click(toggle);

    expect(window.localStorage.setItem).toHaveBeenCalled();
  });
});
