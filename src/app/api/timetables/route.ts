import { getDatabase } from '@/db';
import { generationAuditLogs, timetables } from '@/db/schema';
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

    // Optionally record audit log
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
