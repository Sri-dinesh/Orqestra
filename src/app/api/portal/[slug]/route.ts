import { and, eq } from 'drizzle-orm';
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

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    const params = await props.params;
    const database = getDatabase();
    const slug = params.slug;

    if (!slug) {
      return Response.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Find the published timetable
    const [timetableRecord] = await database
      .select()
      .from(timetables)
      .where(and(eq(timetables.publicSlug, slug), eq(timetables.isPublished, true)));

    if (!timetableRecord) {
      return Response.json(
        { error: 'Published timetable not found or no longer publicly accessible.' },
        { status: 404 },
      );
    }

    const { userId, termId, departmentId } = timetableRecord;

    // Fetch related department and metadata
    const [deptRecord, termRecord, collegeProfile] = await Promise.all([
      database
        .select()
        .from(departments)
        .where(and(eq(departments.userId, userId), eq(departments.id, departmentId)))
        .then((rows) => rows[0] || null),
      database
        .select()
        .from(academicTerms)
        .where(and(eq(academicTerms.userId, userId), eq(academicTerms.id, termId)))
        .then((rows) => rows[0] || null),
      database
        .select()
        .from(collegeProfiles)
        .where(eq(collegeProfiles.userId, userId))
        .then((rows) => rows[0] || null),
    ]);

    // Fetch resource details for display
    const [secRows, subRows, facRows, roomRows, breakRows] = await Promise.all([
      database
        .select()
        .from(sections)
        .where(and(eq(sections.userId, userId), eq(sections.departmentId, departmentId))),
      database
        .select()
        .from(subjects)
        .where(and(eq(subjects.userId, userId), eq(subjects.departmentId, departmentId))),
      database
        .select()
        .from(faculty)
        .where(and(eq(faculty.userId, userId), eq(faculty.departmentId, departmentId))),
      database
        .select()
        .from(rooms)
        .where(and(eq(rooms.userId, userId), eq(rooms.termId, termId))),
      database
        .select()
        .from(breaks)
        .where(and(eq(breaks.userId, userId), eq(breaks.termId, termId))),
    ]);

    // Effective department with fallback
    const effectiveDept = deptRecord || {
      id: departmentId,
      userId,
      termId,
      name: `Department ${departmentId}`,
      code: departmentId.toUpperCase(),
      workingDays: timetableRecord.configurationSnapshot?.workingDays?.length
        ? timetableRecord.configurationSnapshot.workingDays
        : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      periodsPerDay: timetableRecord.configurationSnapshot?.periodsPerDay || 6,
      periodTimings: [],
      status: 'CONFIGURED',
      createdAt: timetableRecord.createdAt,
      updatedAt: timetableRecord.updatedAt,
    };

    // Ensure all referenced sections/subjects/faculty exist in arrays so the UI never displays blanks
    const secMap = new Map(secRows.map((s) => [s.id, s]));
    const subMap = new Map(subRows.map((s) => [s.id, s]));
    const facMap = new Map(facRows.map((f) => [f.id, f]));
    const roomMap = new Map(roomRows.map((r) => [r.id, r]));

    for (const entry of timetableRecord.entries ?? []) {
      if (entry.sectionId && !secMap.has(entry.sectionId)) {
        secMap.set(entry.sectionId, {
          id: entry.sectionId,
          userId,
          termId,
          departmentId,
          name: entry.sectionId,
          year: 1,
          semester: 1,
          studentCount: 60,
          subjectRequirements: [],
          roomNo: null,
          classAdvisor: null,
          active: true,
          createdAt: timetableRecord.createdAt,
          updatedAt: timetableRecord.updatedAt,
        });
      }
      if (entry.subjectId && !subMap.has(entry.subjectId)) {
        subMap.set(entry.subjectId, {
          id: entry.subjectId,
          userId,
          termId,
          departmentId,
          name: entry.subjectId,
          code: entry.subjectId.toUpperCase(),
          type: 'THEORY',
          courseCode: null,
          sessionsPerWeek: 1,
          durationPeriods: 1,
          eligibleFacultyIds: [],
          eligibleSectionIds: [],
          active: true,
          createdAt: timetableRecord.createdAt,
          updatedAt: timetableRecord.updatedAt,
        });
      }
      if (entry.facultyId && !facMap.has(entry.facultyId)) {
        facMap.set(entry.facultyId, {
          id: entry.facultyId,
          userId,
          termId,
          departmentId,
          name: entry.facultyId,
          facultyCode: entry.facultyId.toUpperCase().slice(0, 4),
          subjectIds: [],
          sectionIds: [],
          availability: [],
          preferredSlots: [],
          maxPeriodsPerDay: null,
          maxPeriodsPerWeek: null,
          active: true,
          createdAt: timetableRecord.createdAt,
          updatedAt: timetableRecord.updatedAt,
        });
      }
      if (entry.roomId && !roomMap.has(entry.roomId)) {
        roomMap.set(entry.roomId, {
          id: entry.roomId,
          userId,
          termId,
          departmentId,
          name: entry.roomId,
          code: entry.roomId.toUpperCase(),
          capacity: 60,
          type: 'GENERAL',
          active: true,
          createdAt: timetableRecord.createdAt,
          updatedAt: timetableRecord.updatedAt,
        });
      }
    }

    return Response.json(
      {
        timetable: timetableRecord,
        department: effectiveDept,
        term: termRecord,
        college: collegeProfile,
        sections: Array.from(secMap.values()),
        subjects: Array.from(subMap.values()),
        faculty: Array.from(facMap.values()),
        rooms: Array.from(roomMap.values()),
        breaks: breakRows,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('Portal lookup failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Portal lookup failed' },
      { status: 500 },
    );
  }
}
