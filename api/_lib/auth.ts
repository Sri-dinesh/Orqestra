import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { and, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../../src/db';
import { institutionMembers, type InstitutionRole } from '../../src/db/schema';

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

export interface InstitutionalContext {
  user: AuthenticatedUser;
  institutionId: string;
  role: InstitutionRole;
  departmentId: string | null;
  facultyId: string | null;
  isOwner: boolean;
}

export async function resolveInstitutionalContext(
  request: Request,
  targetInstitutionId?: string | null,
): Promise<InstitutionalContext> {
  const user = await requireAuthenticatedUser(request);
  const database = getDatabase();

  // If a specific institution is requested, check membership there
  if (targetInstitutionId) {
    const [membership] = await database
      .select()
      .from(institutionMembers)
      .where(
        and(
          eq(institutionMembers.userId, user.id),
          eq(institutionMembers.institutionId, targetInstitutionId),
          eq(institutionMembers.status, 'ACTIVE'),
        ),
      );

    if (membership) {
      return {
        user,
        institutionId: membership.institutionId,
        role: membership.role,
        departmentId: membership.departmentId,
        facultyId: membership.facultyId,
        isOwner: membership.institutionId === user.id,
      };
    }

    if (targetInstitutionId === user.id) {
      return {
        user,
        institutionId: user.id,
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        isOwner: true,
      };
    }

    throw new Response(
      JSON.stringify({ error: 'You are not an authorized member of this institution.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Otherwise find the active memberships for this user
  const memberships = await database
    .select()
    .from(institutionMembers)
    .where(
      and(
        eq(institutionMembers.userId, user.id),
        eq(institutionMembers.status, 'ACTIVE'),
      ),
    );

  if (memberships.length > 0) {
    // Prefer admin membership if available, otherwise first active membership
    const membership = memberships.find((m) => m.role === 'ADMIN') || memberships[0];
    return {
      user,
      institutionId: membership.institutionId,
      role: membership.role,
      departmentId: membership.departmentId,
      facultyId: membership.facultyId,
      isOwner: membership.institutionId === user.id,
    };
  }

  // Default: user is primary owner/ADMIN of their own institution
  return {
    user,
    institutionId: user.id,
    role: 'ADMIN',
    departmentId: null,
    facultyId: null,
    isOwner: true,
  };
}

export function requireRole(
  context: InstitutionalContext,
  allowedRoles: InstitutionRole[],
): void {
  if (!allowedRoles.includes(context.role)) {
    throw new Response(
      JSON.stringify({
        error: `Access denied. Requires one of: ${allowedRoles.join(', ')} (your role is ${context.role}).`,
        code: 'INSUFFICIENT_PERMISSIONS',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export function assertDepartmentAccess(
  context: InstitutionalContext,
  departmentId: string,
): void {
  if (context.role === 'ADMIN') return;

  if (context.role === 'HOD') {
    if (context.departmentId === departmentId) return;
    throw new Response(
      JSON.stringify({
        error: 'Access denied. You may only manage configurations and timetables for your assigned department.',
        code: 'DEPARTMENT_ACCESS_DENIED',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  throw new Response(
    JSON.stringify({
      error: 'Access denied. Department administration requires ADMIN or HOD role.',
      code: 'DEPARTMENT_ADMIN_REQUIRED',
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  );
}

export function assertFacultyAccess(
  context: InstitutionalContext,
  facultyId: string,
): void {
  if (context.role === 'ADMIN') return;
  if (context.role === 'HOD') return;

  if (context.role === 'FACULTY') {
    if (context.facultyId === facultyId) return;
    throw new Response(
      JSON.stringify({
        error: 'Access denied. You may only view and modify your own faculty profile and availability.',
        code: 'FACULTY_ACCESS_DENIED',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  throw new Response(
    JSON.stringify({
      error: 'Access denied. Unauthorized role.',
      code: 'UNAUTHORIZED_ROLE',
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  );
}
