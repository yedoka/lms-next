# LMS Project — Tech Stack & Architecture

> Bachelor's Diploma: _"Development of a Full-Stack Learning Management System using Next.js and modern web technologies"_

---

## Features

- User authentication with role-based access (student / teacher / admin)
- Course management with video/file uploads
- Quizzes & grading
- Live notifications (new grade, enrollment)
- Live quiz / classroom sessions
- Real-time progress tracking

---

## Repository Structure

Two separate repositories — no monorepo overhead:

| Repo          | Contents                             | Deployed to |
| ------------- | ------------------------------------ | ----------- |
| `skillbase-next`    | Next.js 16 app (frontend + CRUD API) | Vercel      |
| `skillbase-express` | Bun + Express + Socket.io server     | Render.com  |

> **Shared TypeScript types** (User, Course, Quiz, etc.) are duplicated across both repos for simplicity. For a diploma project this is the pragmatic choice — avoids monorepo complexity with no real downside at this scale.

---

## Tech Stack

### Frontend + Non-Realtime Backend (`lms-web`)

| Layer     | Technology                       | Notes                                               |
| --------- | -------------------------------- | --------------------------------------------------- |
| Framework | **Next.js 16.2** (App Router)    | SSR, RSC, Server Actions, file-based routing        |
| Language  | **TypeScript**                   | Strict mode, end-to-end type safety                 |
| Styling   | **Tailwind CSS** + **shadcn/ui** | Fast, professional UI                               |
| Auth      | **NextAuth.js (Auth.js v5)**     | Roles, sessions, OAuth — native Next.js integration |

### Next.js 16 Key Changes to Know

| Feature                      | What changed                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Turbopack**                | Stable and on by default — ~400% faster `next dev` startup                                                        |
| **React Compiler**           | Stable — auto-memoization, no more manual `useMemo`/`React.memo`                                                  |
| **Caching**                  | Opt-in via `"use cache"` directive — dynamic by default (no surprise caching)                                     |
| **`cacheLife` / `cacheTag`** | No longer need `unstable_` prefix — both are stable APIs                                                          |
| **View Transitions**         | Built-in via `<Link transitionTypes={['slide']}>` — App Router only                                               |
| **PPR**                      | Partial Prerendering now complete — static shell + streamed dynamic content                                       |
| **`refresh()`**              | New server-side `refresh()` from `next/cache` for refreshing client router from Server Actions                    |
| **`create-next-app`**        | Redesigned — App Router, TypeScript, Tailwind, ESLint by default. Also generates `AGENTS.md` for AI coding agents |

### Realtime Backend (`lms-realtime`)

| Layer   | Technology              | Notes                                                          |
| ------- | ----------------------- | -------------------------------------------------------------- |
| Runtime | **Bun**                 | Faster startup than Node, built-in TypeScript, built-in `.env` |
| Server  | **Express + Socket.io** | Persistent WebSocket server; rooms, events, reconnection       |
| Pub/Sub | **Redis** (via Upstash) | Bridge between Next.js API routes and Socket.io server         |

> **Why Bun over Node?** Built-in TypeScript (no `ts-node`), built-in `.env` (no `dotenv`), significantly faster cold starts on Render.com free tier, and Socket.io is fully compatible.

### Database & Storage

| Layer         | Technology                | Notes                                                |
| ------------- | ------------------------- | ---------------------------------------------------- |
| Database      | **PostgreSQL** (via Neon) | Relational data: users, courses, enrollments, grades |
| ORM           | **Prisma**                | Type-safe queries, migrations                        |
| Media storage | **Cloudinary**            | Video/file uploads, transcoding, streaming           |

---

## Architecture Overview

