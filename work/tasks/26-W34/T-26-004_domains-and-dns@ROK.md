---
task: T-26-004
title: Point almostdonedear.app at the worker
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
source: docs/HOSTING.md, requirements §1
---

# Point almostdonedear.app at the worker

One domain, bought on Cloudflare Registrar, so the zone already exists in the
account and nothing has to move. Two things left: attach it to the worker, and
settle apex versus www.

**`almostdonedear.app` is canonical**; `www.almostdonedear.app` redirects to it, 301. Not cosmetics: sessions and sign-in links are bound to a host, so a cookie
set on the apex is not sent to `www`, and a magic link is checked against
`PUBLIC_ORIGIN` (T-26-007). Serving both hosts produces a person who clicks a
working link and lands signed out — on a phone, over WhatsApp, where nobody will
ever reproduce it.

## Steps

1. **A deployed worker has to exist** before a Custom Domain can attach to it.
   Workers Builds deploys on push to `main` (ADR-024), so the first green build
   is what creates it.
2. **Custom Domain** on the worker for `almostdonedear.app`. Cloudflare creates
   the DNS record and the certificate itself — the supported path, and it avoids
   the placeholder-record trick that Routes need.
3. **`www` → apex**, a 301 redirect rule preserving path and query.
4. `PUBLIC_ORIGIN` for production is already `https://almostdonedear.app` in
   `wrangler.jsonc`. Confirm nothing in the code hard-codes an origin.

The zone being on Cloudflare already is also what lets T-26-005 publish its DKIM,
SPF and DMARC records without waiting for a nameserver change.

## Done when

```bash
curl -sI https://almostdonedear.app     | head -1   # 200
curl -sI https://www.almostdonedear.app | head -2   # 301 -> apex
```

Both need a deployed worker; run them after the first deploy, not before.
