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
    const [existing] = await database
      .select()
      .from(timetables)
      .where(and(eq(timetables.userId, user.id), eq(timetables.id, timetableId)));

    if (!existing) {
      return Response.json({ error: 'Timetable not found' }, { status: 404 });
    }

    const publicSlug =
      existing.publicSlug ||
      `tt-${existing.departmentId.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const [updated] = await database
      .update(timetables)
      .set({
        isPublished: publish,
        publicSlug: publish ? publicSlug : existing.publicSlug,
        updatedAt: new Date(),
      })
      .where(and(eq(timetables.userId, user.id), eq(timetables.id, timetableId)))
      .returning();

    return Response.json({
      ok: true,
      isPublished: updated.isPublished,
      publicSlug: updated.publicSlug,
      shareUrl: updated.publicSlug ? `/schedule-portal?slug=${updated.publicSlug}` : null,
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
