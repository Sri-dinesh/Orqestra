import { sql } from 'drizzle-orm';
import { getDatabase } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const database = getDatabase();
    await database.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - startTime;

    return Response.json(
      {
        status: 'ok',
        db: 'healthy',
        latencyMs,
        timestamp,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('[Health Check Failure]: Database ping failed:', error);

    return Response.json(
      {
        status: 'degraded',
        db: 'unreachable',
        timestamp,
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  }
}
