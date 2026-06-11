# andreas-skills — Design Spec

**Date:** 2026-06-11
**Status:** Approved (design) → pending implementation plan
**Author:** Andreas Ttofi

## One-liner

A full-lifecycle engineering skill system that makes Claude Code work like a
senior engineer from idea to production — unified by a project-memory **Spine**
so it never loses the plot across phases or sessions.

## Why this exists

The skills ecosystem is full of *drawers of loose tools*: useful individually,
but disconnected. Three failure modes keep recurring with coding agents:

1. **Builds the wrong thing** — runs off implementing before intent is aligned.
2. **Fragile / over-complex code** — works once, then rots into a ball of mud.
3. **Loses context across sessions** — forgets decisions, re-explores, repeats
   mistakes.

`andreas-skills` attacks all three with one structural idea: every skill reads
from and writes to a small, persistent per-project memory store. That store —
the Spine — is the connective tissue that makes a *system* out of a *drawer*.

## Differentiation

- **vs generic skills repos:** they are collections; this is a connected
  lifecycle with shared memory.
- **Defensible identity:** the Spine. Almost no skills repo systematizes
  cross-session/cross-phase memory. It leans on what Claude Code already has
  (CLAUDE.md, plan mode, subagents) rather than inventing a heavyweight
  framework.
- **Generic & reusable:** works in any repo, any stack, model-agnostic.

> Note: "most starred" is an outcome, not a lever. We optimize the controllable
> inputs — genuine value, sharp identity, polish, discoverability — and let
> stars follow.

## Architecture — The Spine

A lightweight `.spine/` folder Claude maintains in any repo. Generic name so any
engineer can adopt it. Created/located by `init`.

```
.spine/
├── context.md       # domain language + architecture map (shared vocabulary)
├── conventions.md   # stack patterns Claude MUST follow
├── journal.md       # running log: what's done, current focus, next step
└── decisions/       # ADRs — why things are the way they are
    └── NNNN-*.md
```

| File | Purpose | Pain it attacks |
|---|---|---|
| `context.md` | Shared vocabulary + architecture map | verbosity, "builds wrong thing" |
| `conventions.md` | Patterns to follow consistently | inconsistency, ball-of-mud |
| `journal.md` | Current focus + next step + history | **loses context across sessions** |
| `decisions/` | ADRs capturing the *why* | regressions, fragile rework |

### Spine I/O contract

Every lifecycle skill declares what it **reads** and **writes**. This is the
core invariant that keeps the system coherent:

- A skill **reads** the Spine at start to ground itself in prior context.
- A skill **writes** to the Spine when it produces durable knowledge
  (decisions, conventions, progress) — not transient chatter.
- `journal.md` is append-mostly; `remember` is responsible for compaction.

## The lifecycle loop

```
        ┌──────────────────────────────────────────────┐
        │                THE SPINE (.spine/)             │
        │   context · conventions · journal · decisions  │
        └──────────────────────────────────────────────┘
           ▲      ▲      ▲      ▲      ▲      ▲      ▲
   align → design → build → verify → ship → troubleshoot → remember
```

`remember` closes the loop: it distills each session back into the Spine, so the
next session starts informed instead of cold.

## Skill catalog

| Skill | Phase | What it does | Spine I/O |
|---|---|---|---|
| `init` | foundation | Bootstraps `.spine/`; detects stack, seeds `context.md`/`conventions.md` | **writes** all |
| `align` | align | Grills on intent until acceptance criteria are crisp | writes intent + criteria → journal |
| `design` | design | Architecture & interface design; deep modules, not balls of mud | writes ADRs + context |
| `build` | build | TDD vertical-slice implementation following `conventions.md` | reads all · writes journal |
| `verify` | verify | Review + run tests + check work vs acceptance criteria | reads criteria · writes journal |
| `ship` | deploy | Release-readiness checklist (env, migrations, rollback, smoke) | reads · writes journal |
| `troubleshoot` | debug | Reproduce→minimize→hypothesize→fix→regress loop | writes findings → journal/ADR |
| `remember` | close | Distills the session into the Spine; clean handoff + compaction | **writes** all |
| `new-skill` | meta | Authors new skills in this repo's style (self-extending) | — |

### Design tenets (what keeps each skill good)

- **Small & composable** — each skill does one job; they chain.
- **Progressive disclosure** — thin `SKILL.md` + reference files loaded on demand.
- **Model-agnostic** — no dependence on a specific model's quirks.
- **Reusable** — no assumptions about a specific repo or stack.
- **AI-native efficiency** — skills explicitly use subagents, parallelism, and
  plan mode where it genuinely helps; mindful of tokens.

## Repo structure

```
andreas-skills/
├── README.md            # vision · the Spine · install · skill reference
├── LICENSE              # MIT
├── CONTEXT.md           # shared language for repo contributors
├── .claude-plugin/
│   └── plugin.json      # installable via skills.sh
├── skills/
│   ├── init/SKILL.md
│   ├── align/SKILL.md   # + reference files per skill
│   └── … one dir per skill
└── docs/
    ├── specs/           # design specs (this file)
    └── adr/             # decisions about the repo itself
```

### Distribution

Installable via `npx skills add AndrewTtofi/andreas-skills` (skills.sh), an
existing discovery channel. `plugin.json` lists every shipped skill.

## Scope

### v1 — the minimal loop that proves the Spine end-to-end

> `init` → `align` → `build` → `verify` → `remember`

Five skills: bootstrap memory, nail intent, build with TDD, verify quality,
persist learning. After `remember`, a fresh session reads the Spine and is
*already informed* — the demoable differentiator, and it hits the top three
pains directly.

### v1.1 — complete the lifecycle

`design`, `ship`, `troubleshoot`, `new-skill`.

### Non-goals (for now)

- No heavyweight process framework that takes control away from the user.
- No issue-tracker integrations in v1 (can come later as optional skills).
- No model-specific tuning.
- We do not copy other authors' skills; patterns may inspire, prose is original.

## Success criteria

- A new user can run `init` in any repo and get a seeded `.spine/` in <2 min.
- Running the v1 loop on a real feature produces: aligned criteria, a
  TDD-built slice, a verification pass, and a Spine that lets a *fresh* session
  resume with zero re-explaining.
- Each `SKILL.md` is self-contained, model-agnostic, and reads like the work of
  a senior engineer.
- The repo installs cleanly via skills.sh.

## Open questions

- Exact `journal.md` compaction strategy in `remember` (size/age threshold).
- Whether `conventions.md` should be auto-derived from the codebase by `init`
  or hand-seeded then refined.

These are deferred to the implementation plan.
