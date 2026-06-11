---
name: design
description: Use after align and before build to turn acceptance criteria into a concrete architecture — module boundaries, interfaces, data flow — recorded as ADRs and an architecture map in the Spine. Greenfield-first; also designs features within an existing codebase. Use when starting a new project, making upfront architectural decisions, or designing a non-trivial feature.
---

# design — architecture before code

Turn aligned intent into a concrete architecture the way a senior engineer does:
deep modules, clear boundaries, decisions recorded with their *why*. Run this
after `align` and before `build`.

## Steps

1. **Read the Spine.** Load the acceptance criteria from `journal.md` and the
   existing `context.md` / `conventions.md`. If there are no criteria yet, run
   `align` first.
2. **Detect the mode.**
   - *Greenfield* — `context.md` is thin/empty and there are no modules yet.
     Architect from scratch: include stack/scaffolding decisions.
   - *Existing codebase* — read the current architecture first (key modules,
     patterns) and the existing ADRs in `.spine/decisions/`. Design to fit;
     respect what's there.
3. **Map the decision space.** Identify the consequential choices — see
   [architecture-questions.md](architecture-questions.md). Typically: data
   model, module boundaries, key interfaces, external dependencies, data/state
   flow, and failure modes.
4. **Interview.** Ask one question at a time, multiple-choice where possible,
   only on decisions that matter. Don't ask what the Spine already answers.
5. **Propose options.** For each major decision, offer 2–3 approaches with
   trade-offs and a recommendation. Favor [deep modules](interface-design.md) —
   small interface, deep implementation — clear boundaries, and YAGNI. Don't
   over-engineer.
6. **Record the architecture in the Spine.**
   - Update `context.md`: the architecture map (modules + how they connect) and
     any new shared-language terms.
   - Write one ADR per significant decision in `.spine/decisions/NNNN-title.md`
     using [adr-format.md](adr-format.md). Number `NNNN` as the next 4-digit
     value after the highest existing ADR (start at `0001`).
   - Write a build-ready slice breakdown and the next step to `journal.md`.
7. **Confirm** the design with the user before building.

## Spine I/O

- **Reads:** `context.md`, `conventions.md`, `journal.md`.
- **Writes:** `context.md` (architecture map), `decisions/` (ADRs),
  `journal.md` (build plan / next step).

## Notes

- Design is decisions, not code. Produce the architecture and the plan; `build`
  writes the code.
- In an existing codebase, never propose a redesign that ignores current
  patterns — improve within them.
- An ADR captures *why*, so future sessions don't relitigate settled choices.
