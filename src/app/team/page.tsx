'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { TeamPage } from '@/features/team/TeamPage';

export default function TeamRoute() {
  return (
    <RequireAuthWrapper>
      <TeamPage />
    </RequireAuthWrapper>
  );
}
