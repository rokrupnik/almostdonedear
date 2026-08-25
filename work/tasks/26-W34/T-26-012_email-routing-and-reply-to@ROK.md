---
task: T-26-012
title: Cloudflare Email Routing, so the domain can also receive
status: open
assignee: [ROK]
week: 26-W34
created: 2026-08-24
source: T-26-005 deliverability findings
---

# Cloudflare Email Routing, so the domain can also receive

`almostdonedear.app` sends but has **no MX record**, which costs twice:

- A domain that cannot receive mail is a mild negative signal to receiving
  providers. It is not why the first sign-in email landed in spam — that was a
  three-day-old domain with no history — but it is one of the few things left
  that can actually be fixed with a setting.
- More concretely: a friend who hits _reply_ on an invitation is talking to
  nobody, and never finds out.

Email Routing is free, lives in the same dashboard as everything else, and needs
no mail server.

## Steps

1. Cloudflare dashboard → the zone → **Email → Email Routing**, enable it. It
   publishes the MX and SPF records itself.
2. Route `pozdrav@almostdonedear.app` → your Gmail, and confirm the forwarding
   address by clicking the verification mail Cloudflare sends.
3. Optional but cheap: also route `dmarc@almostdonedear.app`, then add
   `rua=mailto:dmarc@almostdonedear.app` to the DMARC record. Reports are the
   only way to find out that some other service is sending as you.
4. Set `REPLY_TO` in `wrangler.jsonc` to `pozdrav@almostdonedear.app` and push.
   The code already omits the header while the value is empty, so nothing has to
   change in the mailer.

**Watch the SPF record.** Email Routing wants to publish its own SPF at the apex
while Resend uses `send.almostdonedear.app` for the return path. Those do not
collide — different names — but if Cloudflare offers to add a _second_ SPF record
at the same name, refuse: two SPF records at one name is a permanent error, and
the failure looks like intermittent spam placement.

## Done when

```bash
dig +short MX almostdonedear.app          # Cloudflare's mail routing hosts
dig +short TXT almostdonedear.app         # exactly one v=spf1 record
```

- A reply to a sign-in email arrives in your Gmail.
- `curl -s https://almostdonedear.app` still serves the app — routing MX records
  must not disturb the worker's custom domain.
