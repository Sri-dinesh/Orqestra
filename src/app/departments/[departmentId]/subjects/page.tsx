'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { SubjectsPage } from '@/features/subjects/SubjectsPage';

export default function DepartmentSubjectsRoute() {
  return (
    <RequireAuthWrapper>
      <SubjectsPage />
    </RequireAuthWrapper>
  );
}
