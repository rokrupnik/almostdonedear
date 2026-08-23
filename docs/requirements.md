# AlmostDone, Dear — Requirements

Status: draft, pending approval
Last updated: 2026-08-13
Source: intake interview (sections A–H)

## 1. Product summary

A private web application for closed circles of friends who organise shared work
days (_moba_) and lend each other tools. Two things live in one place because
they belong together: a work day needs equipment, and equipment is mostly
borrowed for a work day.

Domain: `almostdonedear.app`, registered on Cloudflare.
Repository: `git@github.com:rokrupnik/almostdonedear.git`, licensed AGPL-3.0.

**It is a product for multiple groups, not an internal tool** — multi-tenant from
day one — but there is no public sign-up. Entry is by invitation only.

## 2. Scale and constraints

| Dimension | First-year target |
| --------- | ----------------- |
| Users     | ≤ 300             |
| Groups    | ≤ 20              |
| Actions   | ~200 / year       |
| Tools     | ~500 entries      |

The author works on this alongside a full-time job. **Maintenance burden
outranks completeness in every trade-off.** A feature that cannot be operated by
one person in an evening does not belong in this product.

## 3. Functional requirements — MVP

### 3.1 Accounts and access

- **FR-1** A person enters the system only via an invitation: either an
  _instance invite_ (issued by the operator; the recipient lands with no group)
  or a _group invite_ (issued by a group admin).
- **FR-2** Authentication is passwordless: the user submits their email address
  and receives a single-use sign-in link. Sessions are long-lived cookies.
- **FR-3** One account may hold memberships in several groups. The UI has an
  active-group switcher; all actions and tools always belong to exactly one group.
- **FR-4** A user profile holds a display name, an email address, a locale and
  notification preferences. Nothing else.

### 3.2 Groups and membership

- **FR-5** Any authenticated user can create a group and becomes its admin.
- **FR-6** Group invites are tokenised links with a default validity of 7 days,
  shareable over WhatsApp/Viber. There is no approval queue — the invitation _is_
  the approval. Admins can revoke an unused invite.
- **FR-7** Two roles exist. **Admin**: invite and remove members, edit group
  settings, edit or cancel any action, remove any tool entry. **Member**: call an
  action and manage the ones they called, respond to actions, add their own
  tools, borrow tools.
- **FR-8** Leaving (or being removed from) a group is a _soft_ leave: the
  membership becomes `left`. Past responses, attendance and loan history remain,
  attributed by name. The member's tools disappear from the catalogue.
- **FR-9** On leave, open loans and future responses are surfaced to the group
  admin as an "unresolved" list. A member with an unreturned tool is warned but
  not blocked from leaving.

### 3.3 Actions (work days)

- **FR-10** Any member can call an action. Lifecycle: `draft → published →
completed`, plus `cancelled` from either non-draft state. Only publication
  notifies anyone.
- **FR-11** An action carries: title, description, start (date + time), expected
  end, optional multi-day span, location (name, free-text address, optional
  latitude/longitude and a link out to a map), a task list and an equipment list.
- **FR-12** **An action cannot be published without at least one task.** The task
  list is a first-class part of the action UI, not a detail — people must be able
  to see what is expected of them before they commit.
- **FR-13** Tasks are a checklist: title, optional assignee, done/not done.
- **FR-14** The equipment list holds items a member can claim with "I'll bring
  it". Where possible, an item links to an entry in the tool catalogue, and
  claiming it creates a loan (see FR-25).
- **FR-15** Responses are one of `yes` / `no` / `maybe`, for the whole action.
  There is no partial-attendance model and no waiting list.
