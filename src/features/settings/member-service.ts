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
  token?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationDetailsDto {
  id: string;
  email: string;
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  institutionId: string;
  institutionName: string;
  institutionCode: string | null;
  logoDataUrl: string | null;
  departmentId: string | null;
  departmentName: string | null;
  facultyId: string | null;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
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

export async function fetchInvitationByToken(token: string): Promise<{ valid: boolean; invitation?: InvitationDetailsDto; error?: string; status?: string }> {
  const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { valid: false, error: data.error || 'Failed to verify invitation.', status: data.status };
  }
  return data;
}

export async function acceptInvitation(token: string): Promise<{ ok: boolean; membership: { id: string; role: 'ADMIN' | 'HOD' | 'FACULTY'; institutionId: string; departmentId: string | null; facultyId: string | null }; message?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to accept invitation: ${res.statusText}`);
  }
  return res.json();
}

export async function adjustMyRole(data: {
  role: 'ADMIN' | 'HOD' | 'FACULTY';
  departmentId?: string | null;
  facultyId?: string | null;
}): Promise<{ ok: boolean; membership: { role: 'ADMIN' | 'HOD' | 'FACULTY'; departmentId: string | null; facultyId: string | null; institutionId: string }; message?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/members/me/role', {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update role: ${res.statusText}`);
  }
  return res.json();
}