```
┌──────────────────────────────┐      ┌───────────────────────────────┐
│           Vercel             │      │          Render.com           │
│                              │      │                               │
│  ┌──────────────────────┐    │      │  ┌─────────────────────────┐  │
│  │   Next.js 16 App     │    │      │  │  Bun + Express +        │  │
│  │                      │    │      │  │  Socket.io              │  │
│  │  - UI / pages        │◄───┼──WS──┼─►│                         │  │
│  │  - Auth (NextAuth)   │    │      │  │  - Quiz rooms           │  │
│  │  - CRUD API routes   │    │      │  │  - Notifications        │  │
│  │  - Server Actions    │    │      │  │  - Progress events      │  │
│  └─────────┬────────────┘    │      │  └──────────┬──────────────┘  │
└────────────┼─────────────────┘      └─────────────┼─────────────────┘
             │                                       │
             │          ┌─────────────────┐          │
             └─────────►│   PostgreSQL    │◄─────────┘
                        │   (Neon)        │
                        └─────────────────┘
                                ▲
                       ┌────────┴────────┐
                       │  Redis Pub/Sub  │
                       │   (Upstash)     │
                       └─────────────────┘
```

### Live Quiz Flow

1. Teacher starts quiz → Next.js Server Action creates a session in PostgreSQL
2. Next.js publishes a `quiz:start` event to **Redis**
3. Socket.io server picks it up, opens a **room** for that quiz
4. Students connect via WebSocket to Socket.io and join the room
5. Answers, scores, and progress fire as real-time Socket.io events
6. Final grades saved back to PostgreSQL by the Socket.io server

---

## Project Structure

### `skillbase-next` (Next.js 16)

```
lms-web/
├── app/
│   ├── api/              # Route Handlers (auth, courses, uploads)
│   ├── (auth)/           # login, register pages
│   ├── dashboard/        # student & teacher dashboards
│   └── courses/
│       └── [courseId]/   # course detail, lessons, quizzes
├── components/           # shadcn/ui + custom components
├── lib/                  # auth config, db client, utils
├── prisma/               # schema + migrations
├── AGENTS.md             # AI agent instructions (auto-generated by create-next-app)
└── next.config.ts
```

### `skillbase-express` (Bun + Express + Socket.io)

```
lms-realtime/
├── src/
│   ├── rooms/            # quiz room logic
│   ├── notifications/    # grade & enrollment events
│   ├── progress/         # real-time lesson progress
│   └── index.ts          # server entry point (bun src/index.ts)
├── .env
└── package.json
```

---

## Deployment (All Free)

| Service        | Hosts                  | Free Tier                                  |
| -------------- | ---------------------- | ------------------------------------------ |
| **Vercel**     | Next.js 16 app         | Generous hobby plan, no time limit         |
| **Render.com** | Bun + Socket.io server | Free tier — sleeps after 15 min inactivity |
| **Neon**       | PostgreSQL             | 0.5 GB storage                             |
| **Upstash**    | Redis                  | 10,000 commands/day                        |
| **Cloudinary** | Video & file storage   | 25 GB storage                              |

> ⚠️ **Render.com free tier sleeps after 15 minutes of inactivity.** For the diploma demo this is acceptable — first connection wakes it up in ~30 seconds. If needed, add a cron ping via [cron-job.org](https://cron-job.org) to keep it alive.

---

## Key Architectural Decisions (for diploma defense)

| Decision                               | Choice                    | Rationale                                                                                    |
| -------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Why Next.js 16?                        | Next.js 16.2              | Latest stable — Turbopack default, opt-in caching, React Compiler stable, View Transitions   |
| Why two repos over monorepo?           | Two repos                 | Simpler setup, independent deploys, no Turborepo overhead for a 1-month project              |
| Why Bun for the realtime server?       | Bun 1.x                   | Built-in TypeScript + `.env`, faster cold starts on Render free tier, Socket.io compatible   |
| Why a separate realtime server at all? | Bun + Socket.io on Render | Vercel is serverless — WebSockets require persistent connections, fundamentally incompatible |
| Why Redis as a bridge?                 | Upstash Redis Pub/Sub     | Next.js API and Socket.io are separate processes; Redis decouples them cleanly               |
| Why PostgreSQL over MongoDB?           | PostgreSQL via Neon       | Relational integrity is essential for enrollments, grades, and course hierarchies            |
| Why Prisma?                            | Prisma ORM                | Type-safe queries, great DX, schema migrations, Neon compatible                              |
| Why Cloudinary?                        | Cloudinary                | Built-in video transcoding and streaming, generous free tier                                 |
| Why Render over Railway?               | Render.com                | Fully free tier (Railway requires $5/mo credit)                                              |
