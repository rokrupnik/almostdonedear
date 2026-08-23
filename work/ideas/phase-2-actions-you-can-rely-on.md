---
title: Phase 2 — actions people can actually rely on
owner: ROK
---

# Phase 2 — actions people can actually rely on

~5 dev-days, `docs/roadmap.md`. Becomes tasks once phase 1 is on production.

- Cancellation with a reason, and notification on a change of time or location
  (FR-18) — the single feature that separates a trusted app from one people
  double-check on WhatsApp.
- Minimum participants with a decision deadline on a Cron Trigger, and a
  one-click cancel for the caller (FR-16).
- Maximum participants locking "yes", with the caller notified (FR-17).
- Duplicate action (FR-19).
- Attendance ticks (FR-20) — one optional checkbox per person, nothing more.
- Notification preferences: email on/off, push on/off, mute per group (FR-33).

Needs Workers Paid for Queues, and a wrapper entry that re-exports the adapter's
fetch handler alongside `scheduled()` and `queue()`. The commented block in
`wrangler.jsonc` is the starting point.

Exit signal: a Cron Trigger forced to run twice sends each reminder exactly once,
which the unique index on `notification` already makes true — the task is to
prove it.
