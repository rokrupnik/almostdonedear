---
title: Phase 3 — tools and lending
owner: ROK
---

# Phase 3 — tools and lending

~7 dev-days, `docs/roadmap.md`. The half of the product that no Doodle replaces.

- Catalogue with visibility resolved inside `scope.ts`, add/edit/retire a tool,
  condition and the `unavailable` flag (FR-22, FR-23).
- Loans: reservation, pickup, return, condition and note on return, full history
  on the tool (FR-24, FR-27).
- **Overlaps warn, never block, and no owner approval is required** (ADR-018).
  This is the decision to hold on to when it feels wrong to implement: a hard
  block just moves the negotiation to a phone call.
- Equipment items on an action link to catalogue tools; claiming one creates a
  loan due the day after the action (FR-25).
- Due-date reminder with an "extend" button, overdue escalation capped at three,
  and the owner's manual nudge (ADR-019).

Exit signal: `borrow -> overdue -> extend -> return` as an e2e path, and a tool
with `visibility = network` returning nothing anywhere in the UI.
