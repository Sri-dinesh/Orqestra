'use client';

import { RequireAuthWrapper } from '@/features/auth/RequireAuth';
import { FacultyTimetablePage } from '@/features/timetable-editor/FacultyTimetablePage';

export default function DepartmentFacultyTimetableRoute() {
  return (
    <RequireAuthWrapper>
      <FacultyTimetablePage />
    </RequireAuthWrapper>
  );
}
