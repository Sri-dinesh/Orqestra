# Orqestra

Orqestra is a browser-based **enterprise timetable generator** for educational departments. It lets you configure departments, manage sections, subjects, and faculty, automatically generate conflict-free schedules, edit timetables manually with full validation, version every change, and export the final result to PDF or Excel.

The app is **fully client-side** — no backend, no accounts. Workspace data lives in the browser's local storage, so it works offline and nothing ever leaves your machine.

---

## Features

- **Department dashboard** — status at a glance, live stats (sections, subjects, faculty, timetable version), and one-click preset setup
- **Full configuration** — working days, periods per day, sections, subjects (theory + labs), faculty pools, and per-section subject requirements
- **Automated generation** — backtracking scheduler with seeded randomness, preflight feasibility analysis, faculty fairness heuristics, and configurable time/node budgets
- **Fully-packed schedules** — the solver fills every period of every day for every section when requirements match weekly capacity
- **Manual editor** — move/swap sessions, change subject or faculty, custom day/period placement via an edit dialog, all with undo/redo
- **Robust conflict blocking** — every edit runs the full authoritative validator _before_ commit; hard conflicts are rejected with a blocking modal explaining why
- **Faculty availability** — set available and preferred teaching windows with a dedicated grid editor
- **Faculty timetable view** — review a teacher's weekly workload across all sections in a read-only grid
- **Version history** — every generation and edit creates a restore-point snapshot; browse and restore any version from the timetable page
- **Export** — official notice-board PDF per section (crest header, time grid with vertical break columns, class advisor, course/instructor details, mentors, signatories) plus Excel grid output
- **Persistence** — schema-versioned local storage with migrations, import/export, and corruption recovery

## How It Works

1. Create a department from scratch or apply a built-in preset from the dashboard.
2. Configure working days, periods per day, sections, subjects, and faculty.
3. Assign weekly session requirements per section (labs count as 2 consecutive periods).
4. Run generation. Preflight diagnostics warn about capacity gaps, unassigned faculty, and infeasibility _before_ the search starts.
5. Open the timetable editor: click an entry to select it, click an empty slot to move, right-click to swap, double-click (or "Edit…") to change subject/faculty/day/period.
6. Use the faculty page to set availability and preferred periods, then review the read-only faculty timetable view for weekly workload balance.
7. Restore any earlier version from the version history panel.
8. Export the final timetable as PDF or Excel.

> **Full-packing rule:** a section's weekly requirements must sum to exactly `working days × teaching periods per day` (labs = 2 periods each). Breaks such as lunch sit in their own grid columns after the 4th teaching period and are not counted. If requirements sum to less, the shortfall shows up as empty periods — the Generate page's preflight warnings tell you the exact gap.

---

## System Architecture

Orqestra follows a **layered, unidirectional architecture**. Dependencies only ever point downward — the domain knows nothing about React, storage, or the DOM.

```
┌─────────────────────────────────────────────────┐
│  UI Layer (src/features, src/components)        │
│  Pages, grids, modals, toasts, dashboards       │
├─────────────────────────────────────────────────┤
│  State Layer (src/state)                        │
│  Zustand stores: workspace, editor, generation  │
├─────────────────────────────────────────────────┤
│  Application Layer (src/application)            │
│  GenerationService, TimetableEditService,       │
│  versioning, presets, export                    │
├─────────────────────────────────────────────────┤
│  Domain Layer (src/domain)                      │
│  Scheduler engine, validation rules, models,    │
│  schemas, policies — pure TypeScript            │
├─────────────────────────────────────────────────┤
│  Storage Layer (src/storage)                    │
│  localStorage adapter, migrations, persistence  │
└─────────────────────────────────────────────────┘
```

### Layer responsibilities

