import { describe, it, expect, vi } from 'vitest';
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
} from '@/server/rate-limit';
import { parseJsonBody } from '@/server/request-guard';
import { sanitizeErrorMessage, createErrorResponse } from '@/server/errors';
import { GET as healthHandler } from '@/app/api/health/route';
import * as dbModule from '@/db';

describe('API Security Utilities', () => {
  describe('Rate Limiter', () => {
    it('extracts client IP from various headers', () => {
      const req1 = new Request('https://orqestra.app/api/portal/test', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      });
      expect(getClientIp(req1)).toBe('203.0.113.195');

      const req2 = new Request('https://orqestra.app/api/portal/test', {
        headers: { 'x-real-ip': '198.51.100.1' },
      });
      expect(getClientIp(req2)).toBe('198.51.100.1');

      const req3 = new Request('https://orqestra.app/api/portal/test', {
        headers: { 'cf-connecting-ip': '192.0.2.1' },
      });
      expect(getClientIp(req3)).toBe('192.0.2.1');

      const req4 = new Request('https://orqestra.app/api/portal/test');
      expect(getClientIp(req4)).toBe('127.0.0.1');
    });

    it('enforces request counts within sliding window', () => {
      const ip = '10.0.0.42';
      const makeRequest = () =>
        new Request('https://orqestra.app/api/portal/test', {
          headers: { 'x-forwarded-for': ip },
        });

      // Allow 3 requests in a 10s window
      const options = { maxRequests: 3, windowSeconds: 10, keyPrefix: 'test-limiter' };

      const res1 = checkRateLimit(makeRequest(), options);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(makeRequest(), options);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit(makeRequest(), options);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);

      // 4th request must be blocked
      const res4 = checkRateLimit(makeRequest(), options);
      expect(res4.allowed).toBe(false);
      expect(res4.retryAfter).toBeGreaterThan(0);

      // enforceRateLimit should throw a 429 Response
      expect(() => enforceRateLimit(makeRequest(), options)).toThrow();
    });
  });

  describe('Request Guard & Payload Validation', () => {
    it('parses valid JSON payloads within size limits', async () => {
      const payload = { name: 'Engineering', code: 'ENG' };
      const req = new Request('https://orqestra.app/api/workspace', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsed = await parseJsonBody<{ name: string; code: string }>(req, 1024);
      expect(parsed).toEqual(payload);
    });

    it('rejects oversized payloads according to Content-Length header', async () => {
      const req = new Request('https://orqestra.app/api/workspace', {
        method: 'PUT',
        headers: { 'content-length': '2097152' }, // 2MB
      });

      await expect(parseJsonBody(req, 1024 * 1024)).rejects.toSatisfy((err: unknown) => {
        expect((err as Response).status).toBe(413);
        return true;
      });
    });

    it('rejects oversized payloads according to actual body content', async () => {
      const largeString = 'A'.repeat(2000);
      const req = new Request('https://orqestra.app/api/workspace', {
        method: 'PUT',
        body: JSON.stringify({ data: largeString }),
      });

      await expect(parseJsonBody(req, 500)).rejects.toSatisfy((err: unknown) => {
        expect((err as Response).status).toBe(413);
        return true;
      });
    });

    it('rejects malformed JSON with 400 Bad Request', async () => {
      const req = new Request('https://orqestra.app/api/workspace', {
        method: 'PUT',
        body: '{ malformed: json, missing quotes }',
      });

      await expect(parseJsonBody(req, 1024)).rejects.toSatisfy((err: unknown) => {
        expect((err as Response).status).toBe(400);
        return true;
      });
    });
  });

  describe('Sensitive Error Sanitization', () => {
    it('strips database connection strings and passwords from error messages', () => {
      const dbUrlError = new Error(
        'Failed to connect to postgresql://neon_user:secret_password@ep-cold-lake.us-east-2.aws.neon.tech/neondb?sslmode=require',
      );
      const safe = sanitizeErrorMessage(dbUrlError, 'Internal database query failed.');
      expect(safe).toBe('Internal database query failed.');
      expect(safe).not.toContain('secret_password');
      expect(safe).not.toContain('neon.tech');
    });

    it('strips SQL syntax errors from client error responses', () => {
      const sqlError = new Error('syntax error at or near "SELECT" at character 14');
      const safe = sanitizeErrorMessage(sqlError, 'Database query failed.');
      expect(safe).toBe('Database query failed.');
    });

    it('preserves benign validation messages', () => {
      const benignError = new Error('Valid recipient email address is required.');
      const safe = sanitizeErrorMessage(benignError, 'Action failed.');
      expect(safe).toBe('Valid recipient email address is required.');
    });

    it('creates standardized error responses with private cache control', async () => {
      const response = createErrorResponse(
        new Error('Unauthorized department access'),
        'Access denied',
        403,
      );
      expect(response.status).toBe(403);
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      const data = await response.json();
      expect(data.error).toBe('Unauthorized department access');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('Health Check Probe (/api/health)', () => {
    it('returns status ok with latency when database responds', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      };
      vi.spyOn(dbModule, 'getDatabase').mockReturnValue(mockDb as any);

      const res = await healthHandler();
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-cache');

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.db).toBe('healthy');
      expect(typeof data.latencyMs).toBe('number');
      expect(data.timestamp).toBeDefined();
    });

    it('returns 503 degraded when database connection fails', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Neon database compute suspended')),
      };
      vi.spyOn(dbModule, 'getDatabase').mockReturnValue(mockDb as any);

      const res = await healthHandler();
      expect(res.status).toBe(503);

      const data = await res.json();
      expect(data.status).toBe('degraded');
      expect(data.db).toBe('unreachable');
      expect(data.timestamp).toBeDefined();
    });
  });
});
