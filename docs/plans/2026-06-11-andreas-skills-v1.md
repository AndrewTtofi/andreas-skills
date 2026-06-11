# andreas-skills v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 loop of andreas-skills — `init → align → build → verify → remember` — five Claude Code skills unified by a `.spine/` project-memory store, packaged as an installable skills.sh plugin.

**Architecture:** A skills-repo (markdown `SKILL.md` files + `.claude-plugin/plugin.json`). Skills are documents, not runnable code, so the "test" is a Node validator (`scripts/validate.mjs`) that enforces structural invariants: every skill in `plugin.json` exists, has valid frontmatter, and is wired in. Each skill task follows a red→green→commit loop against the validator. The `init` skill bundles `.spine/` templates; the other skills read the user's `.spine/` files at runtime.

**Tech Stack:** Markdown, JSON, Node 26 (validator only). No runtime dependencies — model-agnostic, generic.

---

## File Structure

| Path | Responsibility |
|---|---|
| `LICENSE` | MIT license |
| `CONTEXT.md` | Shared language for contributors (Spine, lifecycle terms) |
| `.claude-plugin/plugin.json` | Lists the 5 shipped skills; makes the repo installable |
| `scripts/validate.mjs` | Test harness — validates every skill's structure + wiring |
| `skills/init/SKILL.md` | Bootstrap `.spine/` |
| `skills/init/templates/*.md` | Seed templates for `context.md`, `conventions.md`, `journal.md` |
| `skills/align/SKILL.md` | Grill intent → acceptance criteria |
| `skills/build/SKILL.md` | TDD vertical-slice implementation |
| `skills/verify/SKILL.md` | Verify against criteria with evidence |
| `skills/remember/SKILL.md` | Distill session back into `.spine/` |
| `README.md` | Vision · the Spine · install · skill reference |

Each `SKILL.md` is intentionally thin (progressive disclosure). Skills read `.spine/` files that exist in the *user's* repo at runtime, so they don't bundle the Spine format — only `init` does.

---

## Task 1: Repo scaffolding + validator (the test harness)

**Files:**
- Create: `LICENSE`
- Create: `CONTEXT.md`
- Create: `.claude-plugin/plugin.json`
- Create: `scripts/validate.mjs`

- [ ] **Step 1: Write the validator (the failing test)**

Create `scripts/validate.mjs`:

```js
#!/usr/bin/env node
// Validates that every skill listed in plugin.json is structurally sound.
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const errors = [];
const ok = (m) => console.log(`  ok  ${m}`);

const pluginPath = join(root, ".claude-plugin/plugin.json");
if (!existsSync(pluginPath)) {
  console.error("FAIL: .claude-plugin/plugin.json missing");
  process.exit(1);
}
const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
if (!Array.isArray(plugin.skills) || plugin.skills.length === 0) {
  errors.push("plugin.json has no skills[]");
}

for (const rel of plugin.skills ?? []) {
  const dir = join(root, rel);
  const skillFile = join(dir, "SKILL.md");
  if (!existsSync(skillFile)) {
    errors.push(`${rel}: SKILL.md missing`);
    continue;
  }
  const src = readFileSync(skillFile, "utf8");
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    errors.push(`${rel}: missing YAML frontmatter`);
    continue;
  }
  const name = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const desc = fm[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name) errors.push(`${rel}: frontmatter missing name`);
  if (!desc) errors.push(`${rel}: frontmatter missing description`);
  if (name && name !== basename(rel)) {
    errors.push(`${rel}: name "${name}" != folder "${basename(rel)}"`);
  }
  if (name && desc) ok(`${rel} (${name})`);
}

if (errors.length) {
  console.error("\nVALIDATION FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nAll ${plugin.skills.length} skills valid.`);
```

- [ ] **Step 2: Create the plugin manifest listing all 5 v1 skills**

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "andreas-skills",
  "skills": [
    "./skills/init",
    "./skills/align",
    "./skills/build",
    "./skills/verify",
    "./skills/remember"
  ]
}
```

- [ ] **Step 3: Run the validator to verify it fails**

Run: `node scripts/validate.mjs`
Expected: FAIL — `./skills/init: SKILL.md missing` (and the other four). This proves the harness detects missing skills.

- [ ] **Step 4: Create LICENSE (MIT)**

Create `LICENSE`:

