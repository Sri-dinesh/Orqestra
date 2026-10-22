import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountMenu } from '@/features/auth/AccountMenu';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import * as sessionModule from '@/auth/session';

vi.mock('@/auth/session', () => ({
  useAuthSession: vi.fn(),
  notifyAuthChange: vi.fn(),
}));

describe('AccountMenu Role Badge', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Admin badge for institutional administrator', () => {
    vi.mocked(sessionModule.useAuthSession).mockReturnValue({
      data: {
        user: { id: 'u1', email: 'dean@college.edu', name: 'Dean Admin' },
        session: { token: 'tok' } as any,
      },
      refetch: vi.fn(),
      error: null,
      isPending: false,
    });

    useWorkspaceStore.setState({
      membership: {
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        institutionId: 'u1',
      },
    });

    render(
      <MemoryRouter>
        <AccountMenu />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dean Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders HOD badge with department code for department head', () => {
    vi.mocked(sessionModule.useAuthSession).mockReturnValue({
      data: {
        user: { id: 'u2', email: 'hod.cse@college.edu', name: 'Dr. Alan' },
        session: { token: 'tok' } as any,
      },
      refetch: vi.fn(),
      error: null,
      isPending: false,
    });

    useWorkspaceStore.setState({
      departments: [
        {
          id: 'dept_cse',
          code: 'CSE',
          name: 'Computer Science',
          workingDays: ['MONDAY'] as any,
          periodsPerDay: 7,
          status: 'READY',
          createdAt: '',
          updatedAt: '',
        },
      ],
      membership: {
        role: 'HOD',
        departmentId: 'dept_cse',
        facultyId: null,
        institutionId: 'u1',
      },
    });

    render(
      <MemoryRouter>
        <AccountMenu />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dr. Alan')).toBeInTheDocument();
    expect(screen.getByText(/HOD · CSE/i)).toBeInTheDocument();
  });
});
