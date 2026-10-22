import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import { academicTerms } from '@/db/schema';
import { requireAuthenticatedUser } from '@/auth/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  props: { params: Promise<{ termId: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();

    const termId = params.termId;

    // Check if term exists and belongs to user
    const [existing] = await database
      .select()
      .from(academicTerms)
      .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, termId)));

    if (!existing) {
      return Response.json({ error: 'Term not found' }, { status: 404 });
    }

    // Cascade delete term
    await database
      .delete(academicTerms)
      .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, termId)));

    // If deleted term was default, ensure at least one remaining term is default
    if (existing.isDefault) {
      const remaining = await database
        .select()
        .from(academicTerms)
        .where(eq(academicTerms.userId, user.id));

      if (remaining.length > 0) {
        await database
          .update(academicTerms)
          .set({ isDefault: true })
          .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, remaining[0].id)));
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete term' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ termId: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const body = await request.json();

    const termId = params.termId;
    const { name, academicYear } = body;

    const [updated] = await database
      .update(academicTerms)
      .set({
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(academicYear?.trim() ? { academicYear: academicYear.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, termId)))
      .returning();

    if (!updated) {
      return Response.json({ error: 'Term not found' }, { status: 404 });
    }

    return Response.json({ term: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update term' },
      { status: 500 },
    );
  }
}
