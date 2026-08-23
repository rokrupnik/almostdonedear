---
task: T-26-006
title: Decide the deploy path — laptop or CI
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-23
source: docs/HOSTING.md operational shape
---

# Decide the deploy path — laptop or CI

`.github/workflows/deploy.yml` existed and failed on every push, because it
needed `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets
and neither was set. A workflow that is always red is worse than no workflow: it
trains you to ignore the red.

**Decision: deploy from the laptop** (ADR-023). `deploy.yml` is deleted, `ci.yml`
stays, and production is published with `pnpm run deploy` after
`pnpm run db:migrate:remote`. No Cloudflare credential leaves the machine.

Revisit when the first real users exist — at that point reproducibility is worth
a scoped API token (`Workers Scripts: Edit`, `D1: Edit`,
`Account Settings: Read`, one account, never a global key) and a GitHub
Environment with manual approval on production. The deleted workflow is in git
history; restoring it is one `git show` away.

## Done when

- No workflow on the repository is failing. ✅ `deploy.yml` gone; `ci.yml` fixed
  separately (Paraglide is now compiled before `check`, which is why CI was red).
- A decision record states which and why. ✅ ADR-023.

## Superseded the same day — ADR-024

Connecting the worker to the repository in the Cloudflare dashboard turned on
**Workers Builds**, which deploys from inside the account and needs no token
anywhere else. That removes the objection this task was decided on, so deploys
now happen on push and `pnpm run deploy` is the escape hatch. The GitHub Actions
workflow stays deleted either way.
