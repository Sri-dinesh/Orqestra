import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCloudWorkspace,
  saveCloudWorkspace,
  saveTimetableToCloud,
  publishTimetableToCloud,
  createCloudTerm,
  deleteCloudTerm,
  setActiveCloudTerm,
} from '@/storage/cloud-sync';
import type { Timetable } from '@/domain/models';

describe('Cloud Synchronization Client API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchCloudWorkspace requests /api/workspace and returns parsed payload', async () => {
    const mockPayload = {
      workspace: { departments: [], sections: [], subjects: [], faculty: [], timetables: [], rooms: [], breaks: [], activeDepartmentId: null },
      terms: [{ id: 'term-1', name: 'Fall 2026', academicYear: '2026-27' }],
      activeTermId: 'term-1',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await fetchCloudWorkspace('term-1');
    expect(result).toEqual(mockPayload);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workspace?termId=term-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetchCloudWorkspace returns null when unauthenticated (401)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const result = await fetchCloudWorkspace();
    expect(result).toBeNull();
  });

  it('saveCloudWorkspace sends PUT request with payload and termId', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, syncedAt: '2026-10-22T00:00:00Z' }),
    } as Response);

    const payload = {
      departments: [],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      rooms: [],
      breaks: [],
      activeDepartmentId: null,
    };

    const result = await saveCloudWorkspace(payload, 'term-1');
    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workspace',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ termId: 'term-1', payload }),
      }),
    );
  });

  it('saveTimetableToCloud posts generated timetable directly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const mockTimetable: Partial<Timetable> = {
      id: 'tt-1',
      departmentId: 'dept-1' as any,
      status: 'VALID',
      revision: 1,
      entries: [],
    };

    const result = await saveTimetableToCloud(mockTimetable as Timetable, 'term-1');
    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/timetables',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('publishTimetableToCloud toggles isPublished and returns share URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        isPublished: true,
        publicSlug: 'tt-cse-1234',
        shareUrl: '/schedule-portal?slug=tt-cse-1234',
      }),
    } as Response);

    const result = await publishTimetableToCloud('tt-1', true);
    expect(result.ok).toBe(true);
    expect(result.publicSlug).toBe('tt-cse-1234');
    expect(result.shareUrl).toBe('/schedule-portal?slug=tt-cse-1234');
  });

  it('createCloudTerm, deleteCloudTerm, and setActiveCloudTerm invoke correct API endpoints', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    await createCloudTerm('Spring 2027', '2026-27');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/terms',
      expect.objectContaining({ method: 'POST' }),
    );

    await deleteCloudTerm('term-old');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/terms/term-old',
      expect.objectContaining({ method: 'DELETE' }),
    );

    await setActiveCloudTerm('term-new');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/terms',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ termId: 'term-new' }),
      }),
    );
  });
});
