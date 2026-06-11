# `design` Skill — Design Spec

**Date:** 2026-06-11
**Status:** Approved (design) → pending implementation plan
**Author:** Andreas Ttofi
**Part of:** spine v1.1

## Goal

Add the `design` skill — the "how" step between `align` (what/why) and `build`.
It turns aligned acceptance criteria into a concrete architecture *before* any
code, and records the decisions in the Spine so `build` and every future session
inherit them. Greenfield-first; also supports designing a feature inside an
existing codebase. Closes spine's weakest spot: the 0→1 architecture moment.

## Lifecycle position

```
align → design → build → verify → remember
```

`design` reads the criteria `align` wrote; it writes the architecture map, ADRs,
and a build-ready slice breakdown that `build` consumes.

## Method (locked during brainstorming)

**Greenfield-first, supports both. Interview → options → ADRs.**

## Workflow

1. **Read the Spine** — acceptance criteria from `journal.md`, plus existing
   `context.md` / `conventions.md`.
2. **Detect the mode:**
   - *Greenfield* — thin/empty context, no modules yet → architect from scratch
     (broader question set incl. scaffolding/stack decisions).
   - *Existing codebase* — read the current architecture first; respect existing
     patterns and ADRs; design to fit (smaller, targeted question set).
3. **Map the decision space** — the consequential choices: data model, module
   boundaries, key interfaces, external dependencies, data/state flow, failure
   modes.
4. **Interview** — one question at a time, multiple-choice where possible, only
   on decisions that actually matter. Don't ask what the Spine already answers.
5. **Propose options** — for each major decision, 2–3 approaches with trade-offs
   and a recommendation. Bias toward **deep modules** (small interface, deep
   implementation), clear boundaries, and YAGNI.
6. **Record the architecture in the Spine:**
   - update `context.md` — architecture map + shared language
   - write one ADR per significant decision in `decisions/NNNN-*.md`
     (context · decision · why · consequences)
   - write a build-ready slice breakdown + next step to `journal.md`
7. **Confirm** the design with the user before `build` starts.

## Spine I/O

- **Reads:** `context.md`, `conventions.md`, `journal.md`.
- **Writes:** `context.md` (architecture map), `decisions/` (ADRs),
  `journal.md` (build plan / next step).

## Structure (progressive disclosure — ships as a *deep* skill)

- `skills/design/SKILL.md` — thin workflow.
- `skills/design/interface-design.md` — deep modules, information hiding, clean
  interfaces.
- `skills/design/adr-format.md` — the ADR template the skill writes.
- `skills/design/architecture-questions.md` — the decision/question bank, split
  greenfield vs existing.

## Wiring

- Add `./skills/design` to `.claude-plugin/plugin.json` (after `align`).
- Add `design` to the README Skills section and `skills/README.md`.
- Update the README lifecycle loop to `align → design → build → verify → remember`.
- Remove `design` from the roadmap (now shipped); roadmap becomes `ship`,
  `troubleshoot`, `new-skill`.
- `scripts/validate.mjs` enforces the wiring automatically.

## Non-goals

- No code scaffolding/generation by `design` itself — it produces the
  architecture + plan; `build` writes code.
- No `ship` / `troubleshoot` / `new-skill` (still roadmap).
- Does not replace `align`; if criteria are missing, it points back to `align`.

## Success criteria

- On a greenfield repo, `design` produces an architecture map in `context.md`,
  at least one ADR, and a slice breakdown in `journal.md` that `build` can pick
  up — with no re-explaining.
- On an existing repo, it reads and respects current structure before proposing.
- `node scripts/validate.mjs` passes with `design` fully wired (6 skills).
- The skill reads like a senior architect wrote it; reference files add depth.

## Open questions

- ADR numbering: `design` should pick the next `NNNN` by scanning existing
  `.spine/decisions/`. Confirm the zero-padding width (use 4 digits: `0001`).
