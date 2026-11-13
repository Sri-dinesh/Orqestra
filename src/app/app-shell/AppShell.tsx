'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronDown, Menu, X } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { getActiveTerm } from '@/storage/term-manager';
import { AccountMenu } from '@/features/auth/AccountMenu';
import { SemesterSwitcherModal } from '@/components/ui/SemesterSwitcherModal';
import { ThemeToggleCompact, ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from './ErrorBoundary';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const collegeName = useWorkspaceStore((s) => s.collegeDetails.name);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTerm = getActiveTerm();

  const isLanding = pathname === '/';
  const isAuthRoute = pathname.startsWith('/auth/');
  const isInviteRoute = pathname.startsWith('/invite/');
  const isPublicRoute = isLanding || isAuthRoute || isInviteRoute;

  const navLinkCls = (targetPath: string) => {
    const isActive = pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath));
    return `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0] ${
      isActive ? 'bg-[#e8effc] text-[#3b6fe0]' : 'text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2]'
    }`;
  };

  return (
    <div
      className={
        isLanding
          ? 'landing-theme min-h-screen bg-[#f6f7f8] text-[#121417] font-sans'
          : isAuthRoute
            ? 'app-internal h-screen h-[100dvh] overflow-hidden bg-[#f6f7f8] text-[#121417]'
            : 'app-internal min-h-screen bg-[#f6f7f8] text-[#121417]'
      }
    >
      {!isPublicRoute && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e1e4e8] transition-all">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
                {/* Logo Brand */}
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 text-base font-bold tracking-tight text-[#121417] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0] shrink-0"
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

              {/* Desktop Navigation */}
              <nav aria-label="Main navigation" className="hidden md:flex items-center gap-0.5 lg:gap-1 shrink-0">
                <Link className={navLinkCls('/dashboard')} href="/dashboard">
                  Dashboard
                </Link>
                <Link className={navLinkCls('/departments')} href="/departments">
                  Departments
                </Link>
                <Link className={navLinkCls('/team')} href="/team">
                  Team
                </Link>
                <Link className={navLinkCls('/schedule-portal')} href="/schedule-portal">
                  My Schedule
                </Link>
                <Link className={navLinkCls('/settings')} href="/settings">
                  Settings
                </Link>
                <div className="ml-1 flex items-center gap-1.5 sm:ml-2">
                  <ThemeToggleCompact />
                  <AccountMenu />
                </div>
              </nav>

              {/* Mobile Right Controls */}
              <div className="flex md:hidden items-center gap-2 shrink-0">
                <ThemeToggleCompact />
                <AccountMenu />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  className="p-1.5 rounded-md border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] focus-visible:outline-2 focus-visible:outline-[#3b6fe0]"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] px-4 py-3 space-y-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                className={`block w-full ${navLinkCls('/dashboard')}`}
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                className={`block w-full ${navLinkCls('/departments')}`}
                href="/departments"
                onClick={() => setMobileMenuOpen(false)}
              >
                Departments
              </Link>
              <Link
                className={`block w-full ${navLinkCls('/team')}`}
                href="/team"
                onClick={() => setMobileMenuOpen(false)}
              >
                Team
              </Link>
              <Link
                className={`block w-full ${navLinkCls('/schedule-portal')}`}
                href="/schedule-portal"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Schedule
              </Link>
              <Link
                className={`block w-full ${navLinkCls('/settings')}`}
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <div className="pt-2 border-t border-[#e1e4e8] dark:border-[#2a2a2d]">
                <ThemeSwitcher size="sm" />
              </div>
            </div>
          )}
        </header>
      )}

      <main
        className={`w-full ${isAuthRoute ? 'h-full overflow-hidden' : isPublicRoute ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}
        aria-live="polite"
      >
        <ErrorBoundary area="application">{children}</ErrorBoundary>
      </main>

      <SemesterSwitcherModal
        isOpen={semesterModalOpen}
        onClose={() => setSemesterModalOpen(false)}
      />
      <Toast />
    </div>
  );
}
