import { describe, it, expect } from 'vitest';
import {
  requireRole,
  assertDepartmentAccess,
  assertFacultyAccess,
  type InstitutionalContext,
} from '@/auth/server';

describe('Institutional RBAC Authorization Guards', () => {
  const adminCtx: InstitutionalContext = {
    user: { id: 'admin_1', email: 'admin@college.edu', name: 'Dean Admin' },
    institutionId: 'inst_1',
    role: 'ADMIN',
    departmentId: null,
    facultyId: null,
    isOwner: true,
  };

  const hodCtx: InstitutionalContext = {
    user: { id: 'hod_cse', email: 'hod@college.edu', name: 'Dr. Anita' },
    institutionId: 'inst_1',
    role: 'HOD',
    departmentId: 'dept_cse',
    facultyId: 'fac_anita',
    isOwner: false,
  };

  const facultyCtx: InstitutionalContext = {
    user: { id: 'prof_kumar', email: 'kumar@college.edu', name: 'Prof. Kumar' },
    institutionId: 'inst_1',
    role: 'FACULTY',
    departmentId: 'dept_cse',
    facultyId: 'fac_kumar',
    isOwner: false,
  };

  describe('requireRole()', () => {
    it('permits admins when ADMIN is in allowedRoles', () => {
      expect(() => requireRole(adminCtx, ['ADMIN', 'HOD'])).not.toThrow();
    });

    it('permits HOD when HOD is in allowedRoles', () => {
      expect(() => requireRole(hodCtx, ['ADMIN', 'HOD'])).not.toThrow();
    });

    it('rejects FACULTY when only ADMIN and HOD are permitted', async () => {
      try {
        requireRole(facultyCtx, ['ADMIN', 'HOD']);
        expect.unreachable('Should have thrown 403 Response');
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        const res = err as Response;
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      }
    });
  });

  describe('assertDepartmentAccess()', () => {
    it('allows ADMIN to access any department', () => {
      expect(() => assertDepartmentAccess(adminCtx, 'dept_cse')).not.toThrow();
      expect(() => assertDepartmentAccess(adminCtx, 'dept_ece')).not.toThrow();
      expect(() => assertDepartmentAccess(adminCtx, 'dept_mech')).not.toThrow();
    });

    it('allows HOD to access their own assigned department', () => {
      expect(() => assertDepartmentAccess(hodCtx, 'dept_cse')).not.toThrow();
    });

    it('blocks HOD from accessing or modifying other departments', async () => {
      try {
        assertDepartmentAccess(hodCtx, 'dept_ece');
        expect.unreachable('Should have thrown 403 Response');
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        const res = err as Response;
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe('DEPARTMENT_ACCESS_DENIED');
      }
    });

    it('blocks FACULTY from department administration', async () => {
      try {
        assertDepartmentAccess(facultyCtx, 'dept_cse');
        expect.unreachable('Should have thrown 403 Response');
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        const res = err as Response;
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe('DEPARTMENT_ADMIN_REQUIRED');
      }
    });
  });

  describe('assertFacultyAccess()', () => {
    it('allows ADMIN and HOD to access any faculty member', () => {
      expect(() => assertFacultyAccess(adminCtx, 'fac_kumar')).not.toThrow();
      expect(() => assertFacultyAccess(hodCtx, 'fac_kumar')).not.toThrow();
    });

    it('allows FACULTY to access their own faculty record', () => {
      expect(() => assertFacultyAccess(facultyCtx, 'fac_kumar')).not.toThrow();
    });

    it('blocks FACULTY from modifying another teacher’s profile or availability', async () => {
      try {
        assertFacultyAccess(facultyCtx, 'fac_other');
        expect.unreachable('Should have thrown 403 Response');
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        const res = err as Response;
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe('FACULTY_ACCESS_DENIED');
      }
    });
  });
});
