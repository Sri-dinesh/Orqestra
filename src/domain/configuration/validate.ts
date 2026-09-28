import type { Department, Faculty, Section, Subject } from '../models';
import { defaultDurationFor } from './normalize';

export interface ConfigIssue {
  code: string;
  message: string;
  entityIds: string[];
  suggestions: string[];
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  issues: ConfigIssue[];
}

/**
 * Full configuration validation pipeline (§71):
 * structure → references → assignments → scheduling inputs.
 */
export function validateConfiguration(input: {
  department: Department;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
}): ConfigurationValidationResult {
  const issues: ConfigIssue[] = [];
  const { department, sections, subjects, faculty } = input;

  issues.push(...validateStructure(department, sections, subjects, faculty));
  issues.push(...validateReferences(sections, subjects, faculty));
  issues.push(...validateAssignments(subjects));
  issues.push(...validateSchedulerInputs(department, sections, subjects));

  return { isValid: issues.length === 0, issues };
}

function validateStructure(
  department: Department,
  sections: Section[],
  subjects: Subject[],
  faculty: Faculty[],
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  if (department.workingDays.length === 0) {
    issues.push({
      code: 'NO_WORKING_DAYS',
      message: 'At least one working day must be configured.',
      entityIds: [department.id],
      suggestions: ['Configure working days for the department.'],
    });
  }
  if (department.periodsPerDay < 1 || department.periodsPerDay > 12) {
    issues.push({
      code: 'INVALID_PERIODS_PER_DAY',
      message: `Periods per day must be between 1 and 12 (got ${department.periodsPerDay}).`,
      entityIds: [department.id],
      suggestions: ['Set periods per day to a value between 1 and 12.'],
    });
  }
  if (sections.length === 0) {
    issues.push({
      code: 'NO_SECTIONS',
      message: 'At least one section is required before scheduling.',
      entityIds: [department.id],
      suggestions: ['Add at least one section.'],
    });
  }
  if (subjects.length === 0) {
    issues.push({
      code: 'NO_SUBJECTS',
      message: 'At least one subject is required before scheduling.',
      entityIds: [department.id],
      suggestions: ['Add subjects with weekly session requirements.'],
    });
  }

  // Unique codes
  const sectionNames = new Set<string>();
  for (const s of sections) {
    if (sectionNames.has(s.name)) {
      issues.push({
        code: 'DUPLICATE_SECTION_NAME',
        message: `Section name "${s.name}" is duplicated.`,
        entityIds: [s.id],
        suggestions: ['Give each section a unique name.'],
      });
    }
    sectionNames.add(s.name);
  }
  const subjectCodes = new Set<string>();
  for (const s of subjects) {
    if (subjectCodes.has(s.code)) {
      issues.push({
        code: 'DUPLICATE_SUBJECT_CODE',
        message: `Subject code "${s.code}" is duplicated.`,
        entityIds: [s.id],
        suggestions: ['Give each subject a unique code within the department.'],
      });
    }
    subjectCodes.add(s.code);
  }
  const facultyCodes = new Set<string>();
  for (const f of faculty) {
    if (facultyCodes.has(f.facultyCode)) {
      issues.push({
        code: 'DUPLICATE_FACULTY_CODE',
        message: `Faculty code "${f.facultyCode}" is duplicated.`,
        entityIds: [f.id],
        suggestions: ['Give each faculty member a unique code.'],
      });
    }
    facultyCodes.add(f.facultyCode);
  }

  return issues;
}

