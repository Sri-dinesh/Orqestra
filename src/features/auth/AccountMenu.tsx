import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Settings, Calendar, ChevronDown, ShieldCheck, Users } from 'lucide-react';
import { authClient } from '@/auth/client';
import { useAuthSession, notifyAuthChange } from '@/auth/session';
import { clearInMemoryWorkspace } from '@/hooks/usePersistence';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

export function AccountMenu() {
  const navigate = useNavigate();
  const { data } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const membership = useWorkspaceStore((s) => s.membership);
  const departments = useWorkspaceStore((s) => s.departments);
  const role = membership?.role ?? 'ADMIN';
  const assignedDept = membership?.departmentId
    ? departments.find((d) => d.id === membership.departmentId)
    : null;
  const deptLabel = assignedDept ? assignedDept.code || assignedDept.name : null;

  const userName = data?.user?.name || '';
  const userEmail = data?.user?.email || '';
  const displayName = userName || userEmail || 'Account';

  // Compute initials (up to 2 letters)
  const initials = (userName || userEmail || 'U')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'U';

  // Close on click outside and escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      clearInMemoryWorkspace();
      notifyAuthChange();
      setIsOpen(false);
      navigate('/auth/sign-in', { replace: true });
    } catch (error) {
      console.error('Failed to sign out cleanly:', error);
      clearInMemoryWorkspace();
      navigate('/auth/sign-in', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!data?.session || !data?.user) {
    return (
      <Link
        to="/auth/sign-in"
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#111315] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF]"
      >
        <span>Sign In</span>
      </Link>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="account-menu-button"
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111315] shadow-xs transition hover:border-[#0047FF] hover:bg-blue-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF]"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#111315] to-[#30363D] text-[11px] font-bold text-white shadow-xs"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="hidden max-w-[130px] truncate text-left text-xs font-medium text-[#111315] sm:inline">
          {displayName}
        </span>
        {role === 'ADMIN' ? (
          <span className="hidden rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-500/20 sm:inline">
            Admin
          </span>
        ) : role === 'HOD' ? (
          <span className="hidden rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-500/20 sm:inline">
            HOD {deptLabel ? `· ${deptLabel}` : ''}
          </span>
        ) : (
          <span className="hidden rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/20 sm:inline">
            Faculty
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#71767B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="account-menu-button"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-[#E5E8E0] bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* User Identity Card */}
          <div className="rounded-xl bg-[#F7F8F5] p-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#111315] text-xs font-bold text-white shadow-xs">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#111315]" title={displayName}>
                  {displayName}
                </p>
                {userEmail && (
                  <p className="truncate text-[11px] text-[#71767B]" title={userEmail}>
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-[#E5E8E0] pt-2 text-[10px] font-medium text-[#71767B]">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-800">
                  {role === 'ADMIN'
                    ? 'Institution Admin'
                    : role === 'HOD'
                    ? `HOD · ${deptLabel || 'Dept'}`
                    : 'Teaching Faculty'}
                </span>
                <span className="hidden sm:inline">· Institutional Workspace Active</span>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-[#71767B]">{role}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-1 space-y-0.5">
            <Link
              to="/settings#role"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#30363D] hover:bg-black/5 hover:text-[#111315] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-[#0047FF]" />
              <span>Adjust Role & Permissions</span>
            </Link>

            {role === 'ADMIN' && (
              <Link
                to="/settings?tab=team"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#30363D] hover:bg-black/5 hover:text-[#111315] transition-colors"
              >
                <Users className="h-4 w-4 text-[#71767B]" />
                <span>Team & Access Control</span>
              </Link>
            )}

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#30363D] hover:bg-black/5 hover:text-[#111315] transition-colors"
            >
              <Settings className="h-4 w-4 text-[#71767B]" />
              <span>Workspace Settings</span>
            </Link>

            <Link
              to="/schedule-portal"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#30363D] hover:bg-black/5 hover:text-[#111315] transition-colors"
            >
              <Calendar className="h-4 w-4 text-[#71767B]" />
              <span>My Schedule Portal</span>
            </Link>
          </div>

          {/* Security & Neon Info */}
          <div className="my-1 border-t border-[#E5E8E0]" />
          <div className="px-2.5 py-1 text-[11px] text-[#71767B] flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Neon Auth Protected</span>
          </div>

          <div className="my-1 border-t border-[#E5E8E0]" />

          {/* Sign Out Action */}
          <button
            type="button"
            role="menuitem"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 text-left"
          >
            {isSigningOut ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                <span>Signing out…</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 text-rose-600" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
