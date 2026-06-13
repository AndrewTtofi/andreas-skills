# Repository conventions

Skills live under `skills/`, one directory per skill, each with a `SKILL.md`.

## Wiring (enforced by `scripts/validate.mjs`)

Every shipped skill MUST:
- be listed in `.claude-plugin/plugin.json`
- be referenced (linked) in the top-level `README.md`
- be listed in `skills/README.md`

`.claude-plugin/plugin.json` must carry `name`, `description`, `version`, `author`.

Run `node scripts/validate.mjs` before every commit. It must pass.

## Skill conventions

- Frontmatter `name` must match the skill's folder name.
- `description` should include explicit trigger phrases ("Use when ...") so the
  skill activates reliably.
- Keep `SKILL.md` thin. Put depth in sibling reference files (progressive
  disclosure) and link to them.
- Every lifecycle skill declares its **Spine I/O** — what it reads from and
  writes to `.spine/`.

## The Spine

`.spine/` is the per-repo memory store: `context.md`, `conventions.md`,
`journal.md`, and `decisions/`. Skills read and write it. `init` creates it;
`remember` compacts it. It is the connective tissue across phases and sessions.

<!-- spine:contracting-gate (managed by spine init) -->
## The contracting gate

This repo uses the **Spine** (`.spine/`). Every non-trivial request starts with
`align`. Before writing code or making a change for a feature, fix, or anything
ambiguous, invoke `align` and run it to completion — an extensive interview, an
explicit confidence score, and a context playback the user confirms. **Do not
start building until confidence is high and the user has confirmed the
playback.** The point is that *both* the agent and the user are certain the
context is right.

Trivial work is exempt: one-line edits, answering a question, mechanical chores,
or anything the user has already specified unambiguously. When in doubt, align.
<!-- /spine:contracting-gate -->

## Labels

Work in the Spine is **labelled** so the path stays queryable and filterable.
ADRs carry a `- **Labels:** area, topic` line; journal History entries are tagged
`- <date> {labels} — …`. Reuse a small, shared vocabulary across both. The skills
(`align`, `design`, `remember`) record labels; the dashboard derives more from
commit `type`/`scope` and lets you filter the graph by them.
