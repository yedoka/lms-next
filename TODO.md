# TODO

## Thesis: replace screenshot after the fix

The reveal-timing fix has shipped, so the live-quiz-player screenshot/figure in
the thesis still shows the old immediate-feedback behavior. Retake and swap it
in `akedil-aidyn-diploma-thesis2.md`. The player now has three states worth a
figure: the neutral "Answer locked in" card while the question is open, the
verdict once the timer closes it, and the per-question review on the final
screen.

## Thesis: monospace pass for code/paths

Wrap every code identifier, function call, filename, and path in monospace
(backticks) throughout the thesis - both what's already written and
everything written from here on. Examples already fixed as models:
`proxy.ts`, `auth()`, `requireAuth()`, `validateCourseOwnership()`,
`features/auth/utils/with-role.ts`. Do a full pass over the existing text
(e.g. `shared/lib/publish-notification.ts` currently unformatted) rather than
relying on catching it going forward.

## Live quiz: changing the timer discards the lobby

`live-quiz-host.tsx:145-167` has `secondsPerQuestion` in the `useEffect` deps
that creates the session, so picking a different duration mints a **new session
with a new code**. Any student already in the lobby is stranded on the old one.
Either create the session once and send the duration with `session:start`, or
lock the selector after the first student joins.

## Live quiz: reloading drops the student out of the session

`LiveQuizPlayer` keeps `joined` in React state and the code is not in the URL,
so a refresh sends the student back to the code-entry screen mid-quiz. The
server side already handles rejoining correctly; only the client forgets. Put
the code in the URL (`/live/[code]`) or persist it in `sessionStorage`.
