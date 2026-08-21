# Chronos ⏱️

**Chronos** is a desktop time-tracking and productivity application built to help you understand where your time goes.

It combines **focused work sessions, persistent local storage, productivity statistics, and a clean desktop UI** into a lightweight application.

> 🚧 **Status:** Active development — core session tracking and SQLite persistence are currently implemented.

---

## ✨ Features

### 🎯 Focus Sessions

- Start a focused work session with an activity name
- Real-time session timer
- Pause and resume sessions
- Finish sessions and automatically calculate duration
- Persist completed sessions locally

### 💾 Local SQLite Storage

Chronos uses SQLite for persistent session data.

Each session stores:

```text
activity
started_at
ended_at
duration_seconds
created_at
```

This means your productivity data remains available after restarting the application.

### 📊 Dashboard

The dashboard currently provides:

- Total focused time for today
- Daily goal progress
- Current session status
- Activity-wise time breakdown
- Daily productivity review
- Tracked-time summary

Dashboard statistics are calculated from the actual SQLite session data rather than hardcoded values.

### 📋 Sessions

A dedicated Sessions section is being developed to provide a complete history and management interface for tracked sessions.

---

## 🛠️ Tech Stack

| Technology     | Purpose                                   |
| -------------- | ----------------------------------------- |
| **React**      | Frontend UI                               |
| **TypeScript** | Type-safe application development         |
| **Tauri**      | Lightweight desktop application framework |
| **Rust**       | Native desktop/backend layer              |
| **SQLite**     | Local persistent database                 |
| **Vite**       | Frontend development and bundling         |
| **CSS**        | Application styling                       |

### Architecture

```text
┌──────────────────────────────────────┐
│              Chronos                 │
│                                      │
│          React + TypeScript          │
│                 │                    │
│                 ▼                    │
│        Tauri Application Layer       │
│                 │                    │
│                 ▼                    │
│          SQLite Database             │
└──────────────────────────────────────┘
```

---

## 🏗️ Project Structure

```text
chronos/
│
├── src/
│   ├── components/
│   │   └── StartSessionModal.tsx
│   │
│   ├── db/
│   │   ├── database.ts
│   │   ├── schema.ts
│   │   └── sessionRepository.ts
│   │
│   ├── hooks/
│   │   ├── useSessionTimer.ts
│   │   ├── useTodaySessions.ts
│   │   └── useAllSessions.ts
│   │
│   ├── pages/
│   │   └── SessionsPage.tsx
│   │
│   ├── utils/
│   │   └── time.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
│
├── src-tauri/
│   ├── src/
│   │   └── lib.rs
│   │
│   └── capabilities/
│       └── default.json
│
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔄 How Session Tracking Works

When a user starts a session:

```text
User
 │
 │ Start Session
 ▼
StartSessionModal
 │
 ▼
useSessionTimer
 │
 │ Running
 ▼
Real-time Timer
 │
 │ Finish
 ▼
Completed Session
 │
 ▼
sessionRepository
 │
 ▼
SQLite
 │
 ▼
useTodaySessions()
 │
 ▼
Dashboard Updates
```

The important part is that the dashboard doesn't maintain a separate source of truth.

**SQLite is the source of truth for completed sessions.**

---

## 🗄️ Database

Chronos currently uses a `sessions` table.

Conceptually:

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
```

Example:

```text
ID   Activity    Duration
──────────────────────────
6    DSA         37 sec
5    DSA         20 sec
4    DSA         14 sec
3    DSA          2 sec
2    Academics    1 sec
```

Multiple sessions can belong to the same activity, and the dashboard aggregates them automatically.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js
- npm
- Rust
- Tauri prerequisites for your operating system

Then clone the repository:

```bash
git clone <your-repository-url>
cd chronos
```

Install dependencies:

```bash
npm install
```

Start the development application:

```bash
npm run tauri dev
```

---

## 🧪 Development

For frontend-only development:

```bash
npm run dev
```

The Vite development server runs on:

```text
http://localhost:1420
```

For the complete desktop application:

```bash
npm run tauri dev
```

---

## 🗺️ Roadmap

Chronos is being developed incrementally.

### ✅ Completed

- [x] Tauri desktop application
- [x] React + TypeScript frontend
- [x] SQLite integration
- [x] Database schema
- [x] Session repository
- [x] Start session
- [x] Pause session
- [x] Resume session
- [x] Finish session
- [x] Persistent session storage
- [x] Today's session retrieval
- [x] Dynamic dashboard statistics
- [x] Activity-wise time aggregation
- [x] Dashboard / Sessions navigation

### 🚧 In Progress

- [ ] Complete Sessions history page
- [ ] Session deletion
- [ ] Session editing
- [ ] Calendar view
- [ ] Productivity analytics
- [ ] Weekly/monthly statistics
- [ ] Configurable daily goals
- [ ] Real computer activity tracking
- [ ] Improved Pomodoro functionality

### 🔮 Future

- [ ] System-level activity tracking
- [ ] Application usage detection
- [ ] Idle-time detection
- [ ] Productivity insights
- [ ] Notifications
- [ ] Keyboard shortcuts
- [ ] Export productivity data
- [ ] Packaging and distribution

---

## 🎯 Project Goals

Chronos is being built with a few principles in mind:

**1. Local-first**

Productivity data should belong to the user and remain locally accessible.

**2. Lightweight**

Tauri provides a significantly lighter desktop architecture than traditional Electron-based applications.

**3. Data-driven UI**

Dashboard metrics should be derived from actual tracked sessions rather than duplicated state.

**4. Extensible architecture**

The application is being structured so features such as analytics, calendar views, Pomodoro sessions, and computer activity tracking can be added without rewriting the core session system.

---

## 📌 Current Development Status

Chronos is currently at the **core session tracking milestone**.

The fundamental loop is working:

```text
Start
  ↓
Track
  ↓
Pause / Resume
  ↓
Finish
  ↓
Save to SQLite
  ↓
Reload from SQLite
  ↓
Update Dashboard
```

The next major milestone is turning the Sessions section into a complete session-history and management interface.

---

## 📄 License

This project is currently being developed as a personal project.

License information will be added as the project approaches its first release.

---

<p align="center">
  Built with React, TypeScript, Rust, Tauri & SQLite.
</p>
