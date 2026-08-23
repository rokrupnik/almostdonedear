---
task: T-26-010
title: Responses, the publication email and the share link
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
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

## Done when

```bash
pnpm run test:unit -- --run
pnpm run test:e2e     # publish -> second user responds -> caller sees the tally
```

- Publishing sends exactly one email per eligible member, and none to a member
  who muted the group or switched email off.
- Re-publishing, or editing a published action, sends no second publication
  email.
- The share text contains the action title, the start in Slovenian format, the
  location and an absolute link on `PUBLIC_ORIGIN`.
