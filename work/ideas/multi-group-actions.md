---
title: One action, several groups invited
owner: ROK
---

# One action, several groups invited

Today an action belongs to exactly one group, so a work day that wants the
village crew _and_ the two cousins from another circle has no home. The instinct
is to blame the group model and reach for a friend graph; the cheaper reading is
that this is one missing feature.

## What it is

The audience of an action becomes a set of groups rather than a single one. A
join table — `action_audience(action_id, group_id)` — and one change in
`src/lib/server/scope.ts`: you may see an action if you are an active member of
**any** of its audience groups. Tasks, equipment, responses and the publication
email need no changes; they already hang off the action.

## Why this rather than a friend graph

The thing worth protecting is the **denominator**. "2 pride" means two out of a
known eight; everyone sees the same list, and that shared list is what makes the
social pressure work — Janez comes because he can see that Miha is coming. In a
per-person friend graph every viewer sees a different slice, so "how many of us
will there be" stops having one answer.

It also keeps disclosure explicit. Inviting two groups says plainly that the two
groups will see each other, which is a decision the caller makes once and can
see, rather than a side effect of who happens to follow whom.

And the admin role survives: someone can still fix or cancel an action that its
caller has stopped answering for.

## Open questions

- Does the group's name appear next to a person in the list of answers? Useful
  when two circles meet and half the names are unfamiliar; noise when they are
  not. Probably: show it only when the action has more than one audience group.
- Can a member of group A invite group B, or only someone who belongs to both?
  Leaning to the latter — you may only hand out an audience you are part of.
- What happens to the action if it is left with one audience group and you leave
  it? Nothing; the action stays, like every other piece of history.

## Not this

A per-action guest link — one person, no membership, for the neighbour with the
tractor — is a separate and also useful idea. It is the same scope-helper change,
so the two would land well together, but they solve different problems and
should not be argued about as one.
