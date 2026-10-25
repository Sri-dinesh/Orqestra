'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { DepartmentHomePage } from '@/features/departments/DepartmentHomePage';

export default function DepartmentRoute() {
  return (
    <RequireAuthWrapper>
      <DepartmentHomePage />
    </RequireAuthWrapper>
  );
}