| Layer                                     | What it does                                                                                                                              | What it never does                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **UI** (`src/features`, `src/components`) | Renders pages, grids, modals; dispatches edit commands and generation requests                                                            | Contains no scheduling or validation logic         |
| **State** (`src/state/stores`)            | Holds the workspace (departments, sections, subjects, faculty, timetables), editor state (selection, undo/redo), and generation job state | Doesn't validate or transform domain data          |
| **Application** (`src/application`)       | Orchestrates flows: preflight → generate → validate; draft → validate → commit edits; version snapshots; exports                          | No direct DOM or storage access                    |
| **Domain** (`src/domain`)                 | Pure logic: solver engine, validation rules, models, Zod schemas, versioning policy                                                       | Zero React, zero browser APIs, fully unit-testable |
| **Storage** (`src/storage`)               | Serializes the workspace to local storage, runs schema migrations, recovers from corruption                                               | Understands nothing about scheduling               |

### Key data flow: editing a session

```
User clicks a slot / Edit…
        │
        ▼
EditCommand (MOVE_ENTRY / SWAP_ENTRIES / CHANGE_SUBJECT / …)
        │
        ▼
TimetableEditService.executeCommand()
  1. Deep-copy timetable → draft
  2. applyEditCommand() — pure transformation
  3. validateTimetable(draft) — FULL authoritative validation
     ├─ hard conflict → REJECTED → blocking ConflictModal (nothing saved)
     └─ clean → commit:
         • pre-edit state snapshotted into versionHistory
         • revision++, status recomputed (VALID / STALE / INVALID)
        ▼
Zustand store updated → persistence middleware writes to localStorage
        ▼
UI re-renders; undo/redo stacks updated
```

---

## Timetable Generation — Algorithm Deep Dive

Generation is the heart of Orqestra. It is a **constraint-satisfaction backtracking search with heuristic guidance** — not a random shuffler and not an ILP. Everything lives in `src/domain/scheduler` as pure, side-effect-free TypeScript.

### Pipeline overview

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

### [1] Preflight feasibility (`src/domain/scheduler/feasibility`)

Before any search, the config is analyzed so the user learns about impossibilities in milliseconds instead of after a timeout:

- **Section capacity** — `requiredPeriods = Σ sessions × duration (labs = 2)` per section, compared against the teachable periods: `workingDays × periodsPerDay`, where `periodsPerDay` counts _teaching_ periods only. All-day breaks (e.g. lunch) render as their own grid columns and never consume a period number; only day-specific breaks reduce usable capacity. Over-capacity blocks generation; under-capacity (`SECTION_CAPACITY_SLACK`) is an advisory warning listing exactly how many empty periods to expect.
- **Lab capacity** — within each day, free teaching runs split at all-day break columns contribute `floor(run / 2)` placeable 2-period blocks; a lab can never span a break.
- **Faculty workload** — each subject's demand is summed across all sections and split evenly (ceil) among its eligible faculty pool; anyone over their weekly cap raises `FACULTY_CAPACITY_EXCEEDED` (blocking), anyone eligible for nothing raises `FACULTY_UNASSIGNED` (advisory).
- **Missing subjects** — stale references in section requirements.

### [2] Session expansion and ordering

Each section requirement like "THE-1, 6×/week" expands into **6 independent session units**. Labs expand into 1 unit carrying `durationPeriods = 2` — atomicity is guaranteed by construction, since a lab is placed as a single indivisible block spanning 2 consecutive periods.

Sessions are then arranged **section-major**: all of one section's sessions (labs first, longer durations first) before the next section. Sections interact _only_ through shared faculty, so this converts one giant search into a sequence of near-independent sub-problems — critical for fully-packed timetables where naive global lab-first ordering thrashes.

### [3] The backtracking search (`src/domain/scheduler/solver`)

#### Dynamic variable ordering — MRV

At every step, the solver does **not** follow a static list. It applies **MRV (minimum remaining values)**: among the next `MRV_WINDOW = 24` unscheduled sessions, it counts feasible placements for each (capped at 32 for speed) and picks the **most constrained** session first. This has two effects:

