import { getAuthHeaders } from '@/storage/cloud-sync';

export interface InstitutionMemberDto {
  id: string;
  userId: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId: string | null;
  facultyId: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export interface MemberInvitationDto {
  id: string;
  email: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId: string | null;
  facultyId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
}

export interface MembersResponse {
  members: InstitutionMemberDto[];
  invitations: MemberInvitationDto[];
  currentUserId: string;
  currentRole: 'ADMIN' | 'HOD' | 'FACULTY';
}

export async function fetchMembersAndInvitations(): Promise<MembersResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/members', {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch members: ${res.statusText}`);
  }
  return res.json();
}

export async function inviteColleague(data: {
  email: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId?: string;
  facultyId?: string;
}): Promise<MemberInvitationDto> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/members/invite', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to invite colleague: ${res.statusText}`);
  }
  const body = await res.json();
  return body.invitation;
}

export async function updateMemberRole(
  memberId: string,
  patch: {
    role?: 'ADMIN' | 'HOD' | 'FACULTY';
    departmentId?: string | null;
    facultyId?: string | null;
  },
): Promise<InstitutionMemberDto> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/members/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update member: ${res.statusText}`);
  }
  const body = await res.json();
  return body.member;
}

export async function removeMemberOrInvitation(memberId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/members/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to remove member: ${res.statusText}`);
  }
}
