import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import { timetables } from '@/db/schema';
import { requireAuthenticatedUser } from '@/auth/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const body = await request.json().catch(() => ({}));

    const timetableId = params.id;
    const publish = body.publish !== undefined ? Boolean(body.publish) : true;

    // Check if timetable exists and belongs to user
    let [existing] = await database
      .select()
      .from(timetables)
      .where(and(eq(timetables.userId, user.id), eq(timetables.id, timetableId)));

    const now = new Date();
    const publicSlug =
      existing?.publicSlug ||
      `tt-${(existing?.departmentId || body.timetable?.departmentId || 'schedule').toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    if (!existing && body.timetable) {
      const tb = body.timetable;
      const [inserted] = await database
        .insert(timetables)
        .values({
          id: timetableId,
          userId: user.id,
          termId: body.termId || 'default',
          departmentId: tb.departmentId,
          status: tb.status,
          revision: tb.revision ?? 1,
          configurationSnapshot: tb.configurationSnapshot,
          entries: tb.entries,
          validationSummary: tb.validationSummary,
          generationMetadata: tb.generationMetadata,
          versionHistory: tb.versionHistory ?? [],
          isPublished: publish,
          publicSlug: publish ? publicSlug : null,
          createdAt: tb.createdAt ? new Date(tb.createdAt) : now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: timetables.id,
          set: {
            isPublished: publish,
            publicSlug: publish ? publicSlug : null,
            updatedAt: now,
          },
        })
        .returning();
      existing = inserted;
    } else if (!existing) {
      return Response.json({ error: 'Timetable not found' }, { status: 404 });
    } else {
      const [updated] = await database
        .update(timetables)
        .set({
          isPublished: publish,
          publicSlug: publish ? publicSlug : existing.publicSlug,
          updatedAt: now,
        })
        .where(and(eq(timetables.userId, user.id), eq(timetables.id, timetableId)))
        .returning();
      existing = updated;
    }

    return Response.json({
      ok: true,
      isPublished: existing.isPublished,
      publicSlug: existing.publicSlug,
      shareUrl: existing.publicSlug ? `/schedule-portal?slug=${existing.publicSlug}` : null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to toggle publish status:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update publish status' },
      { status: 500 },
    );
  }
}
