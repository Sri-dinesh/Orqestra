import { useState, useEffect } from "react";
import {
  Link,
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
import { DepartmentsPage } from "@/features/departments/DepartmentsPage";
import { DepartmentHomePage } from "@/features/departments/DepartmentHomePage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { FacultyPage } from "@/features/faculty/FacultyPage";
import { RoomsPage } from "@/features/rooms/RoomsPage";
import { GeneratePage } from "@/features/generation/GeneratePage";
import { TimetablePage } from "@/features/timetable-editor/TimetablePage";
import { FacultyTimetablePage } from "@/features/timetable-editor/FacultyTimetablePage";
import { MasterTimetablePage } from "@/features/timetable-editor/MasterTimetablePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { TeamPage } from "@/features/team/TeamPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { InviteAcceptancePage } from "@/features/invite/InviteAcceptancePage";
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
  `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0] ${
    isActive
      ? "bg-[#e8effc] text-[#3b6fe0]"
      : "text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2]"
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
    } else if (path === "/team") {
      pageTitle = "Team & Access Control — Orqestra";
    } else if (path === "/profile") {
      pageTitle = "My Profile & Operational Role — Orqestra";
    } else if (path === "/schedule-portal") {
      pageTitle = "My Schedule Portal — Orqestra";
    } else if (path === "/settings") {
      pageTitle = "Settings — Orqestra";
    }

    document.title = pageTitle;
  }, [location.pathname]);

  const isLanding = location.pathname === "/";
  const isAuthRoute = location.pathname.startsWith("/auth/");
  const isInviteRoute = location.pathname.startsWith("/invite/");
  const isPublicRoute = isLanding || isAuthRoute || isInviteRoute;

  return (
    <div
      className={
        isLanding
          ? "landing-theme min-h-screen bg-[#f6f7f8] text-[#121417] font-sans"
          : isAuthRoute
            ? "app-internal h-screen h-[100dvh] overflow-hidden bg-[#f6f7f8] text-[#121417]"
            : "app-internal min-h-screen bg-[#f6f7f8] text-[#121417]"
      }
    >
      {!isPublicRoute && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e1e4e8] transition-all">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Logo */}
                <Link
                  to="/dashboard"
                  className="group flex items-center gap-2.5 text-base font-bold tracking-tight text-[#121417] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0] shrink-0"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#121417] text-white text-[11px] font-bold shadow-xs transition-transform group-hover:scale-105"
                    aria-hidden="true"
                  >
                    O
                  </span>
                  <span className="font-['Geist',ui-sans-serif,sans-serif] text-lg font-bold tracking-tight text-[#121417]">
                    Orqestra
                  </span>
                  {collegeName && (
                    <span
                      className="hidden xl:inline border-l border-[#e1e4e8] pl-2.5 text-xs font-normal text-[#5b616b] truncate max-w-[160px]"
                      title={collegeName}
                    >
                      {collegeName}
                    </span>
                  )}
                </Link>

                {/* Academic Semester Switcher */}
                <button
                  type="button"
                  onClick={() => setSemesterModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#121417] bg-[#f6f7f8] border border-[#e1e4e8] hover:border-[#3b6fe0] hover:bg-[#eef0f2] rounded-md transition-all cursor-pointer min-w-0 max-w-[130px] sm:max-w-[170px] lg:max-w-[210px] shrink"
                  title={`Academic Semester: ${activeTerm.name}`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#3b6fe0] shrink-0" />
                  <span className="truncate">
                    {activeTerm.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#5b616b] shrink-0" />
                </button>
              </div>

              {/* Navigation */}
              <nav
                aria-label="Main navigation"
                className="flex items-center gap-0.5 lg:gap-1 shrink-0"
              >
                <NavLink className={navLinkCls} to="/dashboard">
                  Dashboard
                </NavLink>
                <NavLink className={navLinkCls} to="/departments">
                  Departments
                </NavLink>
                <NavLink className={navLinkCls} to="/team">
                  Team
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
        className={`w-full ${isAuthRoute ? 'h-full overflow-hidden' : isPublicRoute ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"}`}
        aria-live="polite"
      >
        <ErrorBoundary area="application">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/sign-in" element={<AuthPage pathname="SIGN_IN" />} />
            <Route path="/auth/sign-up" element={<AuthPage pathname="SIGN_UP" />} />
            <Route path="/auth/forgot-password" element={<AuthPage pathname="FORGOT_PASSWORD" />} />
            <Route path="/auth/reset-password" element={<AuthPage pathname="RESET_PASSWORD" />} />
            <Route path="/invite/:token" element={<InviteAcceptancePage />} />

            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              <Route path="/departments" element={<DepartmentsPage />} />
              <Route
                path="/departments/:departmentId"
                element={<DepartmentHomePage />}
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
