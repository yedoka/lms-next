# Skillbase

A learning management system: course authoring, lessons with attachments,
quizzes with auto-grading, a gradebook with teacher overrides, and live
instructor-run quiz sessions over WebSockets.

## Layout

```
apps/
  web/         Next.js 16 — all UI and all mutations
  realtime/    Bun + Express + Socket.IO — live sessions, presence, notifications
packages/
  db/          Prisma schema, migrations, seed, shared PrismaClient
docs/specs/    design documents
```

Both apps talk to one PostgreSQL database and one Redis instance. The web app is
not fully functional without the realtime server: live quiz sessions and push
notifications go through it.

## Requirements

- Node 20+
- Yarn 1.x — the only package manager here
- Bun 1.x — the runtime for `apps/realtime`
- PostgreSQL and Redis (the project is developed against Neon and Upstash)

## Getting started

```bash
cp .env.example .env    # then fill it in
yarn                    # installs everything, generates the Prisma client
yarn db:setup           # migrate + generate + seed
yarn dev                # starts both apps
```

The web app comes up on `http://localhost:3000`, the socket server on `:8080`.

## Commands

| Command | What it does |
| --- | --- |
| `yarn dev` | both apps, concurrently |
| `yarn dev:web` / `yarn dev:realtime` | one app |
| `yarn build` | regenerate the Prisma client, then build the web app |
| `yarn lint` / `yarn typecheck` | eslint / `tsc --noEmit` across workspaces |
| `yarn db:migrate` | create and apply a migration |
| `yarn db:seed` | seed a realistic demo dataset |
| `yarn db:studio` | Prisma Studio |
| `yarn db:reset` | drop, re-migrate, re-seed |

## Environment

One `.env` at the repo root serves every package — see `.env.example` for the
full list and what each variable is for. There is no per-package `.env` on
purpose: both apps must agree on `DATABASE_URL`, `REDIS_URL` and `AUTH_SECRET`,
and two files meant two chances to point them somewhere different.

## History

`apps/web` and `apps/realtime` were two separate GitHub repositories
(`skillbase-next` and `skillbase-express`) until 2026-08-02. Both histories are
preserved in this repository's log. The merge is described in
`docs/specs/2026-08-02-monorepo-design.md`; the problem that motivated it is in
`brain/02-data-model/schema-divergence.md`.
