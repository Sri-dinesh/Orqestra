import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TeamAccessSection } from '@/features/settings/TeamAccessSection';
import * as memberService from '@/features/settings/member-service';

vi.mock('@/features/settings/member-service', () => ({
  fetchMembersAndInvitations: vi.fn(),
  removeMemberOrInvitation: vi.fn(),
  updateMemberRole: vi.fn(),
  inviteColleague: vi.fn(),
}));

describe('TeamAccessSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders member table and invite button for admin', async () => {
    vi.mocked(memberService.fetchMembersAndInvitations).mockResolvedValueOnce({
      members: [
        {
          id: 'mem_1',
          userId: 'user_1',
          role: 'ADMIN',
          departmentId: null,
          facultyId: null,
          createdAt: new Date().toISOString(),
          user: { id: 'user_1', email: 'dean@college.edu', name: 'Dean Principal' },
        },
      ],
      invitations: [],
      currentUserId: 'user_1',
      currentRole: 'ADMIN',
    });

    render(<TeamAccessSection />);

    expect(screen.getByText(/Team & Role-Based Access Control/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dean Principal')).toBeInTheDocument();
      expect(screen.getByText('dean@college.edu')).toBeInTheDocument();
      expect(screen.getByText('Invite Colleague')).toBeInTheDocument();
    });
  });

  it('hides invite button for non-admin roles', async () => {
    vi.mocked(memberService.fetchMembersAndInvitations).mockResolvedValueOnce({
      members: [
        {
          id: 'mem_2',
          userId: 'user_2',
          role: 'HOD',
          departmentId: 'dept_cse',
          facultyId: null,
          createdAt: new Date().toISOString(),
          user: { id: 'user_2', email: 'hod@college.edu', name: 'HOD CSE' },
        },
      ],
      invitations: [],
      currentUserId: 'user_2',
      currentRole: 'HOD',
    });

    render(<TeamAccessSection />);

    await waitFor(() => {
      expect(screen.getByText('HOD CSE')).toBeInTheDocument();
      expect(screen.queryByText('Invite Colleague')).not.toBeInTheDocument();
    });
  });
});
