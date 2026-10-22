import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  institutionMembers,
  memberInvitations,
  type InstitutionRole,
} from '@/db/schema';
import {
  resolveInstitutionalContext,
  requireRole,
} from '@/auth/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const id = params.id;

    if (id === context.institutionId || id === `owner_${context.institutionId}`) {
      return Response.json(
        { error: 'Cannot remove the primary institutional owner.' },
        { status: 400 },
      );
    }

    // 1. Check if it is a pending invitation
    if (id.startsWith('inv_')) {
      await database
        .delete(memberInvitations)
        .where(
          and(
            eq(memberInvitations.id, id),
            eq(memberInvitations.institutionId, context.institutionId),
          ),
        );
      return Response.json({ ok: true, deleted: 'invitation' });
    }

    // 2. Otherwise remove from institutionMembers
    await database
      .delete(institutionMembers)
      .where(
        and(
          eq(institutionMembers.id, id),
          eq(institutionMembers.institutionId, context.institutionId),
        ),
      );

    return Response.json({ ok: true, deleted: 'member' });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to remove member:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const id = params.id;
    const body = await request.json();

    const {
      role,
      departmentId,
      facultyId,
    }: {
      role?: InstitutionRole;
      departmentId?: string | null;
      facultyId?: string | null;
    } = body;

    const [updated] = await database
      .update(institutionMembers)
      .set({
        ...(role ? { role } : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(facultyId !== undefined ? { facultyId } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(institutionMembers.id, id),
          eq(institutionMembers.institutionId, context.institutionId),
        ),
      )
      .returning();

    if (!updated) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    return Response.json({ ok: true, member: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to update member:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 },
    );
  }
}
