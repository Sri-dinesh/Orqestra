/**
 * Request payload guard and validation utilities.
 * Protects against payload oversized DOS attacks and malformed JSON payloads.
 */

export async function parseJsonBody<T = unknown>(
  request: Request,
  maxSizeBytes = 2 * 1024 * 1024, // 2MB default
): Promise<T> {
  // Check Content-Length header if provided
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(contentLength) && contentLength > maxSizeBytes) {
      throw new Response(
        JSON.stringify({
          error: `Payload too large. Maximum allowed size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`,
          code: 'PAYLOAD_TOO_LARGE',
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          },
        },
      );
    }
  }

  try {
    const text = await request.text();
    if (text.length > maxSizeBytes) {
      throw new Response(
        JSON.stringify({
          error: `Payload too large. Maximum allowed size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`,
          code: 'PAYLOAD_TOO_LARGE',
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          },
        },
      );
    }

    if (!text.trim()) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response(
      JSON.stringify({
        error: 'Malformed JSON payload in request body.',
        code: 'INVALID_JSON',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      },
    );
  }
}
