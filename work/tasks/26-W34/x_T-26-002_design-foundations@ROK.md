---
task: T-26-002
title: Design foundations — tokens, core components, gallery
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-23
source: docs/roadmap.md phase 1.2 and the design track
---

# Design foundations — tokens, core components, gallery

Phase 1.2 of `docs/roadmap.md`, done before the first real screen exists, which
is the whole point of doing it first (ADR-020).

- `src/routes/layout.css` — raw palette, semantic names, `@theme inline` mapping,
  dark mode as a token override rather than a second set of components.
- Nine components in `src/lib/ui/`: Button, Input, Textarea, CheckRow, Card,
  ListRow, Badge, Sheet, EmptyState. `CheckRow` is a whole-row target because it
  is used outdoors with gloves (NFR-9) and is one of the two offline-capable
  writes (FR-38).
- `/dev/ui` renders every component and state on one page, and returns 404 in a
  production build — asserted by an e2e test, not by intention.
- `pnpm run design:bundle` renders that gallery in a real browser and writes one
  self-contained preview per group, so a review surface is a snapshot of the
  components and never a second copy of them.

Claude Design was set up and then set aside — the previews generate fine, the
review loop is not what we want to spend evenings on yet. Picking it back up
costs one command.

## Verified by

```bash
pnpm run design:bundle    # 7 previews
pnpm run test:e2e         # /dev/ui is 404 in the built worker
```
