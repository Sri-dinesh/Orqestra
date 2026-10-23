import { and, eq, ne } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  academicTerms,
  departments,
  timetables,
  userProfiles,
} from '@/db/schema';
import {
  resolveInstitutionalContext,
  assertDepartmentAccess,
} from '@/auth/server';
import { enforceRateLimit, parseJsonBody, createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    enforceRateLimit(request, { maxRequests: 30, windowSeconds: 60, keyPrefix: 'tt-pub' });

    const params = await props.params;
    const timetableId = params.id;

    if (!timetableId || typeof timetableId !== 'string' || timetableId.length > 128) {
      return Response.json({ error: 'Valid timetable identifier is required.' }, { status: 400 });
    }

    const context = await resolveInstitutionalContext(request);
    const database = getDatabase();
    const body = await parseJsonBody<{
      publish?: boolean;
      termId?: string;
      timetable?: any;
    }>(request, 512 * 1024).catch((): { publish?: boolean; termId?: string; timetable?: any } => ({ publish: true }));

    const publish = body.publish !== undefined ? Boolean(body.publish) : true;
    const now = new Date();

    // 1. Ensure user profile exists to satisfy foreign key constraints
    await database
      .insert(userProfiles)
      .values({
        id: context.institutionId,
        email: context.user.email,
        name: context.user.name,
      })
      .onConflictDoNothing();

    // 2. Check if timetable exists and belongs to this institution
    let [existing] = await database
      .select()
      .from(timetables)
      .where(and(eq(timetables.userId, context.institutionId), eq(timetables.id, timetableId)));

    const targetDeptId = existing?.departmentId || body.timetable?.departmentId;
    if (targetDeptId) {
      assertDepartmentAccess(context, targetDeptId);
    }

    const publicSlug =
      existing?.publicSlug ||
      `tt-${(existing?.departmentId || body.timetable?.departmentId || 'schedule').toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    if (!existing && body.timetable) {
      const tb = body.timetable;
      const termId = body.termId || 'default';
      const departmentId = tb.departmentId;

      // Ensure term exists
      const [existingTerm] = await database
        .select({ id: academicTerms.id })
        .from(academicTerms)
        .where(and(eq(academicTerms.userId, context.institutionId), eq(academicTerms.id, termId)));

      if (!existingTerm) {
        await database
          .insert(academicTerms)
          .values({
            id: termId,
            userId: context.institutionId,
            name: 'Academic Year 2026-27 (Odd Sem)',
            academicYear: '2026-27',
            isDefault: termId === 'default',
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }

      // Ensure department exists
      const [existingDept] = await database
        .select({ id: departments.id })
        .from(departments)
        .where(and(eq(departments.userId, context.institutionId), eq(departments.id, departmentId)));

      if (!existingDept) {
        await database
          .insert(departments)
          .values({
            id: departmentId,
            userId: context.institutionId,
            termId,
            code: departmentId.toUpperCase().slice(0, 10),
            name: `Department ${departmentId}`,
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            periodsPerDay: 6,
            status: 'CONFIGURED',
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }

      // Remove any other timetable for the same department with a different ID
      await database
        .delete(timetables)
        .where(
          and(
            eq(timetables.userId, context.institutionId),
            eq(timetables.termId, termId),
            eq(timetables.departmentId, departmentId),
            ne(timetables.id, timetableId),
          ),
        );

      const [inserted] = await database
        .insert(timetables)
        .values({
          id: timetableId,
          userId: context.institutionId,
          termId,
          departmentId,
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
      const resolvedSlug = publish ? (existing.publicSlug || publicSlug) : existing.publicSlug;
      const [updated] = await database
        .update(timetables)
        .set({
          isPublished: publish,
          publicSlug: resolvedSlug,
          updatedAt: now,
        })
        .where(and(eq(timetables.userId, context.institutionId), eq(timetables.id, timetableId)))
        .returning();
      existing = updated;
    }

    return Response.json(
      {
        ok: true,
        isPublished: existing.isPublished,
        publicSlug: existing.publicSlug,
        shareUrl: existing.publicSlug ? `/schedule-portal?slug=${existing.publicSlug}` : null,
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
    return createErrorResponse(error, 'Failed to update publish status');
  }
}
