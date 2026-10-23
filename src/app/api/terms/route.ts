import { and, eq } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  academicTerms,
  breaks,
  departments,
  faculty,
  rooms,
  sections,
  subjects,
  timetables,
  userProfiles,
} from '@/db/schema';
import { resolveInstitutionalContext, requireRole } from '@/auth/server';
import type { CloneTermOptions } from '@/storage/term-manager';
import { parseJsonBody, createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  try {
    const context = await resolveInstitutionalContext(request);
    const database = getDatabase();

    const terms = await database
      .select()
      .from(academicTerms)
      .where(eq(academicTerms.userId, context.institutionId));

    return Response.json(
      { terms },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to list academic terms');
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const body = await parseJsonBody<{
      name?: string;
      academicYear?: string;
      cloneFromTermId?: string;
      cloneOptions?: CloneTermOptions;
    }>(request, 512 * 1024);

    const {
      name,
      academicYear,
      cloneFromTermId,
      cloneOptions,
    } = body;

    if (!name?.trim() || !academicYear?.trim()) {
      return Response.json(
        { error: 'Name and academic year are required.' },
        { status: 400 },
      );
    }

    const newTermId = `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const institutionId = context.institutionId;

    // Ensure user profile exists
    await database
      .insert(userProfiles)
      .values({
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
      })
      .onConflictDoNothing();

    // 1. Create the new term
    const [createdTerm] = await database
      .insert(academicTerms)
      .values({
        id: newTermId,
        userId: institutionId,
        name: name.trim(),
        academicYear: academicYear.trim(),
        isDefault: false,
        stats: { departments: 0, sections: 0, faculty: 0, rooms: 0 },
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 2. Clone from source term if requested
    if (cloneFromTermId && cloneOptions) {
      let deptsCount = 0;
      let secsCount = 0;
      let facsCount = 0;
      let rmsCount = 0;

      if (cloneOptions.includeDepartments) {
        const sourceDepts = await database
          .select()
          .from(departments)
          .where(
            and(
              eq(departments.userId, institutionId),
              eq(departments.termId, cloneFromTermId),
            ),
          );
        deptsCount = sourceDepts.length;

        for (const d of sourceDepts) {
          await database.insert(departments).values({
            ...d,
            termId: newTermId,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (cloneOptions.includeSubjects) {
          const sourceSubs = await database
            .select()
            .from(subjects)
            .where(
              and(
                eq(subjects.userId, institutionId),
                eq(subjects.termId, cloneFromTermId),
              ),
            );
          for (const s of sourceSubs) {
            await database.insert(subjects).values({
              ...s,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }

          const sourceSecs = await database
            .select()
            .from(sections)
            .where(
              and(
                eq(sections.userId, institutionId),
                eq(sections.termId, cloneFromTermId),
              ),
            );
          secsCount = sourceSecs.length;

          for (const s of sourceSecs) {
            await database.insert(sections).values({
              ...s,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        if (cloneOptions.includeFaculty) {
          const sourceFac = await database
            .select()
            .from(faculty)
            .where(
              and(
                eq(faculty.userId, institutionId),
                eq(faculty.termId, cloneFromTermId),
              ),
            );
          facsCount = sourceFac.length;

          for (const f of sourceFac) {
            await database.insert(faculty).values({
              ...f,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        if (cloneOptions.includeRooms) {
          const sourceRooms = await database
            .select()
            .from(rooms)
            .where(
              and(
                eq(rooms.userId, institutionId),
                eq(rooms.termId, cloneFromTermId),
              ),
            );
          rmsCount = sourceRooms.length;

          for (const r of sourceRooms) {
            await database.insert(rooms).values({
              ...r,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        if (cloneOptions.includeDepartments) {
          const sourceBreaks = await database
            .select()
            .from(breaks)
            .where(
              and(
                eq(breaks.userId, institutionId),
                eq(breaks.termId, cloneFromTermId),
              ),
            );
          for (const b of sourceBreaks) {
            await database.insert(breaks).values({
              ...b,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        if (cloneOptions.includeTimetables) {
          const sourceTimetables = await database
            .select()
            .from(timetables)
            .where(
              and(
                eq(timetables.userId, institutionId),
                eq(timetables.termId, cloneFromTermId),
              ),
            );
          for (const t of sourceTimetables) {
            await database.insert(timetables).values({
              ...t,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      await database
        .update(academicTerms)
        .set({
          stats: {
            departments: deptsCount,
            sections: secsCount,
            faculty: facsCount,
            rooms: rmsCount,
          },
          updatedAt: now,
        })
        .where(
          and(
            eq(academicTerms.userId, institutionId),
            eq(academicTerms.id, newTermId),
          ),
        );
    }

    return Response.json(
      { term: createdTerm },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to create academic term');
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const context = await resolveInstitutionalContext(request);
    requireRole(context, ['ADMIN']);

    const database = getDatabase();
    const body = await parseJsonBody<{ termId?: string }>(request, 256 * 1024);

    const { termId } = body;
    if (!termId || typeof termId !== 'string') {
      return Response.json({ error: 'Valid termId is required' }, { status: 400 });
    }

    const institutionId = context.institutionId;

    // Clear previous default
    await database
      .update(academicTerms)
      .set({ isDefault: false })
      .where(eq(academicTerms.userId, institutionId));

    // Set new default
    await database
      .update(academicTerms)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(academicTerms.userId, institutionId),
          eq(academicTerms.id, termId),
        ),
      );

    return Response.json(
      { ok: true, activeTermId: termId },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to set active term');
  }
}
