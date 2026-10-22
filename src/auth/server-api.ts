import { getAuthToken, authClient } from './client';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppUserProfile = UserProfile;

const PROFILE_SYNC_ATTEMPTS = 3;
const PROFILE_SYNC_RETRY_DELAY_MS = 500;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function syncCurrentUser(): Promise<UserProfile> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= PROFILE_SYNC_ATTEMPTS; attempt += 1) {
    try {
      // 1. Try getAuthToken() first
      let token = await getAuthToken();

      // 2. Fall back to active session token from authClient
      if (!token) {
        const sessionResult = await authClient.getSession().catch(() => null);
        token = sessionResult?.data?.session?.token ?? null;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const body = (await response.json().catch(() => ({}))) as {
        user?: UserProfile;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? `User profile sync failed with status ${response.status}.`);
      }

      if (!body.user) throw new Error('Authentication returned no user profile.');
      return body.user;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error('User profile sync failed.');
      if (attempt < PROFILE_SYNC_ATTEMPTS) await wait(PROFILE_SYNC_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError ?? new Error('User profile sync failed.');
}
