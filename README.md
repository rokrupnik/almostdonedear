# AlmostDone, Dear

Shared work days (_moba_) and tool lending for closed circles of friends.

Call a work day, say what needs doing, see who is coming and who brings what —
and keep track of whose chainsaw is currently in whose garage. Entry is by
invitation only; there is no public sign-up.

- **Requirements:** [`docs/requirements.md`](docs/requirements.md)
- **Decisions (ADRs):** [`docs/decisions.md`](docs/decisions.md)
- **Data model:** [`docs/data-model.md`](docs/data-model.md)
- **Roadmap:** [`docs/roadmap.md`](docs/roadmap.md)
- **Hosting:** [`docs/HOSTING.md`](docs/HOSTING.md)

Status: **Phase 1, walking skeleton.** Nothing here is usable yet.

## Stack

SvelteKit 5 + TypeScript on Cloudflare Workers, D1 (SQLite) via Drizzle,
Tailwind v4 with project tokens, Paraglide for i18n (Slovenian only for now),
Resend for outbound email. Vitest for logic, Playwright for the paths that
matter. Reasoning for each of these is in `docs/decisions.md` — read that before
proposing a change to any of them.

## Getting started

```sh
corepack enable pnpm
pnpm install
cp .env.example .env           # drizzle-kit credentials, optional
cp .dev.vars.example .dev.vars # local overrides for the worker's vars
pnpm run gen                   # generates worker-configuration.d.ts
pnpm run dev
```

`http://localhost:5173` is the app; `http://localhost:5173/dev/ui` is the
component gallery, which exists in development only.

### The database

`almostdonedear` on D1, in WEUR, already created and wired into
`wrangler.jsonc`. The location hint is deliberate — see ADR-016. Local
development runs against a local D1, never the remote one.

```sh
pnpm run db:generate        # SQL migration from the Drizzle schema
pnpm run db:migrate:local   # apply to the local D1
pnpm run db:migrate:remote  # apply to production — before pushing the change
```

## Deploying

Pushing to `main` deploys, through Cloudflare Workers Builds (ADR-024). Two
things follow from that:

- **Migrations are not part of the build.** Run `pnpm run db:migrate:remote`
  _before_ pushing a schema change.
- **`wrangler.jsonc` has exactly one environment**, because the build deploys
  with a bare `wrangler deploy`. Local values live in `.dev.vars`.

`pnpm run deploy` still works from any machine with `wrangler login`, for when a
deploy must not wait for a push.

## Scripts

| Command                                 | What it does                                   |
| --------------------------------------- | ---------------------------------------------- |
| `pnpm run dev`                          | Vite dev server                                |
| `pnpm run check`                        | `svelte-check` plus Cloudflare type generation |
| `pnpm run lint`                         | Prettier check and ESLint                      |
| `pnpm run format`                       | Prettier write                                 |
| `pnpm run test:unit`                    | Vitest (watch; add `-- --run` for one pass)    |
| `pnpm run test:e2e`                     | Playwright against a production build          |
| `pnpm run build`                        | Build the Worker bundle                        |
| `pnpm run preview`                      | Run the built Worker locally via Wrangler      |
| `pnpm run deploy`                       | Build and deploy to production                 |
| `pnpm run db:generate`                  | Generate a migration from the schema           |
| `pnpm run db:migrate:local` / `:remote` | Apply migrations                               |

## Layout

```
src/lib/server/db/schema.ts   the whole data model, one file
src/lib/server/scope.ts       tenant scoping — the one place group_id is filtered
src/lib/server/ids.ts         ULIDs and session identifiers
src/lib/ui/                   design system components
src/routes/layout.css         design tokens (colour, radius, spacing)
src/routes/dev/ui/            component gallery, development only
e2e/                          Playwright specs
docs/                         requirements, decisions, data model, roadmap
```

## Two rules worth knowing before contributing

1. **No route composes `group_id = ?` by hand.** Everything goes through
   `src/lib/server/scope.ts` (ADR-014). A leak between groups is the most likely
   serious defect in this design, so there is one place to get it right.
2. **No screen invents a colour or a spacing value.** If a token does not exist
   for it, add the token.

## Licence

[AGPL-3.0-or-later](LICENSE). You may run, modify and share this; if you run a
modified version as a service, publish your changes.
