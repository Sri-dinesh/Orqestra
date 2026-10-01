import { useEffect } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DepartmentConfigPage } from '@/features/departments/DepartmentConfigPage';
import { SubjectsPage } from '@/features/subjects/SubjectsPage';
import { FacultyPage } from '@/features/faculty/FacultyPage';
import { GeneratePage } from '@/features/generation/GeneratePage';
import { TimetablePage } from '@/features/timetable-editor/TimetablePage';
import { FacultyTimetablePage } from '@/features/timetable-editor/FacultyTimetablePage';
import { MasterTimetablePage } from '@/features/timetable-editor/MasterTimetablePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { usePersistence } from '@/hooks/usePersistence';
import { Toast } from '@/components/ui/Toast';

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue ${
    isActive ? 'bg-charcoal text-white' : 'text-body-gray hover:bg-surface-2 hover:text-ink'
  }`;

export default function App() {
  usePersistence();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Orqestra';
  }, []);

  return (
    <div className="min-h-dvh bg-surface-1 text-ink">
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-charcoal text-[11px] font-bold text-white" aria-hidden="true">
              O
            </span>
            Orqestra
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <NavLink className={navLinkCls} to="/" end>
              Dashboard
            </NavLink>
            <NavLink className={navLinkCls} to="/departments">
              Configuration
            </NavLink>
            <NavLink className={navLinkCls} to="/settings">
              Settings
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-live="polite">
        <ErrorBoundary area="application">
          <Routes location={location}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/departments" element={<DepartmentConfigPage />} />
            <Route path="/departments/:departmentId/configuration" element={<DepartmentConfigPage />} />
            <Route path="/departments/:departmentId/subjects" element={<SubjectsPage />} />
            <Route path="/departments/:departmentId/faculty" element={<FacultyPage />} />
            <Route path="/departments/:departmentId/generate" element={<GeneratePage />} />
            <Route path="/departments/:departmentId/timetable" element={<TimetablePage />} />
            <Route path="/departments/:departmentId/faculty-timetable" element={<FacultyTimetablePage />} />
            <Route path="/departments/:departmentId/master-timetable" element={<MasterTimetablePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Toast />
    </div>
  );
}
