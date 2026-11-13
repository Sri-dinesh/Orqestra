# Contributing to Orqestra

Thank you for your interest in contributing to **Orqestra**! We welcome contributions from developers, designers, educators, and researchers of all skill levels.

Orqestra is an open-source, high-performance academic timetable workstation and constraint solver. Whether you are fixing a typo, improving algorithmic performance, adding scheduling heuristics, or expanding institutional presets, your help is appreciated.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Available Scripts](#available-scripts)
5. [Architecture & Design Guidelines](#architecture--design-guidelines)
6. [Git Workflow & Commit Guidelines](#git-workflow--commit-guidelines)
7. [Submitting a Pull Request](#submitting-a-pull-request)
8. [Reporting Issues](#reporting-issues)
9. [Getting Help](#getting-help)

---

## Code of Conduct

All contributors and maintainers are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand our community expectations and pledge.

---

## Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js**: `>= 20.x` (LTS recommended)
- **npm**: `>= 10.x`
- **Git**: `>= 2.30`
- *(Optional)* **PostgreSQL** or a free [Neon](https://neon.tech) account if working on serverless cloud sync and database migrations.

---

## Local Development Setup

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/Orqestra.git
   cd Orqestra
   ```

2. **Install Dependencies**:
   ```bash
   npm ci --legacy-peer-deps
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   *Note: Orqestra operates fully client-side and offline by default. You only need to populate `DATABASE_URL` and `NEXT_PUBLIC_NEON_AUTH_URL` if testing cloud database sync or team collaboration features.*

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development workstation with Hot Module Replacement (HMR) |
| `npm run build` | Compiles an optimized Next.js production build |
| `npm run start` | Starts the Next.js production server |
| `npm run typecheck` | Validates TypeScript types across the entire project with `tsc --noEmit` |
| `npm run lint` | Runs ESLint across `src`, `scripts`, and configuration files |
| `npm test` | Executes all Vitest unit and integration test suites |
| `npm run test:watch` | Starts Vitest in interactive watch mode for TDD |
| `npm run db:generate` | Generates Drizzle database migrations |
| `npm run db:migrate` | Runs database migrations against the configured PostgreSQL instance |

---

## Architecture & Design Guidelines

### 1. Layered Unidirectional Architecture
Orqestra enforces strict downward-only dependencies:
```
┌────────────────────────────────────────────────────────┐
│  UI Layer (src/features, src/components)               │
│  React components, Next.js routes, modals, drawers     │
├────────────────────────────────────────────────────────┤
│  State Layer (src/state)                               │
│  Zustand stores: workspaceStore, editorStore           │
├────────────────────────────────────────────────────────┤
│  Application Layer (src/application)                   │
│  Workflows: GenerationService, EditService, PDF export │
├────────────────────────────────────────────────────────┤
│  Domain Layer (src/domain)                             │
│  Pure TypeScript: Solver engine, validators, schemas   │
├────────────────────────────────────────────────────────┤
│  Storage Layer (src/storage)                           │
│  LocalStorage adapter, migrations, cloud-sync client   │
└────────────────────────────────────────────────────────┘
```
- **Domain Purity**: Code in `src/domain` must remain 100% pure TypeScript. Never import React, DOM APIs, or storage libraries into the domain layer.
- **Validation**: All timetable mutations must run through `TimetableEditService` and `validateTimetable()` to preserve constraint integrity.

### 2. Design System (`/dev/null` Unified Theme)
All visual components must adhere to the design system in [DESIGN.md](DESIGN.md):
- **Colors**: Use design tokens (`--color-shell`, `--color-surface`, `--color-hairline`, `--color-primary`, `--color-wash`, `--color-lane-*`). Never introduce arbitrary hex codes.
- **Dark Mode**: Support both Dark Graphite (`#111112` / `#18181a` / `#7aa2f7`) and Light mode (`#f6f7f8` / `#ffffff` / `#3b6fe0`). Test your changes in both modes.
- **"The One Blue Rule"**: Blue indicates the primary call-to-action or current location. Secondary actions must use outline/wash styles.
- **Typography**: Geist Sans for human prose, Geist Mono (`tabular`) for machine data (counts, timestamps, room identifiers, codes).
- **The No Cards Rule**: Avoid heavy floating panels with drop shadows. Prefer flat surfaces divided by 1px hairlines.

---

## Git Workflow & Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear, automated changelogs.

### Branch Naming Conventions
- `feat/feature-name` (New functionality)
- `fix/bug-description` (Bug fixes)
- `docs/documentation-update` (Documentation changes)
- `refactor/scope-cleanup` (Code refactoring without behavioral change)
- `perf/optimization-description` (Performance improvements)

### Commit Message Format
```
<type>(<scope>): <concise description in imperative mood>

[optional body providing rationale and details]

[optional footer: Closes #123]
```

**Examples:**
- `feat(scheduler): add lunch break spacing constraint heuristic`
- `fix(navbar): resolve responsive menu overflow on narrow screens`
- `docs(readme): add docker setup instructions`

---

## Submitting a Pull Request

1. **Create a Topic Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Make Your Changes** and write corresponding unit tests under `tests/`.
3. **Verify Quality Gates**:
   Run the full verification suite locally before opening your PR:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
4. **Push and Open PR**:
   Push your branch to your fork and submit a PR against `main` on the upstream repository.
5. **Fill out the Pull Request Template**:
   Describe what your PR changes, why it is necessary, and attach screenshots for UI changes in both Light and Dark themes.

---

## Reporting Issues

- **Bug Reports**: Open an issue using the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml). Include clear reproduction steps, browser/Node version, and error logs.
- **Feature Requests**: Open an issue using the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml). Explain the problem, the proposed solution, and institutional use case.
- **Security Vulnerabilities**: Please review our [Security Policy](SECURITY.md) and report vulnerabilities responsibly.

---

## Getting Help

If you have questions or need architectural guidance:
- Visit the live deployment: [https://orqestraofficial.vercel.app](https://orqestraofficial.vercel.app)
- Join GitHub Discussions on our repository.
- Check the [Algorithmic Deep Dive in README.md](README.md#timetable-generation--algorithm-deep-dive).
- Review [DESIGN.md](DESIGN.md) for UI guidelines.
- Contact the maintainer directly at [santhisridinesh@gmail.com](mailto:santhisridinesh@gmail.com).

Thank you for helping make Orqestra better for institutions worldwide!
