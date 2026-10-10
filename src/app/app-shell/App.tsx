import { useEffect } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { LandingPage } from "@/features/landing/LandingPage";
import { DepartmentConfigPage } from "@/features/departments/DepartmentConfigPage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { FacultyPage } from "@/features/faculty/FacultyPage";
import { GeneratePage } from "@/features/generation/GeneratePage";
import { TimetablePage } from "@/features/timetable-editor/TimetablePage";
import { FacultyTimetablePage } from "@/features/timetable-editor/FacultyTimetablePage";
import { MasterTimetablePage } from "@/features/timetable-editor/MasterTimetablePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { usePersistence } from "@/hooks/usePersistence";
import { useWorkspaceStore } from "@/state/stores/workspace-store";
import { Toast } from "@/components/ui/Toast";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF] ${
    isActive
      ? "bg-[#111315] text-white"
      : "text-[#4B5259] hover:text-[#111315] hover:bg-black/5"
  }`;

export default function App() {
  usePersistence();
  const location = useLocation();
  const collegeName = useWorkspaceStore((s) => s.collegeDetails.name);

  useEffect(() => {
    const path = location.pathname;
    let pageTitle = "Orqestra — Intelligent Academic Timetable Generator & Constraint Solver";

    if (path === "/dashboard") {
      pageTitle = "Dashboard — Orqestra";
    } else if (path.startsWith("/departments")) {
      if (path.includes("/subjects")) {
        pageTitle = "Subjects Management — Orqestra";
      } else if (path.includes("/faculty-timetable")) {
        pageTitle = "Faculty Timetable View — Orqestra";
      } else if (path.includes("/faculty")) {
        pageTitle = "Faculty Management — Orqestra";
      } else if (path.includes("/generate")) {
        pageTitle = "Generate Timetable — Orqestra";
      } else if (path.includes("/master-timetable")) {
        pageTitle = "Master Timetable — Orqestra";
      } else if (path.includes("/timetable")) {
        pageTitle = "Timetable Editor — Orqestra";
      } else {
        pageTitle = "Department Configuration — Orqestra";
      }
    } else if (path === "/settings") {
      pageTitle = "Settings — Orqestra";
    }

    document.title = pageTitle;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans">
      {location.pathname !== "/" && (
        <header className="sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[#111315] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF]"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111315] text-white text-[11px] font-bold"
                  aria-hidden="true"
                >
                  O
                </span>
                <span className="font-display text-lg font-bold tracking-tight">
                  Orqestra
                </span>
                {collegeName && (
                  <span className="hidden border-l border-[#E5E8E0] pl-2 text-xs font-normal text-[#71767B] sm:inline">
                    {collegeName}
                  </span>
                )}
              </Link>

              {/* Navigation */}
              <nav
                aria-label="Main navigation"
                className="flex items-center gap-1"
              >
                <NavLink className={navLinkCls} to="/dashboard">
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
          </div>
        </header>
      )}
      <main
        className={`mx-auto w-full ${location.pathname === "/" ? "" : "max-w-7xl px-4 sm:px-6 lg:px-8 py-8"}`}
        aria-live="polite"
      >
        {location.pathname === "/" ? (
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        ) : (
          <ErrorBoundary area="application">
            <Routes location={location}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/departments" element={<DepartmentConfigPage />} />
              <Route
                path="/departments/:departmentId/configuration"
                element={<DepartmentConfigPage />}
              />
              <Route
                path="/departments/:departmentId/subjects"
                element={<SubjectsPage />}
              />
              <Route
                path="/departments/:departmentId/faculty"
                element={<FacultyPage />}
              />
              <Route
                path="/departments/:departmentId/generate"
                element={<GeneratePage />}
              />
              <Route
                path="/departments/:departmentId/timetable"
                element={<TimetablePage />}
              />
              <Route
                path="/departments/:departmentId/faculty-timetable"
                element={<FacultyTimetablePage />}
              />
              <Route
                path="/departments/:departmentId/master-timetable"
                element={<MasterTimetablePage />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        )}
      </main>
      <Toast />
    </div>
  );
}
