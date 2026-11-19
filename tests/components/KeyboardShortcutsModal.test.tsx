import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';

describe('KeyboardShortcutsModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with title, search input, and shortcut categories when isOpen is true', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Keyboard Shortcuts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search shortcuts/i),
    ).toBeInTheDocument();

    // Check categories
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Workstation Editing')).toBeInTheDocument();
    expect(screen.getByText('Mouse & Touch')).toBeInTheDocument();
  });

  it('filters shortcuts when typing in search input', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search shortcuts/i);

    // Search for "undo"
    fireEvent.change(searchInput, { target: { value: 'undo' } });

    expect(
      screen.getByText('Undo previous timetable action'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Focus timetable search and entity filter'),
    ).not.toBeInTheDocument();

    // Search for non-existent shortcut
    fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });
    expect(
      screen.getByText(/No shortcuts found/i),
    ).toBeInTheDocument();
  });

  it('filters by key name (e.g. "del" or "esc")', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search shortcuts/i);
    fireEvent.change(searchInput, { target: { value: 'Esc' } });

    expect(
      screen.getByText('Deselect active entry or close modal'),
    ).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside modal dialog', () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
