'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronDown, Menu, X } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { getActiveTerm } from '@/storage/term-manager';
import { AccountMenu } from '@/features/auth/AccountMenu';
import { SemesterSwitcherModal } from '@/components/ui/SemesterSwitcherModal';
import { CloudSyncBadge } from '@/components/ui/CloudSyncBadge';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from './ErrorBoundary';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const collegeName = useWorkspaceStore((s) => s.collegeDetails.name);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTerm = getActiveTerm();

  const isPublicRoute = pathname === '/' || pathname.startsWith('/auth/');

  const navLinkCls = (targetPath: string) => {
    const isActive = pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath));
    return `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF] ${
      isActive ? 'bg-[#111315] text-white shadow-2xs' : 'text-[#4B5259] hover:text-[#111315] hover:bg-black/5'
    }`;
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans">
      {!isPublicRoute && (
        <header className="sticky top-0 z-50 bg-[#F7F8F5]/98 backdrop-blur-md border-b border-[#E5E8E0] shadow-2xs transition-all">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Logo Brand */}
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2.5 text-base font-bold tracking-tight text-[#111315] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF] shrink-0"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111315] text-white text-[11px] font-bold shadow-xs transition-transform group-hover:scale-105"
                    aria-hidden="true"
                  >
                    O
                  </span>
                  <span className="font-display text-lg font-bold tracking-tight text-[#111315]">
                    Orqestra
                  </span>
                  {collegeName && (
                    <span
                      className="hidden md:inline border-l border-[#E5E8E0] pl-2.5 text-xs font-normal text-[#71767B] truncate max-w-[140px] lg:max-w-[240px]"
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
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#111315] bg-white border border-[#D0D5DD] hover:border-[#0047FF] hover:bg-blue-50/40 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                  title="Switch or duplicate academic semester"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0047FF] shrink-0" />
                  <span className="truncate max-w-[100px] sm:max-w-[150px] lg:max-w-[200px]">
                    {activeTerm.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#71767B] shrink-0" />
                </button>
              </div>

              {/* Desktop Navigation */}
              <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 shrink-0">
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
                <div className="ml-1 sm:ml-2 mr-1">
                  <CloudSyncBadge />
                </div>
                <AccountMenu />
              </nav>

              {/* Mobile Right Controls */}
              <div className="flex md:hidden items-center gap-2 shrink-0">
                <CloudSyncBadge />
                <AccountMenu />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  className="p-1.5 rounded-xl border border-[#D0D5DD] bg-white text-[#111315] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#0047FF]"
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
            <div className="md:hidden border-t border-[#E5E8E0] bg-[#F7F8F5] px-4 py-3 space-y-1 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
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
                Configuration
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
            </div>
          )}
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
