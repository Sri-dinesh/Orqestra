import { and, eq, notInArray } from 'drizzle-orm';
import { getDatabase } from '@/db';
import {
  academicTerms,
  breaks,
  collegeProfiles,
  departments,
  faculty,
  rooms,
  sections,
  subjects,
  timetables,
} from '@/db/schema';
import { requireAuthenticatedUser } from '@/auth/server';
import type {
  Break,
  CollegeDetails,
  Department,
  Faculty,
  Room,
  Section,
  Subject,
  Timetable,
} from '@/domain/models';
import type { GenerationSettingsOverrides } from '@/state/stores/workspace-store';
import type { AcademicTerm } from '@/storage/term-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const url = new URL(request.url);

    // 1. Fetch user's academic terms
    let terms = await database
      .select()
      .from(academicTerms)
      .where(eq(academicTerms.userId, user.id));

    // If user has no terms yet, initialize a default term
    let targetTermId = url.searchParams.get('termId');
    if (terms.length === 0) {
      const now = new Date();
      const [defaultTerm] = await database
        .insert(academicTerms)
        .values({
          id: 'default',
          userId: user.id,
          name: 'Academic Year 2026-27 (Odd Sem)',
          academicYear: '2026-27',
          isDefault: true,
          stats: { departments: 0, sections: 0, faculty: 0, rooms: 0 },
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      terms = [defaultTerm];
      targetTermId = defaultTerm.id;
    } else if (!targetTermId || targetTermId === 'default') {
      const defaultTerm = terms.find((t) => t.isDefault) || terms[0];
      targetTermId = defaultTerm.id;
    }

    // 2. Fetch College Profile
    const [collegeProfile] = await database
      .select()
      .from(collegeProfiles)
      .where(eq(collegeProfiles.userId, user.id));

    const collegeDetails: CollegeDetails = collegeProfile
      ? {
          name: collegeProfile.name,
          code: collegeProfile.code,
          address: collegeProfile.address,
          city: collegeProfile.city,
          state: collegeProfile.state,
          pincode: collegeProfile.pincode,
          website: collegeProfile.website,
          contactEmail: collegeProfile.contactEmail,
          contactPhone: collegeProfile.contactPhone,
          academicYear: collegeProfile.academicYear,
          logoDataUrl: collegeProfile.logoDataUrl,
        }
      : {
          name: '',
          code: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          website: '',
          contactEmail: '',
          contactPhone: '',
          academicYear: '',
          logoDataUrl: '',
        };

    // 3. Fetch resources for this term
    const [deptRows, secRows, subRows, facRows, roomRows, breakRows, ttRows] =
      await Promise.all([
        database
          .select()
          .from(departments)
          .where(
            and(
              eq(departments.userId, user.id),
              eq(departments.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(sections)
          .where(
            and(
              eq(sections.userId, user.id),
              eq(sections.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.userId, user.id),
              eq(subjects.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(faculty)
          .where(
            and(
              eq(faculty.userId, user.id),
              eq(faculty.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.userId, user.id),
              eq(rooms.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(breaks)
          .where(
            and(
              eq(breaks.userId, user.id),
              eq(breaks.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(timetables)
          .where(
            and(
              eq(timetables.userId, user.id),
              eq(timetables.termId, targetTermId),
            ),
          ),
      ]);

    // Aggregate generationSettingsOverrides
    const generationSettingsOverrides: Record<
      string,
      Partial<GenerationSettingsOverrides>
    > = {};
    for (const d of deptRows) {
      if (d.generationSettingsOverrides) {
        generationSettingsOverrides[d.id] = d.generationSettingsOverrides;
      }
    }

    const domainDepartments: Department[] = deptRows.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      workingDays: d.workingDays as any,
      periodsPerDay: d.periodsPerDay,
      periodTimings: d.periodTimings ?? undefined,
      effectiveFrom: d.effectiveFrom ?? undefined,
      mentors: d.mentors ?? undefined,
      status: d.status as any,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    const domainSections: Section[] = secRows.map((s) => ({
      id: s.id,
      departmentId: s.departmentId,
      name: s.name,
      year: s.year,
      semester: s.semester,
      studentCount: s.studentCount,
      subjectRequirements: s.subjectRequirements as any,
      roomNo: s.roomNo ?? undefined,
      classAdvisor: s.classAdvisor ?? undefined,
      active: s.active,
    }));

    const domainSubjects: Subject[] = subRows.map((s) => ({
      id: s.id,
      departmentId: s.departmentId,
      code: s.code,
      name: s.name,
      type: s.type as any,
      courseCode: s.courseCode ?? undefined,
      sessionsPerWeek: s.sessionsPerWeek,
      durationPeriods: s.durationPeriods,
      eligibleFacultyIds: s.eligibleFacultyIds as any,
      eligibleSectionIds: s.eligibleSectionIds as any,
      active: s.active,
    }));

    const domainFaculty: Faculty[] = facRows.map((f) => ({
      id: f.id,
      departmentId: f.departmentId,
      facultyCode: f.facultyCode,
      name: f.name,
      subjectIds: f.subjectIds as any,
      sectionIds: f.sectionIds as any,
      availability: f.availability as any,
      preferredSlots: f.preferredSlots as any,
      maxPeriodsPerDay: f.maxPeriodsPerDay,
      maxPeriodsPerWeek: f.maxPeriodsPerWeek,
      active: f.active,
    }));

    const domainRooms: Room[] = roomRows.map((r) => ({
      id: r.id,
      departmentId: r.departmentId ?? '',
      code: r.code,
      name: r.name,
      capacity: r.capacity,
      type: r.type as any,
      active: r.active,
    }));

    const domainBreaks: Break[] = breakRows.map((b) => ({
      id: b.id,
      name: b.name,
      dayIndex: b.dayIndex,
      startPeriod: b.startPeriod,
      durationPeriods: b.durationPeriods,
      startTime: b.startTime ?? undefined,
      endTime: b.endTime ?? undefined,
    }));

    const domainTimetables: Timetable[] = ttRows.map((t) => ({
      id: t.id,
      departmentId: t.departmentId,
      status: t.status as any,
      revision: t.revision,
      configurationSnapshot: t.configurationSnapshot as any,
      entries: t.entries as any,
      validationSummary: t.validationSummary as any,
      generationMetadata: t.generationMetadata as any,
      versionHistory: t.versionHistory as any,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    const formattedTerms: AcademicTerm[] = terms.map((t) => ({
      id: t.id,
      name: t.name,
      academicYear: t.academicYear,
      isDefault: t.isDefault,
      stats: t.stats ?? undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return Response.json(
      {
        workspace: {
          departments: domainDepartments,
          sections: domainSections,
          subjects: domainSubjects,
          faculty: domainFaculty,
          rooms: domainRooms,
          breaks: domainBreaks,
          timetables: domainTimetables,
          activeDepartmentId: domainDepartments[0]?.id ?? null,
          generationSettingsOverrides,
          collegeDetails,
        },
        terms: formattedTerms,
        activeTermId: targetTermId,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to load workspace:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to load workspace' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const body = await request.json();

    const termId = body.termId || 'default';
    const payload = body.payload;

    if (!payload) {
      return Response.json({ error: 'Missing workspace payload' }, { status: 400 });
    }

    const now = new Date();

    // Execute atomic sync
    await database.transaction(async (tx) => {
      // 1. Ensure target term exists
      const [existingTerm] = await tx
        .select()
        .from(academicTerms)
        .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, termId)));

      if (!existingTerm) {
        await tx.insert(academicTerms).values({
          id: termId,
          userId: user.id,
          name: 'Academic Year 2026-27 (Odd Sem)',
          academicYear: '2026-27',
          isDefault: termId === 'default',
          createdAt: now,
          updatedAt: now,
        });
      }

      // 2. Sync College Details
      if (payload.collegeDetails) {
        const cd = payload.collegeDetails as CollegeDetails;
        await tx
          .insert(collegeProfiles)
          .values({
            id: `col_${user.id}`,
            userId: user.id,
            name: cd.name ?? '',
            code: cd.code ?? '',
            address: cd.address ?? '',
            city: cd.city ?? '',
            state: cd.state ?? '',
            pincode: cd.pincode ?? '',
            website: cd.website ?? '',
            contactEmail: cd.contactEmail ?? '',
            contactPhone: cd.contactPhone ?? '',
            academicYear: cd.academicYear ?? '',
            logoDataUrl: cd.logoDataUrl ?? '',
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: collegeProfiles.userId,
            set: {
              name: cd.name ?? '',
              code: cd.code ?? '',
              address: cd.address ?? '',
              city: cd.city ?? '',
              state: cd.state ?? '',
              pincode: cd.pincode ?? '',
              website: cd.website ?? '',
              contactEmail: cd.contactEmail ?? '',
              contactPhone: cd.contactPhone ?? '',
              academicYear: cd.academicYear ?? '',
              logoDataUrl: cd.logoDataUrl ?? '',
              updatedAt: now,
            },
          });
      }

      const overrides =
        (payload.generationSettingsOverrides as Record<
          string,
          Partial<GenerationSettingsOverrides>
        >) ?? {};

      // 3. Sync Departments
      const depts = (payload.departments as Department[]) ?? [];
      const deptIds = depts.map((d) => d.id);

      for (const d of depts) {
        await tx
          .insert(departments)
          .values({
            id: d.id,
            userId: user.id,
            termId,
            code: d.code,
            name: d.name,
            workingDays: d.workingDays,
            periodsPerDay: d.periodsPerDay,
            periodTimings: d.periodTimings,
            effectiveFrom: d.effectiveFrom,
            mentors: d.mentors,
            status: d.status,
            generationSettingsOverrides: overrides[d.id] ?? null,
            createdAt: d.createdAt ? new Date(d.createdAt) : now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: departments.id,
            set: {
              code: d.code,
              name: d.name,
              workingDays: d.workingDays,
              periodsPerDay: d.periodsPerDay,
              periodTimings: d.periodTimings,
              effectiveFrom: d.effectiveFrom,
              mentors: d.mentors,
              status: d.status,
              generationSettingsOverrides: overrides[d.id] ?? null,
              updatedAt: now,
            },
          });
      }

      if (deptIds.length > 0) {
        await tx
          .delete(departments)
          .where(
            and(
              eq(departments.userId, user.id),
              eq(departments.termId, termId),
              notInArray(departments.id, deptIds),
            ),
          );
      } else {
        await tx
          .delete(departments)
          .where(
            and(
              eq(departments.userId, user.id),
              eq(departments.termId, termId),
            ),
          );
      }

      // 4. Sync Sections
      const secs = (payload.sections as Section[]) ?? [];
      const secIds = secs.map((s) => s.id);

      for (const s of secs) {
        await tx
          .insert(sections)
          .values({
            id: s.id,
            userId: user.id,
            termId,
            departmentId: s.departmentId,
            name: s.name,
            year: s.year,
            semester: s.semester,
            studentCount: s.studentCount,
            subjectRequirements: s.subjectRequirements,
            roomNo: s.roomNo,
            classAdvisor: s.classAdvisor,
            active: s.active,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: sections.id,
            set: {
              name: s.name,
              year: s.year,
              semester: s.semester,
              studentCount: s.studentCount,
              subjectRequirements: s.subjectRequirements,
              roomNo: s.roomNo,
              classAdvisor: s.classAdvisor,
              active: s.active,
              updatedAt: now,
            },
          });
      }

      if (secIds.length > 0) {
        await tx
          .delete(sections)
          .where(
            and(
              eq(sections.userId, user.id),
              eq(sections.termId, termId),
              notInArray(sections.id, secIds),
            ),
          );
      } else {
        await tx
          .delete(sections)
          .where(
            and(
              eq(sections.userId, user.id),
              eq(sections.termId, termId),
            ),
          );
      }

      // 5. Sync Subjects
      const subs = (payload.subjects as Subject[]) ?? [];
      const subIds = subs.map((s) => s.id);

      for (const s of subs) {
        await tx
          .insert(subjects)
          .values({
            id: s.id,
            userId: user.id,
            termId,
            departmentId: s.departmentId,
            code: s.code,
            name: s.name,
            type: s.type,
            courseCode: s.courseCode,
            sessionsPerWeek: s.sessionsPerWeek,
            durationPeriods: s.durationPeriods,
            eligibleFacultyIds: s.eligibleFacultyIds,
            eligibleSectionIds: s.eligibleSectionIds,
            active: s.active,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: subjects.id,
            set: {
              code: s.code,
              name: s.name,
              type: s.type,
              courseCode: s.courseCode,
              sessionsPerWeek: s.sessionsPerWeek,
              durationPeriods: s.durationPeriods,
              eligibleFacultyIds: s.eligibleFacultyIds,
              eligibleSectionIds: s.eligibleSectionIds,
              active: s.active,
              updatedAt: now,
            },
          });
      }

      if (subIds.length > 0) {
        await tx
          .delete(subjects)
          .where(
            and(
              eq(subjects.userId, user.id),
              eq(subjects.termId, termId),
              notInArray(subjects.id, subIds),
            ),
          );
      } else {
        await tx
          .delete(subjects)
          .where(
            and(
              eq(subjects.userId, user.id),
              eq(subjects.termId, termId),
            ),
          );
      }

      // 6. Sync Faculty
      const facs = (payload.faculty as Faculty[]) ?? [];
      const facIds = facs.map((f) => f.id);

      for (const f of facs) {
        await tx
          .insert(faculty)
          .values({
            id: f.id,
            userId: user.id,
            termId,
            departmentId: f.departmentId,
            facultyCode: f.facultyCode,
            name: f.name,
            subjectIds: f.subjectIds,
            sectionIds: f.sectionIds,
            availability: f.availability,
            preferredSlots: f.preferredSlots,
            maxPeriodsPerDay: f.maxPeriodsPerDay,
            maxPeriodsPerWeek: f.maxPeriodsPerWeek,
            active: f.active,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: faculty.id,
            set: {
              facultyCode: f.facultyCode,
              name: f.name,
              subjectIds: f.subjectIds,
              sectionIds: f.sectionIds,
              availability: f.availability,
              preferredSlots: f.preferredSlots,
              maxPeriodsPerDay: f.maxPeriodsPerDay,
              maxPeriodsPerWeek: f.maxPeriodsPerWeek,
              active: f.active,
              updatedAt: now,
            },
          });
      }

      if (facIds.length > 0) {
        await tx
          .delete(faculty)
          .where(
            and(
              eq(faculty.userId, user.id),
              eq(faculty.termId, termId),
              notInArray(faculty.id, facIds),
            ),
          );
      } else {
        await tx
          .delete(faculty)
          .where(
            and(
              eq(faculty.userId, user.id),
              eq(faculty.termId, termId),
            ),
          );
      }

      // 7. Sync Rooms
      const rms = (payload.rooms as Room[]) ?? [];
      const rmIds = rms.map((r) => r.id);

      for (const r of rms) {
        await tx
          .insert(rooms)
          .values({
            id: r.id,
            userId: user.id,
            termId,
            departmentId: r.departmentId ?? null,
            code: r.code,
            name: r.name,
            capacity: r.capacity,
            type: r.type,
            active: r.active,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: rooms.id,
            set: {
              departmentId: r.departmentId ?? null,
              code: r.code,
              name: r.name,
              capacity: r.capacity,
              type: r.type,
              active: r.active,
              updatedAt: now,
            },
          });
      }

      if (rmIds.length > 0) {
        await tx
          .delete(rooms)
          .where(
            and(
              eq(rooms.userId, user.id),
              eq(rooms.termId, termId),
              notInArray(rooms.id, rmIds),
            ),
          );
      } else {
        await tx
          .delete(rooms)
          .where(
            and(
              eq(rooms.userId, user.id),
              eq(rooms.termId, termId),
            ),
          );
      }

      // 8. Sync Breaks
      const brks = (payload.breaks as Break[]) ?? [];
      const brkIds = brks.map((b) => b.id);

      for (const b of brks) {
        await tx
          .insert(breaks)
          .values({
            id: b.id,
            userId: user.id,
            termId,
            name: b.name,
            dayIndex: b.dayIndex,
            startPeriod: b.startPeriod,
            durationPeriods: b.durationPeriods,
            startTime: b.startTime,
            endTime: b.endTime,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: breaks.id,
            set: {
              name: b.name,
              dayIndex: b.dayIndex,
              startPeriod: b.startPeriod,
              durationPeriods: b.durationPeriods,
              startTime: b.startTime,
              endTime: b.endTime,
              updatedAt: now,
            },
          });
      }

      if (brkIds.length > 0) {
        await tx
          .delete(breaks)
          .where(
            and(
              eq(breaks.userId, user.id),
              eq(breaks.termId, termId),
              notInArray(breaks.id, brkIds),
            ),
          );
      } else {
        await tx
          .delete(breaks)
          .where(
            and(
              eq(breaks.userId, user.id),
              eq(breaks.termId, termId),
            ),
          );
      }

      // 9. Sync Timetables
      const tts = (payload.timetables as Timetable[]) ?? [];
      const ttIds = tts.map((t) => t.id);

      for (const t of tts) {
        await tx
          .insert(timetables)
          .values({
            id: t.id,
            userId: user.id,
            termId,
            departmentId: t.departmentId,
            status: t.status,
            revision: t.revision,
            configurationSnapshot: t.configurationSnapshot,
            entries: t.entries,
            validationSummary: t.validationSummary,
            generationMetadata: t.generationMetadata,
            versionHistory: t.versionHistory ?? [],
            createdAt: t.createdAt ? new Date(t.createdAt) : now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: timetables.id,
            set: {
              status: t.status,
              revision: t.revision,
              configurationSnapshot: t.configurationSnapshot,
              entries: t.entries,
              validationSummary: t.validationSummary,
              generationMetadata: t.generationMetadata,
              versionHistory: t.versionHistory ?? [],
              updatedAt: now,
            },
          });
      }

      if (ttIds.length > 0) {
        await tx
          .delete(timetables)
          .where(
            and(
              eq(timetables.userId, user.id),
              eq(timetables.termId, termId),
              notInArray(timetables.id, ttIds),
            ),
          );
      } else {
        await tx
          .delete(timetables)
          .where(
            and(
              eq(timetables.userId, user.id),
              eq(timetables.termId, termId),
            ),
          );
      }

      // 10. Update Term Statistics
      await tx
        .update(academicTerms)
        .set({
          stats: {
            departments: depts.length,
            sections: secs.length,
            faculty: facs.length,
            rooms: rms.length,
          },
          updatedAt: now,
        })
        .where(and(eq(academicTerms.userId, user.id), eq(academicTerms.id, termId)));
    });

    return Response.json({
      ok: true,
      syncedAt: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to sync workspace:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to sync workspace' },
      { status: 500 },
    );
  }
}
