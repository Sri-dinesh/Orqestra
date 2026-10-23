import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleSwitcherCard } from '@/features/settings/RoleSwitcherCard';
import { InviteAcceptancePage } from '@/features/invite/InviteAcceptancePage';
import * as memberService from '@/features/settings/member-service';
import * as sessionModule from '@/auth/session';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

const mockNavigate = vi.fn();
let mockParamsToken = 'valid_token';

vi.mock('@/lib/navigation', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ token: mockParamsToken }),
  Link: ({ children, href, to, className, ...props }: any) => (
    <a href={href || to} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe('InviteAcceptancePage & RoleSwitcherCard Component Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockParamsToken = 'valid_token';
    useWorkspaceStore.setState({
      membership: {
        role: 'ADMIN',
        departmentId: null,
        facultyId: null,
        institutionId: 'inst_1',
      },
      departments: [
        {
          id: 'dept_cse',
          code: 'CSE',
          name: 'Computer Science',
          workingDays: ['MONDAY', 'TUESDAY'],
          periodsPerDay: 6,
          status: 'READY',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      faculty: [
        {
          id: 'fac_1',
          facultyCode: 'CSE01',
          name: 'Dr. John',
          departmentId: 'dept_cse',
          active: true,
          subjectIds: [],
          sectionIds: [],
          availability: [],
          preferredSlots: [],
          maxPeriodsPerDay: 4,
          maxPeriodsPerWeek: 16,
        },
      ],
    });
  });

  describe('RoleSwitcherCard', () => {
    it('renders all three institutional roles (Admin, HOD, Faculty)', () => {
      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: { user: { id: 'usr_1', email: 'admin@college.edu', name: 'Dean' } },
        status: 'authenticated',
      } as any);

      render(<RoleSwitcherCard />);

      expect(screen.getByText(/my institutional role & operational mode/i)).toBeDefined();
      expect(screen.getByText(/institution admin/i)).toBeDefined();
      expect(screen.getByText(/head of department \(hod\)/i)).toBeDefined();
      expect(screen.getByText(/teaching faculty/i)).toBeDefined();
      expect(screen.getByText(/signed in as:/i)).toBeDefined();
    });

    it('shows department selector when HOD is selected', async () => {
      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: { user: { id: 'usr_1', email: 'admin@college.edu', name: 'Dean' } },
        status: 'authenticated',
      } as any);

      render(<RoleSwitcherCard />);

      const hodCard = screen.getByText(/head of department \(hod\)/i);
      fireEvent.click(hodCard);

      expect(screen.getByText(/assigned head of department \*/i)).toBeDefined();
      expect(screen.getByText(/as hod, your administrative and generator privileges/i)).toBeDefined();
    });

    it('calls adjustMyRole and updates workspace membership on apply', async () => {
      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: { user: { id: 'usr_1', email: 'admin@college.edu', name: 'Dean' } },
        status: 'authenticated',
      } as any);

      const adjustSpy = vi.spyOn(memberService, 'adjustMyRole').mockResolvedValue({
        ok: true,
        membership: {
          role: 'FACULTY',
          departmentId: 'dept_cse',
          facultyId: 'fac_1',
          institutionId: 'inst_1',
        },
        message: 'Active role updated',
      });

      render(<RoleSwitcherCard />);

      const facultyCard = screen.getByText(/teaching faculty/i);
      fireEvent.click(facultyCard);

      const applyBtn = screen.getByRole('button', { name: /apply operational role/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(adjustSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'FACULTY',
          }),
        );
      });

      expect(useWorkspaceStore.getState().membership?.role).toBe('FACULTY');
    });
  });

  describe('InviteAcceptancePage', () => {
    it('shows loading state initially', () => {
      vi.spyOn(memberService, 'fetchInvitationByToken').mockReturnValue(new Promise(() => {}));
      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: null,
        status: 'loading',
      } as any);

      render(
        <MemoryRouter>
          <InviteAcceptancePage />
        </MemoryRouter>,
      );

      expect(screen.getByText(/verifying invitation/i)).toBeDefined();
    });

    it('shows error card if token is invalid or expired', async () => {
      mockParamsToken = 'expired_token';
      vi.spyOn(memberService, 'fetchInvitationByToken').mockResolvedValue({
        valid: false,
        error: 'This invitation link has expired. Please ask your administrator to send a new invite.',
        status: 'EXPIRED',
      });
      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      render(
        <MemoryRouter>
          <InviteAcceptancePage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText(/invitation unavailable/i)).toBeDefined();
        expect(screen.getByText(/this invitation link has expired/i)).toBeDefined();
      });
    });

    it('renders valid invitation details and enables acceptance when signed in', async () => {
      mockParamsToken = 'valid_token';
      vi.spyOn(memberService, 'fetchInvitationByToken').mockResolvedValue({
        valid: true,
        invitation: {
          id: 'inv_1',
          email: 'prof.smith@college.edu',
          role: 'FACULTY',
          institutionId: 'inst_1',
          institutionName: 'Stanford Engineering College',
          institutionCode: 'SEC',
          departmentName: 'Computer Science',
          departmentId: 'dept_cse',
          facultyId: null,
          logoDataUrl: null,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'PENDING',
        },
      });

      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: { user: { id: 'usr_smith', email: 'prof.smith@college.edu', name: 'Prof. Smith' } },
        status: 'authenticated',
      } as any);

      const acceptSpy = vi.spyOn(memberService, 'acceptInvitation').mockResolvedValue({
        ok: true,
        membership: {
          id: 'mem_1',
          role: 'FACULTY',
          departmentId: 'dept_cse',
          facultyId: null,
          institutionId: 'inst_1',
        },
        message: 'Successfully joined',
      });

      render(
        <MemoryRouter>
          <InviteAcceptancePage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText(/stanford engineering college/i)).toBeDefined();
        expect(screen.getAllByText(/teaching faculty/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /accept invitation & enter workspace/i })).toBeDefined();
      });

      const acceptButton = screen.getByRole('button', { name: /accept invitation & enter workspace/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(acceptSpy).toHaveBeenCalledWith('valid_token');
      });
    });
  });
});
