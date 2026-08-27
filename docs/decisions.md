# Decision records

Short ADRs. Format: context (why this came up), decision, consequences (what it
costs us, including what we accept losing). A decision stands until a later
record supersedes it by number.

Status legend: `accepted` · `superseded by ADR-nnn` · `proposed`

---

## ADR-001 — License: AGPL-3.0, public repository

**Status:** accepted

**Context.** The candidate was FSL-1.1-ALv2 (as used by kentcdodds/kody): source
available, "no competing use", converting to Apache 2.0 after two years. The goal
was open source that is not competitively exploitable.

**Decision.** AGPL-3.0, public repository, no CLA for now.

**Consequences.** FSL is legally valid but its "Competing Use" clause is defined
against _the licensor's commercial offering_ — and there is none here, so the
clause protects close to nothing while costing OSI recognition, package-manager
distribution, and contributors who avoid source-available licences. AGPL is
recognised, and in practice deters hosted commercial forks more effectively,
since anyone operating it as a service must publish their changes. Enforcement of
either would be ours to fund, which we would not do. If monetisation ever
appears, AGPL plus a CLA keeps dual licensing open; adding a CLA later requires
contributor consent, which is cheap at zero contributors and expensive at fifty.

---

## ADR-002 — Multi-tenant from day one, invitation-only entry

**Status:** accepted

**Context.** The product could have been an internal tool for one circle.

**Decision.** Model groups as first-class tenants from the first commit; no
public sign-up. Entry via instance invites (issued by the operator) or group
invites (issued by group admins). Any authenticated user may create a group.

**Consequences.** Retrofitting multi-tenancy is the most expensive refactor of
the ones on offer; opening registration later is an afternoon. The cost is that
every query carries a group scope — see ADR-014. Two invite levels exist because
"anyone can create a group" plus "you only get in by invitation" would otherwise
have no entry point for the first member of a new circle.

---

## ADR-003 — Two roles only: admin and member

**Status:** accepted

**Context.** Roles proliferate quickly (moderator, treasurer, tool keeper).

**Decision.** `admin` and `member`. Calling an action is a member right; the
caller manages their own action, and an admin can edit or cancel any of them.

**Consequences.** Fine-grained permissions will eventually be requested and will
be a schema change, not a rewrite. Keeping action-calling open to all members is
deliberate: an app where only admins can start things dies the week the admin is
busy.

---

## ADR-004 — Soft leave; deletion anonymises

**Status:** accepted

**Context.** Leaving a group and exercising the right to erasure are different
events that are easy to conflate.

**Decision.** Leaving sets membership status to `left` and retains history under
the person's name. Deleting an account anonymises: display name becomes "Former
member", email is removed, rows survive.

**Consequences.** Shared history (who was at which action) stays intact for
everyone else, which is the point of keeping it at all. Erasure requests are
satisfied without cascade deletes that would silently rewrite other people's
records. We accept that a determined observer could re-identify a "former
member" from context inside a 15-person group; the alternative is destroying
group history.

---

## ADR-005 — Installable PWA, no native apps

**Status:** accepted

**Context.** The author has no production native-mobile experience and works
evenings.

**Decision.** One installable web app. No App Store or Play presence.

**Consequences.** Store accounts, certificates, review cycles and per-release
overhead all disappear — the largest single saving available in this project.
Costs: on iOS, push requires the user to install to the Home Screen (ADR-006),
there is no share-target integration worth relying on, and "install" needs
explaining to non-technical members.

---

## ADR-006 — Offline: read cache plus two queued writes

**Status:** accepted

**Context.** Work happens on farms, in woods and in cellars, where there is no
signal. Full offline sync was the obvious ask.

**Decision.** Service worker caches recently opened actions and the tool
catalogue for reading. Exactly two operations queue offline — ticking a task and
marking attendance — as idempotent toggles resolved last-write-wins. Every other
write requires connectivity and says so.

