---
task: T-26-005
title: Resend account and domain authentication
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-23
source: ADR-011, ADR-010
---

# Resend account and domain authentication

Outbound email is the one thing Cloudflare does not cover (ADR-011), and with
passwordless sign-in it is not a notification channel but the **login mechanism**
(ADR-010). A magic link in a spam folder is a locked-out user, so SPF, DKIM and
DMARC are launch blockers rather than polish.

- The zone is already on Cloudflare (Registrar), so the DKIM, SPF and DMARC
  records can go in as soon as Resend hands them over — no waiting on anything.
- Create the Resend account and add `almostdonedear.app` as a sending domain.
- Publish the DKIM and SPF records Resend gives you in the Cloudflare zone, plus
  a DMARC record — start at `p=none` with a reporting address, tighten later.
- Sending address: `AlmostDone, Dear <ne-odgovarjaj@almostdonedear.app>`, with a
  real `Reply-To` pointing at you. Slovenian, because every recipient is.
- Store the API key as a worker secret, never in the repo:
  `pnpm exec wrangler secret put RESEND_API_KEY`.

## Done when

- `dig TXT almostdonedear.app` and the DKIM selector both resolve, and Resend
  shows the domain as verified.
- A test send from the Resend dashboard to a Gmail address lands in the inbox,
  and its headers show `spf=pass`, `dkim=pass`, `dmarc=pass`.
- `pnpm exec wrangler secret list` includes `RESEND_API_KEY`.

Blocks T-26-007: the auth flow cannot be tested end to end without this.
