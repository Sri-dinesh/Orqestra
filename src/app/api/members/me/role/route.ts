import { getDatabase } from '@/db';
import {
  institutionMembers,
  type InstitutionRole,
  userProfiles,
} from '@/db/schema';
import { resolveInstitutionalContext } from '@/auth/server';
import { parseJsonBody, enforceRateLimit, createErrorResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, { maxRequests: 30, windowSeconds: 60, keyPrefix: 'role-switch' });

    const context = await resolveInstitutionalContext(request);
    const database = getDatabase();
    const body = await parseJsonBody<{
      role?: InstitutionRole;
      departmentId?: string | null;
      facultyId?: string | null;
    }>(request, 256 * 1024);

    const { role, departmentId = null, facultyId = null } = body;

    if (!role || !['ADMIN', 'HOD', 'FACULTY'].includes(role)) {
      return Response.json(
        { error: 'Valid role is required (ADMIN, HOD, or FACULTY).' },
        { status: 400 },
      );
    }

    if (role === 'HOD' && !departmentId) {
      return Response.json(
        { error: 'A Department must be selected when operating as Head of Department (HOD).' },
        { status: 400 },
      );
    }

    const now = new Date();

    // Ensure user profile exists
    await database
      .insert(userProfiles)
      .values({
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    // Insert or update user's membership in institutionMembers
    const memberId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const [updated] = await database
      .insert(institutionMembers)
      .values({
        id: memberId,
        institutionId: context.institutionId,
        userId: context.user.id,
        role,
        departmentId: departmentId || null,
        facultyId: facultyId || null,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [institutionMembers.institutionId, institutionMembers.userId],
        set: {
          role,
          departmentId: departmentId || null,
          facultyId: facultyId || null,
          status: 'ACTIVE',
          updatedAt: now,
        },
      })
      .returning();

    return Response.json(
      {
        ok: true,
        membership: {
          role: updated.role,
          departmentId: updated.departmentId,
          facultyId: updated.facultyId,
          institutionId: updated.institutionId,
        },
        message: `Active operational role adjusted to ${updated.role}.`,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return createErrorResponse(error, 'Failed to update active role.');
  }
}
