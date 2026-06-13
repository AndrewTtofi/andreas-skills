---
name: new-skill
description: Use when adding a new skill to the spine repo — scaffolds a conventions-compliant SKILL.md, wires it into plugin.json, the README, and the skill index, and runs the validator until green. Meta-tooling that dogfoods spine's own contribution rules so extensions land correctly the first time.
---

# new-skill — scaffold a spine skill, wired and valid

Adding a skill means more than writing a `SKILL.md` — it must be wired into the
manifest, the README, and the index, or `scripts/validate.mjs` fails. This skill
does the whole job to the repo's own quality bar. Unlike the lifecycle skills, it
operates on the **spine repo itself**, not a user's `.spine/`.

## Steps

1. **Read the conventions.** Load `CLAUDE.md` (the wiring rules the validator
   enforces) and `CONTRIBUTING.md`, and skim an existing `SKILL.md` as the
   template for voice and structure.
2. **Interview.** Settle, one question at a time: the skill's `name` (which must
   equal its folder), the phase/problem it owns, explicit trigger phrases for the
   description, whether it's a lifecycle skill (and thus declares **Spine I/O**),
   and what sibling reference files — if any — it needs.
3. **Write `skills/<name>/SKILL.md`.** Frontmatter `name` matching the folder and
   a `description` with "Use when …" triggers. Keep the body thin: a one-line
   intent, `## Steps`, `## Spine I/O` (for lifecycle skills), and `## Notes`. Push
   depth into sibling files and link to them — progressive disclosure.
4. **Wire it in** (all three, or the validator fails):
   - add `./skills/<name>` to `.claude-plugin/plugin.json`
   - link it in the README's Skills section
   - list it in `skills/README.md`
5. **Validate.** Run `node scripts/validate.mjs` and fix until it prints
   `All N skills valid.`
6. **Hand off.** Suggest committing, and point at `ship` to open the PR.

## What it touches

Unlike a lifecycle skill, this reads and writes the **spine repo's** own files —
`CLAUDE.md`, `CONTRIBUTING.md`, `.claude-plugin/plugin.json`, `README.md`,
`skills/README.md`, and the new `skills/<name>/` directory. It does not touch a
user's `.spine/`.

## Notes

- The validator is the test. A skill isn't done until `scripts/validate.mjs` is
  green — frontmatter `name` must equal the folder, and all three wirings present.
- Match the existing skills' voice: senior-engineer terse, no ceremony.
- Don't bloat `SKILL.md`. If it's getting long, a sibling reference file is the answer.
