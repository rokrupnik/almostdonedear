---
title: Phase 4 — PWA and offline
owner: ROK
---

# Phase 4 — PWA and offline

~5 dev-days, `docs/roadmap.md`. The part that makes it usable on a farm.

- Manifest, icons, install guidance, and the iOS path that explains Add to Home
  Screen. Push permission is requested only after install — on iOS it does not
  work before, and getting this wrong means half the group decides the app is
  broken (FR-36).
- Web Push signed with VAPID in the worker; no provider needed. Store
  subscriptions, prune dead endpoints.
- Service worker caches recently opened actions and the catalogue for reading.
- **Exactly two writes queue offline**: ticking a task and marking attendance,
  as idempotent toggles, last write wins (ADR-006). Everything else says plainly
  that it needs a connection.

Exit signal: aeroplane mode, open a cached action, tick a task, reconnect, and
the change appears on another device within seconds — and replaying the same
queued operation twice changes nothing the second time.