```
MIT License

Copyright (c) 2026 Andreas Ttofi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Create CONTEXT.md (shared language)**

Create `CONTEXT.md`:

```markdown
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
```

- [ ] **Step 6: Commit**

```bash
git add LICENSE CONTEXT.md .claude-plugin/plugin.json scripts/validate.mjs
git commit -m "chore: scaffold repo + skill validator harness"
```

---

## Task 2: `init` skill — bootstrap the Spine

**Files:**
- Create: `skills/init/SKILL.md`
- Create: `skills/init/templates/context.md`
- Create: `skills/init/templates/conventions.md`
- Create: `skills/init/templates/journal.md`

- [ ] **Step 1: Run the validator to confirm `init` is still missing (red)**

Run: `node scripts/validate.mjs`
Expected: FAIL — `./skills/init: SKILL.md missing`.

- [ ] **Step 2: Create the Spine templates**

Create `skills/init/templates/context.md`:

```markdown
# Project Context

> Shared vocabulary and architecture map. Keep it concise — one concept per entry.

## What this project is

<one paragraph: the product and who it's for>

## Architecture map

<key modules and how they connect — bullet list>

## Language

**<Term>**: <definition> _Avoid_: <discouraged synonyms>
```

Create `skills/init/templates/conventions.md`:

```markdown
# Conventions

> Patterns Claude MUST follow in this repo. Derived from the codebase, refined over time.

## Stack

<detected stack>

## Commands

- Install: `<cmd>`
- Test: `<cmd>`
- Typecheck: `<cmd>`
- Build/Run: `<cmd>`

## Patterns

- <convention the agent must follow>
```

Create `skills/init/templates/journal.md`:

```markdown
# Journal

## Current focus

<what we're working on right now>

## Next step

<the single next action>

## History

- <date> — <what happened>
```

- [ ] **Step 3: Create `skills/init/SKILL.md`**

```markdown
---
name: init
description: Use to bootstrap the .spine/ project-memory store in a repo before using other andreas-skills. Detects the stack and seeds context.md, conventions.md, and journal.md. Run once per repo.
---

# init — bootstrap the Spine

The Spine (`.spine/`) is the shared memory every andreas-skill reads and writes.
This skill creates it.

## Steps

1. **Check for an existing Spine.** If `.spine/` already exists, report what's
   there and ask whether to refresh specific files rather than overwriting.
2. **Detect the stack.** Inspect manifests (`package.json`, `pyproject.toml`,
   `go.mod`, `Cargo.toml`, etc.) and config to infer language, framework, test
   runner, and the install/test/typecheck/build commands.
3. **Create the structure:**
   - `.spine/context.md`
   - `.spine/conventions.md`
   - `.spine/journal.md`
   - `.spine/decisions/` (empty, with a `.gitkeep`)
   Seed each from this skill's `templates/`, filling in detected values. Leave
   `<placeholders>` only where you genuinely lack information, and flag them.
4. **Confirm with the user.** Show the seeded `conventions.md` commands and the
   `context.md` architecture map; correct anything wrong before finishing.
5. **Suggest committing** `.spine/` so the memory is shared with the team.

## Spine I/O

- **Writes:** `context.md`, `conventions.md`, `journal.md`, `decisions/`.

## Notes

- Never invent commands you haven't verified exist in the manifest/scripts.
- The Spine is for durable knowledge, not transient chatter.
```

- [ ] **Step 4: Run the validator to verify it passes (green)**

Run: `node scripts/validate.mjs`
Expected: line `ok  ./skills/init (init)` present; still fails overall because align/build/verify/remember remain missing. That partial pass confirms `init` is well-formed.

- [ ] **Step 5: Commit**

```bash
git add skills/init
git commit -m "feat: add init skill (bootstrap the Spine)"
```

---

## Task 3: `align` skill — grill intent into criteria

**Files:**
- Create: `skills/align/SKILL.md`

- [ ] **Step 1: Run the validator (red for align)**

Run: `node scripts/validate.mjs`
Expected: FAIL list includes `./skills/align: SKILL.md missing`.

- [ ] **Step 2: Create `skills/align/SKILL.md`**

```markdown
---
name: align
description: Use before building any feature or change to interrogate intent until acceptance criteria are crisp. Prevents the agent from building the wrong thing. Writes the agreed intent and criteria to .spine/journal.md.
---

# align — nail intent before building

Most wasted work comes from building before intent is clear. This skill closes
that gap with a focused interview.

## Steps

1. **Read the Spine** (`context.md`, `conventions.md`, current `journal.md`) so
   questions are grounded in what already exists — don't ask what the Spine
   already answers.
