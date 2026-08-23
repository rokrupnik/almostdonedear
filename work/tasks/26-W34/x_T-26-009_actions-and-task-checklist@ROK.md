---
task: T-26-009
title: Actions — draft, publish, and the task checklist
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-24
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

## What shipped

- `src/lib/server/actions.ts` — the domain: list, get, create, update, publish,
  duplicate, tasks and equipment. `validate()` and the two permission predicates
  are pure, so they are unit tested without a database.
- Routes under `/skupine/[groupId]/akcije`: list of what is coming, the create
  form, the detail page, and an edit form sharing one parser with create.
- The detail page puts the task list first, above equipment and above the
  buttons, because it is the answer to "what am I signing up for".

Decisions taken while building:

- **Publishing without a task is refused in `publish()`**, not in the form
  (FR-12). A form is not a boundary.
- **A draft answers 404 to everyone but its caller and the admins** — the same
  reasoning as group scope: its existence is scoped information.
- **Duplicating moves the dates a week forward** rather than copying them, since
  a copy is almost always the next occurrence and a date already in the past is
  never what was meant.
- Location is a name, free text and a link out to Google Maps. No embedded map,
  no geocoding: API keys, cost and a GDPR conversation for something a link does.

## Verified

```
pnpm run lint     ok
pnpm run check    0 errors
pnpm run test:unit -- --run   20 passed
pnpm run test:e2e             9 passed
```

The e2e path is create -> publish refused -> add a task -> publish -> it appears
in the group's list, plus a second test proving a draft is invisible (404) to
another member of the same group.

The suite now runs with a single Playwright worker: it seeds users through
`wrangler d1 execute --local`, which writes to the same SQLite file the running
worker holds open, and parallel writers trip its lock.
