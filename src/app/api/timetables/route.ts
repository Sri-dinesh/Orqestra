import { and, eq, ne } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  academicTerms,
  departments,
  generationAuditLogs,
  timetables,
  userProfiles,
} from '@/db/schema';
import { requireAuthenticatedUser } from '@/auth/server';
import type { GenerationMetrics, Timetable } from '@/domain/models';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const body = await request.json();

    const {
      timetable,
      termId = 'default',
      auditMetrics,
    }: {
      timetable: Timetable;
      termId?: string;
      auditMetrics?: GenerationMetrics | null;
    } = body;

    if (!timetable || !timetable.departmentId) {
      return Response.json(
        { error: 'Valid timetable and departmentId are required.' },
        { status: 400 },
      );
    }

    const now = new Date();

    // 1. Ensure user profile exists to satisfy foreign key constraints
    await database
      .insert(userProfiles)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .onConflictDoNothing();

    // 2. Ensure academic term exists
    const [existingTerm] = await database
      .select({ id: academicTerms.id })
      .from(academicTerms)
      .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, termId)));

    if (!existingTerm) {
      await database
        .insert(academicTerms)
        .values({
          id: termId,
          userId: user.id,
          name: 'Academic Year 2026-27 (Odd Sem)',
          academicYear: '2026-27',
          isDefault: termId === 'default',
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    // 3. Ensure department exists to satisfy foreign key constraint
    const [existingDept] = await database
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.userId, user.id), eq(departments.id, timetable.departmentId)));

    if (!existingDept) {
      await database
        .insert(departments)
        .values({
          id: timetable.departmentId,
          userId: user.id,
          termId,
          code: timetable.departmentId.toUpperCase().slice(0, 10),
          name: `Department ${timetable.departmentId}`,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          periodsPerDay: 6,
          status: 'CONFIGURED',
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    // 4. Remove any other timetable for the same department with a different ID to prevent unique index collisions
    await database
      .delete(timetables)
      .where(
        and(
          eq(timetables.userId, user.id),
          eq(timetables.termId, termId),
          eq(timetables.departmentId, timetable.departmentId),
          ne(timetables.id, timetable.id),
        ),
      );

    // 5. Upsert the current timetable
    const [saved] = await database
      .insert(timetables)
      .values({
        id: timetable.id,
        userId: user.id,
        termId,
        departmentId: timetable.departmentId,
        status: timetable.status,
        revision: timetable.revision,
        configurationSnapshot: timetable.configurationSnapshot,
        entries: timetable.entries,
        validationSummary: timetable.validationSummary,
        generationMetadata: timetable.generationMetadata,
        versionHistory: timetable.versionHistory ?? [],
        createdAt: timetable.createdAt ? new Date(timetable.createdAt) : now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: timetables.id,
        set: {
          status: timetable.status,
          revision: timetable.revision,
          configurationSnapshot: timetable.configurationSnapshot,
          entries: timetable.entries,
          validationSummary: timetable.validationSummary,
          generationMetadata: timetable.generationMetadata,
          versionHistory: timetable.versionHistory ?? [],
          updatedAt: now,
        },
      })
      .returning();

    // 6. Optionally record audit log
    if (auditMetrics) {
      try {
        await database.insert(generationAuditLogs).values({
          id: `genlog_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          userId: user.id,
          termId,
          departmentId: timetable.departmentId,
          seed: auditMetrics.seed,
          status: timetable.status,
          durationMs: auditMetrics.durationMs,
          nodesExplored: auditMetrics.exploredNodes,
          finalScore: auditMetrics.finalScore,
          createdAt: now,
        });
      } catch (logErr) {
        console.warn('Could not record generation audit log:', logErr);
      }
    }

    return Response.json({ ok: true, timetable: saved });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to save timetable:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to save timetable' },
      { status: 500 },
    );
  }
}
