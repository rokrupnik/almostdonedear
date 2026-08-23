---
task: T-26-011
title: First production release — phase 1 exit
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
blocked-by: [T-26-010]
source: docs/roadmap.md phase 1 exit criteria
---

# First production release — phase 1 exit

Phase 1 is not over when the code works locally. It is over when an invited
person signs in on `almostdonedear.app`, lands in a group, calls a work day with
a task list, and someone else answers — on production.

- Apply migrations to the remote D1, then deploy by whichever path T-26-006
  chose.
- Issue yourself an instance invite, create the first real group, invite one
  other human — a person, not a second browser profile.
- Walk the whole path on a phone, on mobile data, outdoors. The gloves are not a
  joke: NFR-3 and NFR-9 are checked here or not at all.
- Record what broke in a follow-up task rather than fixing it inside this one.

## Done when

```bash
curl -sI https://almostdonedear.app | head -1                  # 200
pnpm exec wrangler d1 execute almostdonedear --remote \
  --command "select count(*) from action where status='published'"   # >= 1
```

- A second person, on their own phone, received an invitation, signed in, opened
  a published action and responded to it.
- The isolation test from T-26-008 passes against the deployed worker, not only
  locally.
- `docs/roadmap.md` phase 1 exit criteria are all ticked, or the ones that are
  not have a task of their own in the next week's folder.
