import type { PersistedWorkspacePayload } from './workspace-document';
import type { AcademicTerm, CloneTermOptions } from './term-manager';
import type { GenerationMetrics, Timetable } from '@/domain/models';

export interface CloudWorkspaceResponse {
  workspace: PersistedWorkspacePayload;
  terms: AcademicTerm[];
  activeTermId: string;
}

/**
 * Fetch the authenticated user's workspace for an academic term from Neon Postgres.
 */
export async function fetchCloudWorkspace(
  termId?: string,
): Promise<CloudWorkspaceResponse | null> {
  try {
    const url = termId ? `/api/workspace?termId=${encodeURIComponent(termId)}` : '/api/workspace';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const res = await fetch('/api/workspace', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const res = await fetch('/api/timetables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
): Promise<{ ok: boolean; publicSlug?: string; shareUrl?: string; error?: string }> {
  try {
    const res = await fetch(`/api/timetables/${encodeURIComponent(timetableId)}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish }),
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
    const res = await fetch('/api/terms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const res = await fetch(`/api/terms/${encodeURIComponent(termId)}`, {
      method: 'DELETE',
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
    const res = await fetch('/api/terms', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