- sessions with zero feasible placements are detected **immediately**, pruning whole branches before any placement is attempted (fail-fast);
- tightly-packed sections get scheduled while the grid is still flexible, which is what makes 100% occupancy solvable in seconds.

The chosen session is swapped into the current position and swapped back on backtrack, keeping the recursion clean.

#### Candidate generation & hard-constraint pruning

For the chosen session, candidates are enumerated over the full grid: `day × startPeriod × eligibleFaculty`. Before scoring, each candidate must pass **hard constraints** (checked via the occupancy index in ~O(1)):

| Constraint                                                                   | Enforced by                    |
| ---------------------------------------------------------------------------- | ------------------------------ |
| Section collision — a section can't be in two rooms at once                  | `OccupancyIndex.isSectionFree` |
| Faculty collision — a teacher can't teach two sections simultaneously        | `OccupancyIndex.isFacultyFree` |
| Lab atomicity — labs span 2 consecutive periods on one day                   | session unit construction      |
| Subject/day cap — max sessions of one subject per section per day (optional) | `subjectPerDayWithinLimits`    |
| Lab/day cap — max lab blocks per section per day (optional)                  | `labPerDayWithinLimits`        |
| Faculty workload caps — `maxPeriodsPerWeek` / `maxPeriodsPerDay`             | `facultyWithinLimits`          |

#### Heuristic candidate scoring

Feasible candidates are ranked by a weighted score — this is what turns "a valid timetable" into "a good timetable":

| Term                                  | Weight    | Purpose                                                                                                                         |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `− sectionDayLoad × 2`                | strongest | spread each section's load across days; prevents starved days and deep dead ends on packed schedules                            |
| day-completion bonus `+1.5`           | —         | prefer extending a partially-filled day over opening a sparse one; consolidates slack onto few days instead of one hole per day |
| `− facultyLoad × 2`                   | —         | **faculty fairness**: always prefer the least-loaded eligible teacher, so pools share work evenly                               |
| `− periodUsage × 1.2`                 | —         | **period-band balancing**: spread sessions across the day so the last period isn't systematically empty                         |
| `− sameDayCount × 0.8`                | —         | distribute a subject's weekly sessions across distinct days                                                                     |
| `− labStartUsage × 1.5` (labs only)   | —         | lab start times vary across sections instead of stacking at one slot                                                            |
| day/period/faculty index tie-breakers | —         | fully deterministic ordering (no `Math.random` in the solver)                                                                   |

All the counters feeding these terms (`periodUsageByDay`, `facultyLoad`, `labStartPeriodUsage`) are maintained **incrementally** — O(1) update on place, O(1) on rollback.

#### Backtracking with reversible mutation

The search is classic recursive backtracking with explicit rollback:

1. Apply a candidate: push the entry, `occupancy.apply()` returns a **rollback closure**, and the three usage counters are updated.
2. Recurse to the next session.
3. On failure: pop the entry, call the rollback closure (exact reverse-order undo of every map write), decrement the counters, increment `backtrackCount`.

No state is ever rebuilt from scratch on backtrack — every undo is proportional to the size of the last placement.

#### The occupancy index (`src/domain/scheduler/occupancy`)

Two hash maps — `sectionOccupancy` and `facultyOccupancy` — keyed by `"sectionId"`/`"facultyId"` → `"day:period"` → entry id. Collision checks are O(duration) hash lookups instead of scanning all placed entries, which is what keeps the search fast at enterprise scale (hundreds of sessions × thousands of candidates).

#### Determinism & budgets

- **Seeded PRNG (mulberry32)** — `createSeededRng(seed)`; the seed is stored in generation metadata, so _identical input + identical seed = bit-identical timetable_. Auto mode picks a random seed per run.
- **Cancellation** — checked every node via a `CancellationToken` (the Cancel button).
- **Node budget** — `maxExploredNodes` (default 20 M); exceeded → `SEARCH_NODE_LIMIT`.
- **Time budget** — `maxSearchDurationMs` (default 60 s), checked every 1024 nodes (`& 0x3ff`) to keep clock reads off the hot path; exceeded → `SEARCH_TIMEOUT`. Both are configurable per department on the Generate page.
- Exhausting the search space with no solution → `IMPOSSIBLE` with actionable diagnostics (reduce sessions, add faculty, add days).

