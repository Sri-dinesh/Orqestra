# Orqestra Production Roadmap

## Goal

Turn Orqestra from a browser-only timetable generator into a dependable product that schools, colleges, and universities can use to configure, generate, review, publish, and maintain academic schedules.

## Current position

Orqestra already has a strong scheduling core:

- React + TypeScript + Vite frontend
- Pure TypeScript scheduling and validation domain layer
- Backtracking timetable generation with feasibility checks
- Manual editing with validation and undo/redo
- Faculty, rooms, breaks, exports, and version history
- Local-storage persistence
- Web Worker execution path
- Passing typecheck and automated tests

The main product limitation is that the application is currently **single-user and browser-local**. Data is stored in one browser, there is no account or institution workspace, and there is no collaboration, server backup, or operational support layer.

## Product direction

Build a **multi-tenant, role-based, local-first SaaS product**.

- The server becomes the source of truth for accounts, organizations, permissions, and saved workspaces.
- The browser continues to run the scheduling engine where practical, preserving privacy and responsiveness.
- Every important operation is saved as a versioned workspace revision.
- Schools and colleges can start with a template, import their data, generate a timetable, review it, publish it, and share read-only schedules.

## Recommended first production customer

Start with one clear customer profile rather than trying to serve every institution immediately:

> A school or college timetable coordinator managing one institution, several departments/classes, faculty workloads, rooms, labs, and printable schedules.

Support both schools and colleges through configuration, but avoid building separate products initially.

---

# Phase 0 — Product decisions and scope lock

Before adding more features, make these decisions:

1. **Choose the first launch segment:** schools, colleges, or both.
2. **Choose the first scheduling model:** department-based college scheduling, school class scheduling, or a unified model.
3. **Choose the first business model:** free beta, paid pilot, or subscription.
4. **Choose the hosted architecture:** managed PostgreSQL plus an authentication provider and API/server layer.
5. **Define the first release boundary.**

Recommended V1 boundary:

- One institution/workspace per customer
- Multiple departments/classes inside the workspace
- Administrator, coordinator/editor, and viewer roles
- Configuration import/export
- Generation and manual editing
- Version history
- PDF/Excel exports
- Published read-only schedule links
- Server persistence and backups

Defer for later:

- Student portals with personalized accounts
- Attendance integration
- Payroll/HR integration
- Complex cross-campus optimization
- Real-time multi-user editing
- Native mobile apps
- Automated parent communication

---

# Phase 1 — Production foundation

## Objective

Make the existing application safe to deploy, easy to develop, and observable.

## Work

- Add a real CI pipeline for typecheck, lint, test, and production build.
- Add separate development, staging, and production environments.
- Add error tracking for frontend crashes and failed generation jobs.
- Add product analytics for onboarding, generation, export, and publishing funnels.
- Add a status/health page for hosted services.
- Define backup, restore, retention, and incident-response procedures.
- Add a privacy policy, terms of service, acceptable-use policy, and support contact.
- Remove or correct stale project documentation and design references.
- Add a production build smoke test against the deployed app.

## Release gate

- Every pull request runs the same checks locally and in CI.
- A failed generation or export produces a useful diagnostic, not a silent failure.
- Production errors can be traced to a user-safe event and release version.

---

# Phase 2 — Authentication, organizations, and server persistence

## Objective

Move from browser-only storage to secure institution workspaces.

## Core entities

Add a server-side model for:

- User
- Organization/institution
- Organization membership
- Role and permission
- Academic term/semester
- Department or school division
- Workspace revision
- Timetable
- Published schedule
- Import/export job
- Audit event

## Roles

Start with simple role-based access control:

- **Owner/Admin:** institution settings, members, billing, deletion, imports
- **Coordinator/Editor:** configure data, generate, edit, publish
- **Viewer:** view and export published or shared schedules

## Work

