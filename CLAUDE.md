# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

Skillbase, an LMS. One yarn workspace, two deployable apps and one shared package:

| Package | Runtime | Responsibility |
| --- | --- | --- |
| `apps/web` | Next.js 16 on Node | All UI and all mutations (server actions), NextAuth v5, edge middleware, route handlers |
| `apps/realtime` | Bun + Express 5 + Socket.IO 4 | The persistent WebSocket: handshake auth, presence, the live-quiz state machine, two Redis subscribers, and one batch grader that writes to Postgres |
| `packages/db` | — | `schema.prisma`, migrations, seed, and the one `PrismaClient` both apps import as `@skillbase/db` |

Both apps must run together — the web app is not fully functional without the
socket server.

## Commands

Everything runs from the repo root. **Yarn is the only package manager**; bun is
the runtime for `apps/realtime`, not an installer. Never run `bun install` or
`npm install` here — it will fight the root `yarn.lock`.

```bash
yarn                 # install everything (postinstall runs db:generate)
yarn dev             # both apps, concurrently
yarn dev:web         # Next.js only
yarn dev:realtime    # socket server only
yarn build           # db:generate + next build
yarn lint            # eslint (web)
yarn typecheck       # tsc --noEmit in every workspace

yarn db:migrate      # create + apply a migration (dev)
yarn db:generate     # regenerate the Prisma client
yarn db:seed         # packages/db/prisma/seed.ts
yarn db:studio
yarn db:setup        # migrate + generate + seed
yarn db:reset
```

## The rules that matter here

**One schema.** `packages/db/prisma/schema.prisma` is the only schema and
`packages/db/prisma/migrations/` the only migration history. Do not add a
`PrismaClient` anywhere else. `apps/web/shared/db/prisma.ts` is a re-export kept
so its ~35 importers stay untouched; `apps/realtime` imports `@skillbase/db`
directly. This exists because the two apps were previously separate repos with
two schemas that drifted, and the realtime grader failed silently as a result —
see `brain/02-data-model/schema-divergence.md`.

**One `.env`, at the root.** There is deliberately no `.env` inside any package.
`apps/web` loads it with `dotenv-cli` (`-e ../../.env`), `apps/realtime` with
`bun --env-file=../../.env`, and the Prisma CLI through
`packages/db/prisma.config.ts`. `DATABASE_URL`, `REDIS_URL` and `AUTH_SECRET`
must be identical for both apps, which is exactly why there is one file.

**`packages/db` ships TypeScript source**, not a build artifact. `apps/web`
consumes it via `transpilePackages: ["@skillbase/db"]` in `next.config.ts`; bun
reads TS natively. There is no build step for the package and there should not
need to be one.

## Knowledge base

`brain/` is an 82-note vault documenting every feature, model, route and flow,
with `file:line` citations throughout. It is **gitignored** — it lives on disk
only. Start at `brain/00-map-of-content.md`.

- `brain/03-features/authorization-rbac.md` — the real role/capability matrix per enforcement layer
- `brain/05-flows/` — six cross-cutting sequence diagrams
- `brain/99-open-questions.md` — catalogued gaps and defects; §1 indexes the fixed ones

When you change behavior the vault describes, update the corresponding note in
the same change.

App-specific architecture, the RBAC layer map and the server-action pattern are
in `apps/web/CLAUDE.md`. Read it before touching `apps/web`.
