'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { DepartmentConfigPage } from '@/features/departments/DepartmentConfigPage';

export default function DepartmentsRoute() {
  return (
    <RequireAuthWrapper>
      <DepartmentConfigPage />
    </RequireAuthWrapper>
  );
}
