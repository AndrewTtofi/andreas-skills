# andreas-skills

A full-lifecycle engineering skill system for coding agents, unified by a
project-memory store called the Spine.

## Language

**Spine**: The `.spine/` folder a skill maintains in a user's repo. Holds
`context.md`, `conventions.md`, `journal.md`, and `decisions/`. The connective
tissue across phases and sessions.
_Avoid_: memory bank, context store (use "the Spine").

**Lifecycle skill**: A skill mapped to one phase of engineering work (align,
design, build, verify, ship, troubleshoot, remember) that reads from and writes
to the Spine.

**Spine I/O contract**: What a skill reads from and writes to the Spine,
declared in its SKILL.md.

## Relationships

- The **Spine** is read and written by every **Lifecycle skill**.
- `init` creates the Spine; `remember` compacts it.