- **FR-16** An action may declare an optional **minimum** number of participants
  together with a decision deadline ("if there are fewer than 5 by Thursday, it
  is off"). At the deadline the caller is notified and can cancel in one click.
- **FR-17** An action may declare an optional **maximum** number of participants.
  When it is reached, "yes" is locked for further members and the caller is
  notified. No waiting list.
- **FR-18** Editing an action's start time or location notifies everyone who
  responded `yes` or `maybe`.
- **FR-19** "Duplicate action" copies an action into a new draft. There are no
  recurring actions.
- **FR-20** After an action, the caller may record **attendance** — a simple,
  optional set of checkboxes over the respondents, plus the ability to tick
  someone who never responded. Nothing else is recorded: no hours, no report, no
  photos.
- **FR-21** A member's profile within a group shows their number of attendances.
  No points, credits, debts or favour-counting of any kind.

### 3.4 Tools and lending

- **FR-22** Any member can add a tool. Every tool entry has either an owner (a
  user) or is marked as group-owned. It is editable by its owner or a group admin.
- **FR-23** A tool holds: name, description, free-text storage note ("in Janez's
  garage"), condition (`ok` / `damaged` / `in repair` / `lost`), an
  `unavailable` flag with a reason, and a **visibility** field
  (`private` / `group` / `network`, default `group`).
- **FR-24** A loan records borrower, optional linked action, expected return
  date, pickup and return timestamps, condition on return and a free note. The
  tool's current holder follows from the open loan.
- **FR-25** A loan can be created directly, or by claiming an equipment item on
  an action — in which case the loan links to the action and the return date
  defaults to the day after it ends.
- **FR-26** Reservations for a date range are supported. **Overlapping
  reservations produce a warning, never a refusal**, and no owner approval is
  required: you take it and log it, and the owner is notified.
- **FR-27** Every tool shows its full loan history: who had it, when, and in what
  condition it came back.
- **FR-28** Every list of tools passes through a single visibility-scope function.
  In the MVP that function resolves `group` only; the cross-group ("friends of
  friends") network scope is deliberately not exposed yet.

### 3.5 Notifications

- **FR-29** Two channels: email (the reliable baseline) and Web Push (once the
  PWA is installed). No SMS.
- **FR-30** Notifications are sent for exactly these events: action published;
  action start time or location changed; action cancelled; minimum-participants
  deadline reached; action reminders; tool borrowed; tool returned; tool return
  date due; tool overdue. Nothing else.
- **FR-31** Action reminders go out 48 hours and 3 hours before the start, to
  `yes` and `maybe` respondents.
- **FR-32** Tool reminders: to the borrower on the due date, with an "extend"
  button; on expiry, to **both** borrower and owner; then to the borrower every
  3 days, at most three times. The owner also has a manual "send a nudge" button,
  and the catalogue shows overdue state inline ("with Miha since 12 Mar —
  overdue").
- **FR-33** Notification preferences are per user and deliberately coarse: email
  on/off, push on/off, plus mute-per-group. There is no event-type × channel
  matrix.
- **FR-34** Conversation stays on WhatsApp/Viber. The app is the source of truth
  and provides a "share" action that produces ready-made text with a link
  (Web Share API).

### 3.6 Platform

- **FR-35** The product is an installable PWA. There are no native apps and no
  app-store presence.
- **FR-36** On iOS, installation is a precondition for push. The app must detect
  iOS Safari, explain "Add to Home Screen", and only request notification
  permission after installation.
- **FR-37** Offline **reading** works for recently opened actions and the tool
  catalogue.
- **FR-38** Offline **writing** is supported for exactly two operations: ticking
  a task and marking attendance. They queue locally and flush on reconnect, with
  an idempotency key; on conflict, last write wins.
- **FR-39** Every other write requires connectivity and says so plainly rather
  than failing silently.

### 3.7 Data protection

- **FR-40** A user can export all of their own data as JSON, self-service.
- **FR-41** Account deletion **anonymises**: the display name becomes "Former
  member", the email address is deleted, and responses, attendance and loans
  survive as anonymous rows. Backups follow within 30 days.
- **FR-42** An account inactive for 24 months is warned by email and then
  anonymised.
- **FR-43** A privacy policy and terms of use (short, Slovenian) are published
  before the first real user, naming Cloudflare and Resend as sub-processors.

## 4. Non-functional requirements

- **NFR-1 Maintainability first.** One person, evenings. Any design that needs
  routine operational attention is wrong for this project.
- **NFR-2 Cost.** Target ≤ €10/month at first-year scale (Workers Paid $5 +
  domain + email free tier).
- **NFR-3 Performance.** Meaningful paint under 2 s on a mid-range Android over
  3G; every page usable one-handed with gloves on.
- **NFR-4 Availability.** Best-effort. No SLA, no on-call, no multi-region.
  Scheduled work (reminders) may run late by minutes without harm.
- **NFR-5 Tenant isolation.** Group scoping is the single most security-sensitive
  invariant. It is enforced in one place and covered by tests, not repeated
  ad hoc in each query.
- **NFR-6 Data minimisation.** No phone numbers, no addresses, no avatars, no
  device location. Ever, unless a later decision record says otherwise.
- **NFR-7 Localisation.** UI strings pass through an i18n layer from the first
  commit; only Slovenian translations exist in the MVP. Code, schema, comments
  and documentation are in English.
- **NFR-8 Analytics.** Cookieless (Cloudflare Web Analytics). No consent banner,
  because there is nothing to consent to.
- **NFR-9 Accessibility.** Sensible defaults: real form labels, ≥ 44 px touch
  targets, sufficient contrast in daylight. No formal WCAG audit.
- **NFR-10 Testing.** Vitest for domain logic; Playwright for three critical
  paths — invite → join, call → respond, borrow → return. No coverage target.

## 5. Explicitly out of scope for the MVP

Each of these was considered and rejected for a stated reason, recorded in
`decisions.md`:

| Not building                                    | Why                                                        |
| ----------------------------------------------- | ---------------------------------------------------------- |
| In-app chat                                     | WhatsApp already won; moderation is unbounded work         |
| Points, credits, favour-counting                | Creates accounting between friends and disputes            |
| Photo galleries                                 | Storage, cost, consent, moderation                         |
| Calendar sync (Google/ICS)                      | OAuth surface and support load                             |
| Payments / cost splitting                       | Tax and dispute handling                                   |
| Public group discovery                          | Turns a private circle into a marketplace                  |
| Native apps                                     | No production native experience; store overhead            |
| Recurring actions                               | RRULE, exceptions and per-occurrence edits are a time sink |
| Cross-group "friends of friends" tool catalogue | Consent model and contact flow, not the query, is the work |
| Hours tracking                                  | Dropped in favour of a single attendance tick              |
| Waiting lists                                   | The problem is too few people, not too many                |
| Owner approval for loans                        | Blocks borrowing behind someone's unlocked phone           |
| SMS                                             | Costs money and needs a provider                           |
| Full offline write sync                         | Conflict resolution is where solo projects die             |

## 6. Backlog (post-MVP, ordered by expected value)

1. **Tool requests across the network** — "looking for a chainsaw on Saturday"
   fans out to friends-of-friends; only whoever answers is revealed. Preferred
   over an open cross-group catalogue because consent is built in.
2. **Gamification** — a light, general "man points" scheme derived from existing
   attendance data. No migration needed if attendance is recorded from day one.
3. Photos on actions and tool damage reports (needs R2 and a consent decision).
4. Passkeys alongside magic links.
5. English UI.
6. Recurring actions, if duplication proves insufficient in practice.
7. Cross-group tool catalogue, if and only if the network grows dense.

## 7. Definition of done for the MVP

One real _moba_ is organised end to end in the application — called, published,
responded to, equipment claimed, a tool borrowed and returned, attendance ticked
— **without WhatsApp being used to coordinate who is coming or who brings what.**
WhatsApp remains the place where the link is shared and where people chat.
