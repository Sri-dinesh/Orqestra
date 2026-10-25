import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DepartmentPresetLibrary } from '@/features/departments/DepartmentPresetLibrary';

describe('DepartmentPresetLibrary', () => {
  it('shows the built-in presets inside a department workspace', () => {
    render(
      <MemoryRouter>
        <DepartmentPresetLibrary departmentId="dept_cse" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Department presets')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Apply preset & generate/i })).toHaveLength(3);
    expect(screen.getByText(/replaces this department's current/i)).toBeInTheDocument();
  });
});
