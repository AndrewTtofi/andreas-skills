# `design` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the `design` skill (spine v1.1) — architecture-before-code, greenfield-first, recorded as ADRs + an architecture map in the Spine. Ships deep (SKILL.md + 3 reference files) and fully wired.

**Architecture:** `scripts/validate.mjs` is the test harness. Task 1 authors the skill files (validator stays green because the skill isn't listed yet). Task 2 wires it into plugin.json/README/skills-README (validator goes red on the wiring check, then green).

**Tech Stack:** Markdown, JSON, Node 26.

**Working dir:** `/Users/andreasttofi/Desktop/ttofis/skills-for-me/spine`, branch `v1-skills`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `skills/design/SKILL.md` | Thin design workflow |
| `skills/design/interface-design.md` | Deep modules / information hiding reference |
| `skills/design/adr-format.md` | ADR template the skill writes |
| `skills/design/architecture-questions.md` | Decision/question bank (greenfield vs existing) |
| `.claude-plugin/plugin.json` | Add `./skills/design` |
| `README.md` | Add design to Skills + lifecycle loop; update roadmap |
| `skills/README.md` | Add design; update roadmap |

---

## Task 1: Author the `design` skill files

**Files:**
- Create: `skills/design/SKILL.md`
- Create: `skills/design/interface-design.md`
- Create: `skills/design/adr-format.md`
- Create: `skills/design/architecture-questions.md`

- [ ] **Step 1: Confirm validator is green before starting**

Run: `node scripts/validate.mjs`
Expected: `All 5 skills valid.` exit 0. (design isn't listed yet, so it isn't checked.)

- [ ] **Step 2: Create `skills/design/SKILL.md`**

````markdown
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
````

- [ ] **Step 3: Create `skills/design/interface-design.md`**

```markdown
# Interface design — deep modules

The best modules are **deep**: a simple interface hiding a substantial
implementation. They let a lot of functionality be used through a small surface.

## Principles

- **Small interface, deep implementation.** Maximize the functionality behind
  the smallest possible interface. One method that does a lot beats five that
  each leak internals.
- **Information hiding.** Each module should encapsulate a design decision the
  rest of the system doesn't need to know. If changing an internal choice forces
  changes in callers, the boundary is wrong.
- **Avoid shallow modules.** A wrapper that adds an interface as complex as what
  it wraps earns nothing. Pass-through methods and "manager" classes that just
  delegate are red flags.
- **Define errors out of existence** where you can — design interfaces so common
  error cases simply can't arise, rather than making every caller handle them.
- **General-purpose beats special-purpose.** A slightly more general interface is
  usually simpler and more reusable than several special-cased ones.

## Questions to ask of each module

- Can a caller use this without understanding its internals?
- Can I change the implementation without changing callers?
- Does the interface expose decisions that should be hidden?
- Is this module pulling its weight, or is it a shallow pass-through?

## Boundaries

Group what changes together; split what changes for different reasons. A good
boundary is one you can describe in a sentence: "everything about X lives here,
and the rest of the system only knows Y about it."
```

- [ ] **Step 4: Create `skills/design/adr-format.md`**

`````markdown
# ADR format

An Architecture Decision Record captures one significant decision and, crucially,
*why* it was made — so future sessions don't relitigate it.

Write each ADR to `.spine/decisions/NNNN-short-title.md`, where `NNNN` is the
next 4-digit number after the highest existing ADR (start at `0001`).

## Template

```markdown
# NNNN. <Short title in the imperative, e.g. "Use Postgres for the data store">

- **Status:** accepted
- **Date:** <YYYY-MM-DD>

## Context

<The forces at play: the problem, the constraints, what we know. Use the
project's shared language from context.md.>

## Decision

<The choice we made, stated plainly.>

## Consequences

<What this makes easy, what it makes hard, and what we're now committed to.
Include notable trade-offs we accepted.>
```

## Guidance

- One decision per ADR. If you're tempted to write "and also", split it.
- Record the alternatives you rejected and why — that's the most valuable part.
- ADRs are immutable history. To change a decision, write a new ADR that
  supersedes the old one (note it in both).
`````

- [ ] **Step 5: Create `skills/design/architecture-questions.md`**

```markdown
# Architecture question bank

The decisions worth interviewing on. Pick the ones that matter for this work;
skip what the Spine already answers. Ask one at a time.

## Greenfield (new project)

- **Stack & scaffolding** — language, framework, and how the project is bootstrapped. What does `conventions.md` already imply?
- **Data model** — the core entities and their relationships. What's the source of truth?
- **Persistence** — where state lives (DB, files, external service) and why.
- **Module boundaries** — the top-level pieces and the single responsibility of each.
- **Key interfaces** — how the major modules talk to each other (the contracts).
- **External dependencies** — third-party services/libraries, and what we're coupling ourselves to.
- **Data / control flow** — how a representative request or action moves through the system.
- **Failure modes** — what can go wrong, and how the design contains it.
- **Boundaries of v1** — what's explicitly out of scope for the first build.

## Existing codebase (feature within current architecture)

- **Current shape** — which existing modules does this touch? Read them first.
- **Fit** — does this extend an existing pattern, or introduce a new one? Prefer extending.
- **New boundaries** — what new module/interface is needed, and where does it sit?
- **Data model delta** — what entities/fields/migrations change?
- **Blast radius** — what else depends on the code being changed? What could regress?
- **Consistency** — which existing ADRs and conventions constrain this design?

## For every decision

- What are the 2–3 viable approaches and their trade-offs?
- Which gives the deepest module / simplest interface?
- What's the cost of being wrong, and how reversible is it?
- Is this needed now (YAGNI), or are we designing for an imagined future?
```

- [ ] **Step 6: Run the validator (still green — design not yet listed)**

Run: `node scripts/validate.mjs`
Expected: `All 5 skills valid.` exit 0. The new files exist but aren't wired, so they aren't checked yet.

- [ ] **Step 7: Commit**

```bash
git add skills/design
git commit -m "feat: add design skill files (architecture before code)"
```

---

## Task 2: Wire `design` into the plugin, README, and skill index

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `README.md`
- Modify: `skills/README.md`

- [ ] **Step 1: Add `design` to `.claude-plugin/plugin.json`**

Find:
```json
    "./skills/init",
    "./skills/align",
    "./skills/build",
```
Replace with:
```json
    "./skills/init",
    "./skills/align",
    "./skills/design",
    "./skills/build",
```

- [ ] **Step 2: Run the validator to verify it now fails (red)**

Run: `node scripts/validate.mjs`
Expected: FAIL — `README.md does not reference design/SKILL.md` and `skills/README.md does not reference design/SKILL.md`. (The `skills/design/SKILL.md` file itself exists and its frontmatter is valid, so the only errors are the two wiring references.)

- [ ] **Step 3: Update the README lifecycle loop line**

In `README.md`, find:
```
        init → align → build → verify → remember
```
Replace with:
```
        init → align → design → build → verify → remember
```

- [ ] **Step 4: Update the README Skills section**

In `README.md`, find this exact block:
```
## Skills (v1)

- **[init](./skills/init/SKILL.md)** — Bootstrap the `.spine/` store; detect the stack, seed context/conventions/journal.
- **[align](./skills/align/SKILL.md)** — Grill intent until acceptance criteria are crisp, before building.
- **[build](./skills/build/SKILL.md)** — Implement features as small TDD vertical slices that follow your conventions.
- **[verify](./skills/verify/SKILL.md)** — Check work against the criteria with real evidence before claiming done.
- **[remember](./skills/remember/SKILL.md)** — Distill the session back into the Spine so the next one starts informed.

Roadmap (v1.1): `design`, `ship`, `troubleshoot`, `new-skill`.
```
Replace it with:
```
## Skills

- **[init](./skills/init/SKILL.md)** — Bootstrap the `.spine/` store; detect the stack, seed context/conventions/journal.
- **[align](./skills/align/SKILL.md)** — Grill intent until acceptance criteria are crisp, before building.
- **[design](./skills/design/SKILL.md)** — Turn criteria into a concrete architecture (deep modules, ADRs) before code.
- **[build](./skills/build/SKILL.md)** — Implement features as small TDD vertical slices that follow your conventions.
- **[verify](./skills/verify/SKILL.md)** — Check work against the criteria with real evidence before claiming done.
- **[remember](./skills/remember/SKILL.md)** — Distill the session back into the Spine so the next one starts informed.

Roadmap (v1.1): `ship`, `troubleshoot`, `new-skill`.
```

- [ ] **Step 5: Update `skills/README.md`**

Replace the entire file content with:
```markdown
# Skills

The lifecycle loop. Each skill reads from and writes to the Spine (`.spine/`).

- **[init](./init/SKILL.md)** — Bootstrap the `.spine/` store; detect the stack, seed context/conventions/journal.
- **[align](./align/SKILL.md)** — Grill intent until acceptance criteria are crisp, before building.
- **[design](./design/SKILL.md)** — Turn criteria into a concrete architecture (deep modules, ADRs) before code.
- **[build](./build/SKILL.md)** — Implement features as small TDD vertical slices that follow your conventions.
- **[verify](./verify/SKILL.md)** — Check work against the criteria with real evidence before claiming done.
- **[remember](./remember/SKILL.md)** — Distill the session back into the Spine so the next one starts informed.

Roadmap (v1.1): `ship`, `troubleshoot`, `new-skill`.
```

- [ ] **Step 6: Run the validator (green — 6 skills wired)**

Run: `node scripts/validate.mjs`
Expected: `All 6 skills valid.` and exit 0. (Note: now 6, not 5.)

- [ ] **Step 7: Commit**

```bash
git add .claude-plugin/plugin.json README.md skills/README.md
git commit -m "feat: wire design skill into plugin, README, and skill index"
```

---

## Self-Review

**Spec coverage** (vs `docs/specs/2026-06-11-design-skill-design.md`):
- Workflow (read Spine → detect mode → map decisions → interview → options → record ADRs/map → confirm) → SKILL.md Steps 1–7. ✓
- Greenfield-first, supports both → SKILL.md Step 2 + architecture-questions.md two sections. ✓
- Interview → options → ADRs method → SKILL.md Steps 4–6. ✓
- Spine I/O (reads context/conventions/journal; writes context/decisions/journal) → SKILL.md "Spine I/O". ✓
- Deep skill: SKILL.md + interface-design.md + adr-format.md + architecture-questions.md → Task 1. ✓
- ADR numbering 4-digit, next-after-highest → SKILL.md Step 6 + adr-format.md. ✓
- Wiring: plugin.json, README skills + loop, skills/README, roadmap update → Task 2. ✓
- Non-goals (no code-gen, no ship/troubleshoot/new-skill) → respected; roadmap keeps the latter three. ✓

**Placeholder scan:** The `<...>` inside adr-format.md's template are intentional ADR fill-in markers (the template the skill writes), not plan gaps — same pattern as init's templates.

**Consistency:** Validator success message will read "All 6 skills valid." after Task 2 (it counts `plugin.skills.length`). Both README and skills/README reference `design/SKILL.md` (substring check satisfied). plugin.json inserts `./skills/design` between align and build, matching the lifecycle order. Roadmap reduced to `ship`/`troubleshoot`/`new-skill` in both README and skills/README — consistent. The lifecycle loop line fits under the 49-wide Spine box (≈57 cols vs 59-col box).
