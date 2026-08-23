---
task: T-26-004
title: Point almostdonedear.app at the worker
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-24
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

## Done — 2026-08-24

**Apex is live.** `https://almostdonedear.app` returns 200 from the worker
(`x-sveltekit-page: true`, `server: cloudflare`), serves the Slovenian landing
page, and answers 404 on `/dev/ui`. Nameservers are Cloudflare's.

Two things remain, and both are one setting each:

1. **`www` does not resolve at all** — no DNS record. Add a proxied record
   (`CNAME www -> almostdonedear.app`, orange cloud) so Cloudflare answers for
   the name, then a Redirect Rule: hostname equals `www.almostdonedear.app` ->
   `concat("https://almostdonedear.app", http.request.uri.path)`, 301, query
   preserved. Attaching `www` as a second Custom Domain would be the wrong fix:
   it would serve the app on two origins, which is exactly what the top of this
   task rules out.
2. **`http://almostdonedear.app` returns 200, not a redirect** — _Always Use
   HTTPS_ is off in the zone (SSL/TLS -> Edge Certificates). Serving the app over
   plaintext matters more here than usual: the sign-in link and the session
   cookie ship in T-26-007, and a login page reachable over HTTP is worth
   nothing to defend later. Turn it on before that task, not after.

## Done when

Measured 2026-08-24:

```
https://almostdonedear.app                        200
https://www.almostdonedear.app                    301 -> https://almostdonedear.app/
http://almostdonedear.app                         301 -> https://almostdonedear.app/
http://www.almostdonedear.app                     301 -> https://www.almostdonedear.app/
https://www.almostdonedear.app/akcija/x?a=1&b=2   301 -> https://almostdonedear.app/akcija/x?a=1&b=2
```

Following the chain from `http://www.almostdonedear.app/akcija/x?a=1` lands on
`https://almostdonedear.app/akcija/x?a=1` in two hops, path and query intact.
The 404 at the end is correct — that route does not exist yet.
