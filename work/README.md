# `work/` — tasks and ideas

What we are doing, as markdown in the repo, so a person and an agent read the
same file. The `work` CLI is a read-only view over it:

```text
work            # the overview
work validate   # check the conventions
work next-id    # the next free task id
```

```
work/
  tasks/26-W34/   one file per task, grouped by ISO work week
  tasks/x_26-W33/ a closed week: every task in it is done
  ideas/          real but unscheduled — the later phases and loose ideas
```

## Task files

```
work/tasks/26-W34/T-26-007_passwordless-auth@ROK.md
                  │        │   │                └── assignee(s), @ROK+X for two
                  │        │   └── slug
                  │        └── global counter, MAX + 1, never reused
                  └── YY of the year the task was created
```

- **Week folder** is `YY-W<ISO week>` and records the week the task is
  _scheduled_ for. A slipped task moves folder; its number never changes.
- **Done is the `x_` prefix**, kept in step with `status: done` and `completed:`.
- **No `@NAME` means nobody owns it** — a signal, not an omission.
- Renaming is the state change; use `git mv` so history follows.

### Frontmatter

```markdown
---
task: T-26-007
title: Passwordless sign-in with emailed links
status:
  open # open planning ready in-progress review
  # integrating changes-requested blocked done
assignee: [ROK]
week: 26-W34
created: 2026-08-23
completed: # set when status flips to done
blocked-by: [T-26-003, T-26-005]
---
```

The filename is the interface for humans; the frontmatter is the interface for
tooling.

## Acceptance criteria are commands

Every task states how it is checked by something that can be run — `pnpm test`,
a `curl`, a `wrangler` invocation. A criterion that can only be eyeballed is a
criterion that will be argued about later.

## What belongs where

`docs/` holds the durable decisions (requirements, ADRs, data model, roadmap,
hosting). `work/` holds the moving parts. A task points at `docs/`; it does not
restate it.
