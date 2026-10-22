import { useState, useEffect } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Calendar, ChevronDown } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { LandingPage } from "@/features/landing/LandingPage";
import { DepartmentConfigPage } from "@/features/departments/DepartmentConfigPage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { FacultyPage } from "@/features/faculty/FacultyPage";
import { RoomsPage } from "@/features/rooms/RoomsPage";
import { GeneratePage } from "@/features/generation/GeneratePage";
import { TimetablePage } from "@/features/timetable-editor/TimetablePage";
import { FacultyTimetablePage } from "@/features/timetable-editor/FacultyTimetablePage";
import { MasterTimetablePage } from "@/features/timetable-editor/MasterTimetablePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { SchedulePortalPage } from "@/features/portal/SchedulePortalPage";
import { NotFoundPage } from "@/components/ui/NotFoundPage";
import { useWorkspaceStore } from "@/state/stores/workspace-store";
import { Toast } from "@/components/ui/Toast";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { SemesterSwitcherModal } from "@/components/ui/SemesterSwitcherModal";
import { getActiveTerm } from "@/storage/term-manager";
import { AuthPage } from "@/features/auth/AuthPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AccountMenu } from "@/features/auth/AccountMenu";

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF] ${
    isActive
      ? "bg-[#111315] text-white"
      : "text-[#4B5259] hover:text-[#111315] hover:bg-black/5"
  }`;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const collegeName = useWorkspaceStore((s) => s.collegeDetails.name);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const activeTerm = getActiveTerm();

  // Restore SPA redirects from 404.html (for static hosting environments like GitHub Pages)
  useEffect(() => {
    try {
      const redirect = sessionStorage.getItem("spa_redirect");
      if (redirect) {
        sessionStorage.removeItem("spa_redirect");
        if (redirect !== "/" && redirect !== location.pathname) {
          navigate(redirect, { replace: true });
        }
      }
    } catch {
      // sessionStorage may be blocked or unavailable in rare restricted contexts
    }
  }, [navigate, location.pathname]);

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
      } else if (path.includes("/rooms")) {
        pageTitle = "Rooms & Laboratories — Orqestra";
      } else if (path.includes("/generate")) {
        pageTitle = "Generate Timetable — Orqestra";
      } else if (path.includes("/master-timetable")) {
        pageTitle = "Master Timetable — Orqestra";
      } else if (path.includes("/timetable")) {
        pageTitle = "Timetable Editor — Orqestra";
      } else {
        pageTitle = "Department Configuration — Orqestra";
      }
    } else if (path === "/schedule-portal") {
      pageTitle = "My Schedule Portal — Orqestra";
    } else if (path === "/settings") {
      pageTitle = "Settings — Orqestra";
    }

    document.title = pageTitle;
  }, [location.pathname]);

  const isLanding = location.pathname === "/";
  const isPublicRoute = isLanding || location.pathname.startsWith("/auth/");

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans">
      {!isPublicRoute && (
        <header className="sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
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

                {/* Academic Semester Switcher */}
                <button
                  type="button"
                  onClick={() => setSemesterModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#111315] bg-white border border-[#D0D5DD] hover:border-[#0047FF] hover:bg-blue-50/40 rounded-xl transition-all shadow-xs cursor-pointer ml-1 sm:ml-2"
                  title="Switch or duplicate academic semester"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0047FF]" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">
                    {activeTerm.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#71767B]" />
                </button>
              </div>

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
                <NavLink className={navLinkCls} to="/schedule-portal">
                  My Schedule
                </NavLink>
                <NavLink className={navLinkCls} to="/settings">
                  Settings
                </NavLink>
                <AccountMenu />
              </nav>
            </div>
          </div>
        </header>
      )}

      <main
        className={`w-full ${isPublicRoute ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"}`}
        aria-live="polite"
      >
        <ErrorBoundary area="application">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/sign-in" element={<AuthPage pathname="SIGN_IN" />} />
            <Route path="/auth/sign-up" element={<AuthPage pathname="SIGN_UP" />} />
            <Route path="/auth/forgot-password" element={<AuthPage pathname="FORGOT_PASSWORD" />} />
            <Route path="/auth/reset-password" element={<AuthPage pathname="RESET_PASSWORD" />} />

            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/departments" element={<DepartmentConfigPage />} />
              <Route
                path="/departments/:departmentId"
                element={<Navigate to="configuration" replace />}
              />
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
                path="/departments/:departmentId/rooms"
                element={<RoomsPage />}
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
              <Route path="/schedule-portal" element={<SchedulePortalPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <SemesterSwitcherModal
        isOpen={semesterModalOpen}
        onClose={() => setSemesterModalOpen(false)}
      />
      <Toast />
    </div>
  );
}
