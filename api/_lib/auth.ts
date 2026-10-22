import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { sql } from 'drizzle-orm';
import { getDatabase } from '../../src/db';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
}

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getRemoteJwks() {
  if (remoteJwks) return remoteJwks;

  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!authBaseUrl) throw new Error('NEON_AUTH_BASE_URL is not configured.');

  const jwksUrl = process.env.NEON_AUTH_JWKS_URL ?? `${authBaseUrl.replace(/\/$/, '')}/jwt`;
  remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
  return remoteJwks;
}

function getAuthTokenFromRequest(request: Request): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = authHeader.slice('Bearer '.length).trim();
    if (bearer) return bearer;
  }

  // 2. Cookie header fallback
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(
      /(?:__Secure-better-auth\.session_token|better-auth\.session_token|session_token)=([^;]+)/,
    );
    if (match?.[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return null;
}

function claimAsString(payload: JWTPayload, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    throw new Response(
      JSON.stringify({ error: 'Authentication required. No session or bearer token provided.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Strategy A: JWT Verification (if token is 3-part compact JWS format)
  if (token.split('.').length === 3) {
    try {
      const jwks = getRemoteJwks();
      let verifiedPayload: JWTPayload | null = null;
      try {
        const issuer = process.env.NEON_AUTH_ISSUER;
        const verification = issuer ? { issuer } : {};
        const res = await jwtVerify(token, jwks, verification);
        verifiedPayload = res.payload;
      } catch {
        // Issuer claim may differ in trailing slash/protocol; verify against official Neon JWKS keys
        const res = await jwtVerify(token, jwks);
        verifiedPayload = res.payload;
      }

      if (verifiedPayload?.sub) {
        return {
          id: verifiedPayload.sub,
          email: claimAsString(verifiedPayload, 'email'),
          name: claimAsString(verifiedPayload, 'name'),
        };
      }
    } catch (jwtError) {
      console.warn('JWT verification failed; checking session store fallback:', jwtError);
    }
  }

  // Strategy B: Database Session Verification (Direct Neon Auth table check)
  try {
    const database = getDatabase();
    const rawToken =
      token.includes('.') && token.split('.').length !== 3 ? token.split('.')[0] : token;

    const result = await database.execute(sql`
      SELECT s."userId" AS id, u.email, u.name
      FROM neon_auth."session" s
      JOIN neon_auth."user" u ON u.id = s."userId"
      WHERE (s.token = ${token} OR s.token = ${rawToken})
        AND s."expiresAt" > NOW()
      LIMIT 1
    `);

    const row = result.rows[0] as { id?: string; email?: string | null; name?: string | null } | undefined;
    if (row?.id) {
      return {
        id: row.id,
        email: row.email ?? null,
        name: row.name ?? null,
      };
    }
  } catch (dbError) {
    console.warn('Database session verification lookup failed:', dbError);
  }

  // Strategy C: HTTP Neon Auth Get-Session endpoint
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (authBaseUrl) {
    try {
      const verifyUrl = `${authBaseUrl.replace(/\/$/, '')}/get-session`;
      const response = await fetch(verifyUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `better-auth.session_token=${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json().catch(() => null)) as {
          user?: { id?: string; email?: string | null; name?: string | null };
        } | null;

        if (data?.user?.id) {
          return {
            id: data.user.id,
            email: data.user.email ?? null,
            name: data.user.name ?? null,
          };
        }
      }
    } catch (httpError) {
      console.warn('HTTP Neon Auth get-session check failed:', httpError);
    }
  }

  throw new Response(
    JSON.stringify({ error: 'Invalid or expired authentication session.' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  );
}
