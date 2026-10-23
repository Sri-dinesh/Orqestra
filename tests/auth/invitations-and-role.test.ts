import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getInvitationHandler } from '@/app/api/invitations/[token]/route';
import { POST as acceptInvitationHandler } from '@/app/api/invitations/[token]/accept/route';
import { PATCH as updateRoleHandler } from '@/app/api/members/me/role/route';
import * as dbModule from '@/db';
import * as authServerModule from '@/auth/server';

describe('Team Invitation Links & Operational RBAC Role Switching', () => {
  const dummyDb = {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => Promise.resolve(),
        onConflictDoUpdate: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve({ rowCount: 1 }),
      }),
    }),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, 'getDatabase').mockReturnValue(dummyDb as any);
  });

  describe('GET /api/invitations/[token]', () => {
    it('rejects invalid or oversized tokens with 400', async () => {
      const longToken = 'a'.repeat(150);
      const req = new Request(`https://orqestra.app/api/invitations/${longToken}`);
      const res = await getInvitationHandler(req, {
        params: Promise.resolve({ token: longToken }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Invalid invitation token format');
    });

    it('returns 404 if invitation token does not exist', async () => {
      vi.spyOn(dbModule, 'getDatabase').mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => Promise.resolve([]),
          }),
        }),
      } as any);

      const req = new Request('https://orqestra.app/api/invitations/non_existent_token');
      const res = await getInvitationHandler(req, {
        params: Promise.resolve({ token: 'non_existent_token' }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Invitation not found');
    });

    it('returns 410 when invitation has already been accepted', async () => {
      const mockInvitation = {
        id: 'inv_123',
        token: 'accepted_token',
        email: 'faculty@college.edu',
        role: 'FACULTY',
        institutionId: 'inst_1',
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 86400000),
      };

      vi.spyOn(dbModule, 'getDatabase').mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => Promise.resolve([mockInvitation]),
          }),
        }),
      } as any);

      const req = new Request('https://orqestra.app/api/invitations/accepted_token');
      const res = await getInvitationHandler(req, {
        params: Promise.resolve({ token: 'accepted_token' }),
      });

      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.valid).toBe(false);
      expect(data.status).toBe('ACCEPTED');
      expect(data.error).toContain('already been accepted');
    });

    it('returns 410 when invitation link has expired', async () => {
      const expiredInvitation = {
        id: 'inv_456',
        token: 'expired_token',
        email: 'prof@college.edu',
        role: 'FACULTY',
        institutionId: 'inst_1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour in the past
      };

      vi.spyOn(dbModule, 'getDatabase').mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => Promise.resolve([expiredInvitation]),
          }),
        }),
      } as any);

      const req = new Request('https://orqestra.app/api/invitations/expired_token');
      const res = await getInvitationHandler(req, {
        params: Promise.resolve({ token: 'expired_token' }),
      });

      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.valid).toBe(false);
      expect(data.status).toBe('EXPIRED');
      expect(data.error).toContain('expired');
    });

    it('returns 200 with institution details for a valid pending invitation', async () => {
      const validInvitation = {
        id: 'inv_789',
        token: 'valid_faculty_token',
        email: 'newfaculty@college.edu',
        role: 'FACULTY',
        institutionId: 'inst_1',
        departmentId: 'dept_cse',
        facultyId: null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days in the future
      };

      const mockCollege = {
        name: 'Oxford Institute of Engineering',
        code: 'OXFORD',
        logoDataUrl: 'data:image/svg+xml,...',
      };

      const mockDept = {
        id: 'dept_cse',
        name: 'Computer Science & Engineering',
        code: 'CSE',
      };

      let queryCount = 0;
      vi.spyOn(dbModule, 'getDatabase').mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => {
              queryCount++;
              if (queryCount === 1) return Promise.resolve([validInvitation]);
              if (queryCount === 2) return Promise.resolve([mockCollege]);
              if (queryCount === 3) return Promise.resolve([]); // owner profile
              if (queryCount === 4) return Promise.resolve([mockDept]);
              return Promise.resolve([]);
            },
          }),
        }),
      } as any);

      const req = new Request('https://orqestra.app/api/invitations/valid_faculty_token');
      const res = await getInvitationHandler(req, {
        params: Promise.resolve({ token: 'valid_faculty_token' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.invitation.email).toBe('newfaculty@college.edu');
      expect(data.invitation.role).toBe('FACULTY');
      expect(data.invitation.institutionName).toBe('Oxford Institute of Engineering');
      expect(data.invitation.departmentName).toContain('CSE');
      expect(res.headers.get('Cache-Control')).toContain('no-store');
    });
  });

  describe('POST /api/invitations/[token]/accept', () => {
    it('accepts valid invitation, creates member record and updates invitation status', async () => {
      const mockUser = { id: 'usr_sarah', email: 'sarah@college.edu', name: 'Dr. Sarah' };
      vi.spyOn(authServerModule, 'requireAuthenticatedUser').mockResolvedValue(mockUser as any);

      const pendingInvitation = {
        id: 'inv_999',
        token: 'token_to_accept',
        email: 'sarah@college.edu',
        role: 'HOD',
        institutionId: 'inst_1',
        departmentId: 'dept_ai',
        facultyId: null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      };

      const updateSpy = vi.fn().mockReturnValue({
        set: () => ({
          where: () => Promise.resolve({ rowCount: 1 }),
        }),
      });

      vi.spyOn(dbModule, 'getDatabase').mockReturnValue({
        insert: () => ({
          values: () => ({
            onConflictDoUpdate: () => ({
              returning: () =>
                Promise.resolve([
                  {
                    id: 'mem_1',
                    institutionId: 'inst_1',
                    userId: mockUser.id,
                    role: 'HOD',
                    departmentId: 'dept_ai',
                    facultyId: null,
                    status: 'ACTIVE',
                  },
                ]),
            }),
          }),
        }),
        select: () => ({
          from: () => ({
            where: () => Promise.resolve([pendingInvitation]),
          }),
        }),
        update: updateSpy,
      } as any);

      const req = new Request('https://orqestra.app/api/invitations/token_to_accept/accept', {
        method: 'POST',
      });
      const res = await acceptInvitationHandler(req, {
        params: Promise.resolve({ token: 'token_to_accept' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.membership.role).toBe('HOD');
      expect(data.membership.departmentId).toBe('dept_ai');
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/members/me/role (Operational Role Switcher)', () => {
    it('rejects invalid role inputs with 400', async () => {
      const mockContext = {
        user: { id: 'usr_1', email: 'test@college.edu', name: 'Tester' },
        institutionId: 'inst_1',
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        isOwner: true,
      };
      vi.spyOn(authServerModule, 'resolveInstitutionalContext').mockResolvedValue(mockContext as any);

      const req = new Request('https://orqestra.app/api/members/me/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'SUPER_ROOT_INVALID' }),
      });

      const res = await updateRoleHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Valid role is required');
    });

    it('requires a departmentId when switching active role to HOD', async () => {
      const mockContext = {
        user: { id: 'usr_1', email: 'test@college.edu', name: 'Tester' },
        institutionId: 'inst_1',
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        isOwner: true,
      };
      vi.spyOn(authServerModule, 'resolveInstitutionalContext').mockResolvedValue(mockContext as any);

      const req = new Request('https://orqestra.app/api/members/me/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'HOD', departmentId: null }),
      });

      const res = await updateRoleHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Department must be selected');
    });

    it('successfully switches active role to FACULTY', async () => {
      const mockContext = {
        user: { id: 'usr_prof', email: 'prof@college.edu', name: 'Prof. John' },
        institutionId: 'inst_1',
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        isOwner: true,
      };
      vi.spyOn(authServerModule, 'resolveInstitutionalContext').mockResolvedValue(mockContext as any);

      vi.spyOn(dbModule, 'getDatabase').mockReturnValue({
        insert: () => ({
          values: () => ({
            onConflictDoNothing: () => Promise.resolve(),
            onConflictDoUpdate: () => ({
              returning: () =>
                Promise.resolve([
                  {
                    id: 'mem_prof',
                    institutionId: 'inst_1',
                    userId: 'usr_prof',
                    role: 'FACULTY',
                    departmentId: 'dept_cse',
                    facultyId: 'fac_john',
                    status: 'ACTIVE',
                  },
                ]),
            }),
          }),
        }),
      } as any);

      const req = new Request('https://orqestra.app/api/members/me/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'FACULTY',
          departmentId: 'dept_cse',
          facultyId: 'fac_john',
        }),
      });

      const res = await updateRoleHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.membership.role).toBe('FACULTY');
      expect(data.membership.facultyId).toBe('fac_john');
      expect(data.message).toContain('FACULTY');
    });
  });
});