### [4] Independent validation (`src/domain/validation`)

The solver's output is **never trusted**. `validateTimetable()` re-checks the finished grid through layered rules — structure/references, faculty & section collisions, lab atomicity, requirement counts, config staleness — completely independent of solver code. Only a clean pass marks the timetable `VALID`. A solver bug therefore cannot produce a silently-conflicted schedule.

### [5] Soft scoring (`src/domain/scheduler/scoring`)

After validation, the schedule receives a normalized quality score (weighted mean of 0–1 components): subject distribution across days, daily balance per section, faculty balance, gap reduction, and lab distribution. Weights come from the configuration's `softWeights`; the total is surfaced in the generation metadata and shown on the Generate page.

### Why this design works at enterprise scale

The enterprise preset (9 sections × 6 days × 7 periods = **378 sessions, 100% occupancy**) solves in **~2–5 s** with low backtrack counts because of the combination of:

1. **section-major decomposition** — each section is a near-independent sub-problem;
2. **MRV fail-fast** — dead ends are detected before placement, not after;
3. **occupancy indexing** — O(1) collision checks;
4. **day-balancing heuristics** — the greedy ordering keeps every section's days perfectly balanced, which for fully-packed inputs is also exactly what the backtracker wants, so greedy usually _is_ the solution;
5. **incremental counters** — rollback is O(1) per undo.

The same engine also handles slack configurations (e.g. 41/42 periods) — the day-completion bonus concentrates leftover empty periods onto few days instead of scattering one hole per day.

### Validation engine (`src/domain/validation`)

Layered rule checks, each producing structured `Conflict` objects:

| Layer                     | Rule                                                 | Blocks edits?                                                 |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Structure & references    | entries reference existing sections/subjects/faculty | ✅                                                            |
| Collisions                | faculty & section double-booking                     | ✅                                                            |
| Laboratories              | atomic 2-period blocks, no overlap                   | ✅                                                            |
| Requirements              | missing/excess sessions vs. snapshot counts          | ❌ — removal is intentional; timetable marked INVALID instead |
| Configuration consistency | stale timetable after config changes                 | surfaces as STALE status                                      |

### Edit transactionality (`src/application/timetable-service.ts`)

Every edit follows **draft → validate → commit**. Nothing mutates committed state before validation passes, so a rejected edit leaves the timetable byte-identical. Rejected edits surface a **blocking modal** (not a dismissible toast) so the user always learns _why_.

### Versioning (`src/application/timetable-versioning.ts`)

- Every generation and every committed edit appends a deep-copied snapshot to `versionHistory` (newest last, capped at 20).
- Origins: `GENERATED` (regeneration replaced a timetable), `EDIT` (pre-edit state), `RESTORE` (state before a restore — restoring is itself reversible).
- Each snapshot stores entries, status, validation summary, generation metadata, and a human-readable label.
- Persisted as schema v2; a migration backfills `versionHistory: []` for pre-existing workspaces.

### Faculty fairness

