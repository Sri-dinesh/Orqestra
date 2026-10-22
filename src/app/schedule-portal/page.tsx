'use client';

import { Suspense } from 'react';
import { SchedulePortalPage } from '@/features/portal/SchedulePortalPage';

export default function SchedulePortalRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F8F5]" />}>
      <SchedulePortalPage />
    </Suspense>
  );
}
