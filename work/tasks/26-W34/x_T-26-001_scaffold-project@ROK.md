---
task: T-26-001
title: Scaffold the project — repo, stack, schema, CI
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-23
source: docs/roadmap.md phase 1.1
---

# Scaffold the project — repo, stack, schema, CI

Phase 1.1 of `docs/roadmap.md`. Shipped in `5adc46a`.

- SvelteKit 5 + TypeScript on Cloudflare Workers (`@sveltejs/adapter-cloudflare`),
  Tailwind v4, Paraglide with `sl` only, Drizzle against D1, Vitest, Playwright,
  Prettier + ESLint.
- The whole data model of `docs/data-model.md` in one schema file, with its first
  migration generated and applied to the local D1.
- `src/lib/server/scope.ts` — the single place `group_id` is filtered (ADR-014),
  with the `network` tool scope provably inert (ADR-015).
- CI: lint, check, unit, build, plus a separate e2e job. A deploy workflow exists
  but is inert until T-26-006 decides whether it is used.
- AGPL-3.0 (ADR-001), pushed to `git@github.com:rokrupnik/almostdonedear.git`.

## Verified by

```bash
pnpm run lint && pnpm run check && pnpm run test:unit -- --run && pnpm run build
pnpm run test:e2e
pnpm run db:migrate:local
```

All green on 2026-08-23; the migration applied 42 statements to the local D1.
