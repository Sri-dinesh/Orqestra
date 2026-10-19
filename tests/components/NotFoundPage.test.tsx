import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFoundPage } from '@/components/ui/NotFoundPage';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

describe('NotFoundPage', () => {
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

  it('renders 404 badge, heading, and recovery buttons', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('404 Page Not Found')).toBeDefined();
    expect(screen.getByText('Lost in the schedule?')).toBeDefined();
    expect(screen.getByText('Back to Dashboard')).toBeDefined();
    expect(screen.getByText('My Schedule')).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText(/CSE Timetable Editor/i)).toBeDefined();
  });
});
