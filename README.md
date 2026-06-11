# andreas-skills

> A full-lifecycle engineering skill system that makes your coding agent work
> like a senior engineer — from idea to production — and never lose the plot.

Most skill collections are a drawer of loose tools. **andreas-skills** is a
connected lifecycle, unified by a project-memory store called the **Spine**.
Every skill reads from and writes to it, so your agent carries understanding
across phases *and* across sessions.

## The Spine

`init` creates a `.spine/` folder in your repo:

| File | Holds |
|---|---|
| `context.md` | Domain language + architecture map |
| `conventions.md` | Patterns your agent must follow |
| `journal.md` | Current focus, next step, history |
| `decisions/` | ADRs — the *why* behind choices |

The Spine attacks the three classic agent failures at once: building the wrong
thing, fragile/over-complex code, and losing context between sessions.

## The lifecycle loop

```
align → build → verify → remember
        (with the Spine read & written at every step)
```

## Install

```bash
npx skills@latest add AndrewTtofi/andreas-skills
```

## Skills (v1)

- **[init](./skills/init/SKILL.md)** — Bootstrap the `.spine/` store; detect the stack, seed context/conventions/journal.
- **[align](./skills/align/SKILL.md)** — Grill intent until acceptance criteria are crisp, before building.
- **[build](./skills/build/SKILL.md)** — Implement features as small TDD vertical slices that follow your conventions.
- **[verify](./skills/verify/SKILL.md)** — Check work against the criteria with real evidence before claiming done.
- **[remember](./skills/remember/SKILL.md)** — Distill the session back into the Spine so the next one starts informed.

Roadmap (v1.1): `design`, `ship`, `troubleshoot`, `new-skill`.

## Philosophy

Small, composable, model-agnostic, reusable in any repo. Progressive disclosure
(thin skills, references on demand). AI-native efficiency. Built on engineering
fundamentals, not process ceremony.

## License

MIT
