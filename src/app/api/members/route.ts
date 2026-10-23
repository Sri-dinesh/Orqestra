import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  institutionMembers,
  memberInvitations,
  userProfiles,
} from '@/db/schema';
import {
  resolveInstitutionalContext,
} from '@/auth/server';
import { createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  try {
    const context = await resolveInstitutionalContext(request);
    const database = getDatabase();

    // 1. Fetch active members with user profile details
    const membersData = await database
      .select({
        id: institutionMembers.id,
        institutionId: institutionMembers.institutionId,
        userId: institutionMembers.userId,
        role: institutionMembers.role,
        departmentId: institutionMembers.departmentId,
        facultyId: institutionMembers.facultyId,
        status: institutionMembers.status,
        createdAt: institutionMembers.createdAt,
        updatedAt: institutionMembers.updatedAt,
        userName: userProfiles.name,
        userEmail: userProfiles.email,
      })
      .from(institutionMembers)
      .leftJoin(userProfiles, eq(institutionMembers.userId, userProfiles.id))
      .where(
        and(
          eq(institutionMembers.institutionId, context.institutionId),
          eq(institutionMembers.status, 'ACTIVE'),
        ),
      );

    // 2. Fetch pending invitations (only ADMIN can see invitation tokens; others see sanitized data)
    const rawInvitations = await database
      .select()
      .from(memberInvitations)
      .where(
        and(
          eq(memberInvitations.institutionId, context.institutionId),
          eq(memberInvitations.status, 'PENDING'),
        ),
      );

    const isAdmin = context.role === 'ADMIN';
    const invitations = rawInvitations.map((inv) => ({
      ...inv,
      // Strip token if user is not an institutional admin
      token: isAdmin ? inv.token : undefined,
    }));

    // If owner is not yet in institutionMembers, represent them as primary Admin
    const ownerIncluded = membersData.some((m) => m.userId === context.institutionId);
    let allMembers = membersData;

    if (!ownerIncluded) {
      const [ownerProfile] = await database
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, context.institutionId));

      allMembers = [
        {
          id: `owner_${context.institutionId}`,
          institutionId: context.institutionId,
          userId: context.institutionId,
          role: 'ADMIN',
          departmentId: null,
          facultyId: null,
          status: 'ACTIVE',
          createdAt: ownerProfile?.createdAt || new Date(),
          updatedAt: ownerProfile?.updatedAt || new Date(),
          userName: ownerProfile?.name || context.user.name || 'Institution Owner',
          userEmail: ownerProfile?.email || context.user.email,
        },
        ...membersData,
      ];
    }

    return Response.json(
      {
        context,
        members: allMembers,
        invitations,
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
    return createErrorResponse(error, 'Failed to list members');
  }
}
