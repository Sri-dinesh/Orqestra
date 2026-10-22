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

    return Response.json(
      {
        timetable: timetableRecord,
        department: deptRecord,
        term: termRecord,
        college: collegeProfile,
        sections: secRows,
        subjects: subRows,
        faculty: facRows,
        rooms: roomRows,
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
