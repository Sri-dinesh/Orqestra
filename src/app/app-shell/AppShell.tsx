'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronDown } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { getActiveTerm } from '@/storage/term-manager';
import { AccountMenu } from '@/features/auth/AccountMenu';
import { SemesterSwitcherModal } from '@/components/ui/SemesterSwitcherModal';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from './ErrorBoundary';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const collegeName = useWorkspaceStore((s) => s.collegeDetails.name);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const activeTerm = getActiveTerm();

  const isPublicRoute = pathname === '/' || pathname.startsWith('/auth/');

  const navLinkCls = (targetPath: string) => {
    const isActive = pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath));
    return `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF] ${
      isActive ? 'bg-[#111315] text-white' : 'text-[#4B5259] hover:text-[#111315] hover:bg-black/5'
    }`;
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans">
      {!isPublicRoute && (
        <header className="sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <Link
                  href="/dashboard"
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
              <nav aria-label="Main navigation" className="flex items-center gap-1">
                <Link className={navLinkCls('/dashboard')} href="/dashboard">
                  Dashboard
                </Link>
                <Link className={navLinkCls('/departments')} href="/departments">
                  Configuration
                </Link>
                <Link className={navLinkCls('/schedule-portal')} href="/schedule-portal">
                  My Schedule
                </Link>
                <Link className={navLinkCls('/settings')} href="/settings">
                  Settings
                </Link>
                <AccountMenu />
              </nav>
            </div>
          </div>
        </header>
      )}

      <main
        className={`w-full ${isPublicRoute ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}
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
