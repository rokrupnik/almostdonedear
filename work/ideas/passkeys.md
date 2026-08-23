---
title: Passkeys alongside magic links
owner: ROK
---

# Passkeys alongside magic links

Magic links have one real weakness: they depend on email deliverability for
_login_, not merely for notification (ADR-010). A bounced or spam-filed link is a
locked-out user.

Passkeys remove that dependency for anyone who enrols one, without adding
passwords. Added alongside, never replacing — the invitation flow is an email
flow, and the first sign-in on a new device has to keep working.
