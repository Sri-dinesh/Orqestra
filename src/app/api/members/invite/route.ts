import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  institutionMembers,
  memberInvitations,
  userProfiles,
  type InstitutionRole,
} from '@/db/schema';
import {
  resolveInstitutionalContext,
  requireRole,
} from '@/auth/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const body = await request.json();

    const {
      email,
      role = 'FACULTY',
      departmentId = null,
      facultyId = null,
    }: {
      email: string;
      role: InstitutionRole;
      departmentId?: string | null;
      facultyId?: string | null;
    } = body;

    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return Response.json(
        { error: 'Valid recipient email address is required.' },
        { status: 400 },
      );
    }

    if (!['ADMIN', 'HOD', 'FACULTY'].includes(role)) {
      return Response.json(
        { error: 'Invalid role. Must be ADMIN, HOD, or FACULTY.' },
        { status: 400 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 1. Check if user already exists in userProfiles with this email
    const [existingProfile] = await database
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, trimmedEmail));

    if (existingProfile) {
      // Check if already an active member of this institution
      const [existingMember] = await database
        .select()
        .from(institutionMembers)
        .where(
          and(
            eq(institutionMembers.institutionId, context.institutionId),
            eq(institutionMembers.userId, existingProfile.id),
          ),
        );

      if (existingMember) {
        return Response.json(
          { error: 'This user is already a member of your institution.' },
          { status: 409 },
        );
      }

      // If existing user, we can immediately add them to institutionMembers!
      const memberId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const [newMember] = await database
        .insert(institutionMembers)
        .values({
          id: memberId,
          institutionId: context.institutionId,
          userId: existingProfile.id,
          role,
          departmentId,
          facultyId,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return Response.json({
        ok: true,
        member: {
          ...newMember,
          userName: existingProfile.name,
          userEmail: existingProfile.email,
        },
        message: `Member ${existingProfile.name || trimmedEmail} joined immediately.`,
      });
    }

    // 2. Otherwise create a pending invitation
    const inviteId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const token = `tok_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

    const [invitation] = await database
      .insert(memberInvitations)
      .values({
        id: inviteId,
        institutionId: context.institutionId,
        email: trimmedEmail,
        role,
        departmentId,
        facultyId,
        invitedBy: context.user.id,
        token,
        status: 'PENDING',
        expiresAt,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [memberInvitations.institutionId, memberInvitations.email],
        set: {
          role,
          departmentId,
          facultyId,
          token,
          status: 'PENDING',
          expiresAt,
        },
      })
      .returning();

    return Response.json({
      ok: true,
      invitation,
      message: `Invitation created for ${trimmedEmail}. They will join as ${role} when they sign in.`,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to invite member:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to send invitation' },
      { status: 500 },
    );
  }
}
