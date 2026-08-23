---
task: T-26-010
title: Responses, the publication email and the share link
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-24
source: docs/roadmap.md phase 1.6, FR-15, FR-30, FR-34
---

# Responses, the publication email and the share link

The point at which the app replaces the WhatsApp headcount thread — which is the
whole MVP thesis (requirements §7).

- Three responses for the whole action: `pridem` / `ne morem` / `mogoče`
  (FR-15). No partial attendance, no waiting list. The problem in a moba is too
  few people, not too many.
- The action detail shows who answered what, grouped, with the count against the
  minimum and maximum if they are set.
- **One email on publication** (FR-30), to the group's active members, honouring
  the per-user email switch and the per-group mute (FR-33). Sent through the thin
  Resend interface from T-26-007 — one place that knows about the provider, so
  swapping it later is one file.
- Share action producing ready-made Slovenian text plus a link, through the Web
  Share API with a copy-to-clipboard fallback (FR-34). This is how the link gets
  into WhatsApp, and WhatsApp is where the conversation stays (ADR-012).

Reminders, changes and cancellations are phase 2, deliberately: this task is
"can a real group use it once", not "is it complete".

## What shipped

- `src/lib/server/rsvp.ts` — three answers for the whole action, one row per
  person per action, changing your mind replaces the answer. `tally()` and
  `headcountState()` are pure and unit tested; the latter counts only `yes`,
  because a maybe is not a person on the day.
- `src/lib/server/notify.ts` — publication mail. **The row is inserted before
  the email is sent**, and `notification` carries a unique index on
  (user, type, subject, channel), so a retry or a second call cannot produce a
  second email: the database refuses rather than the code remembering to. A
  failed send records the error rather than vanishing.
- `ShareAction.svelte` — Web Share where it exists, clipboard where it does not.
  The app is the source of truth; WhatsApp is where the link goes (ADR-012).

**One thing was deliberately not done.** FR-33 mentions a per-group mute, and
there is no column for it: notification preferences are phase 2 work, and adding
a field with no interface to set it would be a guess about a screen nobody has
designed. The per-user email switch (`user.notify_email`) is honoured today.

## Verified

```
pnpm run lint     ok
pnpm run check    0 errors
pnpm run test:unit -- --run   25 passed
pnpm run test:e2e             10 passed
```

The e2e path is: call an action, publish it, a second member joins and answers,
changes their mind, and the caller sees the tally. Against the local D1 after a
run, `notification` holds exactly one `action_published` row with `sent_at` set —
one recipient, one email — and inserting that row a second time by hand fails
with `UNIQUE constraint failed: notification.user_id, notification.type,
notification.subject_id, notification.channel`. That constraint is the guarantee,
not the code path.
