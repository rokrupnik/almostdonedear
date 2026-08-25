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

- ✅ DKIM resolves at `resend._domainkey.almostdonedear.app`, SPF at
  `send.almostdonedear.app` (`v=spf1 include:amazonses.com ~all`, EU region
  `eu-west-1`), DMARC at `_dmarc` (`v=DMARC1; p=none;`), and Resend reports the
  domain verified.
- ✅ `wrangler secret list` shows `RESEND_API_KEY`.
- ✅ A real sign-in email was delivered to Gmail and its headers checked:

  ```
  dkim=pass   header.i=@almostdonedear.app header.s=resend
  spf=pass    smtp.mailfrom=…@send.almostdonedear.app
  dmarc=pass  (p=NONE) header.from=almostdonedear.app
  ```

  All three pass, routed through `eu-west-1`.

- ⬜ **It still landed in spam**, which authentication cannot explain and does not
  fix. Three causes, by weight:

  1. The domain is days old and has no sending history. Gmail is conservative
     with those regardless of DKIM. The strongest available signal is a human
     marking it _not spam_, which has now happened once.
  2. The message had the shape of a phishing attempt: two lines and a link to a
     domain the recipient's mail provider has never seen. **Rewritten** — it now
     says what the app is, why the message arrived, shows the destination as
     text, and states that ignoring it does nothing.
  3. `almostdonedear.app` has **no MX record**. A domain that sends but cannot
     receive is a mild negative signal, and a friend who hits reply is talking to
     nobody.

## Left to do

- Turn on **Cloudflare Email Routing** for the zone and forward
  `pozdrav@almostdonedear.app` to your Gmail. That publishes MX records and makes
  replies land somewhere.
- Then set the `REPLY_TO` var in `wrangler.jsonc` to that address — the code
  already omits the header while it is empty, so nothing points at a mailbox
  that bounces.
- Ask the first few members to mark the first email _not spam_ if it lands
  there. At this scale, engagement is the whole reputation model.
- Revisit `p=none` → `p=quarantine` in DMARC after a few weeks of clean sending.

Blocks T-26-007: the auth flow cannot be tested end to end without this.