- Add sign-up, sign-in, password reset, and email verification.
- Add organization creation and invitation flow.
- Add role enforcement in the UI and server/API layer.
- Create API boundaries for workspace load/save, revisions, generation jobs, and publishing.
- Migrate local-storage workspaces into server-backed workspaces.
- Keep local storage as a temporary offline cache/draft layer, not the canonical source.
- Add optimistic concurrency protection so one editor cannot silently overwrite another editor's changes.
- Add audit logs for important actions.

## Release gate

- A user can sign in, create an institution, invite a coordinator, and reopen the same workspace from another browser.
- Unauthorized users cannot read or modify another institution's data.
- A workspace can be backed up and restored without losing timetable history.

---

# Phase 3 — Product-grade onboarding and data setup

## Objective

Make the first successful timetable achievable without developer help.

## Work

- Create an onboarding wizard:
  1. Institution details
  2. Academic year/term
  3. School/department setup
  4. Working days and periods
  5. Sections/classes
  6. Subjects
  7. Faculty
  8. Rooms/labs
  9. Requirements and assignments
  10. Feasibility review
- Add clear empty states and sample data.
- Improve built-in templates for common school and college structures.
- Add CSV/XLSX import templates for:
  - Classes/sections
  - Subjects
  - Faculty
  - Rooms
  - Subject requirements
  - Faculty availability
- Add import preview, validation errors, row-level corrections, and rollback.
- Add duplicate detection and reference repair tools.
- Add a configuration completeness checklist.
- Add contextual help explaining labs, periods, breaks, capacity, and faculty limits.

## Release gate

- A new coordinator can create a realistic workspace from a template or spreadsheet.
- Invalid imports identify the exact row, field, and correction required.
- The product clearly explains why a timetable cannot be generated.

---

# Phase 4 — Scheduling and timetable workflow hardening

## Objective

Make generation dependable across real school and college datasets.

## Work

- Formalize the supported scheduling models:
  - School classes and teachers
  - College sections and faculty
  - Theory and laboratory periods
  - Shared faculty
  - Shared rooms
  - Breaks and non-teaching periods
- Add room occupancy as a first-class hard constraint everywhere.
- Add teacher/faculty availability and blocked periods as hard constraints.
- Add optional preferences as soft constraints.
- Add substitution and absence workflows for published timetables.
- Add “what changed” comparison between timetable versions.
- Improve generation progress, cancellation, timeout, and retry behavior.
- Make worker cancellation real rather than only budget-bounded.
- Add generation job persistence for long-running server-side jobs if needed.
- Add reproducible generation metadata: seed, engine version, configuration hash, duration, node count.
- Add capacity and feasibility explanations written for non-technical coordinators.

## Release gate

- The generated timetable passes independent validation.
- Faculty, section, and room collisions are blocked.
- Labs cannot be split or placed across breaks.
- A failed generation identifies likely causes and useful fixes.
- A generated timetable can be reproduced from its saved configuration and seed.

---

# Phase 5 — Editing, publishing, and sharing

## Objective

Turn a generated timetable into an operational schedule used by staff and students.

## Work

- Improve the timetable editor for keyboard, mouse, and touch use.
- Add clear draft, valid, invalid, stale, and published states.
- Add bulk edits and repeatable edit commands.
- Add change review before publishing.
- Add approval flow:
  - Coordinator prepares draft
  - Admin approves
  - Published version becomes read-only
- Add published schedule pages for:
  - Class/section
  - Faculty member
  - Room/lab
  - Department
  - Whole institution
- Add shareable read-only links with optional expiry or access code.
- Add print/PDF templates for different institution formats.
- Add export branding: logo, institution name, term, footer, signatories.
- Add QR/link support for published schedules.

## Release gate

- A coordinator can prepare and revise a draft without affecting the published schedule.
- Viewers only see the approved published version.
- Every published version has an owner, timestamp, term, and revision history.
- Exported files match the on-screen schedule.

---

# Phase 6 — Reliability, security, and scale

## Objective

Make the product safe for real institutional use.

## Work

