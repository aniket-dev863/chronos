# AGENTS.md — Developer & AI Agent Guidelines

Welcome to **Chronos**. This document serves as the guide for AI agents and human developers contributing to this codebase. It outlines the project architecture, tech stack, development workflows, coding standards, and best practices.

---

## 1. Project Overview & Architecture

**Chronos** is a local-first desktop productivity and time-tracking application built with Tauri, React, TypeScript, and SQLite.

### Core Architectural Principles
1. **Local-First & Persistent**: User data lives entirely on the local machine in SQLite. No remote server is required for core functionality.
2. **SQLite as Single Source of Truth**: UI metrics and statistics are derived directly from the database rather than ephemeral in-memory state.
3. **Clean Layered Separation**:
   - **UI Layer** (`src/pages`, `src/components`): Presentational and interactive components.
   - **State / Hook Layer** (`src/hooks`): Encapsulates async queries, reactive timers, and UI state lifecycle.
   - **Data Access Layer** (`src/db`): Schema initialization, non-destructive migrations, and repository functions executing parameterized SQL queries.
   - **Native / Desktop Layer** (`src-tauri`): Rust backend handling native window management, plugins, and system-level capabilities.
   - **Utilities Layer** (`src/utils`): Pure helper functions (e.g. time calculations, date formatting).

---

## 2. Tech Stack

