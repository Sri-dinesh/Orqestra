import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type {
  Faculty,
  GenerationMetadata,
  PeriodTiming,
  Room,
  SubjectRequirement,
  Timetable,
  TimetableEntry,
  TimetableVersion,
  ValidationResult,
} from '@/domain/models';
import type { AcademicTerm } from '@/storage/term-manager';
import type { GenerationSettingsOverrides } from '@/state/stores/workspace-store';
import type { WorkingDay } from '@/domain/enums';

/**
 * Enterprise user profile table for Orqestra.
 * Authentication records themselves remain owned by Neon Auth in the neon_auth schema.
 */
export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export const appUserProfiles = userProfiles;
export type AppUserProfile = UserProfile;
export type NewAppUserProfile = NewUserProfile;

/**
 * College/Institution profile descriptive metadata.
 * Exactly one profile per user/institution.
 */
export const collegeProfiles = pgTable(
  'college_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    name: text('name').default('').notNull(),
    code: text('code').default('').notNull(),
    address: text('address').default('').notNull(),
    city: text('city').default('').notNull(),
    state: text('state').default('').notNull(),
    pincode: text('pincode').default('').notNull(),
    website: text('website').default('').notNull(),
    contactEmail: text('contact_email').default('').notNull(),
    contactPhone: text('contact_phone').default('').notNull(),
    academicYear: text('academic_year').default('').notNull(),
    logoDataUrl: text('logo_data_url').default('').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('college_profiles_user_id_idx').on(table.userId),
  ],
);

export type CollegeProfileRecord = typeof collegeProfiles.$inferSelect;
export type NewCollegeProfileRecord = typeof collegeProfiles.$inferInsert;

/**
 * Academic terms / semesters (e.g. "Fall 2026", "Academic Year 2026-27 (Odd Sem)").
 * Multiple terms allowed per institution.
 */
export const academicTerms = pgTable(
  'academic_terms',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    academicYear: text('academic_year').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    stats: jsonb('stats').$type<AcademicTerm['stats']>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('academic_terms_user_id_idx').on(table.userId),
  ],
);

export type AcademicTermRecord = typeof academicTerms.$inferSelect;
export type NewAcademicTermRecord = typeof academicTerms.$inferInsert;

/**
 * Institutional academic departments.
 */
export const departments = pgTable(
  'departments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    workingDays: jsonb('working_days').$type<WorkingDay[]>().notNull(),
    periodsPerDay: integer('periods_per_day').default(6).notNull(),
    periodTimings: jsonb('period_timings').$type<PeriodTiming[]>(),
    effectiveFrom: text('effective_from'),
    mentors: text('mentors'),
    status: text('status').default('CONFIGURATION_INCOMPLETE').notNull(),
    generationSettingsOverrides: jsonb('generation_settings_overrides').$type<Partial<GenerationSettingsOverrides>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('departments_user_term_idx').on(table.userId, table.termId),
  ],
);

export type DepartmentRecord = typeof departments.$inferSelect;
export type NewDepartmentRecord = typeof departments.$inferInsert;

/**
 * Section / Batch within a department.
 */
export const sections = pgTable(
  'sections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    year: integer('year').notNull(),
    semester: integer('semester').notNull(),
    studentCount: integer('student_count').default(60).notNull(),
    subjectRequirements: jsonb('subject_requirements').$type<SubjectRequirement[]>().notNull(),
    roomNo: text('room_no'),
    classAdvisor: text('class_advisor'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('sections_department_id_idx').on(table.departmentId),
    index('sections_user_term_idx').on(table.userId, table.termId),
  ],
);

export type SectionRecord = typeof sections.$inferSelect;
export type NewSectionRecord = typeof sections.$inferInsert;

/**
 * Course/Subject offering in a department.
 */
export const subjects = pgTable(
  'subjects',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    type: text('type').$type<'THEORY' | 'LAB'>().notNull(),
    courseCode: text('course_code'),
    sessionsPerWeek: integer('sessions_per_week').default(4).notNull(),
    durationPeriods: integer('duration_periods').default(1).notNull(),
    eligibleFacultyIds: jsonb('eligible_faculty_ids').$type<string[]>().notNull(),
    eligibleSectionIds: jsonb('eligible_section_ids').$type<string[]>().notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('subjects_department_id_idx').on(table.departmentId),
    index('subjects_user_term_idx').on(table.userId, table.termId),
  ],
);

export type SubjectRecord = typeof subjects.$inferSelect;
export type NewSubjectRecord = typeof subjects.$inferInsert;

/**
 * Faculty educators teaching in departments.
 */
export const faculty = pgTable(
  'faculty',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    facultyCode: text('faculty_code').notNull(),
    name: text('name').notNull(),
    subjectIds: jsonb('subject_ids').$type<string[]>().notNull(),
    sectionIds: jsonb('section_ids').$type<string[]>().notNull(),
    availability: jsonb('availability').$type<Faculty['availability']>().notNull(),
    preferredSlots: jsonb('preferred_slots').$type<Faculty['preferredSlots']>().notNull(),
    maxPeriodsPerDay: integer('max_periods_per_day'),
    maxPeriodsPerWeek: integer('max_periods_per_week'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('faculty_department_id_idx').on(table.departmentId),
    index('faculty_user_term_idx').on(table.userId, table.termId),
  ],
);

