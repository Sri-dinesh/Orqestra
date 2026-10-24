/**
 * Safe error sanitization utility for API routes.
 * Ensures internal database connection strings, passwords, SQL syntax errors,
 * and sensitive server paths are never leaked to client responses.
 */

const SENSITIVE_PATTERNS = [
  /postgresql:\/\/[^\s]+/gi,
  /postgres:\/\/[^\s]+/gi,
  /password=[^\s&]+/gi,
  /neon\.tech/gi,
  /neonauth/gi,
  /DATABASE_URL/gi,
  /NEON_AUTH/gi,
  /syntax error at or near/gi,
  /relation "[^"]+" does not exist/gi,
  /column "[^"]+" does not exist/gi,
];

export function sanitizeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;

    // Check if the error message contains any sensitive keywords or DB patterns
    const containsSensitiveInfo = SENSITIVE_PATTERNS.some((pattern) => pattern.test(msg));
    if (containsSensitiveInfo) {
      return fallback;
    }

    // Limit length to prevent buffer/string DOS
    return msg.slice(0, 300);
  }

  if (typeof error === 'string') {
    const containsSensitiveInfo = SENSITIVE_PATTERNS.some((pattern) => pattern.test(error));
    if (containsSensitiveInfo) {
      return fallback;
    }
    return error.slice(0, 300);
  }

  return fallback;
}

export function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
  status = 500,
  extraHeaders: Record<string, string> = {},
): Response {
  if (error instanceof Response) {
    return error;
  }

  console.error(`[API Error ${status}]:`, error);

  const safeMessage = sanitizeErrorMessage(error, fallbackMessage);

  return Response.json(
    {
      error: safeMessage,
      code: status === 400 ? 'BAD_REQUEST' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
    },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        ...extraHeaders,
      },
    },
  );
}
