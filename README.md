# Orqestra

Orqestra is a browser-based timetable generator for educational departments. It lets you configure departments, manage sections, subjects, and faculty, generate schedules, edit timetables manually, and export the final result to PDF or Excel.

The app is fully client-side and stores workspace data in the browser, so it can be used without a backend.

## Features

- Department dashboard with status, version, and preset setup shortcuts
- Department configuration, subjects, faculty, and settings screens
- Automated timetable generation with feasibility checks and scoring
- Manual timetable editor with undo, redo, conflict handling, and version history
- PDF and Excel export for generated timetables
- Persistent local workspace storage with import/export support

## How It Works

1. Create or apply a department preset from the dashboard.
2. Configure working days, periods, sections, subjects, and faculty.
3. Run generation to produce a timetable.
4. Review feasibility diagnostics, if any, before and after generation.
5. Open the timetable editor to move sessions, change faculty, clear entries, or restore versions.
6. Export the final timetable as PDF or Excel.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Zustand
- Zod
- jsPDF
- XLSX

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

- `npm run dev` - start the development server
- `npm run build` - type-check and build for production
- `npm run typecheck` - run the TypeScript compiler without emitting files
- `npm run test` - run the test suite once
- `npm run test:watch` - run tests in watch mode
- `npm run lint` - lint the source files
- `npm run preview` - preview the production build locally

## Main Workflow

- **Dashboard**: overview of departments, presets, and quick navigation
- **Configuration**: define sections, subjects, faculty, and department rules
- **Generate**: run the scheduling engine and inspect preflight diagnostics
- **Timetable**: review the generated timetable, edit sessions, restore versions, and export outputs
- **Settings**: manage workspace-level preferences

## Data Persistence

Workspace data is saved in browser local storage and restored automatically on load. The storage layer supports schema migration, import/export, and recovery from corrupted payloads.

## Project Structure

- `src/app` - application shell and global styling
- `src/application` - generation, export, presets, and timetable edit services
- `src/domain` - core domain types, rules, validation, and scheduling logic
- `src/features` - dashboard and page-level UI
- `src/state` - client state stores
- `src/storage` - persistence, migrations, and local storage adapter
- `tests` - unit, integration, and storage coverage

## License

MIT
