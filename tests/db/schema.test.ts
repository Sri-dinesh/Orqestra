import { describe, it, expect } from 'vitest';
import {
  userProfiles,
  collegeProfiles,
  academicTerms,
  departments,
  sections,
  subjects,
  faculty,
  rooms,
  breaks,
  timetables,
  generationAuditLogs,
} from '@/db/schema';
import { getTableColumns } from 'drizzle-orm';

describe('Relational Database Schema (Neon Postgres + Drizzle ORM)', () => {
  it('defines all 11 required domain and audit tables', () => {
    expect(userProfiles).toBeDefined();
    expect(collegeProfiles).toBeDefined();
    expect(academicTerms).toBeDefined();
    expect(departments).toBeDefined();
    expect(sections).toBeDefined();
    expect(subjects).toBeDefined();
    expect(faculty).toBeDefined();
    expect(rooms).toBeDefined();
    expect(breaks).toBeDefined();
    expect(timetables).toBeDefined();
    expect(generationAuditLogs).toBeDefined();
  });

  it('configures userProfiles with enterprise profile columns', () => {
    const cols = getTableColumns(userProfiles);
    expect(cols.id).toBeDefined();
    expect(cols.email).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.createdAt).toBeDefined();
    expect(cols.updatedAt).toBeDefined();
  });

  it('configures collegeProfiles with complete institutional branding fields', () => {
    const cols = getTableColumns(collegeProfiles);
    expect(cols.userId).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.code).toBeDefined();
    expect(cols.address).toBeDefined();
    expect(cols.city).toBeDefined();
    expect(cols.state).toBeDefined();
    expect(cols.pincode).toBeDefined();
    expect(cols.website).toBeDefined();
    expect(cols.contactEmail).toBeDefined();
    expect(cols.contactPhone).toBeDefined();
    expect(cols.academicYear).toBeDefined();
    expect(cols.logoDataUrl).toBeDefined();
  });

  it('configures academicTerms with multi-semester support and statistics', () => {
    const cols = getTableColumns(academicTerms);
    expect(cols.id).toBeDefined();
    expect(cols.userId).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.academicYear).toBeDefined();
    expect(cols.isDefault).toBeDefined();
    expect(cols.stats).toBeDefined();
  });

  it('configures departments with working days, periods per day, and period timings', () => {
    const cols = getTableColumns(departments);
    expect(cols.id).toBeDefined();
    expect(cols.userId).toBeDefined();
    expect(cols.termId).toBeDefined();
    expect(cols.code).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.workingDays).toBeDefined();
    expect(cols.periodsPerDay).toBeDefined();
    expect(cols.periodTimings).toBeDefined();
    expect(cols.effectiveFrom).toBeDefined();
    expect(cols.mentors).toBeDefined();
    expect(cols.status).toBeDefined();
    expect(cols.generationSettingsOverrides).toBeDefined();
  });

  it('configures timetables with entries, snapshots, version history, and publishing flags', () => {
    const cols = getTableColumns(timetables);
    expect(cols.id).toBeDefined();
    expect(cols.userId).toBeDefined();
    expect(cols.termId).toBeDefined();
    expect(cols.departmentId).toBeDefined();
    expect(cols.status).toBeDefined();
    expect(cols.revision).toBeDefined();
    expect(cols.configurationSnapshot).toBeDefined();
    expect(cols.entries).toBeDefined();
    expect(cols.validationSummary).toBeDefined();
    expect(cols.generationMetadata).toBeDefined();
    expect(cols.versionHistory).toBeDefined();
    expect(cols.isPublished).toBeDefined();
    expect(cols.publicSlug).toBeDefined();
  });

  it('configures sections, subjects, faculty, rooms, and breaks with proper relational foreign keys', () => {
    const secCols = getTableColumns(sections);
    expect(secCols.departmentId).toBeDefined();
    expect(secCols.subjectRequirements).toBeDefined();

    const subCols = getTableColumns(subjects);
    expect(subCols.departmentId).toBeDefined();
    expect(subCols.type).toBeDefined();
    expect(subCols.eligibleFacultyIds).toBeDefined();

    const facCols = getTableColumns(faculty);
    expect(facCols.departmentId).toBeDefined();
    expect(facCols.facultyCode).toBeDefined();
    expect(facCols.availability).toBeDefined();
    expect(facCols.preferredSlots).toBeDefined();

    const roomCols = getTableColumns(rooms);
    expect(roomCols.code).toBeDefined();
    expect(roomCols.capacity).toBeDefined();

    const breakCols = getTableColumns(breaks);
    expect(breakCols.startPeriod).toBeDefined();
    expect(breakCols.durationPeriods).toBeDefined();
  });
});
