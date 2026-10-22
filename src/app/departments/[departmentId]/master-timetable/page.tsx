'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { MasterTimetablePage } from '@/features/timetable-editor/MasterTimetablePage';

export default function DepartmentMasterTimetableRoute() {
  return (
    <RequireAuthWrapper>
      <MasterTimetablePage />
    </RequireAuthWrapper>
  );
}
