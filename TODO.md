# TODO

## Thesis: replace screenshot after the fix

The reveal-timing fix has shipped, so the live-quiz-player screenshot/figure in
the thesis still shows the old immediate-feedback behavior. Retake and swap it
in `akedil-aidyn-diploma-thesis2.md`. The player now shows a neutral "Answer
locked in" card during the quiz and a full per-question review on the final
screen, so the figure may want to be both states rather than one.

## Thesis: monospace pass for code/paths

Wrap every code identifier, function call, filename, and path in monospace
(backticks) throughout the thesis - both what's already written and
everything written from here on. Examples already fixed as models:
`proxy.ts`, `auth()`, `requireAuth()`, `validateCourseOwnership()`,
`features/auth/utils/with-role.ts`. Do a full pass over the existing text
(e.g. `shared/lib/publish-notification.ts` currently unformatted) rather than
relying on catching it going forward.
