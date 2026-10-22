'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { SettingsPage } from '@/features/settings/SettingsPage';

export default function SettingsRoute() {
  return (
    <RequireAuthWrapper>
      <SettingsPage />
    </RequireAuthWrapper>
  );
}
