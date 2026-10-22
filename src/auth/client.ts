import { createInternalNeonAuth } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

const neonAuthUrl =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ??
  process.env.VITE_NEON_AUTH_URL ??
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_NEON_AUTH_URL) ??
  '';

/**
 * Browser-side Neon Auth client.
 *
 * The internal wrapper gives the UI the React Better Auth client while also
 * exposing the short-lived JWT getter used by our server API boundary.
 */
export const neonAuth = createInternalNeonAuth(neonAuthUrl, {
  adapter: BetterAuthReactAdapter(),
});

export const authClient = neonAuth.adapter;

export async function getAuthToken(): Promise<string | null> {
  return neonAuth.getJWTToken();
}
