import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { RefreshCw, LogIn, ShieldAlert } from 'lucide-react';
import { syncCurrentUser } from '@/auth/server-api';
import { useAuthSession } from '@/auth/session';
import { usePersistence } from '@/hooks/usePersistence';

function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8F5] px-4">
      <div className="flex flex-col items-center text-center">
        {/* Animated Brand Monogram */}
        <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111315] text-xl font-bold text-white shadow-md">
          <span>O</span>
          <span className="absolute -inset-1.5 -z-10 animate-ping rounded-2xl bg-[#0047FF]/20" />
        </div>

        <h2 className="text-base font-semibold text-[#111315]">Verifying secure session</h2>
        <p className="mt-1.5 max-w-xs text-xs text-[#71767B]">
          Connecting to your institutional timetable workspace…
        </p>

        {/* Indeterminate loader bar */}
        <div className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-[#E5E8E0]">
          <div className="h-full w-24 animate-[shimmer_1.5s_infinite] rounded-full bg-[#0047FF]" />
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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F5] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-amber-200/80 bg-white p-6 sm:p-8 text-center shadow-lg shadow-amber-500/5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-lg font-bold tracking-tight text-[#111315]">
            Authentication Service Unavailable
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-[#4B5259]">
            {isMissingEnv
              ? 'VITE_NEON_AUTH_URL is not configured in your environment. Please ensure Neon Auth Base URL is configured in .env.local.'
              : error.message || 'We were unable to verify your active session with Neon Auth. Please check your network or try reconnecting.'}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#111315] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Session</span>
            </button>

            <Link
              to="/auth/sign-in"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D0D5DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] transition hover:bg-black/5"
            >
              <LogIn className="h-3.5 w-3.5 text-[#71767B]" />
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
