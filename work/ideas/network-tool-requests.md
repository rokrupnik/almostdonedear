---
title: Ask the wider network for a tool, without exposing a catalogue
owner: ROK
---

# Ask the wider network for a tool, without exposing a catalogue

The friends-of-friends catalogue was considered and deliberately deferred
(ADR-015). The query is a depth-2 walk over memberships — one join, milliseconds,
about a day of work. Everything else is the hard part: a storage note like "pri
Janezu v garaži" is effectively an address, and its owner never agreed to show it
to strangers; and a tool you can see but cannot ask for is a dead end, because
there is no chat and lending assumes a shared group.

The better shape, when the network is dense enough to be worth it: **a request,
not a catalogue.** "Iščem motorno žago za soboto" fans out to friends of friends;
only whoever answers is revealed. Consent is then implicit, and silence stays
private.

The model is already prepared for either: `tool.visibility` ships with
`private | group | network`, and `network` resolves to nothing inside one
function in `src/lib/server/scope.ts`.

## Where this sits now

ADR-025 takes the one-hop step first: tools visible to everyone you share a
group with (`work/ideas/tool-visibility-across-my-groups.md`). That covers the
"entered twice" problem and needs no consent machinery, because everyone who can
see the tool already shares a group with its owner.

This file stays the two-hop idea, and the consent problem described above is
exactly what one hop does not have. If one hop turns out to be enough, this is
the right thing to never build.
