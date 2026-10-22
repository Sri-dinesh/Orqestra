'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { SchedulePortalPage } from '@/features/portal/SchedulePortalPage';

export default function SchedulePortalRoute() {
  return (
    <RequireAuthWrapper>
      <SchedulePortalPage />
    </RequireAuthWrapper>
  );
}
