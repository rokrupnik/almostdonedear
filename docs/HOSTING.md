# Hosting

```yaml
status: decided
target: cloudflare
account-owner: rok (own account — no client involved)
decided: 2026-08-13
rule-matched: 4 / 6 / 7
```

## Decision

**Cloudflare**, with the application, its API and its static assets served by a
single Worker.

| Concern                                     | Service                                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| App + API (SvelteKit, `adapter-cloudflare`) | Workers                                                 |
| Static assets                               | Workers Assets (same Worker, no separate Pages project) |
| Relational data                             | D1, created with an EU location hint                    |
| Notification fan-out                        | Queues                                                  |
| Reminders and sweeps                        | Cron Triggers                                           |
| Images, if photos ever ship                 | R2                                                      |
| Analytics                                   | Cloudflare Web Analytics (cookieless)                   |
| Outbound email                              | **Resend** — not Cloudflare (ADR-011)                   |

Plan: **Workers Paid, $5/month**, required for Queues. Domain
`almostdonedear.app` on Cloudflare Registrar.

## How the rubric resolved

| Rule                                         | Applies?                     | Reasoning                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — client already has infrastructure        | No                           | There is no client. This is the author's own project.                                                                                                                                                                                                                                           |
| 2 — needs a persistent server process        | No                           | No Odoo, no Shopware, no queue workers, no writable local filesystem, no self-owned WebSocket server. Scheduled work is Cron Triggers; fan-out is Queues.                                                                                                                                       |
| 3 — data residency or procurement            | **Recorded, not triggering** | GDPR applies, but there is no client DPA, no public-sector procurement and no contractual EU-only commitment. Addressed by a D1 EU location hint plus data minimisation (ADR-016) rather than in-region custom hosting. Revisit if the app is ever offered to an organisation that imposes one. |
| 4 — API, scheduled jobs, edge logic          | Yes                          | The API surface, reminder crons and notification fan-out fit Workers directly.                                                                                                                                                                                                                  |
| 5 — Next.js with framework-specific features | No                           | The stack is SvelteKit (ADR-008).                                                                                                                                                                                                                                                               |
| 6 — framework-agnostic frontend              | Yes                          | SvelteKit builds to a Worker plus static assets.                                                                                                                                                                                                                                                |
| 7 — genuine tie                              | Yes, and it agrees           | One dashboard, one bill, one set of credentials, one status page.                                                                                                                                                                                                                               |

Rules 4, 6 and 7 all point the same way, which is the easy case.

## Rejected

| Option                                      | Why it lost                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**                                  | Rule 5 is Next.js-specific, and this is not Next.js. A SvelteKit app on Vercel pays a premium for advantages it cannot use, and splits the stack across two providers since the database would also have to come from somewhere else.                                                                 |
| **VPS / Hetzner / CloudPepper (custom)**    | Nothing here requires a persistent process, so Rule 2 does not fire. Would mean OS patching, TLS renewal, backups, monitoring and an on-call of one — precisely the maintenance burden that NFR-1 exists to avoid. Kept as the escape hatch if a future feature genuinely needs a long-lived process. |
| **Cloudflare Pages + separate Workers**     | The historic split; Workers with static assets now covers both, and one deployment target beats two.                                                                                                                                                                                                  |
| **Neon / Supabase Postgres via Hyperdrive** | Would give the author the PostgreSQL semantics he knows (ADR-009), at the cost of a second provider, a second bill and a second failure domain. D1 is sufficient at ≤ 300 users. Revisit on real concurrent-write pressure or reporting needs SQLite cannot serve.                                    |
| **Supabase (as a whole platform)**          | Auth, database and storage in one box is genuinely convenient, but it moves the project off Cloudflare entirely and its auth model is heavier than emailed magic links (ADR-010).                                                                                                                     |

## Operational shape

- `wrangler.jsonc` with explicit bindings and **one** environment, because
  Workers Builds deploys without `--env`. Local values come from `.dev.vars`.
- Secrets via `wrangler secret put` — never in `wrangler.toml`, never in the
  repository. That means the Resend API key and, later, the VAPID
  private key.
- Account ID in `.env`, not in committed config.
- Deploys run in Cloudflare Workers Builds on every push to `main` (ADR-024),
  with `pnpm run deploy` from a logged-in machine as the escape hatch.
  `pnpm run db:migrate:remote` is a manual step before pushing a schema change.
  GitHub Actions runs lint, check and tests; it never deploys.
- Local development is `wrangler dev` against a local D1; no Docker in this
  project.
- D1 backups: scheduled export to R2, and the restore path exercised once
  before launch (Phase 5), because an untested backup is not a backup.

## Watch items

- **CPU time per invocation**, not wall-clock. The notification sweep must
  decompose over Queues rather than looping over every pending row in one call.
- **D1 ceilings** (database size, writes per second) are far above first-year
  scale but should be re-checked before any change in the product's character —
  photos, other tenants' scale, or analytics-style queries.
- **Deliverability is a login dependency** (ADR-010): domain authentication is
  a launch blocker, not a polish task.
- Limits move. Verify current figures at `developers.cloudflare.com` before
  designing anything that sits near a boundary.
