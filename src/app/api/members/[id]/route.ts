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
import { parseJsonBody, createErrorResponse } from '@/lib/api-security';

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

    if (!id || typeof id !== 'string' || id.length > 128) {
      return Response.json({ error: 'Valid member identifier is required.' }, { status: 400 });
    }

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
    return createErrorResponse(error, 'Failed to remove member');
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

    if (!id || typeof id !== 'string' || id.length > 128) {
      return Response.json({ error: 'Valid member identifier is required.' }, { status: 400 });
    }

    const body = await parseJsonBody<{
      role?: InstitutionRole;
      departmentId?: string | null;
      facultyId?: string | null;
    }>(request, 256 * 1024);

    const {
      role,
      departmentId,
      facultyId,
    } = body;

    if (role && !['ADMIN', 'HOD', 'FACULTY'].includes(role)) {
      return Response.json({ error: 'Invalid role specified.' }, { status: 400 });
    }

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
    return createErrorResponse(error, 'Failed to update member');
  }
}