| Domain | Technology | Notes |
|---|---|---|
| **Desktop Framework** | [Tauri v2](https://tauri.app/) | Native windowing, plugin ecosystem (`tauri-plugin-sql`, `tauri-plugin-opener`) |
| **Backend Language** | [Rust](https://www.rust-lang.org/) (2021 Edition) | Native runtime in `src-tauri/` |
| **Frontend Framework** | [React 19](https://react.dev/) | Functional components with hooks |
| **Language** | [TypeScript 5.8+](https://www.typescriptlang.org/) | Strict type checking enabled (`strict: true`) |
| **Bundler / Dev Server** | [Vite 7](https://vite.dev/) | Fast HMR and bundle compilation |
| **Database** | SQLite via `@tauri-apps/plugin-sql` | Local database file `sqlite:chronos.db` |
| **Styling** | Custom Vanilla CSS (`src/App.css`) | Modular, variable-driven desktop UI design system |

---

## 3. Common Commands & Workflows

### Frontend Development
```bash
# Start Vite development server (browser preview at http://localhost:1420)
npm run dev

# Run TypeScript type check and build production assets
npm run build

# Preview production build locally
npm run preview
```

### Full Desktop Application (Tauri)
```bash
# Launch Tauri desktop app in dev mode (starts Vite + native window)
npm run tauri dev

# Build production desktop installer/binary
npm run tauri build
```

### Rust / Backend Verification
```bash
# Check Rust backend code for compilation issues
cargo check --manifest-path src-tauri/Cargo.toml

# Format Rust code
cargo fmt --manifest-path src-tauri/Cargo.toml
```

---

## 4. Repository Structure

```text
chronos/
├── AGENTS.md                  # Agent & developer instructions (this file)
├── README.md                  # Project overview & roadmap
├── package.json               # Frontend dependencies and scripts
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite configuration
│
├── src/                       # Frontend application source
│   ├── assets/                # Static assets (images, icons, svgs)
│   ├── components/            # Reusable UI components and modal dialogs
│   │   ├── PomodoroTimer.tsx
│   │   └── StartSessionModal.tsx
│   ├── db/                    # Database connection, schemas, and repositories
│   │   ├── database.ts        # Database singleton instance loader
│   │   ├── schema.ts          # Table definitions & migration helpers
│   │   ├── sessionRepository.ts
│   │   └── planRepository.ts
│   ├── hooks/                 # Custom React hooks (data fetching, timers)
│   │   ├── useAllSessions.ts
│   │   ├── usePomodoro.ts
│   │   ├── useSessionTimer.ts
│   │   ├── useTodaySessions.ts
│   │   └── useUpcomingPlans.ts
│   ├── pages/                 # Page-level route views
│   │   ├── AnalyticsPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── PlansPage.tsx
│   │   ├── PomodoroPage.tsx
│   │   └── SessionsPage.tsx
│   ├── utils/                 # Pure helper functions
│   │   ├── analytics.ts       # Productivity metrics, trends & streak calculations
│   │   └── time.ts            # Time calculations and string formatters
│   ├── App.css                # Global styles and design system tokens
│   ├── App.tsx                # Root component, navigation & dashboard views
│   └── main.tsx               # Frontend entry point
│
└── src-tauri/                 # Tauri native desktop layer (Rust)
    ├── Cargo.toml             # Rust dependencies and package configuration
    ├── capabilities/          # Tauri v2 security capabilities and permissions
    │   └── default.json       # Allowed plugins and core capabilities
    ├── src/
    │   ├── lib.rs             # Tauri plugins registration and commands
    │   └── main.rs            # Native application entry point
    └── tauri.conf.json        # Tauri window and bundle settings
```

---

## 5. Coding Guidelines & Standards

### TypeScript & React
1. **Strict Typing**:
   - Never use `any` unless strictly unavoidable with a detailed comment explaining why.
   - Use explicit interfaces/types for component props, state, and repository models.
   - Use explicit type imports: `import type { Session } from "../db/sessionRepository";` or `import { useState, type FormEvent } from "react";`.
2. **Component Conventions**:
   - Write functional components with PascalCase naming (`SessionsPage.tsx`, `StartSessionModal.tsx`).
   - Define prop types via an interface above the component (e.g. `interface SessionsPageProps`).
   - Keep JSX clean and declarative; extract complex inline logic into helper functions or hooks.
3. **Hooks & State Management**:
   - Place data-fetching, timer loops, and persistent state syncing into custom hooks (`src/hooks/use*.ts`).
   - Hooks that load data should expose: data objects/arrays, `loading` boolean, optional `error` state, and a `refresh()` function for manual re-fetching after mutations.
4. **Time & Duration Handling**:
   - **Internal representation**: Always store durations in **seconds** (`duration_seconds: number`) and timestamps in standard **ISO 8601 strings** (`started_at`, `ended_at`, `created_at`).
   - **Display representation**: Only convert seconds to minutes/hours at the presentation layer using utility functions from `src/utils/time.ts` (e.g. `formatDuration`, `formatMinutes`).

### Database & SQLite Best Practices
1. **Encapsulation in Repositories**:
   - Components and hooks must never execute raw SQL directly. All SQL operations must be written inside `src/db/*Repository.ts`.
2. **Safe Initialization**:
   - Always ensure `await initializeDatabase()` is called inside repository functions prior to querying.
3. **Parameterized SQL Queries**:
   - Always use parameterized queries (`?` placeholders) when passing values to `db.execute()` or `db.select()`.
   - Never interpolate user input directly into SQL strings.
4. **Non-Destructive Migrations**:
   - Manage schema additions in `src/db/schema.ts`.
   - Use `CREATE TABLE IF NOT EXISTS` for new tables.
   - Use helper functions like `addColumnIfMissing(db, table, column, definition)` to migrate existing databases without breaking user data.
   - Add database indexes (`CREATE INDEX IF NOT EXISTS`) for frequently queried or filtered columns (e.g., dates, completion statuses).

### Tauri & Rust Guidelines
1. **Keep Native Layer Lean**:
   - Implement business logic on the TypeScript side where possible, using Rust primarily for OS integrations, file system access, and native plugins.
2. **Security & Capabilities**:
   - When introducing new Tauri APIs or plugins, ensure the appropriate permission is explicitly declared in `src-tauri/capabilities/default.json`.
3. **Error Handling in Rust**:
   - Return standard `Result<T, E>` types from Tauri commands and format errors cleanly for frontend consumption.

### Styling, UI & Accessibility
1. **CSS Conventions**:
   - Chronos uses standard CSS rules in `src/App.css`. Maintain cohesive variable naming, spacing, typography, and card styles.
   - Avoid inline CSS styles unless dealing with dynamically computed geometry (e.g. progress bar widths or calendar offsets).
2. **Accessibility**:
   - Provide proper `aria-label` attributes on icon-only buttons or destructive actions.
   - Use semantic elements (`<header>`, `<section>`, `<dialog>`/modal overlays with `role="dialog"` and `aria-modal="true"`).
   - Use `role="status"` on form feedback and error banners.

---

## 6. Agent Rules of Engagement

When modifying this repository:
1. **Verification**: Always run `npm run build` after editing frontend code to ensure TypeScript types and bundle bundling pass cleanly.
2. **No Data Loss**: Never drop tables or columns from `src/db/schema.ts`. Always write backward-compatible migration logic for existing SQLite databases.
3. **Docstring & Comment Integrity**: Preserve existing code comments and functional docstrings.
4. **Simplicity**: Favor clean, readable, dependency-free solutions that align with the existing project patterns before pulling in new external packages.
