import { and, eq, ne, notInArray, sql } from 'drizzle-orm';
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
  userProfiles,
} from '@/db/schema';
import { resolveInstitutionalContext } from '@/auth/server';
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
    const context = await resolveInstitutionalContext(request);
    const database = getDatabase();
    const url = new URL(request.url);

    // 0. Ensure user profile exists
    await database
      .insert(userProfiles)
      .values({
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
      })
      .onConflictDoNothing();

    // 1. Fetch academic terms for this institution
    let terms = await database
      .select()
      .from(academicTerms)
      .where(eq(academicTerms.userId, context.institutionId));

    // If user has no terms yet, initialize a default term
    let targetTermId = url.searchParams.get('termId');
    if (terms.length === 0) {
      const now = new Date();
      const [defaultTerm] = await database
        .insert(academicTerms)
        .values({
          id: 'default',
          userId: context.institutionId,
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
      .where(eq(collegeProfiles.userId, context.institutionId));

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
              eq(departments.userId, context.institutionId),
              eq(departments.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(sections)
          .where(
            and(
              eq(sections.userId, context.institutionId),
              eq(sections.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.userId, context.institutionId),
              eq(subjects.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(faculty)
          .where(
            and(
              eq(faculty.userId, context.institutionId),
              eq(faculty.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.userId, context.institutionId),
              eq(rooms.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(breaks)
          .where(
            and(
              eq(breaks.userId, context.institutionId),
              eq(breaks.termId, targetTermId),
            ),
          ),
        database
          .select()
          .from(timetables)
          .where(
            and(
              eq(timetables.userId, context.institutionId),
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

    const activeDeptId =
      context.role === 'HOD' && context.departmentId
        ? context.departmentId
        : (domainDepartments[0]?.id ?? null);

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
          activeDepartmentId: activeDeptId,
          generationSettingsOverrides,
          collegeDetails,
        },
        terms: formattedTerms,
        activeTermId: targetTermId,
        membership: {
          role: context.role,
          departmentId: context.departmentId,
          facultyId: context.facultyId,
          institutionId: context.institutionId,
        },
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
    const context = await resolveInstitutionalContext(request);
    if (context.role === 'FACULTY') {
      return Response.json(
        { error: 'Faculty members have read-only access to workspace configurations' },
        { status: 403 },
      );
    }

    const database = getDatabase();
    const body = await request.json();

    const termId = body.termId || 'default';
    const payload = body.payload;

    if (!payload) {
      return Response.json({ error: 'Missing workspace payload' }, { status: 400 });
    }

    const now = new Date();
    const institutionId = context.institutionId;
    const isHod = context.role === 'HOD';
    const hodDeptId = context.departmentId;

    // 0. Ensure user profile exists to satisfy foreign key constraints
    await database
      .insert(userProfiles)
      .values({
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userProfiles.id,
        set: {
          email: context.user.email,
          name: context.user.name,
          updatedAt: now,
        },
      });

    // 1. Ensure target term exists
    const [existingTerm] = await database
      .select()
      .from(academicTerms)
      .where(and(eq(academicTerms.userId, institutionId), eq(academicTerms.id, termId)));

    if (!existingTerm) {
      await database.insert(academicTerms).values({
        id: termId,
        userId: institutionId,
        name: 'Academic Year 2026-27 (Odd Sem)',
        academicYear: '2026-27',
        isDefault: termId === 'default',
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Sync College Details (Admin only)
    if (context.role === 'ADMIN' && payload.collegeDetails) {
      const cd = payload.collegeDetails as CollegeDetails;
      await database
        .insert(collegeProfiles)
        .values({
          id: `col_${institutionId}`,
          userId: institutionId,
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
    let depts = (payload.departments as Department[]) ?? [];
    if (isHod && hodDeptId) {
      depts = depts.filter((d) => d.id === hodDeptId);
    }
    const deptIds = depts.map((d) => d.id);

    if (depts.length > 0) {
      const deptRows = depts.map((d) => ({
        id: d.id,
        userId: institutionId,
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
      }));

      await database
        .insert(departments)
        .values(deptRows)
        .onConflictDoUpdate({
          target: departments.id,
          set: {
            code: sql`excluded.code`,
            name: sql`excluded.name`,
            workingDays: sql`excluded.working_days`,
            periodsPerDay: sql`excluded.periods_per_day`,
            periodTimings: sql`excluded.period_timings`,
            effectiveFrom: sql`excluded.effective_from`,
            mentors: sql`excluded.mentors`,
            status: sql`excluded.status`,
            generationSettingsOverrides: sql`excluded.generation_settings_overrides`,
            updatedAt: now,
          },
        });
    }

    if (!isHod) {
      if (deptIds.length > 0) {
        await database
          .delete(departments)
          .where(
            and(
              eq(departments.userId, institutionId),
              eq(departments.termId, termId),
              notInArray(departments.id, deptIds),
            ),
          );
      } else {
        await database
          .delete(departments)
          .where(
            and(
              eq(departments.userId, institutionId),
              eq(departments.termId, termId),
            ),
          );
      }
    }

    // 4. Sync Sections
    let secs = (payload.sections as Section[]) ?? [];
    if (isHod && hodDeptId) {
      secs = secs.filter((s) => s.departmentId === hodDeptId);
    }
    const secIds = secs.map((s) => s.id);

    if (secs.length > 0) {
      const sectionRows = secs.map((s) => ({
        id: s.id,
        userId: institutionId,
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
      }));

      await database
        .insert(sections)
        .values(sectionRows)
        .onConflictDoUpdate({
          target: sections.id,
          set: {
            name: sql`excluded.name`,
            year: sql`excluded.year`,
            semester: sql`excluded.semester`,
            studentCount: sql`excluded.student_count`,
            subjectRequirements: sql`excluded.subject_requirements`,
            roomNo: sql`excluded.room_no`,
            classAdvisor: sql`excluded.class_advisor`,
            active: sql`excluded.active`,
            updatedAt: now,
          },
        });
    }

    if (isHod && hodDeptId) {
      if (secIds.length > 0) {
        await database
          .delete(sections)
          .where(
            and(
              eq(sections.userId, institutionId),
              eq(sections.termId, termId),
              eq(sections.departmentId, hodDeptId),
              notInArray(sections.id, secIds),
            ),
          );
      } else {
        await database
          .delete(sections)
          .where(
            and(
              eq(sections.userId, institutionId),
              eq(sections.termId, termId),
              eq(sections.departmentId, hodDeptId),
            ),
          );
      }
    } else {
      if (secIds.length > 0) {
        await database
          .delete(sections)
          .where(
            and(
              eq(sections.userId, institutionId),
              eq(sections.termId, termId),
              notInArray(sections.id, secIds),
            ),
          );
      } else {
        await database
          .delete(sections)
          .where(
            and(
              eq(sections.userId, institutionId),
              eq(sections.termId, termId),
            ),
          );
      }
    }

    // 5. Sync Subjects
    let subs = (payload.subjects as Subject[]) ?? [];
    if (isHod && hodDeptId) {
      subs = subs.filter((s) => s.departmentId === hodDeptId);
    }
    const subIds = subs.map((s) => s.id);

    if (subs.length > 0) {
      const subRows = subs.map((s) => ({
        id: s.id,
        userId: institutionId,
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
      }));

      await database
        .insert(subjects)
        .values(subRows)
        .onConflictDoUpdate({
          target: subjects.id,
          set: {
            code: sql`excluded.code`,
            name: sql`excluded.name`,
            type: sql`excluded.type`,
            courseCode: sql`excluded.course_code`,
            sessionsPerWeek: sql`excluded.sessions_per_week`,
            durationPeriods: sql`excluded.duration_periods`,
            eligibleFacultyIds: sql`excluded.eligible_faculty_ids`,
            eligibleSectionIds: sql`excluded.eligible_section_ids`,
            active: sql`excluded.active`,
            updatedAt: now,
          },
        });
    }

    if (isHod && hodDeptId) {
      if (subIds.length > 0) {
        await database
          .delete(subjects)
          .where(
            and(
              eq(subjects.userId, institutionId),
              eq(subjects.termId, termId),
              eq(subjects.departmentId, hodDeptId),
              notInArray(subjects.id, subIds),
            ),
          );
      } else {
        await database
          .delete(subjects)
          .where(
            and(
              eq(subjects.userId, institutionId),
              eq(subjects.termId, termId),
              eq(subjects.departmentId, hodDeptId),
            ),
          );
      }
    } else {
      if (subIds.length > 0) {
        await database
          .delete(subjects)
          .where(
            and(
              eq(subjects.userId, institutionId),
              eq(subjects.termId, termId),
              notInArray(subjects.id, subIds),
            ),
          );
      } else {
        await database
          .delete(subjects)
          .where(
            and(
              eq(subjects.userId, institutionId),
              eq(subjects.termId, termId),
            ),
          );
      }
    }

    // 6. Sync Faculty
    let facs = (payload.faculty as Faculty[]) ?? [];
    if (isHod && hodDeptId) {
      facs = facs.filter((f) => f.departmentId === hodDeptId);
    }
    const facIds = facs.map((f) => f.id);

    if (facs.length > 0) {
      const facRows = facs.map((f) => ({
        id: f.id,
        userId: institutionId,
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
      }));

      await database
        .insert(faculty)
        .values(facRows)
        .onConflictDoUpdate({
          target: faculty.id,
          set: {
            facultyCode: sql`excluded.faculty_code`,
            name: sql`excluded.name`,
            subjectIds: sql`excluded.subject_ids`,
            sectionIds: sql`excluded.section_ids`,
            availability: sql`excluded.availability`,
            preferredSlots: sql`excluded.preferred_slots`,
            maxPeriodsPerDay: sql`excluded.max_periods_per_day`,
            maxPeriodsPerWeek: sql`excluded.max_periods_per_week`,
            active: sql`excluded.active`,
            updatedAt: now,
          },
        });
    }

    if (isHod && hodDeptId) {
      if (facIds.length > 0) {
        await database
          .delete(faculty)
          .where(
            and(
              eq(faculty.userId, institutionId),
              eq(faculty.termId, termId),
              eq(faculty.departmentId, hodDeptId),
              notInArray(faculty.id, facIds),
            ),
          );
      } else {
        await database
          .delete(faculty)
          .where(
            and(
              eq(faculty.userId, institutionId),
              eq(faculty.termId, termId),
              eq(faculty.departmentId, hodDeptId),
            ),
          );
      }
    } else {
      if (facIds.length > 0) {
        await database
          .delete(faculty)
          .where(
            and(
              eq(faculty.userId, institutionId),
              eq(faculty.termId, termId),
              notInArray(faculty.id, facIds),
            ),
          );
      } else {
        await database
          .delete(faculty)
          .where(
            and(
              eq(faculty.userId, institutionId),
              eq(faculty.termId, termId),
            ),
          );
      }
    }

    // 7. Sync Rooms
    let rms = (payload.rooms as Room[]) ?? [];
    if (isHod && hodDeptId) {
      rms = rms.filter((r) => r.departmentId === hodDeptId);
    }
    const rmIds = rms.map((r) => r.id);

    if (rms.length > 0) {
      const roomRows = rms.map((r) => ({
        id: r.id,
        userId: institutionId,
        termId,
        departmentId: r.departmentId ?? null,
        code: r.code,
        name: r.name,
        capacity: r.capacity,
        type: r.type,
        active: r.active,
        createdAt: now,
        updatedAt: now,
      }));

      await database
        .insert(rooms)
        .values(roomRows)
        .onConflictDoUpdate({
          target: rooms.id,
          set: {
            departmentId: sql`excluded.department_id`,
            code: sql`excluded.code`,
            name: sql`excluded.name`,
            capacity: sql`excluded.capacity`,
            type: sql`excluded.type`,
            active: sql`excluded.active`,
            updatedAt: now,
          },
        });
    }

    if (isHod && hodDeptId) {
      if (rmIds.length > 0) {
        await database
          .delete(rooms)
          .where(
            and(
              eq(rooms.userId, institutionId),
              eq(rooms.termId, termId),
              eq(rooms.departmentId, hodDeptId),
              notInArray(rooms.id, rmIds),
            ),
          );
      } else {
        await database
          .delete(rooms)
          .where(
            and(
              eq(rooms.userId, institutionId),
              eq(rooms.termId, termId),
              eq(rooms.departmentId, hodDeptId),
            ),
          );
      }
    } else {
      if (rmIds.length > 0) {
        await database
          .delete(rooms)
          .where(
            and(
              eq(rooms.userId, institutionId),
              eq(rooms.termId, termId),
              notInArray(rooms.id, rmIds),
            ),
          );
      } else {
        await database
          .delete(rooms)
          .where(
            and(
              eq(rooms.userId, institutionId),
              eq(rooms.termId, termId),
            ),
          );
      }
    }

    // 8. Sync Breaks (Admin only)
    if (!isHod) {
      const brks = (payload.breaks as Break[]) ?? [];
      const brkIds = brks.map((b) => b.id);

      if (brks.length > 0) {
        const breakRows = brks.map((b) => ({
          id: b.id,
          userId: institutionId,
          termId,
          name: b.name,
          dayIndex: b.dayIndex,
          startPeriod: b.startPeriod,
          durationPeriods: b.durationPeriods,
          startTime: b.startTime,
          endTime: b.endTime,
          createdAt: now,
          updatedAt: now,
        }));

        await database
          .insert(breaks)
          .values(breakRows)
          .onConflictDoUpdate({
            target: breaks.id,
            set: {
              name: sql`excluded.name`,
              dayIndex: sql`excluded.day_index`,
              startPeriod: sql`excluded.start_period`,
              durationPeriods: sql`excluded.duration_periods`,
              startTime: sql`excluded.start_time`,
              endTime: sql`excluded.end_time`,
              updatedAt: now,
            },
          });
      }

      if (brkIds.length > 0) {
        await database
          .delete(breaks)
          .where(
            and(
              eq(breaks.userId, institutionId),
              eq(breaks.termId, termId),
              notInArray(breaks.id, brkIds),
            ),
          );
      } else {
        await database
          .delete(breaks)
          .where(
            and(
              eq(breaks.userId, institutionId),
              eq(breaks.termId, termId),
            ),
          );
      }
    }

    // 9. Sync Timetables
    let tts = (payload.timetables as Timetable[]) ?? [];
    if (isHod && hodDeptId) {
      tts = tts.filter((t) => t.departmentId === hodDeptId);
    }
    const ttIds = tts.map((t) => t.id);

    if (isHod && hodDeptId) {
      if (ttIds.length > 0) {
        await database
          .delete(timetables)
          .where(
            and(
              eq(timetables.userId, institutionId),
              eq(timetables.termId, termId),
              eq(timetables.departmentId, hodDeptId),
              notInArray(timetables.id, ttIds),
            ),
          );
      } else {
        await database
          .delete(timetables)
          .where(
            and(
              eq(timetables.userId, institutionId),
              eq(timetables.termId, termId),
              eq(timetables.departmentId, hodDeptId),
            ),
          );
      }
    } else {
      if (ttIds.length > 0) {
        await database
          .delete(timetables)
          .where(
            and(
              eq(timetables.userId, institutionId),
              eq(timetables.termId, termId),
              notInArray(timetables.id, ttIds),
            ),
          );
      } else {
        await database
          .delete(timetables)
          .where(
            and(
              eq(timetables.userId, institutionId),
              eq(timetables.termId, termId),
            ),
          );
      }
    }

    for (const t of tts) {
      await database
        .delete(timetables)
        .where(
          and(
            eq(timetables.userId, institutionId),
            eq(timetables.termId, termId),
            eq(timetables.departmentId, t.departmentId),
            ne(timetables.id, t.id),
          ),
        );

      const snapshot = t.configurationSnapshot ?? {
        fingerprint: 'fallback',
        department: { id: t.departmentId, code: '', name: '', workingDays: [], periodsPerDay: 0 },
        sections: [],
        subjects: [],
        faculty: [],
        breaks: [],
        rooms: [],
        hardConstraints: {},
        softWeights: {},
        generationSettings: {},
      };

      await database
        .insert(timetables)
        .values({
          id: t.id,
          userId: institutionId,
          termId,
          departmentId: t.departmentId,
          status: t.status,
          revision: t.revision,
          configurationSnapshot: snapshot,
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
            configurationSnapshot: snapshot,
            entries: t.entries,
            validationSummary: t.validationSummary,
            generationMetadata: t.generationMetadata,
            versionHistory: t.versionHistory ?? [],
            updatedAt: now,
          },
        });
    }

    // 10. Update Term Statistics (Admin only)
    if (!isHod) {
      await database
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
        .where(and(eq(academicTerms.userId, institutionId), eq(academicTerms.id, termId)));
    }

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
