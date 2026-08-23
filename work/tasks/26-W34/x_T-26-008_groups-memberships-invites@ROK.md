---
task: T-26-008
title: Groups, memberships and the two kinds of invitation
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-24
source: docs/roadmap.md phase 1.4, FR-1 and FR-5 to FR-9, ADR-002, ADR-014
---

# Groups, memberships and the two kinds of invitation

Multi-tenant from the first commit (ADR-002), and this is the task where that
either holds or quietly does not.

- **Instance invites** get a person into the system when they belong to no group
  yet; **group invites** get an existing user into a group. Both are tokenised
  links, hashed at rest, seven days by default, revocable, shared over WhatsApp.
  There is no approval queue: the invitation is the approval.
- Any authenticated user can create a group and becomes its admin (FR-5).
- Two roles only (ADR-003). Admin: invite, remove, edit group, edit or cancel any
  action. Member: everything else, including calling an action.
- One account, many memberships, with an active-group switcher (FR-3).
- Leaving is soft (FR-8): membership goes to `left`, history keeps the person's
  name, their tools leave the catalogue. Open loans and future responses surface
  to the admin as an unresolved list (FR-9).
- **Every read and write goes through `src/lib/server/scope.ts`** (ADR-014). No
  route composes `group_id = ?` by hand. A group must always keep at least one
  active admin — enforced in application code, since SQLite cannot say it.

## What shipped

- `src/lib/server/groups.ts` — groups, memberships, both kinds of invitation.
  Every function takes a `Scope` from `scope.ts` or a plain user id for the
  questions that cannot be scoped ("which groups am I in").
- Routes: `/skupine` (list, create), `/skupine/[groupId]` (members, invite,
  revoke, promote, remove, leave), `/vabilo/[token]` (redeem).
- `scripts/invite-instance.mjs` (`pnpm run invite:instance`) issues the
  operator's instance invitation; group invitations are made in the app.

Three decisions worth keeping in view:

- **An invitation may create an account, but never sign in to an existing one.**
  Someone holding an invite link could otherwise type a member's address and
  become them. If the address is known, the app mails _that person_ a sign-in
  link and says so.
- **A returning member reuses their old membership row** rather than getting a
  second one, so `left` history stays truthful.
- **The last admin cannot leave or be removed.** SQLite cannot express it, so it
  is checked before every departure and the message says what to do instead.

## Verified

```
pnpm run lint     ok
pnpm run check    0 errors
pnpm run test:unit -- --run   13 passed
pnpm run test:e2e             7 passed
```

The isolation test is the important one: a signed-in user who is not a member
requests the group page and gets **404, not 403** — whether a group exists is
itself scoped information (ADR-014).

The e2e suite now clears `login_token` before running. A few consecutive runs
otherwise trip the per-IP rate limit from T-26-007, with the suite cast as the
attacker — the limit working correctly, so the tests moved rather than the
limit.
