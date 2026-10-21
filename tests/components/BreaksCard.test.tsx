import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreaksCard } from '@/components/ui/BreaksCard';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import type { Department } from '@/domain/models';

const mockDepartment: Department = {
  id: 'dept-test',
  code: 'CSE',
  name: 'Computer Science and Engineering',
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  periodsPerDay: 7,
  status: 'READY',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('BreaksCard', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      breaks: [],
      departments: [mockDepartment],
    });
  });

  it('renders empty breaks state and preset buttons', () => {
    render(<BreaksCard department={mockDepartment} />);

    expect(screen.getByText(/Breaks & Recess Schedule \(0\)/i)).toBeDefined();
    expect(screen.getByText(/No breaks configured yet/i)).toBeDefined();
    expect(screen.getByText(/\+ Standard Lunch Break/i)).toBeDefined();
  });

  it('adds standard lunch break via preset button', () => {
    render(<BreaksCard department={mockDepartment} />);

    const lunchPresetBtn = screen.getByText(/\+ Standard Lunch Break/i);
    fireEvent.click(lunchPresetBtn);

    const storeBreaks = useWorkspaceStore.getState().breaks;
    expect(storeBreaks.length).toBe(1);
    expect(storeBreaks[0].name).toBe('Lunch Break');
    expect(storeBreaks[0].startPeriod).toBe(4);
    expect(storeBreaks[0].dayIndex).toBeNull();
  });

  it('allows adding a custom break via form', () => {
    render(<BreaksCard department={mockDepartment} />);

    const addBtn = screen.getByRole('button', { name: /Add Break/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Break')).toBeDefined();

    const nameInput = screen.getByLabelText(/Break name/i);
    fireEvent.change(nameInput, { target: { value: 'Tea Break' } });

    const submitBtn = screen.getByRole('button', { name: /Create Break/i });
    fireEvent.click(submitBtn);

    const storeBreaks = useWorkspaceStore.getState().breaks;
    expect(storeBreaks.some((b) => b.name === 'Tea Break')).toBe(true);
  });

  it('allows removing an existing break', () => {
    useWorkspaceStore.setState({
      breaks: [
        {
          id: 'brk-1',
          name: 'Afternoon Recess',
          startPeriod: 5,
          dayIndex: null,
          durationPeriods: 1,
          startTime: '03:10 PM',
          endTime: '03:30 PM',
        },
      ],
    });

    render(<BreaksCard department={mockDepartment} />);

    expect(screen.getByText('Afternoon Recess')).toBeDefined();

    const removeBtn = screen.getByLabelText(/Remove break Afternoon Recess/i);
    fireEvent.click(removeBtn);

    const storeBreaks = useWorkspaceStore.getState().breaks;
    expect(storeBreaks.length).toBe(0);
  });
});
