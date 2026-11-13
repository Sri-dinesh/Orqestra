import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { RefreshCw, LogIn, ShieldAlert } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { syncCurrentUser } from '@/auth/server-api';
import { useAuthSession } from '@/auth/session';
import { usePersistence } from '@/hooks/usePersistence';

function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f8] px-4">
      <div className="flex flex-col items-center text-center">
        {/* Brand Logo */}
        <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
          <BrandLogo size={48} className="w-12 h-12 rounded-lg" />
          <span className="absolute -inset-1 -z-10 animate-ping rounded-lg bg-[#3b6fe0]/20" />
        </div>

        <h2 className="text-base font-semibold text-[#121417]">Verifying secure session</h2>
        <p className="mt-1.5 max-w-xs text-xs text-[#5b616b]">
          Connecting to your institutional timetable workspace…
        </p>

        {/* Indeterminate loader bar */}
        <div className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-[#e1e4e8]">
          <div className="h-full w-24 animate-[shimmer_1.5s_infinite] rounded-full bg-[#3b6fe0]" />
        </div>
      </div>
    </div>
  );
}

function AuthBootstrap({ userId, children }: { userId: string; children: ReactNode }) {
  const [status, setStatus] = useState<'LOADING' | 'READY'>('LOADING');

  usePersistence(userId);

  useEffect(() => {
    let active = true;
    void syncCurrentUser()
      .then(() => {
        if (active) setStatus('READY');
      })
      .catch((error: unknown) => {
        // Authentication has already succeeded. The profile sync is an
        // application bootstrap task and must not lock a user out while the
        // timetable workspace is local-backed.
        console.warn('Orqestra profile sync is unavailable; continuing in local workspace mode.', error);
        if (active) setStatus('READY');
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (status === 'LOADING') return <AuthLoading />;

  return <>{children}</>;
}

function RequireAuthContent({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isPending, error, refetch } = useAuthSession();

  if (isPending) return <AuthLoading />;

  if (error) {
    const isMissingEnv =
      !process.env.NEXT_PUBLIC_NEON_AUTH_URL &&
      !(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_NEON_AUTH_URL);

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8] px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-[#e1e4e8] bg-white p-6 sm:p-8 text-center shadow-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-lg font-bold tracking-tight text-[#121417]">
            Authentication Service Unavailable
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-[#5b616b]">
            {isMissingEnv
              ? 'VITE_NEON_AUTH_URL is not configured in your environment. Please ensure Neon Auth Base URL is configured in .env.local.'
              : error.message || 'We were unable to verify your active session with Neon Auth. Please check your network or try reconnecting.'}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#3b6fe0] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#2e5ccb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Session</span>
            </button>

            <Link
              to="/auth/sign-in"
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#e1e4e8] bg-[#f6f7f8] px-4 py-2 text-xs font-medium text-[#121417] transition hover:bg-[#eef0f2]"
            >
              <LogIn className="h-3.5 w-3.5 text-[#5b616b]" />
              <span>Go to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.session || !data.user) {
    const targetUrl = `${location.pathname}${location.search}`;
    return <Navigate to="/auth/sign-in" replace state={{ from: targetUrl }} />;
  }

  return (
    <AuthBootstrap key={data.user.id} userId={data.user.id}>
      {children}
    </AuthBootstrap>
  );
}

export function RequireAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RequireAuthContent>{children}</RequireAuthContent>
    </Suspense>
  );
}

export function RequireAuth() {
  return (
    <RequireAuthWrapper>
      <Outlet />
    </RequireAuthWrapper>
  );
}
