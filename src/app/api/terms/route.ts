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
} from '@/db/schema';
import { requireAuthenticatedUser } from '@/auth/server';
import type { CloneTermOptions } from '@/storage/term-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();

    const terms = await database
      .select()
      .from(academicTerms)
      .where(eq(academicTerms.userId, user.id));

    return Response.json({ terms });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to list terms' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const body = await request.json();

    const {
      name,
      academicYear,
      cloneFromTermId,
      cloneOptions,
    }: {
      name: string;
      academicYear: string;
      cloneFromTermId?: string;
      cloneOptions?: CloneTermOptions;
    } = body;

    if (!name?.trim() || !academicYear?.trim()) {
      return Response.json(
        { error: 'Name and academic year are required.' },
        { status: 400 },
      );
    }

    const newTermId = `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    let createdTerm: any = null;

    await database.transaction(async (tx) => {
      // 1. Create the new term
      const [term] = await tx
        .insert(academicTerms)
        .values({
          id: newTermId,
          userId: user.id,
          name: name.trim(),
          academicYear: academicYear.trim(),
          isDefault: false,
          stats: { departments: 0, sections: 0, faculty: 0, rooms: 0 },
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      createdTerm = term;

      // 2. Clone from source term if requested
      if (cloneFromTermId && cloneOptions) {
        let deptsCount = 0;
        let secsCount = 0;
        let facsCount = 0;
        let rmsCount = 0;

        if (cloneOptions.includeDepartments) {
          const sourceDepts = await tx
            .select()
            .from(departments)
            .where(
              and(
                eq(departments.userId, user.id),
                eq(departments.termId, cloneFromTermId),
              ),
            );
          deptsCount = sourceDepts.length;

          for (const d of sourceDepts) {
            await tx.insert(departments).values({
              ...d,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }

          if (cloneOptions.includeSubjects) {
            const sourceSubs = await tx
              .select()
              .from(subjects)
              .where(
                and(
                  eq(subjects.userId, user.id),
                  eq(subjects.termId, cloneFromTermId),
                ),
              );
            for (const s of sourceSubs) {
              await tx.insert(subjects).values({
                ...s,
                termId: newTermId,
                createdAt: now,
                updatedAt: now,
              });
            }

            const sourceSecs = await tx
              .select()
              .from(sections)
              .where(
                and(
                  eq(sections.userId, user.id),
                  eq(sections.termId, cloneFromTermId),
                ),
              );
            secsCount = sourceSecs.length;
            for (const sec of sourceSecs) {
              await tx.insert(sections).values({
                ...sec,
                termId: newTermId,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }

        if (cloneOptions.includeFaculty) {
          const sourceFac = await tx
            .select()
            .from(faculty)
            .where(
              and(
                eq(faculty.userId, user.id),
                eq(faculty.termId, cloneFromTermId),
              ),
            );
          facsCount = sourceFac.length;
          for (const f of sourceFac) {
            await tx.insert(faculty).values({
              ...f,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        if (cloneOptions.includeRooms) {
          const sourceRooms = await tx
            .select()
            .from(rooms)
            .where(
              and(
                eq(rooms.userId, user.id),
                eq(rooms.termId, cloneFromTermId),
              ),
            );
          rmsCount = sourceRooms.length;
          for (const r of sourceRooms) {
            await tx.insert(rooms).values({
              ...r,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        const sourceBreaks = await tx
          .select()
          .from(breaks)
          .where(
            and(
              eq(breaks.userId, user.id),
              eq(breaks.termId, cloneFromTermId),
            ),
          );
        for (const b of sourceBreaks) {
          await tx.insert(breaks).values({
            ...b,
            termId: newTermId,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (cloneOptions.includeTimetables && cloneOptions.includeDepartments) {
          const sourceTT = await tx
            .select()
            .from(timetables)
            .where(
              and(
                eq(timetables.userId, user.id),
                eq(timetables.termId, cloneFromTermId),
              ),
            );
          for (const t of sourceTT) {
            await tx.insert(timetables).values({
              ...t,
              termId: newTermId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        await tx
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
              eq(academicTerms.userId, user.id),
              eq(academicTerms.id, newTermId),
            ),
          );
      }
    });

    return Response.json({ term: createdTerm });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to create term:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create term' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const body = await request.json();

    const { termId } = body;
    if (!termId) {
      return Response.json({ error: 'termId is required' }, { status: 400 });
    }

    await database.transaction(async (tx) => {
      // Clear previous default
      await tx
        .update(academicTerms)
        .set({ isDefault: false })
        .where(eq(academicTerms.userId, user.id));

      // Set new default
      await tx
        .update(academicTerms)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(academicTerms.userId, user.id),
            eq(academicTerms.id, termId),
          ),
        );
    });

    return Response.json({ ok: true, activeTermId: termId });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to set active term' },
      { status: 500 },
    );
  }
}
