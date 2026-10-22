'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { GeneratePage } from '@/features/generation/GeneratePage';

export default function DepartmentGenerateRoute() {
  return (
    <RequireAuthWrapper>
      <GeneratePage />
    </RequireAuthWrapper>
  );
}
