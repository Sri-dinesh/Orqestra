import { eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  institutionMembers,
  memberInvitations,
  userProfiles,
} from '@/db/schema';
import { requireAuthenticatedUser } from '@/auth/server';
import { enforceRateLimit, createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  props: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    enforceRateLimit(request, { maxRequests: 20, windowSeconds: 60, keyPrefix: 'inv-accept' });

    const user = await requireAuthenticatedUser(request);
    const params = await props.params;
    const token = params.token;

    if (!token || typeof token !== 'string' || token.length > 128) {
      return Response.json(
        { error: 'Invalid invitation token format.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    const database = getDatabase();
    const now = new Date();

    // 1. Ensure user profile exists to satisfy foreign key constraints
    await database
      .insert(userProfiles)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userProfiles.id,
        set: {
          email: user.email,
          name: user.name,
          updatedAt: now,
        },
      });

    // 2. Look up the pending invitation
    const [invitation] = await database
      .select()
      .from(memberInvitations)
      .where(eq(memberInvitations.token, token));

    if (!invitation) {
      return Response.json(
        { error: 'Invitation not found. Please ask your administrator to send a new invite link.' },
        { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    if (invitation.status === 'ACCEPTED') {
      return Response.json(
        { error: 'This invitation has already been accepted.' },
        { status: 410, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    if (invitation.status === 'REVOKED' || new Date(invitation.expiresAt) < now) {
      return Response.json(
        { error: 'This invitation has expired or been revoked.' },
        { status: 410, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } },
      );
    }

    // 3. Insert or update the member record in institutionMembers
    const memberId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const [member] = await database
      .insert(institutionMembers)
      .values({
        id: memberId,
        institutionId: invitation.institutionId,
        userId: user.id,
        role: invitation.role,
        departmentId: invitation.departmentId,
        facultyId: invitation.facultyId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [institutionMembers.institutionId, institutionMembers.userId],
        set: {
          role: invitation.role,
          departmentId: invitation.departmentId,
          facultyId: invitation.facultyId,
          status: 'ACTIVE',
          updatedAt: now,
        },
      })
      .returning();

    // 4. Mark invitation as ACCEPTED
    await database
      .update(memberInvitations)
      .set({ status: 'ACCEPTED' })
      .where(eq(memberInvitations.id, invitation.id));

    return Response.json(
      {
        ok: true,
        membership: {
          id: member.id,
          role: member.role,
          institutionId: member.institutionId,
          departmentId: member.departmentId,
          facultyId: member.facultyId,
        },
        message: `Successfully joined as ${member.role}.`,
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
    return createErrorResponse(error, 'Failed to accept invitation.');
  }
}
