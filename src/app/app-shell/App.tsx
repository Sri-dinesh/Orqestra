import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DepartmentConfigPage } from '@/features/departments/DepartmentConfigPage';
import { SubjectsPage } from '@/features/subjects/SubjectsPage';
import { FacultyPage } from '@/features/faculty/FacultyPage';
import { GeneratePage } from '@/features/generation/GeneratePage';
import { TimetablePage } from '@/features/timetable-editor/TimetablePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { usePersistence } from '@/hooks/usePersistence';
import { Toast } from '@/components/ui/Toast';

export default function App() {
  usePersistence();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Workspace Timetable System';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-slate-900">
            WTS — Timetable System
          </Link>
          <nav aria-label="Main navigation" className="flex gap-4 text-sm">
            <Link className="text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" to="/">Dashboard</Link>
            <Link className="text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" to="/departments">Configuration</Link>
            <Link className="text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" to="/settings">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6" aria-live="polite">
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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Toast />
    </div>
  );
}
