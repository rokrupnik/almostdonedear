---
task: T-26-003
title: Create the D1 databases and wire the account
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-23
source: docs/HOSTING.md, docs/roadmap.md phase 1.1 remainder
---

# Create the D1 databases and wire the account

The schema and its migration exist and run locally; nothing has been created on
Cloudflare yet. Every `database_id` in `wrangler.jsonc` is still
`TODO-run-wrangler-d1-create`, so no remote migration and no deploy can work
until this is done. This is the first task that touches the real account.

One database. A preview one would be a second database nobody looks at while
deploys run from the laptop (ADR-023); it arrives with CI deploys. The EU
location hint is a deliberate placement decision, recorded in ADR-016 — an
operational placement and not a contractual guarantee, and `docs/decisions.md`
says so on purpose.

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create almostdonedear --location weur
```

Done on 2026-08-23: `fc593bd1-…`, region WEUR, wired into `wrangler.jsonc` under
the `DB` binding at the top level and in `env.production`. Wrangler's offer to
add a binding on your behalf produced a **second** binding named
`almostdonedear` carrying `"remote": true`; both were removed. That flag makes
`wrangler dev` read and write the production database from your laptop, which is
not what local development should ever do.

Remaining: put the database id, the account id and a D1-scoped API token into
`.env` — that file is for drizzle-kit (`db:push`, `db:studio`) on your machine
only, and it is gitignored. Migrations do not need it; they go through wrangler.

## Done

```
0000_lush_moon_knight.sql  ✅  42 commands, remote, WEUR
```

`sqlite_master` lists all 13 tables plus `d1_migrations`. No
`TODO-run-wrangler-d1-create` remains in `wrangler.jsonc`. The database id is in
`.env` for drizzle-kit; the account id and D1 token are still empty and only
needed for `db:push` / `db:studio`.
