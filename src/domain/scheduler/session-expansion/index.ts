import type { FacultyId, SectionId, SessionUnitId, SubjectId } from '../../models/ids';
import type { Section, Subject } from '../../models';

export interface SessionUnit {
  id: SessionUnitId;
  sectionId: SectionId;
  subjectId: SubjectId;
  durationPeriods: number;
  eligibleFacultyIds: FacultyId[];
  /** Higher priority is scheduled earlier. */
  priority: number;
  sessionIndex: number;
}

/**
 * Expand section requirements into schedulable session units (§6, §73).
 * Labs remain a single unit with duration 2.
 */
export function expandRequirements(config: {
  sections: Section[];
  subjects: Subject[];
}): SessionUnit[] {
  const sessions: SessionUnit[] = [];
  const subjectById = new Map(config.subjects.map((s) => [s.id, s]));

  for (const section of config.sections) {
    if (!section.active) continue;
    for (const req of section.subjectRequirements) {
      if (req.sessionsPerWeek <= 0) continue;
      const subject = subjectById.get(req.subjectId);
      if (!subject || !subject.active) continue;
      if (!subject.eligibleSectionIds.includes(section.id)) continue;
      const eligibleFaculty = subject.eligibleFacultyIds.filter((fid) => fid.length > 0);

      for (let i = 0; i < req.sessionsPerWeek; i++) {
        sessions.push({
          id: `${section.id}:${subject.id}:${i + 1}`,
          sectionId: section.id,
          subjectId: subject.id,
          durationPeriods: subject.durationPeriods,
          eligibleFacultyIds: [...eligibleFaculty].sort(),
          priority: 0,
          sessionIndex: i,
        });
      }
    }
  }
  assignPriorities(sessions, config);
  return sessions;
}

/**
 * Variable ordering priority (§7, §77): hardest sessions first —
 * labs, scarce faculty, section capacity pressure, stable tie-break by ID.
 */
function assignPriorities(sessions: SessionUnit[], config: { sections: Section[]; subjects: Subject[] }): void {
  const facultyUse = new Map<string, number>();
  for (const s of sessions) {
    for (const fid of s.eligibleFacultyIds) {
      facultyUse.set(fid, (facultyUse.get(fid) ?? 0) + 1);
    }
  }
  const sectionLoad = new Map<string, number>();
  for (const s of sessions) {
    sectionLoad.set(s.sectionId, (sectionLoad.get(s.sectionId) ?? 0) + s.durationPeriods);
  }

  for (const s of sessions) {
    const subject = config.subjects.find((sub) => sub.id === s.subjectId);
    let priority = 0;
    if (s.durationPeriods > 1) priority += 100; // labs first
    priority += Math.max(0, 50 - s.eligibleFacultyIds.length * 10); // fewest faculty first
    const section = config.sections.find((sec) => sec.id === s.sectionId);
    if (section) {
      const cap = section.subjectRequirements.reduce((acc, r) => {
        const sub = config.subjects.find((x) => x.id === r.subjectId);
        return acc + (sub ? r.sessionsPerWeek * sub.durationPeriods : 0);
      }, 0);
      priority += Math.floor(cap / 4); // denser sections earlier
    }
    priority += s.id.length; // stable, negligible tie influence
    priority += (subject?.sessionsPerWeek ?? 1);
    s.priority = priority;
  }
}

/** Deterministic descending sort by priority, then stable ID. */
export function orderSessions(sessions: SessionUnit[]): SessionUnit[] {
  return [...sessions].sort((a, b) =>
    b.priority !== a.priority
      ? b.priority - a.priority
      : a.id < b.id
        ? -1
        : a.id > b.id
          ? 1
          : 0,
  );
}