export type FacultyRecord = typeof faculty.$inferSelect;
export type NewFacultyRecord = typeof faculty.$inferInsert;

/**
 * Physical rooms & laboratory allocations.
 */
export const rooms = pgTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    departmentId: text('department_id').references(() => departments.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    capacity: integer('capacity').default(60).notNull(),
    type: text('type').$type<Room['type']>().default('GENERAL').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('rooms_user_term_idx').on(table.userId, table.termId),
    index('rooms_department_id_idx').on(table.departmentId),
  ],
);

export type RoomRecord = typeof rooms.$inferSelect;
export type NewRoomRecord = typeof rooms.$inferInsert;

/**
 * Scheduled intervals / lunch breaks.
 */
export const breaks = pgTable(
  'breaks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    departmentId: text('department_id').references(() => departments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    dayIndex: integer('day_index'), // null means everyday
    startPeriod: integer('start_period').notNull(),
    durationPeriods: integer('duration_periods').default(1).notNull(),
    startTime: text('start_time'),
    endTime: text('end_time'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('breaks_user_term_idx').on(table.userId, table.termId),
  ],
);

export type BreakRecord = typeof breaks.$inferSelect;
export type NewBreakRecord = typeof breaks.$inferInsert;

/**
 * Generated and validated Timetables.
 */
export const timetables = pgTable(
  'timetables',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    status: text('status').$type<Timetable['status']>().notNull(),
    revision: integer('revision').default(1).notNull(),
    configurationSnapshot: jsonb('configuration_snapshot').$type<Timetable['configurationSnapshot']>().notNull(),
    entries: jsonb('entries').$type<TimetableEntry[]>().notNull(),
    validationSummary: jsonb('validation_summary').$type<ValidationResult | null>(),
    generationMetadata: jsonb('generation_metadata').$type<GenerationMetadata | null>(),
    versionHistory: jsonb('version_history').$type<TimetableVersion[]>(),
    isPublished: boolean('is_published').default(false).notNull(),
    publicSlug: text('public_slug').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('timetables_user_term_dept_idx').on(table.userId, table.termId, table.departmentId),
    index('timetables_department_id_idx').on(table.departmentId),
    index('timetables_public_slug_idx').on(table.publicSlug),
  ],
);

export type TimetableRecord = typeof timetables.$inferSelect;
export type NewTimetableRecord = typeof timetables.$inferInsert;

/**
 * Generation audit log tracking solver performance and seed telemetry.
 */
export const generationAuditLogs = pgTable(
  'generation_audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    termId: text('term_id').notNull(),
    departmentId: text('department_id').notNull(),
    seed: integer('seed'),
    status: text('status').notNull(),
    durationMs: integer('duration_ms'),
    nodesExplored: integer('nodes_explored'),
    finalScore: doublePrecision('final_score'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('generation_logs_user_idx').on(table.userId),
    index('generation_logs_dept_idx').on(table.departmentId),
  ],
);

export type GenerationAuditLogRecord = typeof generationAuditLogs.$inferSelect;
export type NewGenerationAuditLogRecord = typeof generationAuditLogs.$inferInsert;

export type InstitutionRole = 'ADMIN' | 'HOD' | 'FACULTY';

/**
 * Institutional members connecting users to a tenant workspace with assigned roles.
 */
export const institutionMembers = pgTable(
  'institution_members',
  {
    id: text('id').primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    role: text('role').$type<InstitutionRole>().default('FACULTY').notNull(),
    departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
    facultyId: text('faculty_id').references(() => faculty.id, { onDelete: 'set null' }),
    status: text('status').$type<'ACTIVE' | 'SUSPENDED'>().default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('members_inst_user_idx').on(table.institutionId, table.userId),
    index('members_user_id_idx').on(table.userId),
    index('members_dept_id_idx').on(table.departmentId),
  ],
);

export type InstitutionMember = typeof institutionMembers.$inferSelect;
export type NewInstitutionMember = typeof institutionMembers.$inferInsert;

/**
 * Invitations sent to users to join an institution workspace with a specific role.
 */
export const memberInvitations = pgTable(
  'member_invitations',
  {
    id: text('id').primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').$type<InstitutionRole>().default('FACULTY').notNull(),
    departmentId: text('department_id').references(() => departments.id, { onDelete: 'cascade' }),
    facultyId: text('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }),
    invitedBy: text('invited_by')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    status: text('status')
      .$type<'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'>()
      .default('PENDING')
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('invitations_inst_email_idx').on(table.institutionId, table.email),
    index('invitations_token_idx').on(table.token),
  ],
);

export type MemberInvitation = typeof memberInvitations.$inferSelect;
export type NewMemberInvitation = typeof memberInvitations.$inferInsert;
