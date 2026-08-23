---
task: T-26-007
title: Passwordless sign-in with emailed links
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-24
source: docs/roadmap.md phase 1.3, FR-2, ADR-010, ADR-022
---

# Passwordless sign-in with emailed links

No passwords, ever (ADR-010): you type an email address, you get a single-use
link, you are in. Hand-rolled rather than `better-auth` (ADR-022) — the whole
flow is small enough to hold in your head, which matters more here than breadth.

Hand-rolled auth is also where subtle mistakes live, so these are not optional:

- Store only a **hash** of the token, never the token itself. Short expiry
  (15 minutes), single use — mark `used_at` in the same statement that consumes it.
- Compare in constant time; never `===` on a secret.
- Rate limit per email address and per IP. Without it, this endpoint is a free
  email cannon pointed at whoever you name.
- Session id from `crypto.getRandomValues` (`sessionId()` in `src/lib/server/ids.ts`),
  never a ULID — a ULID leaks its creation time.
- Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, and a server-side row in
  `session` so sign-out actually revokes. That row lives in D1 and not KV,
  because revocation must be read-after-write.
- The link must be bound to `PUBLIC_ORIGIN`; a token that works on a
  preview origin and a production origin is one phishing step from useless.

Screens: request the link, "check your inbox", the consume-token route, sign-out.
Slovenian strings through Paraglide, English code.

## What shipped

- `src/lib/server/auth.ts` — request, consume, validate, destroy. Tokens are
  stored as SHA-256 and **looked up by that hash**, so no secret is ever compared
  in JavaScript and the constant-time question does not arise. Single use is the
  `usedAt is null` predicate on the claiming `UPDATE ... RETURNING`, which holds
  even if two clicks race.
- `src/lib/server/email.ts` — the only place that knows about Resend (ADR-011).
  With no API key configured it prints the message to the terminal instead.
- `src/hooks.server.ts` resolves the session once per request into `locals.user`,
  and clears a cookie whose session no longer exists.
- Routes: `/prijava`, `/prijava/preveri`, `/prijava/potrdi`, sign-out as an
  action on `/`.
- `scripts/user-create.mjs` (`pnpm run user:create`) — until invitations exist
  (T-26-008), sign-in refuses unknown addresses, so there has to be some way to
  make the first user.

Rate limits: 5 requests per address and 20 per IP, per rolling hour, counted off
`login_token` rather than a second store.

`AUTH_ECHO_LINK` shows the link on the page instead of only mailing it —
development and e2e only. It is a separate flag rather than "no mailer
configured" on purpose: a missing key in production must not turn into a sign-in
link handed to whoever typed the address.

## Verified

```
pnpm run lint     ok
pnpm run check    0 errors
pnpm run test:unit -- --run   13 passed
pnpm run test:e2e             5 passed
```

The e2e suite covers what a unit test cannot without a real D1: a mailed link
signs you in, the same link is refused the second time, an unknown address is
indistinguishable from a known one, and a forged token does nothing. Expiry is a
timestamp comparison and is not exercised end to end — noted rather than
pretended.