**Consequences.** No conflict resolution, no CRDTs, no version vectors: toggles
are the one operation where last-write-wins is not merely acceptable but
correct. We accept that a caller with no signal cannot create an action on the
spot — which is not something anyone does anyway.

---

## ADR-007 — Hosting: Cloudflare

**Status:** accepted · detail in `HOSTING.md`

**Context.** Evaluated against the standing hosting rubric.

**Decision.** Cloudflare Workers for the application and API, D1 for relational
data, Queues for notification fan-out, Cron Triggers for reminders, R2 later for
images, static assets served by the Worker. Account owner: the author.

**Consequences.** Rules 1–3 of the rubric do not apply (no client
infrastructure, no persistent server process, no contractual data-residency
commitment), so the decision lands on Rules 4/6/7, all of which point at
Cloudflare. Everything except outbound email lives with one provider, one bill,
one dashboard. Watch items: per-invocation CPU limits, and D1's ceilings if
scale ever changes character. EU residency is addressed by a D1 location hint,
not by a contractual guarantee — see ADR-016.

---

## ADR-008 — Stack: SvelteKit and TypeScript

**Status:** accepted

**Context.** The candidates were Nuxt (Vue, familiar from Shopware work) and
SvelteKit (new language, lighter output). Python and PHP were excluded by
ADR-007, since neither runs on Workers.

**Decision.** SvelteKit with `@sveltejs/adapter-cloudflare`, Svelte 5,
TypeScript.

**Consequences.** Chosen by the author's preference over the familiarity
argument. The bundle stays comfortably below Workers' size limit, which removes
the main risk in the Nuxt option. Cost: a new language and ecosystem, so
early-phase estimates should be read as optimistic. Workers Paid ($5/month) is
still required — for Queues, not for bundle size.

---

## ADR-009 — Database: D1 (SQLite) with Drizzle

**Status:** accepted

**Context.** The author knows PostgreSQL well. Keeping everything on Cloudflare
was an explicit goal.

**Decision.** D1 with Drizzle ORM and migrations in the repository. Timestamps
stored as integer epoch milliseconds; booleans as integers.

**Consequences.** No connection pooling, no second provider, no bill at this
scale. We knowingly give up PostgreSQL semantics: no native date/time types, no
`JSONB`, weaker constraint and index expressiveness, single-writer semantics.
At ≤ 300 users none of this binds. Drizzle keeps the schema in code, so a move
to PostgreSQL over Hyperdrive later is real work but not a rewrite — the trigger
for that move would be genuine concurrent-write pressure or a reporting need
SQLite cannot serve.

---

## ADR-010 — Passwordless authentication (email magic links)

**Status:** accepted

**Context.** Membership already flows through emailed invitations.

**Decision.** Sign-in by single-use emailed link; sessions in HttpOnly cookies
with server-side records in D1. No passwords. Passkeys are a later addition.

**Consequences.** No password hashing, no reset flows, no credential stuffing,
one fewer secret for members to mishandle. The cost is a hard dependency on
email deliverability for _login_, not merely for notification — a bounced or
spam-filed link means a locked-out user, so sender reputation (SPF, DKIM, DMARC
on the domain) is a launch requirement, not a polish item.

---

## ADR-011 — Outbound email via Resend

**Status:** accepted

**Context.** Cloudflare has no outbound email product; MailChannels' free
Workers integration is gone.

**Decision.** Resend as the email provider, named as a sub-processor in the
privacy policy.

**Consequences.** The single deliberate exception to "everything on Cloudflare".
Provider is replaceable behind a thin sending interface, which is worth building
because deliverability problems are provider-specific. Web Push needs no
provider — VAPID is signed directly in the Worker.

---

## ADR-012 — No in-app chat; the app generates shareable messages

**Status:** accepted

**Context.** These groups already talk on WhatsApp and Viber.

