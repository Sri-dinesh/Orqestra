import { getDatabase } from '../../src/db';
import { userProfiles } from '../../src/db/schema';
import { requireAuthenticatedUser } from '../_lib/auth';

async function handleProfileSync(request: Request): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const now = new Date();

    const [profile] = await database
      .insert(userProfiles)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userProfiles.id,
        set: {
          email: user.email,
          name: user.name,
          updatedAt: now,
        },
      })
      .returning();

    return Response.json(
      { user: profile },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Unable to synchronize user profile:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to initialize the authenticated application user profile.',
        code: 'USER_PROFILE_SYNC_FAILED',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      },
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleProfileSync(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleProfileSync(request);
}
