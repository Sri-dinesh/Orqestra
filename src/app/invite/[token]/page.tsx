'use client';

import { Suspense } from 'react';
import { InviteAcceptancePage } from '@/features/invite/InviteAcceptancePage';

export default function InviteRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f7f8]" />}>
      <InviteAcceptancePage />
    </Suspense>
  );
}
