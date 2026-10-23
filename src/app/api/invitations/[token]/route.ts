import { eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  collegeProfiles,
  departments,
  memberInvitations,
  userProfiles,
} from '@/db/schema';
import { enforceRateLimit, createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    enforceRateLimit(request, { maxRequests: 60, windowSeconds: 60, keyPrefix: 'inv-lookup' });

    const params = await props.params;
    const token = params.token;

    if (!token || typeof token !== 'string' || token.length > 128) {
      return Response.json(
        { valid: false, error: 'Invalid invitation token format.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    const database = getDatabase();

    // 1. Look up invitation by token
    const [invitation] = await database
      .select()
      .from(memberInvitations)
      .where(eq(memberInvitations.token, token));

    if (!invitation) {
      return Response.json(
        { valid: false, error: 'Invitation not found. The link may have expired or been revoked.' },
        { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    const now = new Date();
    const isExpired = new Date(invitation.expiresAt) < now;

    if (invitation.status === 'ACCEPTED') {
      return Response.json(
        {
          valid: false,
          status: 'ACCEPTED',
          error: 'This invitation has already been accepted.',
        },
        { status: 410, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    if (invitation.status === 'REVOKED' || isExpired) {
      return Response.json(
        {
          valid: false,
          status: isExpired ? 'EXPIRED' : 'REVOKED',
          error: isExpired
            ? 'This invitation link has expired. Please ask your administrator to send a new invite.'
            : 'This invitation link has been revoked by the administrator.',
        },
        { status: 410, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    // 2. Fetch institution descriptive details
    const [collegeProfile] = await database
      .select()
      .from(collegeProfiles)
      .where(eq(collegeProfiles.userId, invitation.institutionId));

    const [ownerProfile] = await database
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, invitation.institutionId));

    let departmentName: string | null = null;
    if (invitation.departmentId) {
      const [dept] = await database
        .select()
        .from(departments)
        .where(eq(departments.id, invitation.departmentId));
      if (dept) {
        departmentName = dept.name ? `${dept.code} · ${dept.name}` : dept.code;
      }
    }

    const institutionName =
      collegeProfile?.name ||
      ownerProfile?.name ||
      'Academic Institution';

    return Response.json(
      {
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          institutionId: invitation.institutionId,
          institutionName,
          institutionCode: collegeProfile?.code || null,
          logoDataUrl: collegeProfile?.logoDataUrl || null,
          departmentId: invitation.departmentId,
          departmentName,
          facultyId: invitation.facultyId,
          expiresAt: invitation.expiresAt.toISOString(),
          status: invitation.status,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to verify invitation.');
  }
}
