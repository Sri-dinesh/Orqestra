'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { FacultyPage } from '@/features/faculty/FacultyPage';

export default function DepartmentFacultyRoute() {
  return (
    <RequireAuthWrapper>
      <FacultyPage />
    </RequireAuthWrapper>
  );
}
