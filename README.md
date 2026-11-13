<div align="center">

# Orqestra

**Intelligent Academic Timetable Generator & Operational Schedule Workstation**

[![CI & Verification](https://github.com/Sri-dinesh/Orqestra/actions/workflows/ci.yml/badge.svg)](https://github.com/Sri-dinesh/Orqestra/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests: 186 Passed](https://img.shields.io/badge/Tests-186_Passing-success?logo=vitest&logoColor=white)](tests/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#timetable-generation--algorithm-deep-dive">Algorithm Deep Dive</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#system-architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

</div>

---

## Overview

**Orqestra** is an intelligent academic timetable workstation and constraint solver built for universities, colleges, and schools. It solves complex academic schedules with hard constraint satisfaction, spreads faculty workloads equitably, and provides an interactive real-time editor with instantaneous conflict detection.

Orqestra features a **hybrid local-first and cloud architecture**:
- **100% Offline Capable**: Operates seamlessly in the browser with schema-versioned local storage — no mandatory backend or accounts.
- **Serverless Cloud Sync & RBAC**: Connects with [Neon Serverless Postgres](https://neon.tech) and Neon Managed Auth for institutional role-based access control (Admin, HOD, Teaching Faculty), multi-semester cloning, and real-time team collaboration.
- **`/dev/null` Unified Design System**: Engineered with the clean `/dev/null` developer workstation aesthetics — featuring a **Dark Graphite Theme** (`#111112` / `#18181a` / `#7aa2f7`), 6 colorful entity lanes, and a 1-click Theme Switcher.

---

## Key Features

- **Backtracking Constraint Solver**: Solves massive institutional allocations (e.g. 9 sections × 6 days × 7 periods = 378 sessions, 100% full-packed) in **~2–5 seconds** with Minimum Remaining Values (MRV) heuristics and seeded determinism.
- **Preflight Feasibility Engine**: Discovers teacher overloading, room bottlenecks, and capacity shortfalls before the search even begins.
- **Interactive Timetable Workstation**: Move, swap, and reallocate class periods with sub-millisecond authoritative collision checks.
- **Dark Graphite & Light Workstation Modes**: Full `/dev/null` design compliance with 1-click theme switching, Geist & Geist Mono typography, and crisp hairline division.
- **Notice-Board PDF & Excel Exports**: Generates official institution-ready PDFs featuring crest headers, break columns, room assignments, mentor details, and official signatories.
- **Faculty Availability & Workload Fairness**: Dedicated teaching window constraints, daily/weekly period limits, and workload spread heuristics.
- **Multi-Semester Workspace Isolation**: Clone and maintain separate schedules across academic years and semesters without re-entering faculty and room records.
- **Role-Based Access Control (RBAC)**: Institution Admins, Department Heads (scoped to department), and Teaching Faculty (safe read-only portal view).

---

## How It Works

```
┌───────────────────────────────┐     ┌──────────────────────────────┐     ┌─────────────────────────────┐
│ 1. Configure Department       │     │ 2. Automated Solver Run      │     │ 3. Interactive Workstation  │
│ Days, periods, theory & labs, │ ──> │ MRV ordering, heuristic      │ ──> │ Visual move/swap, version   │
│ faculty pools, room capacities│     │ pruning & conflict checks    │     │ history, PDF/Excel export   │
└───────────────────────────────┘     └──────────────────────────────┘     └─────────────────────────────┘
```

1. **Configure or Pick a Blueprint**: Start with an empty workspace or apply one of 6 built-in blueprints (from single section schools to a 40-faculty Enterprise Engineering college).
2. **Assign Requirements**: Specify weekly session requirements per subject (e.g., 5 theory periods + 1 atomic 2-period laboratory).
3. **Run Preflight & Solve**: Preflight diagnostics warn about capacity mismatches in real-time. The solver generates a 100% conflict-free schedule.
4. **Edit & Fine-Tune**: Drag, swap, or edit sessions directly on the grid. Hard conflicts trigger an instant blocking explanation modal.
5. **Publish & Export**: Export notice-board PDFs, send public read-only schedule links to faculty, or export Excel spreadsheets.

---

## Timetable Generation — Algorithm Deep Dive

Generation is the core of Orqestra. It is a **constraint-satisfaction backtracking search with heuristic guidance** — not a random shuffler and not an ILP. Everything lives in `src/domain/scheduler` as pure, side-effect-free TypeScript.

### Pipeline Overview

```
Requirements (per section, per subject)
        │
        ▼
[1] Preflight feasibility  (analyzeFeasibility — before the solver runs)
        │
        ▼
[2] Session expansion      (each requirement → individual session units)
        │
        ▼
[3] Backtracking search    (MRV ordering + hard-constraint pruning)
        │   ├─ candidate enumeration (day × period × faculty)
        │   ├─ heuristic scoring & candidate ordering
        │   └─ O(1) occupancy indexing + rollback closures
        ▼
[4] Independent validation (validateTimetable — solver/validator share no code)
        │
        ▼
[5] Soft scoring           (quality score shown in generation metadata)
```

### [1] Preflight Feasibility (`src/domain/scheduler/feasibility`)

Before any search, the configuration is analyzed so the user learns about impossibilities in milliseconds instead of waiting for a timeout:

- **Section capacity** — `requiredPeriods = Σ sessions × duration (labs = 2)` per section, compared against teachable periods: `workingDays × periodsPerDay`. Over-capacity blocks generation; under-capacity (`SECTION_CAPACITY_SLACK`) emits an advisory warning.
- **Lab capacity** — within each day, free teaching runs split at all-day break columns contribute `floor(run / 2)` placeable 2-period blocks; a lab can never span a break.
- **Faculty workload** — each subject's demand is summed across sections and split evenly among its eligible faculty pool; anyone over their weekly cap raises `FACULTY_CAPACITY_EXCEEDED`.
- **Missing subjects & stale references** — caught before variable expansion.

### [2] Session Expansion & Section-Major Decomposition

Each section requirement (e.g. "Theory, 6×/week") expands into **independent session units**. Labs expand into units with `durationPeriods = 2` — atomicity is guaranteed by construction.

Sessions are arranged **section-major**: all of one section's sessions are scheduled before the next. Because sections interact primarily through shared faculty, this converts one giant search into a sequence of near-independent sub-problems — critical for packed timetables.

### [3] The Backtracking Search (`src/domain/scheduler/solver`)

#### Dynamic Variable Ordering — MRV
At every step, the solver applies **MRV (minimum remaining values)** across a window of unscheduled sessions, counting feasible placements and picking the **most constrained** session first:
- Sessions with zero feasible placements are detected **immediately**, pruning entire dead branches (fail-fast).
- Tightly-packed sections get scheduled while the grid is still flexible, enabling 100% occupancy solves in seconds.

#### Candidate Generation & Hard-Constraint Pruning
Candidates are enumerated over `day × startPeriod × eligibleFaculty` and checked against an **Occupancy Index** in ~O(1):

| Constraint | Enforcement Mechanism |
| :--- | :--- |
| **Section Collision** | `OccupancyIndex.isSectionFree` |
| **Faculty Collision** | `OccupancyIndex.isFacultyFree` |
| **Lab Atomicity** | Consecutive period block validation |
| **Subject Daily Cap** | `subjectPerDayWithinLimits` |
| **Lab Daily Cap** | `labPerDayWithinLimits` |
| **Faculty Workload Caps** | `maxPeriodsPerWeek` / `maxPeriodsPerDay` |

#### Heuristic Candidate Scoring
Feasible candidates are ranked by a multi-term heuristic objective:
- `− sectionDayLoad × 2`: Spreads section load evenly across days.
- `day-completion bonus +1.5`: Extends partially-filled days over opening sparse ones.
- `− facultyLoad × 2`: **Faculty fairness** — steers allocations toward least-loaded eligible faculty.
- `− periodUsage × 1.2`: Balances period bands across the day.
- `− labStartUsage × 1.5`: Staggers lab start times across sections.

#### Reversible Mutation with Occupancy Index
The search uses recursive backtracking with rollback closures: applying a candidate updates hash maps (`sectionOccupancy`, `facultyOccupancy`) in O(1) and returns an exact reverse-order undo closure. No state is ever rebuilt from scratch on backtrack.

### [4] Independent Authoritative Validation (`src/domain/validation`)
The solver's output is **never trusted**. `validateTimetable()` independently audits the finished grid against all structural, collision, atomicity, and stale reference rules. Only a clean pass marks the timetable `VALID`.

---

## System Architecture

Orqestra adheres to a **layered, unidirectional architecture**. Dependencies only ever point downward — the domain layer has zero dependencies on React, Next.js, or browser storage APIs.

```
┌────────────────────────────────────────────────────────┐
│  UI Layer (src/features, src/components, src/app)      │
│  Next.js pages, responsive timetable grids, modals     │
├────────────────────────────────────────────────────────┤
│  State Layer (src/state/stores)                        │
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

---

## Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 20.x`
- `npm` `>= 10.x`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sri-dinesh/Orqestra.git
   cd Orqestra
   ```

2. **Install dependencies**:
   ```bash
   npm ci --legacy-peer-deps
   ```

3. **Configure Environment Variables** (Optional for offline local dev):
   ```bash
   cp .env.example .env.local
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the workstation.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Compiles optimized Next.js production build |
| `npm run start` | Runs the compiled Next.js production server |
| `npm run typecheck` | Strict TypeScript typecheck across all files (`tsc --noEmit`) |
| `npm run lint` | Lints codebase with ESLint |
| `npm test` | Runs all 186 unit and integration tests with Vitest |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run db:generate` | Generates Drizzle database migrations |
| `npm run db:migrate` | Applies database migrations to PostgreSQL |

---

## Project Structure

```
.
├── src/
│   ├── app/                 # Next.js App Router: routes, layouts, API endpoints, styles.css
│   ├── application/         # Orchestration: generation, edit service, PDF/Excel exports, presets
│   ├── auth/                # Client-side session and authentication hooks
│   ├── components/ui/       # Primitives (Button, Card, Badge, ThemeSwitcher, Modals)
│   ├── db/                  # Drizzle ORM schema and Neon PostgreSQL client
│   ├── domain/              # Pure domain core (models, scheduler engine, validators, schemas)
│   ├── features/            # Feature views (dashboard, departments, timetable editor, settings)
│   ├── hooks/               # Custom hooks (useTheme, usePersistence, useMedia)
│   ├── state/               # Zustand state stores (workspaceStore, editorStore)
│   └── storage/             # LocalStorage adapter, migrations, cloud sync client
├── tests/                   # 186 Vitest test suites across domain, application, and UI
├── .github/                 # CI workflows, PR templates, and issue forms
├── CONTRIBUTING.md          # Open-source contributor guide
├── CODE_OF_CONDUCT.md       # Contributor Covenant Code of Conduct
├── SECURITY.md              # Security vulnerability reporting policy
├── DESIGN.md                # /dev/null design specification and token dictionary
└── LICENSE                  # MIT License
```

---

## Contributing

We love contributions! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for full instructions on our coding standards, local development workflow, and PR submission checklist.

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Security

For security vulnerabilities, please refer to our [Security Policy](SECURITY.md) and report issues privately.

---

## License

Orqestra is open-source software licensed under the [MIT License](LICENSE).
