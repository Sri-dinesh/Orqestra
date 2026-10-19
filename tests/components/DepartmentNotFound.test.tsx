import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

describe('DepartmentNotFound', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      departments: [
        {
          id: 'dept-1',
          code: 'CSE',
          name: 'Computer Science and Engineering',
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          periodsPerDay: 7,
          status: 'READY',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      rooms: [],
      breaks: [],
      activeDepartmentId: 'dept-1',
    });
  });

  it('renders Department Not Found heading and requested ID', () => {
    render(
      <BrowserRouter>
        <DepartmentNotFound requestedId="dept-nonexistent" targetPage="timetable" />
      </BrowserRouter>,
    );

    expect(screen.getByText('Department Not Found')).toBeDefined();
    expect(screen.getByText('dept-nonexistent')).toBeDefined();
    expect(screen.getByText(/Available Departments in Current Semester/i)).toBeDefined();
    expect(screen.getByText('CSE')).toBeDefined();
    expect(screen.getByText('Computer Science and Engineering')).toBeDefined();
  });

  it('renders empty prompt when no departments exist', () => {
    useWorkspaceStore.setState({ departments: [] });

    render(
      <BrowserRouter>
        <DepartmentNotFound />
      </BrowserRouter>,
    );

    expect(screen.getByText('Department Not Found')).toBeDefined();
    expect(screen.getByText(/You haven't created any departments in this semester yet/i)).toBeDefined();
  });
});
