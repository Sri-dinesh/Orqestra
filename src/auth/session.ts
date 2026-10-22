import { useEffect, useState, useCallback } from 'react';
import { authClient } from './client';

export type AuthSessionResult = Awaited<ReturnType<typeof authClient.getSession>>;
export type AuthSessionData = AuthSessionResult['data'];

const AUTH_CHANGE_EVENT = 'orqestra:auth-change';

/**
 * Dispatches an auth state change event across the application and concurrent browser tabs.
 */
export function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
    try {
      // Trigger cross-tab storage event
      localStorage.setItem('orqestra_auth_pulse', String(Date.now()));
    } catch {
      // localStorage may be restricted or blocked in private mode
    }
  }
}

export function useAuthSession() {
  const [state, setState] = useState<{
    data: AuthSessionData;
    isPending: boolean;
    error: Error | null;
  }>({
    data: null,
    isPending: true,
    error: null,
  });

  const checkSession = useCallback(async (isMounted: () => boolean) => {
    try {
      const result = await authClient.getSession();
      if (!isMounted()) return;
      setState({
        data: result.data,
        isPending: false,
        error: result.error ? new Error(result.error.message) : null,
      });
    } catch (error: unknown) {
      if (!isMounted()) return;
      setState({
        data: null,
        isPending: false,
        error: error instanceof Error ? error : new Error('Unable to check the authentication session.'),
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const isMounted = () => active;

    void checkSession(isMounted);

    const handleAuthChange = () => {
      void checkSession(isMounted);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'orqestra_auth_pulse') {
        void checkSession(isMounted);
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [checkSession]);

  const refetch = useCallback(() => {
    const active = true;
    return checkSession(() => active);
  }, [checkSession]);

  return { ...state, refetch };
}
