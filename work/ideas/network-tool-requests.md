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
