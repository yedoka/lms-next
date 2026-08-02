# Monorepo migration — design

Date: 2026-08-02
Status: approved, in progress

## Problem

The system lives in two independent GitHub repositories plus an untracked documentation vault:

| Path | Repo | Package manager | Prisma |
|---|---|---|---|
| `lms-next/` | `yedoka/skillbase-next` | yarn | `@prisma/client` 7.6, owns `prisma/migrations/` |
| `lms-express/` | `yedoka/skillbase-express` | bun | `@prisma/client` 6.9, no migrations |
| `brain/` | not under git | — | — |

Both apps talk to the same Postgres database through two separate Prisma schemas that have
drifted. `lms-express/prisma/schema.prisma` is missing `RoleRequest`, `RequestStatus`,
`SystemSetting` and `PasswordResetToken`. The express server writes `QuizAttempt` and
`AttemptAnswer` rows when a live quiz session ends and swallows per-player errors, so a schema
mismatch fails silently.

## Goals

1. Make schema drift structurally impossible — one schema, one generated client.
2. One install, one command to start both apps.
3. One repository and one commit history, for the thesis.
4. One package manager instead of yarn + bun.

Non-goals: Turborepo, extracting shared UI or shared types packages, deployment configuration.
The project runs locally only.

## Target layout

```
diploma/                      git root
  package.json                workspaces: ["apps/*", "packages/*"]
  yarn.lock
  .env                        shared runtime config
  .env.example
  .gitignore                  node_modules, .env, brain/, generated clients
  apps/
    web/                      was lms-next        (@skillbase/web)
    realtime/                 was lms-express     (@skillbase/realtime)
  packages/
    db/                       @skillbase/db
      prisma/schema.prisma
      prisma/migrations/
      prisma/seed.ts
      prisma/seed-assets.ts
      prisma.config.ts
      index.ts
  docs/specs/
  brain/                      gitignored
  assets/
  diploma-thesis.docx
```

## Design

### Database package

`packages/db` becomes the single owner of the schema, the migration history, the seed script and
the `PrismaClient` instance.

- The schema is the current `lms-next` schema verbatim — it is a strict superset of the express
  one, and it is the only one with a migration history.
- `lms-express/prisma/schema.prisma` is deleted. It was never a source of truth.
- The `prisma-client-js` generator is kept. In a yarn workspace `@prisma/client` hoists to the
  root `node_modules`, so both apps resolve the same generated client with no build step.
- `packages/db/index.ts` exports the singleton (with the `globalThis` guard the web app needs in
  dev) and re-exports Prisma types.

Consumers:

- `apps/web/shared/db/prisma.ts` becomes a re-export of `@skillbase/db`, so the ~100 existing
  imports across `features/` do not change.
- `apps/realtime/lib/prisma.ts` is deleted; `lib/quiz-session.ts` imports `@skillbase/db`
  instead. Express touches Prisma in exactly one file, at four call sites.
- `apps/realtime` moves from `@prisma/client` 6.9 to 7.6.

### Package management

Yarn workspaces at the root. `apps/realtime` is installed by yarn but still *runs* on bun
(`bun run index.ts`) — bun stays the runtime, not the installer. `bun.lock` is deleted.

Root scripts:

```
yarn dev            concurrently: dev:web + dev:realtime
yarn dev:web        yarn workspace @skillbase/web dev
yarn dev:realtime   yarn workspace @skillbase/realtime dev
yarn build          db:generate && yarn workspace @skillbase/web build
yarn db:generate | db:migrate | db:push | db:seed | db:studio | db:reset
```

Database scripts delegate to `packages/db`, so there is one place to run migrations from.

### Environment

A single root `.env` holds everything both apps need (`DATABASE_URL`, `REDIS_URL`, and the
web-only keys). Apps load it explicitly rather than relying on per-directory `.env` discovery.
`.env.example` documents every key and is committed; `.env` is not.

### Git history

Both existing repositories stay untouched on GitHub as the rollback point. All local branches are
already pushed.

1. `git init` at `diploma/`, empty initial commit.
2. `git subtree add --prefix=apps/web <local lms-next path> feat/student-courses-page` — that
   branch is strictly ahead of `master` and is the real tip.
3. `git subtree add --prefix=apps/realtime <local lms-express path> master`.
4. Separate commits for: workspaces setup, `packages/db`, import rewiring, env consolidation,
   documentation updates.
5. Push to a new `skillbase` repository. Archive the two old repositories; do not delete them.

The old working directories are kept on disk and gitignored until verification passes.

## Verification

Migration is not complete until all of the following pass:

1. `yarn install` at the root succeeds — specifically `argon2`, a native module, builds.
2. `yarn db:generate` succeeds and both apps typecheck against the generated client.
3. `yarn workspace @skillbase/web build` succeeds (Next 16 resolving a workspace package).
4. `yarn dev` starts both apps; the realtime server connects to Redis.
5. End-to-end smoke test of a live quiz session: a teacher starts a session, a student answers,
   and a `QuizAttempt` row is written by the realtime server. This is the path the schema drift
   was breaking, so it is the test that matters most.

## Risks

- **`argon2`** is a native module and is currently installed by bun in the web app; reinstalling
  under yarn in a workspace root may need a rebuild.
- **Next 16 + workspace package** — if the plain re-export does not resolve, add
  `transpilePackages: ["@skillbase/db"]` to `next.config.ts`.
- **Prisma 7 upgrade for realtime** — the client construction already uses `@prisma/adapter-pg`
  in both apps, so the API surface in use is the same; risk is low but the smoke test covers it.
- **`git subtree add`** preserves history but old commits still show their original paths.
  Acceptable; `git log --follow` still works for current files.

## Documentation follow-up

`apps/web/CLAUDE.md` and `brain/` describe a two-repository system with a documented schema
divergence. Both must be updated in the same change that removes the divergence — in particular
`brain/02-data-model/schema-divergence.md`, which describes a problem that will no longer exist.
