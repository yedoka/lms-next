# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two Repos, One System

This LMS is split across two repositories that must be run together:

- **`skillbase-next/`** — Next.js 16 frontend + API (this repo)
- **`skillbase-express/`** — Node.js/Bun Socket.IO server (`../skillbase-express`)

The express server handles real-time: Socket.IO for live quiz sessions and a Redis pub/sub bridge for push notifications. The Next.js app connects to it via `NEXT_PUBLIC_SOCKET_URL`.

> **The two repos share one Postgres database through two separate, drifting Prisma setups.** `skillbase-next` is on `@prisma/client` 7.6, `skillbase-express` on 6.9, and `skillbase-express/prisma/schema.prisma` is missing `RoleRequest`, `SystemSetting` and `PasswordResetToken`. Express **writes** `QuizAttempt` and `AttemptAnswer` rows when a live session ends. Any migration touching those tables must be applied to both schemas, or the live-quiz grader fails — and it swallows per-player errors, so the failure is silent. See `brain/02-data-model/schema-divergence.md`.

## Commands

### skillbase-next (this repo) — uses Yarn

```bash
yarn dev          # start dev server
yarn build        # db:generate + next build
yarn lint         # eslint
```

### Database (Prisma)

```bash
yarn db:migrate   # create + apply migration (dev)
yarn db:generate  # regenerate Prisma client after schema changes
yarn db:push      # push schema without migration (prototyping)
yarn db:studio    # open Prisma Studio
yarn db:seed      # run prisma/seed.ts
yarn db:setup     # migrate + generate + seed
yarn db:reset     # reset and re-migrate
```

### skillbase-express — uses Bun

```bash
bun run index.ts  # start socket server
```

## Architecture

**Stack:** Next.js 16 (React 19, App Router, React Compiler), TypeScript, Prisma v7 + PostgreSQL (Neon), NextAuth v5, Zod v4, **MUI v6** (replaced Tailwind+shadcn), Tiptap, @dnd-kit, Cloudinary, Socket.IO client, ioredis.

> **UI library is MUI v6** — all components use `@mui/material`. Tailwind and shadcn/ui are no longer in use. Theme is defined in `shared/lib/mui-theme.ts` (light + dark color schemes via CSS variables). Use `sx` prop or MUI `styled` for styling.

### Feature-sliced structure

```
features/
  auth/
    actions/        server + client actions (login, signup, logout)
    components/     LoginForm, SignupForm, ProfileDropdown, SessionProvider
    schemas/        Zod schemas
    utils/          rbac.ts, route-guards.ts, with-role.ts, routes.ts, roles.ts
  courses/
    actions/        server-actions, lesson-actions, quiz-actions, gradebook-actions,
                    progress-actions, live-session-actions
    services/       service, lesson-service, quiz-service, gradebook-service,
                    progress-service, live-session-service
    schemas/        schema, lesson, quiz
    components/     all course/lesson/quiz UI components
    hooks/          use-live-session.ts
    utils/          auth.ts (ownership checks)
  notifications/
    actions/        notification-actions
    services/       notification-service
    components/     NotificationBell
    hooks/          use-notifications.ts
  settings/
    actions/        server-actions
    services/       service
    schemas/        schema
    components/     settings tabs + forms
shared/
  db/prisma.ts      singleton Prisma client
  lib/              socket.ts, redis.ts, publish-notification.ts, mui-theme.ts, utils.ts
  components/       AppNavigation, file/image/video upload, shared UI primitives
app/                routing only — pages delegate all logic to features/
```

### RBAC — actual coverage

Roles: `STUDENT` | `TEACHER` | `ADMIN`. Admin can access all dashboards. Routes are defined in `features/auth/utils/routes.ts`.

There are three guard layers, but **they do not all cover the same surface**. Know which one actually applies before relying on it:

1. **Edge middleware** — the file is **`proxy.ts` at the repo root**, not `middleware.ts`; helpers live in `features/auth/utils/route-guards.ts`.
   - Matcher (`proxy.ts:29`) excludes `api`, so **no route handler under `app/api/**` is covered**.
   - It redirects unauthenticated users only for `PROTECTED_ROUTES = ["/", "/settings"]` plus the `/dashboard` prefix (`routes.ts:31-32`).
   - It checks roles only for `/dashboard/{student,teacher,admin}` (`rbac.ts:15-17`).
   - Therefore `/courses/**`, `/live` and `/socket-test` get **no edge guard at all**, despite `/live` and `/socket-test` living inside `(protected)`.

