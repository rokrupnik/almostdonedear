---
task: T-26-008
title: Groups, memberships and the two kinds of invitation
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
blocked-by: [T-26-007]
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

## Done when

```bash
pnpm run test:unit -- --run
pnpm run test:e2e     # invite -> join -> switch groups
```

- An isolation test proves a member of group A gets 404 — not 403 — on every
  route belonging to group B. 404, because whether a group exists is itself
  scoped information.
- Removing the last admin of a group is refused with a readable message.
- A revoked or expired invite link cannot be redeemed.
- `grep -rn "groupId, *scope\?\.\?groupId\|group_id = " src/routes` finds nothing
  that bypasses the scope helper.
