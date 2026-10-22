# Orqestra Authentication Setup

This project now uses:

- Neon Managed Better Auth for sign-up, sign-in, sessions, and JWTs
- Neon Postgres for application data
- Drizzle ORM for application tables and migrations
- Vercel-style server functions for the server-only authentication boundary

## 1. Enable Neon Auth

In the Neon Console:

1. Create or select the production Neon project.
2. Enable **Managed Better Auth**.
3. Copy the Auth Base URL from the Better Auth project settings.
4. Add your local and production application domains as trusted domains.

The browser SDK uses the Auth Base URL through `VITE_NEON_AUTH_URL`.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
VITE_NEON_AUTH_URL=your_neon_auth_base_url
DATABASE_URL=your_neon_postgres_connection_string
NEON_AUTH_BASE_URL=your_neon_auth_base_url
```

Optional server-side verification variables:

```bash
NEON_AUTH_JWKS_URL=your_neon_auth_base_url/jwt
NEON_AUTH_ISSUER=your_neon_auth_base_url
```

Never expose `DATABASE_URL`, `NEON_AUTH_BASE_URL`, or the optional verification variables with a `VITE_` prefix. Only `VITE_NEON_AUTH_URL` belongs in the browser bundle.

## 3. Apply the application migration

Generate a new migration after schema changes:

```bash
npm run db:generate
```

Apply migrations to the configured Neon branch:

```bash
npm run db:migrate
```

The first migration creates `user_profiles`. Neon Auth owns its own authentication records in the `neon_auth` schema; the application table stores the profile identity needed by Orqestra.

## 4. Run locally

The Vite development server includes a small local adapter for `/api/auth/me`, so the normal command can be used after environment variables are configured:

```bash
npm run dev
```

If you deploy through Vercel, the same `/api/auth/me` handler runs as a Vercel Function in staging and production.

## 5. Authentication behavior

- `/` remains public.
- `/auth/sign-in`, `/auth/sign-up`, and `/auth/forgot-password` are public auth screens.
- Dashboard, configuration, generation, timetable, portal, and settings routes require a valid Neon Auth session.
- After session validation, the browser obtains a short-lived Neon JWT.
- The browser sends that JWT to `/api/auth/me`.
- The server verifies the JWT against the Neon Auth JWKS endpoint.
- The server upserts the authenticated user into `user_profiles` through Drizzle.
- Local workspace persistence is namespaced by authenticated user ID to prevent users on the same browser from sharing local workspace data.
- If the optional profile sync is unavailable, authentication still succeeds and the app continues in local workspace mode. Configure the database variables and run the migration before relying on server-backed application data.

## Production checklist

Before enabling production sign-up:

- Add the production domain to Neon Auth trusted domains.
- Configure a custom SMTP provider.
- Set the application name shown in auth emails.
- Enable email verification.
- Configure production OAuth credentials if OAuth is enabled.
- Disable Neon Auth localhost access in the production project.
- Store all server-only variables in the hosting provider's encrypted environment settings.
- Run `npm run db:migrate` against the intended production branch.

## Current boundary

Authentication is now server-verified, but timetable workspaces still use the existing browser persistence layer. The next product slice should move departments, sections, subjects, faculty, rooms, breaks, and timetable revisions into organization-scoped Drizzle tables and enforce organization membership on every API operation.