- Add tenant isolation tests and permission tests.
- Validate all API inputs server-side with shared schemas.
- Encrypt sensitive data in transit and at rest through the hosting platform.
- Add rate limits for authentication, imports, exports, and generation requests.
- Add CSRF/session protection where applicable.
- Add secure file handling for spreadsheet imports and generated exports.
- Add data deletion and institution export flows.
- Add scheduled database backups and restore drills.
- Add audit logs for membership, configuration, generation, publishing, import, export, and deletion events.
- Add performance budgets for large workspaces.
- Move heavy or long-running generation to a server job/worker only when browser execution becomes insufficient.
- Add caching and pagination for large faculty, subject, and revision lists.

## Release gate

- Security review completed.
- Backup restoration has been tested.
- Large representative workspaces meet agreed generation and UI performance targets.
- No tenant can access another tenant's data through direct API manipulation.

---

# Phase 7 — Beta and commercial launch

## Private beta

Recruit 3–5 institutions with different needs:

- One school
- One small college
- One multi-department college
- One institution with heavy lab scheduling

Measure:

- Time to first valid timetable
- Import completion rate
- Generation success rate
- Number of manual corrections
- Time to publish
- Export success rate
- Weekly active coordinators
- Support issues per workspace

## Beta process

- Provide guided onboarding.
- Capture real data and anonymized failure cases.
- Hold weekly feedback sessions.
- Freeze new features during stabilization weeks.
- Fix reliability and usability issues before expanding scope.

## Commercial launch

- Pricing and plan limits
- Billing and invoices
- Customer support process
- Product documentation and tutorials
- Demo workspace and sample templates
- Migration/import service for larger institutions
- SLA and support expectations for paid plans

---

# Recommended technical target architecture

```text
Web app
  ├─ React UI
  ├─ Zustand UI/draft state
  ├─ Shared TypeScript domain models
  └─ Client-side scheduler/Web Worker

API/server
  ├─ Authentication and sessions
  ├─ Organization and membership permissions
  ├─ Workspace and revision APIs
  ├─ Import/export processing
  ├─ Publishing and share links
  └─ Audit logging

Database
  ├─ Organizations
  ├─ Users/memberships
  ├─ Academic terms
  ├─ Departments/classes
  ├─ Subjects/faculty/rooms
  ├─ Timetable revisions
  ├─ Published schedules
  └─ Audit events

Object/file storage
  ├─ Uploaded spreadsheets
  ├─ Generated PDFs/XLSX files
  └─ Institution branding assets
```

Keep the existing domain scheduler independent from React, the database, and the HTTP layer. That is the most valuable architectural decision already present in the project.

---

# Immediate next steps

Do these in order before expanding the feature list:

1. Write a one-page product specification for the first launch customer.
2. Decide whether the first release is school-focused, college-focused, or unified.
3. Define the minimum account, institution, role, and academic-term model.
4. Choose the authentication, database, API, hosting, email, and error-tracking services.
5. Add CI with typecheck, lint, tests, and production build.
6. Add a staging environment and deploy the current app unchanged.
7. Add server-backed workspace persistence and migrate local workspaces.
8. Implement authentication and organization roles.
9. Build onboarding plus spreadsheet import.
10. Harden room, faculty, availability, and break constraints.
11. Add draft-versus-published timetable workflow.
12. Run a private beta with real institutional data.

# First production milestone

The first meaningful production milestone should be:

> A coordinator can sign in, create an institution, import or configure academic data, generate a validated timetable, edit it safely, publish an approved version, and share or export it while the data remains securely available from any device.

Do not treat visual polish or additional scheduling heuristics as the first priority. The first priority is trustworthy data ownership, permissions, persistence, onboarding, and publishing.

# Current validation baseline

The current repository passes:

- `npm run typecheck`
- `npm test`

Before production work is considered complete, add and require:

- `npm run lint`
- `npm run build`
- CI execution of all checks
- Deployed staging smoke test
- Permission and tenant-isolation tests
- Backup/restore verification
