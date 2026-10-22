import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  departments,
  institutionMembers,
  memberInvitations,
} from '@/db/schema';
import {
  requireAuthenticatedUser,
  resolveInstitutionalContext,
} from '@/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();

    // Check if user has any pending invitation matching their verified email
    if (user.email) {
      const pendingInvites = await database
        .select()
        .from(memberInvitations)
        .where(
          and(
            eq(memberInvitations.email, user.email.toLowerCase()),
            eq(memberInvitations.status, 'PENDING'),
          ),
        );

      for (const inv of pendingInvites) {
        if (new Date(inv.expiresAt) > new Date()) {
          // Activate membership!
          const memberId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          await database
            .insert(institutionMembers)
            .values({
              id: memberId,
              institutionId: inv.institutionId,
              userId: user.id,
              role: inv.role,
              departmentId: inv.departmentId,
              facultyId: inv.facultyId,
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [institutionMembers.institutionId, institutionMembers.userId],
              set: {
                role: inv.role,
                departmentId: inv.departmentId,
                facultyId: inv.facultyId,
                status: 'ACTIVE',
                updatedAt: new Date(),
              },
            });

          // Mark invitation as accepted
          await database
            .update(memberInvitations)
            .set({ status: 'ACCEPTED' })
            .where(eq(memberInvitations.id, inv.id));
        }
      }
    }

    const context = await resolveInstitutionalContext(request);

    // Fetch department details if scoped to a department
    let department = null;
    if (context.departmentId) {
      const [deptRecord] = await database
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.userId, context.institutionId),
            eq(departments.id, context.departmentId),
          ),
        );
      department = deptRecord || null;
    }

    return Response.json({
      ok: true,
      context,
      user,
      department,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to get member profile:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve profile' },
      { status: 500 },
    );
  }
}
