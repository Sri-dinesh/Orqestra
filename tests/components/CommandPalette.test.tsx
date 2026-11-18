import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

describe('CommandPalette Component', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      departments: [
        {
          id: 'dept_cs',
          code: 'CS',
          name: 'Computer Science',
          workingDays: ['MONDAY', 'TUESDAY'] as any,
          periodsPerDay: 6,
          status: 'READY',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'dept_mech',
          code: 'MECH',
          name: 'Mechanical Engineering',
          workingDays: ['MONDAY', 'TUESDAY'] as any,
          periodsPerDay: 6,
          status: 'READY',
          createdAt: '',
          updatedAt: '',
        },
      ],
      activeDepartmentId: 'dept_cs',
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      rooms: [],
      breaks: [],
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders commands when isOpen is true', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search commands/i)).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/CS — Timetable Workstation/i)).toBeInTheDocument();
  });

  it('filters commands as user types in the search input', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Search commands/i);
    fireEvent.change(input, { target: { value: 'Mechanical' } });

    expect(screen.getByText(/MECH — Mechanical Engineering/i)).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('closes when Escape key is pressed or close clicked', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={handleClose} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Search commands/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('executes command action on Enter key', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={handleClose} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Search commands/i);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows no results message when search matches nothing', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Search commands/i);
    fireEvent.change(input, { target: { value: 'nonexistentxyz123' } });

    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });
});
