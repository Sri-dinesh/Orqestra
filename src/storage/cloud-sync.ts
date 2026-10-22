import type { PersistedWorkspacePayload } from './workspace-document';
import type { AcademicTerm, CloneTermOptions } from './term-manager';
import type { GenerationMetrics, Timetable } from '@/domain/models';
import { getAuthToken, authClient } from '@/auth/client';

export interface CloudWorkspaceResponse {
  workspace: PersistedWorkspacePayload;
  terms: AcademicTerm[];
  activeTermId: string;
}

/**
 * Helper to retrieve Authorization header for requests from the browser to Next.js API.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    let token = await getAuthToken().catch(() => null);
    if (!token) {
      const sessionResult = await authClient.getSession().catch(() => null);
      token = sessionResult?.data?.session?.token ?? null;
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Could not retrieve auth token for cloud request:', error);
  }

  return headers;
}

/**
 * Fetch the authenticated user's workspace for an academic term from Neon Postgres.
 */
export async function fetchCloudWorkspace(
  termId?: string,
): Promise<CloudWorkspaceResponse | null> {
  try {
    const url = termId ? `/api/workspace?termId=${encodeURIComponent(termId)}` : '/api/workspace';
    const headers = await getAuthHeaders();

    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401) {
        // User not authenticated or session expired
        return null;
      }
      throw new Error(`Failed to fetch cloud workspace: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.warn('Orqestra cloud fetch failed:', error);
    return null;
  }
}

/**
 * Atomically sync the entire workspace payload into Neon Postgres.
 */
export async function saveCloudWorkspace(
  payload: PersistedWorkspacePayload,
  termId = 'default',
): Promise<{ ok: boolean; syncedAt?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/workspace', {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ termId, payload }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.error || res.statusText };
    }

    return await res.json();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error during cloud sync',
    };
  }
}

/**
 * Immediately persist a generated or modified timetable to Neon Postgres.
 */
export async function saveTimetableToCloud(
  timetable: Timetable,
  termId = 'default',
  auditMetrics?: GenerationMetrics | null,
): Promise<{ ok: boolean; timetable?: any; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/timetables', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ timetable, termId, auditMetrics }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || res.statusText };
    }

    return await res.json();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error saving timetable',
    };
  }
}

/**
 * Toggle publication of a timetable for the public schedule portal.
 */
export async function publishTimetableToCloud(
  timetableId: string,
  publish = true,
  timetable?: Timetable,
  termId?: string,
): Promise<{ ok: boolean; publicSlug?: string; shareUrl?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/timetables/${encodeURIComponent(timetableId)}/publish`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ publish, timetable, termId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || res.statusText };
    }

    return await res.json();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error toggling publish state',
    };
  }
}

/**
 * Create a new academic term or clone an existing one in Neon Postgres.
 */
export async function createCloudTerm(
  name: string,
  academicYear: string,
  cloneFromTermId?: string,
  cloneOptions?: CloneTermOptions,
): Promise<{ ok: boolean; term?: AcademicTerm; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/terms', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ name, academicYear, cloneFromTermId, cloneOptions }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || res.statusText };
    }

    const data = await res.json();
    return { ok: true, term: data.term };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error creating term',
    };
  }
}

/**
 * Delete an academic term and cascade its child resources.
 */
export async function deleteCloudTerm(
  termId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/terms/${encodeURIComponent(termId)}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || res.statusText };
    }

    return await res.json();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error deleting term',
    };
  }
}

/**
 * Set active academic term for the user.
 */
export async function setActiveCloudTerm(
  termId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/terms', {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ termId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || res.statusText };
    }

    return await res.json();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error setting active term',
    };
  }
}
