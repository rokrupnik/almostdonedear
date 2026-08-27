---
title: Tools are visible to everyone I share a group with
owner: ROK
---

# Tools are visible to everyone I share a group with

A tool belongs to a person, not to a circle. That the chainsaw currently lives
in _Vaška moba_ is an accident of where it was typed in; its owner would lend it
to a cousin from another group just as readily. The model forces the wrong shape
today: the same saw entered twice, or invisible to half the people who would
borrow it.

## What it is

One derived relation, no new social mechanics:

> **Your connections are everyone with whom you share at least one active group.**

Tool visibility gains that scope — call it `povezave` — resolved inside
`src/lib/server/scope.ts` alongside the existing ones. The owner still chooses
per tool: `private`, `group`, `connections`. Nothing is published wider than the
owner asked for, and one entry now serves every circle they belong to.

## Why derived rather than a real friend graph

Friend requests, accepting, declining, unfriending, the awkwardness of the
ignored request — Facebook needs all of that because its users do not already
know each other. Here they do. Deriving the edge from shared membership gives
the same reach with none of that machinery, and there is no state to keep in
sync: leave the group and the edge is gone.

What it costs: you cannot have a connection to someone you share no group with.
Worth asking whether such a person exists in this app at all — every real
relationship here arrives through a group.

## How it relates to what is already decided

ADR-015 deferred the cross-group catalogue and kept `tool.visibility` in the
schema for exactly this. This is the _one-hop_ version of that idea, and it is
the honest first step: the two-hop version (friends of friends) has a consent
problem this one does not, because everyone who can see the tool is someone the
owner shares a group with.

## Watch

- The storage note ("pri Janezu v garaži") is effectively an address. It goes as
  far as the tool does — so if visibility widens, that field widens with it. It
  may deserve to stay group-scoped even when the tool does not.
- A member who leaves loses the edge, and with it visibility of tools they may
  currently have on loan. The loan record must not disappear with the view of it.