2. **Interview, one question at a time.** Prefer multiple-choice. Cover:
   purpose, scope boundaries (what's explicitly out), constraints, and how we'll
   know it's done. Stop when no decision is left ambiguous.
3. **Surface ambiguities and assumptions explicitly.** Name anything you're
   inferring and get a yes/no.
4. **Produce acceptance criteria** as a checklist — each item observable and
   testable (e.g. "Given X, when Y, then Z").
5. **Write to the Spine.** Update `journal.md`: set *Current focus* to this work,
   *Next step* to the first build action, and append the acceptance criteria.
6. **Confirm** the criteria with the user before any building begins.

## Spine I/O

- **Reads:** `context.md`, `conventions.md`, `journal.md`.
- **Writes:** `journal.md` (focus, next step, acceptance criteria).

## Notes

- Do not start implementing here. This skill ends at agreed criteria.
- One question per message. Don't overwhelm.
```

- [ ] **Step 3: Run the validator (green for align)**

Run: `node scripts/validate.mjs`
Expected: line `ok  ./skills/align (align)` present.

- [ ] **Step 4: Commit**

```bash
git add skills/align
git commit -m "feat: add align skill (intent -> acceptance criteria)"
```

---

## Task 4: `build` skill — TDD vertical slices

**Files:**
- Create: `skills/build/SKILL.md`

- [ ] **Step 1: Run the validator (red for build)**

Run: `node scripts/validate.mjs`
Expected: FAIL list includes `./skills/build: SKILL.md missing`.

- [ ] **Step 2: Create `skills/build/SKILL.md`**

```markdown
---
name: build
description: Use to implement a feature or bugfix as small TDD vertical slices that follow the repo's conventions. Produces working, tested code one slice at a time. Reads acceptance criteria and conventions from the Spine.
---

# build — TDD vertical slices

Implement work the way a senior engineer does: smallest valuable slice first,
test-first, frequent commits, following the repo's existing patterns.

## Steps

1. **Read the Spine.** Load `conventions.md` (commands + patterns to follow),
   `context.md` (architecture + language), and the acceptance criteria in
   `journal.md`. If there are no criteria yet, run `align` first.
2. **Pick the smallest vertical slice** that delivers one acceptance criterion
   end to end.
3. **Red:** write a failing test that pins the desired behavior. Run it; confirm
   it fails for the *expected* reason.
4. **Green:** write the minimal code to pass. Run the test; confirm it passes.
5. **Refactor:** improve names and structure with tests green. Favor deep
   modules with simple interfaces — avoid balls of mud.
6. **Commit** the slice with a clear message.
7. **Update the Spine.** In `journal.md`, tick the criterion, set the next step.
8. Repeat until all criteria are met. Stop and report if a criterion is blocked.

## Spine I/O

- **Reads:** `conventions.md`, `context.md`, `journal.md`.
- **Writes:** `journal.md` (progress, next step).

## Notes

- Use the test/typecheck commands from `conventions.md`, not invented ones.
- Name code using the Spine's shared language for consistency.
- Don't claim a slice is done without running its test — that's `verify`'s rule
  too, applied continuously here.
```

- [ ] **Step 3: Run the validator (green for build)**

Run: `node scripts/validate.mjs`
Expected: line `ok  ./skills/build (build)` present.

- [ ] **Step 4: Commit**

```bash
git add skills/build
git commit -m "feat: add build skill (TDD vertical slices)"
```

---

## Task 5: `verify` skill — evidence before "done"

**Files:**
- Create: `skills/verify/SKILL.md`

- [ ] **Step 1: Run the validator (red for verify)**

Run: `node scripts/validate.mjs`
Expected: FAIL list includes `./skills/verify: SKILL.md missing`.

- [ ] **Step 2: Create `skills/verify/SKILL.md`**

```markdown
---
name: verify
description: Use when work is supposedly complete, before claiming it is done or merging. Checks the change against the acceptance criteria by running tests, typecheck, and review — and reports evidence, never bare assertions. Reads criteria from the Spine.
---

# verify — evidence before "done"

"Done" is a claim that requires proof. This skill produces the proof.

## Steps

1. **Read the acceptance criteria** from `journal.md` and the commands from
   `conventions.md`.
2. **Run the checks.** Execute the test suite, typecheck, and build/lint
   commands. Capture the actual output.
3. **Review the diff** against `conventions.md` and the Spine's language: naming,
   module boundaries, dead code, missing tests.
4. **Check each criterion** off only with concrete evidence (a passing test, an
   observed behavior). Anything unverified stays open.
5. **Report** a short verdict: each criterion → met / not-met → the evidence.
   Quote real command output. If anything failed, say so plainly.
6. **Write the result** to `journal.md`. Do not mark the work complete in the
   Spine unless every criterion is met with evidence.

## Spine I/O

- **Reads:** `journal.md` (criteria), `conventions.md` (commands).
- **Writes:** `journal.md` (verification result).

## Notes

- Never assert "tests pass" without showing the run. Evidence before assertions.
- If a check can't be run, say why — don't skip silently.
```

- [ ] **Step 3: Run the validator (green for verify)**

Run: `node scripts/validate.mjs`
Expected: line `ok  ./skills/verify (verify)` present.

- [ ] **Step 4: Commit**

```bash
git add skills/verify
git commit -m "feat: add verify skill (evidence before done)"
```

---

## Task 6: `remember` skill — close the loop into the Spine

**Files:**
- Create: `skills/remember/SKILL.md`

- [ ] **Step 1: Run the validator (red for remember)**

Run: `node scripts/validate.mjs`
Expected: FAIL list includes `./skills/remember: SKILL.md missing`.

- [ ] **Step 2: Create `skills/remember/SKILL.md`**

```markdown
---
name: remember
description: Use at the end of a work session to distill what happened back into the .spine/ store so the next session starts informed instead of cold. Updates context and conventions, records decisions as ADRs, and compacts the journal.
---

# remember — close the loop

The Spine is only valuable if it stays current. This skill is the closing ritual
that pays that forward.

## Steps

1. **Review the session.** What was decided, built, learned, or reversed?
2. **Update `context.md`** if the architecture map or shared language changed —
   add new terms, update the module map.
3. **Update `conventions.md`** if a new pattern or command became standard.
4. **Record decisions.** For each non-obvious choice with lasting impact, add an
   ADR in `.spine/decisions/NNNN-short-title.md` (context, decision, why,
   consequences).
5. **Compact `journal.md`.** Collapse the blow-by-blow into: *Current focus*,
   *Next step*, and a short *History* of dated milestones. Drop transient noise.
6. **Write a one-paragraph handoff** at the top of *Current focus* so a fresh
   session — yours or a teammate's — can resume immediately.
7. **Suggest committing** the updated `.spine/`.

## Spine I/O

- **Writes:** `context.md`, `conventions.md`, `journal.md`, `decisions/`.

## Notes

- Record durable knowledge only. The journal is a runway, not a diary.
- An ADR captures *why*, not just *what* — that's what prevents future regressions.
```

- [ ] **Step 3: Run the validator (green — all 5 skills pass)**

Run: `node scripts/validate.mjs`
Expected: `All 5 skills valid.` and exit code 0.

- [ ] **Step 4: Commit**

```bash
git add skills/remember
git commit -m "feat: add remember skill (distill session into the Spine)"
```

---

## Task 7: README + final wiring

**Files:**
- Create: `README.md`
- Modify: `scripts/validate.mjs` (add README cross-reference check)

- [ ] **Step 1: Extend the validator to require each skill be referenced in README (red)**

In `scripts/validate.mjs`, before the final `if (errors.length)` block, add:

```js
const readmePath = join(root, "README.md");
if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, "utf8");
  for (const rel of plugin.skills ?? []) {
    const name = basename(rel);
    if (!readme.includes(`skills/${name}/SKILL.md`)) {
      errors.push(`README.md does not reference skills/${name}/SKILL.md`);
    }
  }
} else {
  errors.push("README.md missing");
}
```

Run: `node scripts/validate.mjs`
Expected: FAIL — `README.md missing`.

- [ ] **Step 2: Create `README.md`**

```markdown
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
```

- [ ] **Step 3: Run the full validator (green)**

Run: `node scripts/validate.mjs`
Expected: `All 5 skills valid.` and exit code 0, with no README errors.

- [ ] **Step 4: Commit**

```bash
git add README.md scripts/validate.mjs
git commit -m "docs: add README and README cross-reference validation"
```

---

## Self-Review

**Spec coverage** (checked against `docs/specs/2026-06-11-andreas-skills-design.md`):
- Spine (`.spine/` with context/conventions/journal/decisions) → Task 1 (CONTEXT language) + Task 2 (`init` creates it, templates). ✓
- Spine I/O contract → declared in every skill's "Spine I/O" section (Tasks 2–6). ✓
- v1 skill set `init/align/build/verify/remember` → Tasks 2–6. ✓
- Installable via skills.sh / plugin.json → Task 1 (manifest) + Task 7 (README install). ✓
- Design tenets (small, progressive disclosure, model-agnostic, reusable, AI-native) → README Philosophy + thin SKILL.md structure. ✓
- Success criteria (init <2 min, loop resumable, clean install) → supported by the skill behaviors; runtime UX validated during execution. ✓
- Non-goals (no heavyweight framework, no issue tracker, no copied prose) → respected; all prose original. ✓
- `design/ship/troubleshoot/new-skill` are explicitly v1.1, listed as roadmap, not built. ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases" in steps. Template `<placeholders>` are intentional seed markers the `init` skill fills at runtime — documented as such, not plan gaps.

**Type/name consistency:** Validator reads `plugin.json.skills[]`; manifest paths (`./skills/<name>`) match folder names and frontmatter `name:` (enforced by the validator itself). README references `skills/<name>/SKILL.md` for all five (enforced in Task 7). Consistent.
