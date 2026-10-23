import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import { academicTerms } from '@/db/schema';
import { resolveInstitutionalContext, requireRole } from '@/auth/server';
import { parseJsonBody, createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  props: { params: Promise<{ termId: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const termId = params.termId;

    if (!termId || typeof termId !== 'string' || termId.length > 128) {
      return Response.json({ error: 'Valid termId is required.' }, { status: 400 });
    }

    const institutionId = context.institutionId;

    // Check if term exists and belongs to institution
    const [existing] = await database
      .select()
      .from(academicTerms)
      .where(and(eq(academicTerms.userId, institutionId), eq(academicTerms.id, termId)));

    if (!existing) {
      return Response.json({ error: 'Term not found' }, { status: 404 });
    }

    // Cascade delete term
    await database
      .delete(academicTerms)
      .where(and(eq(academicTerms.userId, institutionId), eq(academicTerms.id, termId)));

    // If deleted term was default, ensure at least one remaining term is default
    if (existing.isDefault) {
      const remaining = await database
        .select()
        .from(academicTerms)
        .where(eq(academicTerms.userId, institutionId));

      if (remaining.length > 0) {
        await database
          .update(academicTerms)
          .set({ isDefault: true })
          .where(and(eq(academicTerms.userId, institutionId), eq(academicTerms.id, remaining[0].id)));
      }
    }

    return Response.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to delete term');
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ termId: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const termId = params.termId;

    if (!termId || typeof termId !== 'string' || termId.length > 128) {
      return Response.json({ error: 'Valid termId is required.' }, { status: 400 });
    }

    const body = await parseJsonBody<{ name?: string; academicYear?: string }>(request, 256 * 1024);
    const { name, academicYear } = body;
    const institutionId = context.institutionId;

    const [updated] = await database
      .update(academicTerms)
      .set({
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(academicYear?.trim() ? { academicYear: academicYear.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(academicTerms.userId, institutionId), eq(academicTerms.id, termId)))
      .returning();

    if (!updated) {
      return Response.json({ error: 'Term not found' }, { status: 404 });
    }

    return Response.json(
      { term: updated },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to update term');
  }
}
