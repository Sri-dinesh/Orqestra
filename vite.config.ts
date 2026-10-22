/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { GET as getCurrentUser } from './api/auth/me';

function localAuthApi(): Plugin {
  return {
    name: 'orqestra-local-auth-api',
    configureServer(server) {
      server.middlewares.use('/api/auth/me', async (request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'POST') {
          next();
          return;
        }

        try {
          const headers = new Headers();
          for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value === 'string') headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(', '));
          }

          const origin = `http://${request.headers.host ?? 'localhost:5173'}`;
          const apiResponse = await getCurrentUser(
            new Request(`${origin}${request.url ?? '/api/auth/me'}`, {
              method: request.method ?? 'GET',
              headers,
            }),
          );

          response.statusCode = apiResponse.status;
          apiResponse.headers.forEach((value, key) => response.setHeader(key, value));
          response.end(await apiResponse.text());
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localAuthApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts'],
  },
});
