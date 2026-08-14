# Roadmap

Estimates are in **dev-days** — focused days of work, not calendar days. At two
to three evenings a week, one dev-day is roughly two evenings, so Phase 1 (≤ 10
dev-days) lands about five to six weeks out. Treat SvelteKit estimates as
optimistic: it is a new framework for the author (ADR-008).

Each phase ends with an exit criterion that can be checked by running something,
not by looking at it.

---

## Phase 1 — Walking skeleton · ≤ 10 dev-days

**Goal.** An invited person signs in, lands in a group, calls a work day with a
task list, and everyone else answers — on production, not on localhost.

| #   | Work                                                                                                                             | Days |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1.1 | Repo, SvelteKit + `adapter-cloudflare`, Wrangler, D1 + Drizzle, GitHub Actions, preview and production environments, domain live | 1.5  |
| 1.2 | Design foundations: tokens, ~8 core components, `/dev/ui` preview route (see _Design track_)                                     | 1.5  |
| 1.3 | Passwordless auth: login tokens, sessions in D1, Resend integration, SPF/DKIM/DMARC on the domain                                | 1.5  |
| 1.4 | Groups, memberships, instance and group invites, active-group switcher, scope helper (ADR-014) with isolation tests              | 2    |
| 1.5 | Actions: draft → publish, edit, task checklist, action list and detail screens                                                   | 2    |
| 1.6 | Responses (yes/no/maybe), email on publication, share text via Web Share API                                                     | 1.5  |

**Not in this phase:** tools, loans, push notifications, reminders, offline,
attendance, cancellation flows.

**Exit criteria**

- `pnpm test` and `pnpm check` pass in CI.
- Playwright path `invite → join → publish → respond` passes against a preview
  deployment.
- A second group's action is provably invisible to a member of the first
  (isolation test, ADR-014).
- `https://almostdonedear.app` serves the app from production.

---

## Phase 2 — Actions people can actually rely on · ~5 dev-days

Cancellation with reason; notification on change of time or location; minimum
participants with a decision deadline (Cron Trigger) and one-click cancel;
maximum participants with "yes" locking; duplicate action; attendance ticks;
the group admin's "unresolved" list; notification preferences (email on/off,
mute per group).

**Exit criteria**

- A Cron Trigger fires the 48 h and 3 h reminders exactly once per recipient —
  verified by the uniqueness constraint on `notification` surviving a forced
  double run.
- An action that misses its minimum by the deadline notifies its caller.
- Attendance for a past action can be recorded in under ten seconds on a phone.

---

## Phase 3 — Tools and lending · ~7 dev-days

Tool catalogue with visibility resolved through the scope helper; add/edit/retire
a tool; condition and unavailability; loans with reservation, pickup and return;
overlap warnings (ADR-018); equipment items on an action linking to catalogue
tools, and claiming one creating a linked loan; loan notifications, due-date
reminder with "extend", overdue escalation capped at three, owner's manual nudge;
full loan history on the tool.

**Exit criteria**

- Playwright path `borrow → overdue → extend → return` passes.
- A tool with `visibility = network` returns no results anywhere in the UI
  (the deferred feature is provably inert, not half-exposed).
- The overdue sweep, run twice in a row, sends nothing the second time.

---

## Phase 4 — PWA and offline · ~5 dev-days

Web app manifest and icons; install guidance, with an iOS-specific path
explaining Add to Home Screen; permission requested only after install;
Web Push with VAPID signed in the Worker, subscription storage and pruning of
dead endpoints; service worker caching of recent actions and the catalogue;
IndexedDB queue for the two offline toggles with idempotency keys.

**Exit criteria**

- With the device in aeroplane mode, a previously opened action renders, tasks
  can be ticked, and the changes appear on another device within seconds of
  reconnecting.
- A push notification arrives on an installed iOS PWA.
- Replaying the same queued operation twice changes nothing the second time.

---

## Phase 5 — Law, launch, first real moba · ~4 dev-days

Privacy policy and terms in Slovenian, naming Cloudflare and Resend;
self-service JSON export; account deletion as anonymisation; the 24-month
inactivity sweep; Cloudflare Web Analytics; a documented restore from a D1
backup, actually performed once.

**Exit criteria**

- Export produces a file containing everything stored about the requesting user
  and nothing about anyone else.
- After deletion, that user's name appears nowhere, while the actions they
  attended still show the correct headcount.
- A real work day is organised end to end in the app, with WhatsApp used only
  for chatting and for sharing the link (requirements §7).

---

## Design track — runs alongside, not after

Design is not a phase; it is a thin slice of every phase. The repository is the
single source of truth, and Claude Design is the review surface.

| Phase   | Design work                                                                                                                                                                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | **Foundations before the first real screen**: colour, type scale, spacing, radius, elevation as CSS custom properties; ~8 components (button, input, select, checkbox row, card, list row, status badge, dialog/sheet, empty state); a `/dev/ui` route that renders every component and state on one page |
| 1 (end) | First push of the component library to a Claude Design project; iterate there on look, bring decisions back as token changes                                                                                                                                                                              |
| 2       | Action detail as the product's flagship screen — the task list must read as the answer to "what am I signing up for"                                                                                                                                                                                      |
| 3       | Tool card and loan states (available / reserved / out / overdue), the one place where colour has to carry meaning                                                                                                                                                                                         |
| 4       | Install and offline states: the "queued, will sync" indicator, and the empty state for a cached page with no connection                                                                                                                                                                                   |
| 5       | Copy pass in Slovenian across every screen, plus the legal pages                                                                                                                                                                                                                                          |

Two rules that keep this from becoming a second project: components enter the
library only when a screen needs them, and no screen gets a bespoke colour or
spacing value that is not a token.

---

## After the MVP

In expected-value order, per requirements §6: network tool _requests_,
gamification derived from attendance, photos, passkeys, English UI, recurring
actions, and — only if the network ever grows dense — the cross-group tool
catalogue (ADR-015).
