# Admin Dashboard — Feature Ideas & Implementation Plans

> ✅ **All 8 features have been implemented.** This file is kept as a record of
> what was built and where. Each entry lists the files touched.

## Implemented features

### 1. Announcement Broadcast
Admin sends a notification to all users or a role-filtered subset; reuses the
existing `publishNotification()` → Redis → socket flow.
- `features/admin/schemas/schema.ts` — `broadcastSchema`
- `features/admin/actions/admin-actions.ts` — `broadcastAnnouncement()` (chunked publish)
- `features/admin/components/BroadcastDialog.tsx`
- Mounted on `app/(protected)/dashboard/admin/settings/page.tsx`

### 2. Platform Analytics Charts
Signup & enrollment trends (30-day line charts) + quiz pass-rate gauge.
- Added dependency `@mui/x-charts`
- `features/admin/services/admin-service.ts` — `getSignupsOverTime`, `getEnrollmentsOverTime`, `getQuizPassRate` (raw SQL `date_trunc`)
- `features/admin/components/AnalyticsCharts.tsx` (fills date gaps for continuous axes)
- Mounted on `app/(protected)/dashboard/admin/page.tsx`

### 3. Real-time Activity Feed
Admins watch live signup / enrollment / quiz-completion events stream in.
- `shared/lib/publish-admin-event.ts` — publishes to Redis `admin:activity`
- Emitted from `features/auth/actions/server-actions.ts` (signup), `features/courses/actions/server-actions.ts` (enrollment), `features/courses/actions/quiz-actions.ts` (quiz completed)
- **skillbase-express**: `lib/admin-activity.ts` subscriber + `index.ts` (admin room join, `verifySocketToken` now returns `{ userId, role }`)
- `features/admin/hooks/use-admin-feed.ts` + `features/admin/components/ActivityFeed.tsx`
- Mounted on the admin overview page

### 4. Bulk User Actions
Select many users → set role or delete in one shot (self excluded server-side).
- `features/admin/schemas/schema.ts` — `bulkUserActionSchema`
- `features/admin/actions/admin-actions.ts` — `bulkUserAction()`
- `features/admin/components/UserTable.tsx` — checkbox selection + bulk toolbar
- `app/(protected)/dashboard/admin/users/page.tsx` passes `currentUserId`

### 5. Teacher Approval Workflow
Students request the TEACHER role; admins approve/reject from a queue.
- **Schema**: `RoleRequest` model + `RequestStatus` enum (synced via `db:push` — see note below)
- `features/admin/services/role-request-service.ts`
- `features/admin/actions/role-request-actions.ts` — `requestRole()` (student) + `reviewRoleRequest()` (admin, transactional + notifies requester)
- `features/admin/components/RoleRequestTable.tsx` + `app/(protected)/dashboard/admin/requests/page.tsx`
- Student entry point: `features/settings/components/request-role-card.tsx` as a new "Access" tab in settings
- Nav + route added in `shared/lib/navigation.ts` and `features/auth/utils/routes.ts` (RBAC auto-covered by the `DASHBOARD_ADMIN` prefix rule)

### 6. Course Publish/Unpublish Override
The toggle already existed in `CourseOversightTable`; added a teacher
notification when an admin flips course visibility.
- `features/admin/actions/admin-actions.ts` — `toggleCoursePublished()` now calls `publishNotification()`

### 7. CSV Export (Users / Enrollments)
Admin downloads spreadsheets; CSV-injection-safe (mirrors the gradebook export).
- `features/admin/services/admin-service.ts` — `getUsersForExport`, `getEnrollmentsForExport`
- `app/api/admin/export/route.ts` (admin-only via `auth()`, returns a `Response`)
- Export buttons on the users page

### 8. Active Users Panel (Presence)
Live count of connected users, grouped by role.
- **skillbase-express** `index.ts`: on connect `SET presence:<userId> <role> EX 60`, refreshed every 30 s, cleared on last-socket disconnect (TTL guards against ghosts)
- `app/api/admin/presence/route.ts` — admin-only, uses `SCAN` (not `KEYS`)
- `features/admin/components/PresencePanel.tsx` (polls every 30 s)
- Mounted on the admin overview page

---

## ⚠️ Notes / follow-ups

- **Migration drift (Feature 5):** `yarn db:migrate` could not run — the Neon DB
  had prior `db:push` changes not in migration history (`Attachment.size`,
  `QuizAttempt.passed`, `QuizOverride` FKs, `SystemSetting`), so Prisma demanded a
  destructive reset. To avoid data loss the `RoleRequest` table was added with
  **`yarn db:push`** (additive, non-destructive) instead. The migration history is
  still out of sync with the DB — a proper `migrate reset` on a disposable
  environment is needed before the next real migration.
- **Pre-existing type error (not introduced here):**
  `features/admin/actions/admin-actions.ts:185` — `revalidateTag(SYSTEM_SETTINGS_TAG)`
  reports "Expected 2 arguments, but got 1" under Next.js 16. This is in the
  untouched `saveSystemSettings` and predates this work; left as-is.
- **Manual verification still recommended** for the real-time features (3 & 8):
  start both `skillbase-next` (`yarn dev`) and `skillbase-express` (`bun run index.ts`), open
  the admin dashboard, and trigger a signup/enrollment in another session to
  confirm events and presence update live.