function validateReferences(
  sections: Section[],
  subjects: Subject[],
  faculty: Faculty[],
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const subjectIds = new Set(subjects.map((s) => s.id));
  const facultyIds = new Set(faculty.map((f) => f.id));
  const sectionIds = new Set(sections.map((s) => s.id));

  for (const section of sections) {
    for (const req of section.subjectRequirements) {
      if (!subjectIds.has(req.subjectId)) {
        issues.push({
          code: 'SECTION_REFERENCES_MISSING_SUBJECT',
          message: `Section "${section.name}" references a deleted subject.`,
          entityIds: [section.id, req.subjectId],
          suggestions: ['Remove the stale requirement or recreate the subject.'],
        });
      }
      if (req.sessionsPerWeek < 0) {
        issues.push({
          code: 'INVALID_SESSION_COUNT',
          message: `Section "${section.name}" has a negative session count.`,
          entityIds: [section.id],
          suggestions: ['Set session counts to zero or more.'],
        });
      }
    }
  }
  for (const subject of subjects) {
    for (const fid of subject.eligibleFacultyIds) {
      if (!facultyIds.has(fid)) {
        issues.push({
          code: 'SUBJECT_REFERENCES_MISSING_FACULTY',
          message: `Subject "${subject.code}" references a deleted faculty member.`,
          entityIds: [subject.id, fid],
          suggestions: ['Remove the stale faculty reference.'],
        });
      }
    }
  }
  for (const f of faculty) {
    for (const sid of f.subjectIds) {
      if (!subjectIds.has(sid)) {
        issues.push({
          code: 'FACULTY_REFERENCES_MISSING_SUBJECT',
          message: `Faculty "${f.name}" references a deleted subject.`,
          entityIds: [f.id, sid],
          suggestions: ['Remove the stale subject reference.'],
        });
      }
    }
    for (const secId of f.sectionIds) {
      if (!sectionIds.has(secId)) {
        issues.push({
          code: 'FACULTY_REFERENCES_MISSING_SECTION',
          message: `Faculty "${f.name}" references a deleted section.`,
          entityIds: [f.id, secId],
          suggestions: ['Remove the stale section reference.'],
        });
      }
    }
  }
  return issues;
}

function validateAssignments(subjects: Subject[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  for (const subject of subjects) {
    if (!subject.active || subject.sessionsPerWeek === 0) continue;
    if (subject.eligibleFacultyIds.length === 0) {
      issues.push({
        code: 'SUBJECT_HAS_NO_FACULTY',
        message: `Subject "${subject.code}" has no eligible faculty.`,
        entityIds: [subject.id],
        suggestions: ['Assign at least one eligible faculty member.'],
      });
    }
    if (subject.eligibleSectionIds.length === 0) {
      issues.push({
        code: 'SUBJECT_HAS_NO_SECTIONS',
        message: `Subject "${subject.code}" is not applicable to any section.`,
        entityIds: [subject.id],
        suggestions: ['Mark at least one section as eligible.'],
      });
    }
    if (subject.durationPeriods !== defaultDurationFor(subject.type)) {
      issues.push({
        code: 'INVALID_SUBJECT_DURATION',
        message: `Subject "${subject.code}" has an invalid duration for its type (theory=1, lab=2).`,
        entityIds: [subject.id],
        suggestions: ['Reset the subject duration to match its type.'],
      });
    }
  }
  return issues;
}

function validateSchedulerInputs(
  department: Department,
  sections: Section[],
  subjects: Subject[],
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const activeSections = sections.filter((s) => s.active);
  if (activeSections.length === 0) {
    issues.push({
      code: 'NO_ACTIVE_SECTIONS',
      message: 'No active sections available for scheduling.',
      entityIds: [department.id],
      suggestions: ['Activate at least one section.'],
    });
  }

  // Every required section-subject combination must have eligible faculty and applicability.
  for (const section of activeSections) {
    for (const req of section.subjectRequirements) {
      if (req.sessionsPerWeek === 0) continue;
      const subject = subjects.find((s) => s.id === req.subjectId);
      if (!subject) continue; // already flagged in reference checks
      if (!subject.active) {
        issues.push({
          code: 'REQUIRED_SUBJECT_INACTIVE',
          message: `Section "${section.name}" requires inactive subject "${subject.code}".`,
          entityIds: [section.id, subject.id],
          suggestions: ['Activate the subject or remove the requirement.'],
        });
        continue;
      }
      if (!subject.eligibleSectionIds.includes(section.id)) {
        issues.push({
          code: 'SUBJECT_NOT_APPLICABLE',
          message: `Subject "${subject.code}" is required by section "${section.name}" but is not marked applicable.`,
          entityIds: [section.id, subject.id],
          suggestions: ['Mark the subject applicable to this section.'],
        });
      }
      const hasEligibleFaculty =
        subject.eligibleFacultyIds.length > 0;
      if (!hasEligibleFaculty) {
        issues.push({
          code: 'MISSING_FACULTY',
          message: `No active eligible faculty for subject "${subject.code}" required by section "${section.name}".`,
          entityIds: [section.id, subject.id],
          suggestions: ['Assign an active faculty member to this subject.'],
        });
      }
    }
  }
  return issues;
}
