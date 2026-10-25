'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';

export default function DepartmentsRoute() {
  return (
    <RequireAuthWrapper>
      <DepartmentsPage />
    </RequireAuthWrapper>
  );
}
