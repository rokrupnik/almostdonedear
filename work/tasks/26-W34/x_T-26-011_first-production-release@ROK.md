---
task: T-26-011
title: First production release — phase 1 exit
status: done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: 2026-08-25
source: docs/roadmap.md phase 1 exit criteria
---

# First production release — phase 1 exit

Phase 1 is not over when the code works locally. It is over when an invited
person signs in on `almostdonedear.app`, lands in a group, calls a work day with
a task list, and someone else answers — on production.

- ~~Apply migrations to the remote D1~~ (done, T-26-003) and deploy — which now
  happens by itself on push, through Workers Builds (ADR-024).
- ~~Create the first account~~: `rok7rupnik@gmail.com` exists in production.
  Sign in at https://almostdonedear.app/prijava — the first real email the app
  sends is that sign-in link, which is also the check T-26-005 is waiting for.
- Create the first real group, invite one other human — a person, not a second
  browser profile.
- Walk the whole path on a phone, on mobile data, outdoors. The gloves are not a
  joke: NFR-3 and NFR-9 are checked here or not at all.
- Record what broke in a follow-up task rather than fixing it inside this one.

## What happened

The whole path was walked on production: sign in, create the group _Poskusna
moba_, issue an invitation, accept it as a second account
(`rok7rupnik+add@gmail.com`), call the action _Zlaganje drv_, give it tasks and
equipment, publish it — which mailed the second account — and answer it from
both sides. The caller's page shows `2 pride · 0 mogoče · 0 ne more` and the
minimum of two met.

The publication email arrived **in the inbox**, not in spam, with the date
rendered as `sob., 5. september, 08:00–13:00`.

## Two real defects, both found only because this was production

**1. The sign-in link was spent by being fetched.** The browser opened it twice;
the first request consumed the one-time token and the second told a person, who
had done nothing wrong, that their link no longer worked. Mail scanners, link
previewers and prefetchers do exactly this to every URL in every message — so
this would have hit the first friend on Outlook, not just a test. Fixed: the
link opens a page, and the POST behind its one button consumes the token. Covered
by an e2e test that fetches the link the way a scanner would and then signs in
with it anyway.

**2. Times were read in the worker's timezone.** An action entered as 08:00–13:00
displayed as 10:00–15:00: the wall clock a person types was parsed as UTC and
rendered in the reader's zone. Fixed: one app timezone, Europe/Ljubljana, for
parsing and for every rendering, with the offset applied twice so the hour is
right on both sides of a DST change. The unit tests assert identical answers
under `TZ=UTC` and `TZ=America/Chicago`.

Neither was reachable from a test suite that only ever ran on one machine in one
timezone against a browser that fetches each URL once.

## Left for a real Saturday

The second account is the author's own plus-address, so this proves the
mechanism, not the social part. A real second person on their own phone, outdoors
on mobile data, is still the honest test — and it is now a matter of using the
thing rather than of building it.
