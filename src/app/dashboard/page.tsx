'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

export default function DashboardRoute() {
  return (
    <RequireAuthWrapper>
      <DashboardPage />
    </RequireAuthWrapper>
  );
}
