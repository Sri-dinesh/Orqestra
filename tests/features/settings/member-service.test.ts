import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMembersAndInvitations,
  inviteColleague,
  updateMemberRole,
  removeMemberOrInvitation,
} from '@/features/settings/member-service';

vi.mock('@/storage/cloud-sync', () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer test-token',
  }),
}));

describe('member-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches members and invitations correctly', async () => {
    const mockResponse = {
      members: [
        {
          id: 'mem_1',
          userId: 'user_1',
          role: 'ADMIN',
          departmentId: null,
          facultyId: null,
          createdAt: new Date().toISOString(),
          user: { id: 'user_1', email: 'admin@college.edu', name: 'Dean Admin' },
        },
      ],
      invitations: [],
      currentUserId: 'user_1',
      currentRole: 'ADMIN',
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const res = await fetchMembersAndInvitations();
    expect(res.members).toHaveLength(1);
    expect(res.members[0].role).toBe('ADMIN');
    expect(res.currentRole).toBe('ADMIN');
    expect(global.fetch).toHaveBeenCalledWith('/api/members', expect.objectContaining({
      method: 'GET',
    }));
  });

  it('sends invite to colleague', async () => {
    const mockInvite = {
      id: 'inv_1',
      email: 'hod.cse@college.edu',
      role: 'HOD',
      departmentId: 'dept_cse',
      facultyId: null,
      status: 'PENDING',
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, invitation: mockInvite }),
    } as Response);

    const result = await inviteColleague({
      email: 'hod.cse@college.edu',
      role: 'HOD',
      departmentId: 'dept_cse',
    });

    expect(result.id).toBe('inv_1');
    expect(result.role).toBe('HOD');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/members/invite',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'hod.cse@college.edu',
          role: 'HOD',
          departmentId: 'dept_cse',
        }),
      }),
    );
  });

  it('updates member role and department', async () => {
    const mockUpdated = {
      id: 'mem_2',
      userId: 'user_2',
      role: 'ADMIN',
      departmentId: null,
      facultyId: null,
      createdAt: new Date().toISOString(),
      user: { id: 'user_2', email: 'prof@college.edu', name: 'Professor' },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, member: mockUpdated }),
    } as Response);

    const res = await updateMemberRole('mem_2', { role: 'ADMIN', departmentId: null });
    expect(res.role).toBe('ADMIN');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/members/mem_2',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });

  it('removes member or invitation cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await expect(removeMemberOrInvitation('mem_2')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/members/mem_2',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});
