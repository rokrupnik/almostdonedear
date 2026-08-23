---
task: T-26-009
title: Actions — draft, publish, and the task checklist
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
blocked-by: [T-26-008]
source: docs/roadmap.md phase 1.5, FR-10 to FR-14, FR-19
---

# Actions — draft, publish, and the task checklist

The product's centre of gravity. A work day is called by any member, lives as a
draft until it is published, and only publication notifies anyone (FR-10).

- Fields: title, description, start and expected end (may span days), location as
  name plus free-text address plus optional hand-entered coordinates and a link
  out to a map. No embedded map, no geocoding — that is API keys, cost and a
  GDPR conversation for something a Google Maps link already does.
- **An action cannot be published without at least one task** (FR-12). This is
  the cheapest way to force the thing people actually need: knowing what is
  expected of them before they commit. The checklist is prominent in the layout,
  not a detail pane.
- Tasks: title, optional assignee, done flag, manual ordering.
- Equipment list with "I'll bring it" (FR-14). In this phase it is free text; the
  link into the tool catalogue arrives with phase 3.
- Optional minimum with a decision deadline, optional maximum (FR-16, FR-17).
  Storing them is this task; acting on them is phase 2.
- "Duplicate action" instead of recurrence (ADR-013).
- Screens: action list for the active group, action detail, create and edit.

## Done when

```bash
pnpm run test:unit -- --run
pnpm run test:e2e     # create draft -> add tasks -> publish -> appears in the list
```

- Publishing an action with an empty task list is refused, in the API and not
  only in the form.
- `ends_at < starts_at` is refused.
- A draft is invisible to everyone except its caller and the group's admins.
- Duplicating an action produces a draft with the tasks copied and the dates
  cleared.
