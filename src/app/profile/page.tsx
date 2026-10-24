'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { ProfilePage } from '@/features/profile/ProfilePage';

export default function ProfileRoute() {
  return (
    <RequireAuthWrapper>
      <ProfilePage />
    </RequireAuthWrapper>
  );
}
