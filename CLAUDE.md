# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start          # or: npx expo start

# Platform-specific launchers
npm run android    # Launch Android emulator
npm run ios        # Launch iOS simulator
npm run web        # Web build

# Start mock API server (required for local dev)
npm run mock-api   # Runs Express.js on port 3001
```

**Demo login**: username `demo`, any password (handled by mock API).

There are no tests or linters configured. Prettier is available (`npx prettier --write <file>`).

## Architecture Overview

CrewLoop is an offline-first React Native / Expo field-service app. The data flow is:

```
API (axios) → SQLite (expo-sqlite) → Context API → Screens/Components
```

SQLite is always the source of truth — screens never read directly from the API. All API responses are written to SQLite first, then rendered from SQLite.

### Key Layers

**`App.js`** — Root: wraps the app in `SQLiteProvider` (database) → `JobProvider` (context) → `NavigationContainer` (stack navigation).

**`Components/Context.js`** — Global state via `JobContext`. Provides `jobResult` (active job list) and `syncVersion` / `incrementSyncVersion` (a counter used to trigger re-fetches across components).

**`Components/AppSyncManager.js`** — Core sync orchestration. On mount/focus, detects network state via `expo-network`, fetches from API when online, writes to SQLite, then triggers a context update. When offline, operations are queued in SQLite with a `pending` status and batch-POSTed to `POST /contractorApi/sync` on reconnect.

**`Components/SessionManager.js`** — Auth token lifecycle; handles expiry and re-authentication.

**`Components/SyncLock.js`** — Prevents concurrent sync operations.

**`Database/`** — Each domain has its own module with two function types:
- `*Api()` functions — axios calls to the backend
- `*Sqlite()` functions — expo-sqlite reads/writes

Key modules: `WorkOrderDatabase.js`, `AttachmentDatabase.js`, `CheckInOutDatabase.js`, `FinalCheckOutDatabase.js`.

**`Database/SetupDatabase.js`** — SQLite schema creation and migrations (currently schema v6). Contains all `CREATE TABLE` statements and migration logic.

**`Config.js`** — Routes API base URL based on Expo update channel (`production` / `staging` / `development` / `demo`). Update this when adding environments.

**`StyleSheet.js`** — Centralized design tokens. All colors and shared styles live here. Primary: `#1B3A6B` (navy), Accent: `#F47C20` (orange). Prefer these tokens over hardcoded hex values.

**`UpdateGate.js`** — Checks server for minimum app version; blocks launch if the installed version is too old.

### Navigation Structure

```
Login
└── Home (Material Top Tabs)
    ├── JobsList
    ├── CompletedJobs
    └── Profile
        └── JobModal (stack modal over Home)
            ├── Details
            ├── Contacts
            ├── CheckInOut
            ├── Photos
            ├── Files
            └── FinalCheckOut
```

### Offline Queue Pattern

Operations that mutate data (check-in, photo upload, final checkout) are written to SQLite immediately with a `status: 'pending'` flag. `AppSyncManager` processes the queue and POSTs to `/contractorApi/sync` when network is available. `BannerOnPendingSync.js` shows a UI indicator when the queue is non-empty.

## Pending Work (PATCH_NOTES.md)

There are hardcoded color values that need migrating to `StyleSheet.js` tokens in:
- `Screens/FinalCheckOut.js` — button colors
- `Screens/Profile.js` — toggle colors
- `Screens/SignatureScreen.js` — button colors
- `Components/JobDetails/Photos.js` — button colors
- `Database/JobDatabase.js` — config import & header name change

## EAS Builds

Build profiles are defined in `eas.json`:
- `development` → staging channel, internal distribution
- `preview` → staging channel, store distribution
- `production` → production channel, store distribution

OTA update policy is `appVersion` — updates are delivered per app version via `expo-updates`.