2. **Protected layout** (`app/(protected)/layout.tsx:16-26`) — re-checks `auth()`, redirects anonymous users, and enforces maintenance mode. It performs **no role check**. Being inside `(protected)` means authenticated, not authorized.

3. **Server action / Server Component** — the only layer that covers mutations.
   - `withRole([...])` is currently used **only in the 11 dashboard page components**, never in an action or a route handler.
   - Actions guard with `requireAuth()` from `features/auth/utils/with-role.ts`; admin actions add an inline `role !==` check that throws `Error("Forbidden")`.
   - Ownership is validated via `validateCourseOwnership()` in `features/courses/utils/auth.ts`.

**Rule when writing new code:** a server action or route handler must carry its own complete guard — auth, role, *and* ownership of the exact entity it mutates. Never assume an outer layer already checked. Ownership must be validated against the id being mutated, not against a parent id supplied by the same client request.

> Known gaps are catalogued with `file:line` in `brain/03-features/authorization-rbac.md` and `brain/99-open-questions.md`.

### Server actions pattern

All mutations live in `features/*/actions/*.ts` with `"use server"` at the top. Pattern:
1. `requireAuth()` / `withRole()` — throws redirect if unauthenticated/unauthorized
2. Ownership check on the entity actually being mutated (`validateCourseOwnership()` or an equivalent scoped query)
3. `schema.safeParse(data)` — Zod validation, on update paths as well as create paths
4. Prisma call
5. `revalidatePath(...)` / `revalidateTag(...)` if cache must be busted
6. `redirect(...)` or `return { success: true }`

> **`"use server"` exports are public HTTP endpoints.** Anyone with a session can invoke one directly with arbitrary arguments. The calling component's guard is not a guard.

> **Caution on step 5:** the only cache tag declared anywhere in the app is `SYSTEM_SETTINGS_TAG` (`features/admin/services/settings-service.ts:31`). The four `revalidateTag("courses")` calls in `features/courses/actions/` therefore invalidate nothing — no `unstable_cache` declares that tag. Use `revalidatePath` unless you are also declaring the tag on the read side.

### Real-time (Socket.IO + Redis)

- **Notifications**: Next.js writes a notification to Postgres via `publishNotification()` in `shared/lib/publish-notification.ts`, which also publishes to the `notification:new` Redis channel. The express server subscribes and forwards to the connected user's socket room (`user:<userId>`).
- **Live quiz**: Teacher creates a session via `createLiveSession()` (stored in Redis with a 6-char code). Both teacher and students connect via the shared `socket` singleton (`shared/lib/socket.ts`). The `useLiveSession()` hook (`features/courses/hooks/use-live-session.ts`) manages all socket event bindings for both roles. Socket auth uses a short-lived JWT fetched from `/api/auth/socket-token`.

### Data model summary

`User` → `Course` (teacher), `Enrollment`, `QuizAttempt`, `LessonProgress`, `Notification`  
`Course` → `Lesson` → `Attachment`, `Quiz` → `Question` → `Answer`  
`QuizAttempt` → `AttemptAnswer`, `QuizOverride` (teacher score override with reason)

For detailed architecture, data flows, and navigation guides, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

## Knowledge base

`../brain/` is an 82-note vault documenting every feature, model, route and flow in both repos, with `file:line` citations throughout. Start at `brain/00-map-of-content.md`. Useful entry points:

- `brain/03-features/authorization-rbac.md` — the real role/capability matrix per enforcement layer
- `brain/05-flows/` — six cross-cutting sequence diagrams (signup→first lesson, authoring, quiz attempt, live session, realtime transport, role request)
- `brain/99-open-questions.md` — 98 catalogued gaps and defects, grouped by theme, with 8 cross-slice defect patterns; §1 indexes the ones already fixed

When you change behavior the vault describes, update the corresponding note in the same commit.
