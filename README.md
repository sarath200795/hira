# Unified HSE Engine

A single application that unifies seven previously-standalone HSE apps
(`fire-marshal`, `hecp-loto`, `hira`, `hse-committee`, `incident-ira`,
`inspections`, `internal-audit`) behind **one login**, **one tiles dashboard**,
and **shared Site Management + User & Role Management**, all on **one shared
Firebase project**.

> Status: **Phase 1 + 2 scaffold.** The engine shell, shared auth/firebase/sites,
> tiles dashboard, cumulative Action Tracker, and the two admin tabs are built,
> and **hira is fully ported** as the reference app. The other six apps appear as
> "coming soon" tiles until they are ported the same way.

## Architecture

```
apps/engine            The shell: single login/signup/create-org, EngineLayout,
                       tiles Dashboard, /action-tracker, /admin/sites, /admin/users,
                       and /apps/:appId/* mount point.
apps/hira              Vendored hira, converted into a mountable AppModule
                       (src/module.jsx exports { Provider, Routes, nav, actionsProvider }).
packages/shared-firebase   One Firebase init for the shared project.
packages/shared-auth       AuthContext (superset useAuth), ProtectedRoute,
                           PublicOnlyRoute, identity data layer, roles, accessModel.
packages/shared-sites      Canonical organizations/{orgId}/sites model + useSites +
                           per-app site adapters (siteAdapters/hira.js).
packages/shared-users      User/role admin service surface.
packages/shared-ui         Neutral engine UI primitives (Spinner, Modal, …).
packages/app-registry      The tile/app descriptors (single source of truth).
firebase/                  Merged firestore.rules + firebase.json (shared project).
```

### How an app is mounted
The registry (`packages/app-registry`) lists every app. Each ported app exports
an **AppModule** (`{ id, Provider, Routes, nav, actionsProvider }`). The engine
mounts it at `/apps/<id>/*`: `AppMountPoint` lazy-loads the module, gates it with
`ProtectedRoute access`, wraps it in the app's domain `Provider`, and renders its
**relative** routes. Internal links are re-prefixed to `/apps/<id>/...`.

### Shared Site & User management
Site Management (`/admin/sites`) and User & Role Management (`/admin/users`) are
engine-owned tabs. Apps consume sites through `@unified/shared-sites` adapters so
their existing references keep working (hira reads sites by name from the
canonical subcollection via `useHiraSites`).

### Cumulative Action Tracker
`/action-tracker` aggregates every accessible app's `actionsProvider(orgId,
profile, cb)` into one normalized, filterable list (hira contributes its open
risk-control actions).

## Develop

```bash
pnpm install
cp .env.example apps/engine/.env   # fill in the SHARED Firebase project keys
pnpm dev                           # single Vite server (engine)
pnpm build                         # turbo build
pnpm check:routes                  # gate: no legacy /app/ prefixes in ported apps
```

Without `apps/engine/.env`, the app renders a "Firebase isn't configured" screen.

## Remaining work (next rounds)
- Port the other six apps the same way (hecp-loto last — RBAC/permissions).
- Flesh out `shared-sites` adapters for name-based (hecp) and free-text
  (fire-marshal, incident-ira) apps.
- Merge each app's domain Firestore rules (collision-namespaced) into
  `firebase/firestore.rules`.
- One-time data migration to consolidate the 7 existing Firebase projects.