**Decision.** No messaging feature. The app is the source of truth for who is
coming and what is needed, and offers a share action producing ready-made text
plus a link (Web Share API).

**Consequences.** Moderation, notification noise, read state and abuse handling
all stay out of scope. We accept that discussion about an action is invisible to
the app, which occasionally means context lives elsewhere. Competing with
WhatsApp is not winnable; being the thing people paste into WhatsApp is.

---

## ADR-013 — No recurring actions; duplicate instead

**Status:** accepted

**Context.** Work days do repeat (spring, autumn, every second Saturday).

**Decision.** No recurrence rules. A "duplicate action" button creates a new
draft from an existing action.

**Consequences.** Avoids RRULE, per-occurrence exceptions, "edit this or all
future" semantics, and the reminder scheduling that follows — historically one of
the largest hidden costs in scheduling software. Covers most real cases at a
fraction of the work; revisit only if duplication proves insufficient in
practice.

---

## ADR-014 — Group scope enforced in one place

**Status:** accepted

**Context.** Every action and tool belongs to exactly one group, and one user may
belong to several. Tenant leaks are the most likely serious defect in this
design.

**Decision.** All data access passes through a scope helper that takes the
session's active membership; no route composes a group filter by hand. Tool
visibility (`private` / `group` / `network`) resolves inside the same helper,
which in the MVP never returns `network` results.

**Consequences.** Slightly more ceremony per query, in exchange for one testable
choke point and the ability to add the network scope later without auditing every
route. Playwright coverage of cross-group isolation is mandatory.

---

## ADR-015 — Cross-group ("friends of friends") tool catalogue deferred

**Status:** accepted

**Context.** Asked explicitly during intake: could members see tools owned by
people who share a group with someone in their group?

**Decision.** Not in the MVP. The visibility field ships from day one so that the
model does not need changing; the feature does not.

**Consequences.** The query itself is a depth-2 graph walk over memberships —
one join with two `EXISTS` clauses, milliseconds at this scale, about a day of
work. The work is everywhere else: consent (a storage note like "in Janez's
garage" is effectively an address, and its owner never agreed to show it to
strangers), a dead end in use (you can see a tool owned by someone you cannot
contact, since there is no chat and lending assumes a shared group), a second
visibility rule across every query, and near-zero value while the network is
sparse. The preferred later shape is a _request_ — broadcast "looking for a
chainsaw", and only whoever answers is revealed — because consent is then
implicit and silence stays private.

---

## ADR-016 — Data minimisation and EU residency posture

**Status:** accepted

**Context.** GDPR applies to a free app for friends exactly as it does to
anything else. There is no client DPA and no procurement constraint, so rubric
Rule 3 does not force in-region custom hosting.

**Decision.** Store display name, email, memberships, responses, attendance and
loans — nothing more. No phone numbers, no addresses, no avatars, no device
location; coordinates are optional and typed by a human. D1 is created with an
EU location hint. Publish a privacy policy and terms before the first real user,
naming Cloudflare and Resend. Retention: data lives while the group does;
accounts inactive for 24 months are warned and then anonymised. Analytics is
cookieless, so no consent banner exists.

**Consequences.** The EU location hint is an operational placement, not a
contractual guarantee — recorded honestly rather than overstated. Minimisation
is what keeps a breach boring: the worst case is a list of names, email addresses
and who owns a chainsaw.

---

## ADR-017 — Attendance only; no hours, no favour-counting

**Status:** accepted

**Context.** Hours per participant, and some form of reciprocity accounting, were
both considered.

**Decision.** After an action, the caller may optionally tick who actually came.
Nothing else is recorded. No points, credits or debts.

