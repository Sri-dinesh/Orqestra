'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { RoomsPage } from '@/features/rooms/RoomsPage';

export default function DepartmentRoomsRoute() {
  return (
    <RequireAuthWrapper>
      <RoomsPage />
    </RequireAuthWrapper>
  );
}
