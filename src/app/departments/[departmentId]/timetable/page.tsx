'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { TimetablePage } from '@/features/timetable-editor/TimetablePage';

export default function DepartmentTimetableRoute() {
  return (
    <RequireAuthWrapper>
      <TimetablePage />
    </RequireAuthWrapper>
  );
}