The solver tracks faculty load incrementally and steers placement toward the least-loaded eligible teacher. With balanced pools (e.g. the enterprise preset's pools of 4 faculty per theory subject), weekly loads stay within a spread of 1–2 periods across each pool.

### Persistence (`src/storage`)

- Storage key `wts:v1:workspace`; the workspace is serialized as a versioned document (`schemaVersion`, `applicationVersion`, timestamps).
- **Migrations** run old → current on load (v1 → v2 adds timetable versioning); unknown newer versions fail fast with a clear error instead of silently corrupting.
- Corrupted payloads are recovered rather than crashing the app.
- Zod schemas (`src/domain/schemas`) validate the persisted shape.

---

## Engineering Details

- **Strict TypeScript** — the whole codebase compiles with `tsc --noEmit` as a build gate; no `any` shortcuts in the domain layer.
- **Pure domain core** — the scheduler, validator, and versioning are pure functions with no side effects, which makes them deterministic and trivially testable (same input + same seed = same timetable).
- **Seeded randomness** — a seeded PRNG drives candidate ordering, so any timetable can be reproduced exactly from its seed (shown in generation metadata).
- **Zustand for state** — small, focused stores instead of a monolith: `workspace-store` (data), `editor-store` (selection, undo/redo, toasts), `generation-store` (job lifecycle).
- **Zod at the boundaries** — persisted documents and configuration snapshots are schema-validated; invalid data is rejected at load time, not at render time.
- **51 tests** across domain, application, storage, and integration suites — including enterprise-scale end-to-end runs (9 sections, 378 sessions, 0 empty slots).
- **Optimistic-free mutations** — the UI never mutates store state directly; everything flows through application services, keeping the undo/redo and versioning guarantees intact.

## Tech Stack

- **React 18** + **TypeScript** (strict)
- **Vite** — dev server & production build
- **React Router** — department-scoped routing
- **Zustand** — client state
- **Zod** — runtime schema validation
- **jsPDF** + **XLSX** — exports
- **Vitest** — test runner
- **Tailwind CSS v4** — bevel-themed design tokens (`src/app/styles.css`)

## Prerequisites

- Node.js 18 or newer
- npm

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL shown by Vite in your browser.

## Available Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and build for production
- `npm run typecheck` — run the TypeScript compiler without emitting files
- `npm run test` — run the test suite once
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — lint the source files
- `npm run preview` — preview the production build locally

## Main Workflow Screens

- **Dashboard** — workspace overview, department cards with status + version, built-in presets
- **Configuration** — sections, subjects, faculty, department days/periods
- **Generate** — preflight diagnostics, seed, per-department budgets, generation state
- **Timetable** — weekly grid per section, full editing, conflict modals, version history with restore, validation panel, exports
- **Faculty timetable** — read-only weekly workload grid per teacher with print support
- **Settings** — workspace-level preferences

## Built-in Presets

Six presets ship with the app, from a 1-section Quick Start to an **Enterprise** preset: 9 sections × 6 days × 7 periods, 6 theory subjects × 6 sessions/week + 3 labs, 40 faculty in dedicated pools — fully packed at 42/42 periods per section per week, solved in ~2–5 s. The **B.Tech CSE 3rd Year** preset mirrors a real Vardhaman College III-I timetable: 3 sections (CSE-G/H/I) × 6 days × 7 teaching periods with real subjects, faculty, rooms, period timings, plus Break (after P2) and Lunch (after P4) columns — fully packed at 42/42, solved in ~1 s.

## Data Persistence

Workspace data is saved in browser local storage and restored automatically on load. The storage layer supports schema migration (currently v2), import/export, and recovery from corrupted payloads. Export filenames follow the pattern `orqestra-workspace-*.json`.

## Project Structure

```
src/
├── app/                  # Application shell, routing, global styles (design tokens)
├── application/          # Orchestration: generation, edit service, versioning, presets, export
├── components/ui/        # Reusable primitives (Button, Card, EditModal, ConflictModal, …)
├── domain/               # Pure core: models, schemas, policies, scheduler, validation
│   ├── scheduler/        #   engine, solver, scoring, feasibility, seeded RNG
│   └── validation/       #   layered rules + authoritative validator
├── features/             # Page-level UI (dashboard, config, generation, timetable editor, …)
├── state/stores/         # Zustand stores (workspace, editor, generation)
└── storage/              # Persistence: local-storage adapter, migrations, document schema
tests/                    # Vitest suites: domain, application, storage, integration
```

## License

MIT
