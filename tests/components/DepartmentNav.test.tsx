import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

describe('DepartmentNav RBAC Scoping', () => {
  beforeEach(() => {
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
        {
          id: 'dept_ece',
          code: 'ECE',
          name: 'Electronics',
          workingDays: ['MONDAY'] as any,
          periodsPerDay: 7,
          status: 'READY',
          createdAt: '',
          updatedAt: '',
        },
      ],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      rooms: [],
      breaks: [],
    });
  });

  it('displays Generate tab for Admin', () => {
    useWorkspaceStore.setState({
      membership: {
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        institutionId: 'inst_1',
      },
    });

    render(
      <MemoryRouter initialEntries={['/departments/dept_cse/configuration']}>
        <Routes>
          <Route path="/departments/:departmentId/*" element={<DepartmentNav />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.queryByText('Read-Only View')).not.toBeInTheDocument();
  });

  it('displays Read-Only View and hides Generate tab for HOD viewing foreign department', () => {
    useWorkspaceStore.setState({
      membership: {
        role: 'HOD',
        departmentId: 'dept_cse',
        facultyId: null,
        institutionId: 'inst_1',
      },
    });

    render(
      <MemoryRouter initialEntries={['/departments/dept_ece/configuration']}>
        <Routes>
          <Route path="/departments/:departmentId/*" element={<DepartmentNav />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Read-Only View')).toBeInTheDocument();
    expect(screen.queryByText('Generate')).not.toBeInTheDocument();
  });
});
