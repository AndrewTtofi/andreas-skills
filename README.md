# spine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-skills-7c3aed.svg)](https://claude.com/claude-code)

> A full-lifecycle engineering skill system that makes your coding agent work
> like a senior engineer — from idea to production — and never lose the plot.

Most skill collections are a drawer of loose tools. **spine** is a
connected lifecycle, unified by a project-memory store called the **Spine**.
Every skill reads from and writes to it, so your agent carries understanding
across phases *and* across sessions.

## The problems it solves

Coding agents fail in three predictable ways. spine attacks all three
with one structural idea — shared memory.

1. **It builds the wrong thing.** It starts implementing before it understands
   what you want. → **[`align`](./skills/align/SKILL.md)** grills intent into
   crisp, testable acceptance criteria *before* any code is written, and records
   them in the Spine.
2. **The code is fragile and over-complex.** It works once, then rots into a
   ball of mud. → **[`build`](./skills/build/SKILL.md)** works in small TDD
   vertical slices and follows the conventions stored in the Spine;
   **[`verify`](./skills/verify/SKILL.md)** refuses to call anything "done"
   without evidence.
3. **It loses context between sessions.** It forgets decisions, re-explores, and
   repeats mistakes. → **[`remember`](./skills/remember/SKILL.md)** distills each
   session back into the Spine, so the next session starts informed instead of
   cold.

## The Spine

[`init`](./skills/init/SKILL.md) creates a `.spine/` folder in your repo:

| File | Holds |
|---|---|
| `context.md` | Domain language + architecture map |
| `conventions.md` | Patterns your agent must follow |
| `journal.md` | Current focus, next step, history |
| `decisions/` | ADRs — the *why* behind choices |

```
        ┌─────────────────────────────────────────────────┐
        │               THE SPINE (.spine/)               │
        │   context · conventions · journal · decisions   │
        └─────────────────────────────────────────────────┘

        init → align → design → build → verify → remember
```

## A walkthrough

A single feature, end to end — watch the Spine fill up.

```text
> init
  Detected: Next.js + TypeScript, Vitest. Seeded .spine/ ✓

> align  "add CSV export to the invoices table"
  …a few sharp questions…
  Wrote acceptance criteria to .spine/journal.md:
    - [ ] Export button downloads a CSV of the currently filtered rows
    - [ ] Columns: date, client, amount, status
    - [ ] Empty result exports headers only

> build
  RED → GREEN, slice by slice. Commits each slice.
  journal.md: 3/3 criteria ticked.

> verify
  vitest: 7 passed. 3/3 criteria met, with evidence. ✓

> remember
  Wrote ADR-0001 (CSV via streaming), updated conventions,
  compacted the journal, left a handoff. ✓
```

The next day — a **fresh session, zero prior context**:

```text
> read .spine/ and tell me where we left off
  Last session shipped CSV export for invoices (ADR-0001, streaming approach).
  Conventions now include the export pattern. No open focus.
  Ready for the next thing — no re-explaining needed.
```

That last step is the point. The Spine is the difference between an agent that
forgets and one that remembers.

## Install

```bash
npx skills@latest add AndrewTtofi/spine
```

## Skills

- **[init](./skills/init/SKILL.md)** — Bootstrap the `.spine/` store; detect the stack, seed context/conventions/journal.
- **[align](./skills/align/SKILL.md)** — Grill intent until acceptance criteria are crisp, before building.
- **[design](./skills/design/SKILL.md)** — Turn criteria into a concrete architecture (deep modules, ADRs) before code.
- **[build](./skills/build/SKILL.md)** — Implement features as small TDD vertical slices that follow your conventions.
- **[verify](./skills/verify/SKILL.md)** — Check work against the criteria with real evidence before claiming done.
- **[remember](./skills/remember/SKILL.md)** — Distill the session back into the Spine so the next one starts informed.

Roadmap (v1.1): `ship`, `troubleshoot`, `new-skill`.

## Philosophy

Small, composable, model-agnostic, reusable in any repo. Progressive disclosure
(thin skills, references on demand). AI-native efficiency. Built on engineering
fundamentals, not process ceremony.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the conventions in
[CLAUDE.md](./CLAUDE.md).

## License

[MIT](./LICENSE)
