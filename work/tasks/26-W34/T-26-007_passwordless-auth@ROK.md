---
task: T-26-007
title: Passwordless sign-in with emailed links
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
blocked-by: [T-26-005]
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

## Done when

```bash
pnpm run test:unit -- --run    # token hashing, expiry, single use, constant-time compare
pnpm run test:e2e              # request link -> consume it -> land signed in
```

- A consumed link returns "this link has already been used" on second use.
- An expired link is refused, and the message does not say whether the address
  is known — no account enumeration.
- Signing out invalidates the session immediately on the next request.