**Consequences.** Post-action bookkeeping stays a five-second job, which is the
only reason it will happen at all. Explicit reciprocity between friends invites
disputes and turns generosity into a ledger. A later gamification scheme ("man
points") can be derived from attendance without a migration, which is precisely
why attendance is recorded from the start.

---

## ADR-018 — Loans: warn on overlap, never block; owner approval not required

**Status:** accepted

**Context.** Reservation systems usually prevent double-booking.

**Decision.** Reservations may overlap; the system warns both parties and lets
them proceed. Borrowing requires no owner approval — you take it, log it, and the
owner is notified.

**Consequences.** No availability solver, no calendar conflict engine — the
single largest saving in the tool module. Among friends a warning is enough, and
a hard block just moves the negotiation to a phone call. Requiring approval
would mean not getting the tool until someone unlocks their phone, which is how
a tool catalogue becomes shelfware.

---

## ADR-019 — Overdue tools are chased by the system, then by a human

**Status:** accepted

**Context.** Nothing in software prevents a late return; the only real lever is
social visibility.

**Decision.** The borrower is reminded on the due date, with an "extend" button.
On expiry, both borrower and owner are notified, then the borrower is reminded
every three days, at most three times. Beyond that, the owner has a manual
"send a nudge" button, and the catalogue displays overdue state inline.

**Consequences.** Capped automatic chasing avoids the failure mode where the app
becomes a debt collector and members switch notifications off entirely. The
"extend" button matters more than the reminders: most overdue loans are not
negligence, they are someone who needed another week and had no way to say so.

---

## ADR-020 — Tailwind v4, but every value comes from a token

**Status:** accepted

**Context.** Decided during scaffolding, not during the intake interview. The
alternative was hand-written CSS with custom properties and no framework.

**Decision.** Tailwind v4 with the palette, radii and spacing defined once in
`src/routes/layout.css` — raw palette, then semantic names, then `@theme inline`
mapping. Components use semantic utilities (`bg-surface`, `text-muted`,
`rounded-card`) and never raw colours. Dark mode is a token override under
`prefers-color-scheme`, not a second set of components.

**Consequences.** Tailwind v4's CSS-first configuration means the token layer is
plain custom properties, so the design system survives a later move off
Tailwind. The discipline that makes this work is a rule, not a tool: a screen
that needs a colour or spacing value which is not a token must add the token.
Cost: another build-time dependency, and class lists that read poorly in diffs.

---

## ADR-021 — Prettier and ESLint, not Biome

**Status:** accepted · supersedes the toolchain default assumed during intake

**Context.** Biome was the working assumption (one tool, much faster). Checked
before scaffolding: its Svelte support covers `<script>` blocks, not template
syntax.

**Decision.** Prettier with `prettier-plugin-svelte` and
`prettier-plugin-tailwindcss`, plus ESLint with `eslint-plugin-svelte`.

**Consequences.** Slower, two tools instead of one, and the ecosystem default —
which is the point: a formatter that cannot format half of every `.svelte` file
is a formatter that will be argued with weekly. Revisit when Biome formats
Svelte templates.

---

## ADR-022 — Authentication is hand-rolled, not a library

**Status:** accepted

**Context.** `better-auth` is offered as a scaffolding add-on and would handle
sessions, magic links and more.

**Decision.** Implement the magic-link flow directly: hashed single-use tokens
with a short expiry, opaque session identifiers from `crypto.getRandomValues`,
sessions in D1, an HttpOnly cookie.

**Consequences.** The whole flow is roughly a hundred and fifty lines that the
author can hold in his head — which matters more here than breadth, since the
product needs one authentication method and no OAuth, no passwords, no
multi-tenancy of identity. Against it: hand-rolled auth is where subtle mistakes
live, so the non-negotiables are token hashing at rest, single use, short
expiry, rate limiting per email, and constant-time comparison. If passkeys
arrive later and prove awkward, revisiting this is fair.

---

## ADR-023 — Deploy from the laptop, not from CI

**Status:** superseded by ADR-024

**Context.** The scaffold shipped a GitHub Actions deploy workflow. It needs a
Cloudflare API token as a repository secret, and without one it failed on every
push — while CI, which is the useful signal, sat next to it in the same red.

**Decision.** Delete the deploy workflow. Production is published with
`pnpm run db:migrate:remote` followed by `pnpm run deploy`, from the machine that
already holds a `wrangler login` session. `ci.yml` stays and runs on every push.

**Consequences.** No Cloudflare credential exists outside the author's machine,
and there is exactly one red-or-green signal on the repository instead of two.
What we give up is reproducibility: production is built from whatever the working
tree contains, and the migration is a separate step someone has to remember.
That trade is right while there are no users and wrong once there are — revisit
with a scoped token (`Workers Scripts: Edit`, `D1: Edit`,
`Account Settings: Read`, one account, never a global key) and production behind
a GitHub Environment with manual approval. The workflow is in git history rather
than deleted from the world.

---

## ADR-024 — Deploy through Cloudflare Workers Builds

**Status:** accepted · supersedes ADR-023

**Context.** ADR-023 chose laptop deploys because the alternative on the table
was a Cloudflare API token living in GitHub secrets. While binding the domain,
the worker was connected to the repository in the Cloudflare dashboard, which
turns on **Workers Builds** — Cloudflare clones the repo, runs the build and
deploys, from inside the account that already owns the worker.

**Decision.** Deploys happen on push to `main`, run by Workers Builds. The
GitHub Actions workflow stays deleted. `pnpm run deploy` remains available from
any machine with a `wrangler login` session, as the escape hatch when a deploy
must not wait for a push.

**Consequences.** No credential exists outside Cloudflare — the objection that
produced ADR-023 disappears rather than being traded away, and reproducible
deploys come back with it. Two consequences to keep in view:

- Workers Builds runs a bare `npx wrangler deploy`, so **anything hidden behind
  `--env` is silently skipped.** `wrangler.jsonc` therefore has exactly one
  environment, holding production values, and local development overrides them
  through `.dev.vars`. A second environment must not be reintroduced without
  changing the deploy command in the dashboard at the same time.
- **Migrations are not part of the build.** `pnpm run db:migrate:remote` is run
  by hand before pushing a schema change. Automating it inside the build would
  mean a failed migration and a deployed worker that expects it, which is the
  worse of the two failure modes.

GitHub Actions still runs lint, type-check, unit and e2e on every push. Two
signals, and they answer different questions: GitHub says the code is sound,
Cloudflare says it is live.

---

## ADR-025 — No friend graph: groups stay the audience, tools cross them

**Status:** proposed

**Context.** With phase 1 running, the question came up of replacing groups with
a LinkedIn/Facebook-style graph of connections. Two real problems motivated it:
a tool has to be entered once per group, and an action cannot invite people from
two circles.

**Decision.** Keep groups as the audience for actions, and address both problems
without a friend graph:

- an action may invite **several groups** (`action_audience`), and
- tool visibility gains a **derived** scope: everyone you share an active group
  with, resolved in `scope.ts` like every other scope.

**Consequences.** The property being protected is the shared denominator: "2
pride" means two out of a known eight, and everyone sees the same list. That
shared list is what produces the social pressure a work day runs on, and a
per-person graph dissolves it — each viewer would see a different slice, and
"how many of us will there be" would stop having one answer. Groups also keep an
admin who can fix or cancel an action whose caller has gone quiet, and they keep
disclosure explicit: inviting two groups says out loud that the two groups will
see each other.

Deriving connections from shared membership avoids requests, accepting,
declining and unfriending — machinery Facebook needs because its users do not
already know each other. The cost is that a connection cannot exist without a
shared group; in this product that appears to be no cost at all.

Both parts wait until phase 3 has shipped and there is evidence — how much
equipment was entered twice, how many actions were called in the wrong group —
rather than being built on the strength of the argument alone. Written up in
`work/ideas/multi-group-actions.md` and
`work/ideas/tool-visibility-across-my-groups.md`.
