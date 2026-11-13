'use client';

import { Suspense } from 'react';
import { SchedulePortalPage } from '@/features/portal/SchedulePortalPage';

export default function SchedulePortalRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f7f8]" />}>
      <SchedulePortalPage />
    </Suspense>
  );
}
