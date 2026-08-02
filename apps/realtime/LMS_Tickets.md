# LMS Project — Real-Time Feature Tickets

> **Repo:** `lms-realtime` — Bun, Express, Socket.io, Redis &nbsp;•&nbsp; **Sprint 4 · Days 23–27**

---

## Sprint 4 — Real-Time Features

> 🎯 **Goal:** Socket.io server live on Render. Notifications, live quiz sessions, and progress events working.

---

### LMS-014 · Deploy `lms-realtime` to Render.com

`[Setup]` &nbsp;|&nbsp; Priority: **High** &nbsp;|&nbsp; Estimate: **3h**

#### 📖 User Story

> As a developer, I want the Bun + Socket.io server running on Render.com and reachable from the Vercel app, so real-time features work in production.

#### ✅ Acceptance Criteria

1. `lms-realtime` deployed to Render.com as a Web Service.
2. Render uses Bun as the runtime (`bun src/index.ts` as start command).
3. All environment variables set in Render dashboard: `PORT`, `CLIENT_URL`, `REDIS_URL`, `DATABASE_URL`.
4. `CLIENT_URL` set to the Vercel production domain; CORS works correctly.
5. Health check `GET /health` returns `200 OK` from the public Render URL.
6. `NEXT_PUBLIC_SOCKET_URL` env var set in Vercel pointing to the Render service URL.
7. A test WebSocket connection from the deployed Next.js app succeeds.
8. cron-job.org configured to ping `/health` every 10 minutes to prevent Render free tier sleep.

#### 🔧 Technical Notes

- Render free tier sleeps after 15 min inactivity — the cron ping keeps it awake for the demo.
- GitHub Actions workflow in `lms-realtime` deploys to Render on push to `main` via Render Deploy Hook.

---

### LMS-015 · Live Notifications System

`[Feature]` &nbsp;|&nbsp; Priority: **High** &nbsp;|&nbsp; Estimate: **5h**

#### 📖 User Story

> As a student, I want to receive instant notifications when I receive a grade or when a teacher publishes a new lesson, so I'm always up to date without refreshing the page.

#### ✅ Acceptance Criteria

1. Notification bell icon in the top nav shows an unread count badge.
2. Clicking the bell opens a dropdown list of recent notifications.
3. Notification types: new grade received, new lesson published, enrollment confirmed.
4. Notifications arrive in real-time without a page refresh.
5. Notifications are persisted in the DB and survive page refreshes.
6. Marking all as read clears the badge.

#### 🔧 Technical Notes

- Flow: Next.js Server Action saves grade → publishes `notification:new` to Upstash Redis → Socket.io server picks up → emits to `user:{userId}` room.
- Each user joins a personal room on connect: `socket.join(\`user:${userId}\`)`.
- Identity verified on handshake using the NextAuth JWT passed as a socket `auth` token.
- `Notification` model in Prisma: `(userId, type, message, readAt, createdAt)`.
- `useNotifications` custom hook manages state + Socket.io listener on the client.

---

### LMS-016 · Live Quiz Session (Teacher Hosts)

`[Feature]` &nbsp;|&nbsp; Priority: **High** &nbsp;|&nbsp; Estimate: **8h**

#### 📖 User Story

> As a teacher, I want to host a live quiz session where all students answer simultaneously and I can see results update in real-time, like a Kahoot-style experience.

#### ✅ Acceptance Criteria

1. Teacher can start a "Live Session" for any published quiz.
2. A shareable 6-character session code is generated (e.g., `ABC123`).
3. Students enter the code to join the session lobby and see a waiting screen.
4. Teacher controls question pace — "Next Question" advances all participants simultaneously.
5. Students see a countdown timer per question (configurable per quiz).
6. Teacher's screen shows a live leaderboard updating after each answer.
7. Session ends when teacher clicks "Finish"; final scores are saved to `QuizAttempt` in DB.
8. Disconnected students can rejoin using the same session code.

#### 🔧 Technical Notes

- Socket.io rooms: `session:{sessionCode}` for students, `teacher:{sessionCode}` for the host.
- Full session state (current question index, scores per student) stored in a Redis hash — survives server restarts.
- Events: `session:join`, `session:start`, `question:next`, `answer:submit`, `leaderboard:update`, `session:end`.
- Final scores written to `QuizAttempt` by `lms-realtime` directly using Prisma Client on `session:end`.
- Session code expiry: set a Redis TTL of 24 hours on the session hash.

---

### LMS-017 · Real-Time Progress Tracking

`[Feature]` &nbsp;|&nbsp; Priority: **Medium** &nbsp;|&nbsp; Estimate: **4h**

#### 📖 User Story

> As a teacher, I want to see student progress update in real-time on my course dashboard, so I can identify students who are falling behind.

#### ✅ Acceptance Criteria

1. Teacher's course dashboard shows all enrolled students with progress bars.
2. Progress bars update without a page refresh when a student completes a lesson.
3. Student count and average progress % shown as live stats.
4. Teacher can click a student row to see their full lesson-by-lesson breakdown.

#### 🔧 Technical Notes

- When a lesson is marked complete: Next.js Server Action publishes `progress:update` to Redis.
- Socket.io server picks it up and emits to `teacher:{courseId}` room.
- Teacher page subscribes in `useEffect` with a Socket.io client listener.
- Teacher joins `teacher:{courseId}` room on connect (role verified server-side).

---

## Ticket Summary

| ID      | Title                               | Sprint | Type    | Priority | Est. |
| ------- | ----------------------------------- | ------ | ------- | -------- | ---- |
| LMS-014 | Deploy `lms-realtime` to Render.com | 4      | Setup   | High     | 3h   |
| LMS-015 | Live Notifications System           | 4      | Feature | High     | 5h   |
| LMS-016 | Live Quiz Session (Teacher Hosts)   | 4      | Feature | High     | 8h   |
| LMS-017 | Real-Time Progress Tracking         | 4      | Feature | Medium   | 4h   |

**Total estimated development time: ~20 hours**
