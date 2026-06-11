# Polish & Distribution-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make andreas-skills v1 launch-ready (without announcing): a masterclass README, governance files, an extended validator that enforces wiring, and quietly-prepared distribution material.

**Architecture:** Same as v1 — `scripts/validate.mjs` is the test harness. Task 1 extends it (red), then governance files turn it green. Tasks 2–3 keep it green.

**Tech Stack:** Markdown, JSON, Node 26, `gh` CLI.

**Working dir:** `/Users/andreasttofi/Desktop/ttofis/skills-for-me/andreas-skills`, branch `v1-skills`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `scripts/validate.mjs` | Extended: enforce plugin metadata + skill wiring in README & skills/README |
| `skills/README.md` | Skill index (one-liner per skill, linked) |
| `CLAUDE.md` | Repo governance rules |
| `CONTRIBUTING.md` | How to add a skill + quality bar |
| `README.md` | Masterclass rewrite (narrative + worked walkthrough) |
| `docs/launch/launch-post.md` | Unpublished launch post draft |
| `docs/launch/awesome-claude-code-entry.md` | Unpublished awesome-list entry draft |

---

## Task 1: Extend validator + add governance files

**Files:**
- Modify: `scripts/validate.mjs` (full overwrite)
- Create: `skills/README.md`, `CLAUDE.md`, `CONTRIBUTING.md`

- [ ] **Step 1: Overwrite `scripts/validate.mjs` with the extended validator**

```js
#!/usr/bin/env node
// Validates that every skill listed in plugin.json is structurally sound,
// wired into the README and skill index, and that plugin metadata is present.
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

// plugin.json must carry discovery metadata
for (const field of ["name", "description", "version", "author"]) {
  if (!plugin[field]) errors.push(`plugin.json missing "${field}"`);
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

// Every skill must be wired into both the README and the skill index.
const wiring = [
  ["README.md", join(root, "README.md")],
  ["skills/README.md", join(root, "skills/README.md")],
];
for (const [label, path] of wiring) {
  if (!existsSync(path)) {
    errors.push(`${label} missing`);
    continue;
  }
  const text = readFileSync(path, "utf8");
  for (const rel of plugin.skills ?? []) {
    const name = basename(rel);
    if (!text.includes(`${name}/SKILL.md`)) {
      errors.push(`${label} does not reference ${name}/SKILL.md`);
    }
  }
}

if (errors.length) {
  console.error("\nVALIDATION FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nAll ${plugin.skills.length} skills valid.`);
```

- [ ] **Step 2: Run the validator to verify it now fails (red)**

Run: `node scripts/validate.mjs`
Expected: FAIL — `skills/README.md missing` (5 reference errors too). `plugin.json` metadata checks should PASS (name/description/version/author were already added). README references should PASS (current README links all 5).

- [ ] **Step 3: Create `skills/README.md`**

```markdown
# Skills

The v1 lifecycle loop. Each skill reads from and writes to the Spine (`.spine/`).

- **[init](./init/SKILL.md)** — Bootstrap the `.spine/` store; detect the stack, seed context/conventions/journal.
- **[align](./align/SKILL.md)** — Grill intent until acceptance criteria are crisp, before building.
- **[build](./build/SKILL.md)** — Implement features as small TDD vertical slices that follow your conventions.
- **[verify](./verify/SKILL.md)** — Check work against the criteria with real evidence before claiming done.
- **[remember](./remember/SKILL.md)** — Distill the session back into the Spine so the next one starts informed.

Roadmap (v1.1): `design`, `ship`, `troubleshoot`, `new-skill`.
```

- [ ] **Step 4: Create `CLAUDE.md`**

```markdown
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
```

- [ ] **Step 5: Create `CONTRIBUTING.md`**

```markdown
# Contributing

Thanks for helping make andreas-skills better.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter:
   - `name:` must equal `<name>` (the folder name).
   - `description:` one line with explicit trigger phrases ("Use when ...").
2. Keep `SKILL.md` thin. Put depth in sibling reference files
   (e.g. `skills/<name>/patterns.md`) and link to them — progressive disclosure.
3. If it's a lifecycle skill, declare its **Spine I/O** (what it reads from and
   writes to `.spine/`).
4. Wire it in:
   - add the path to `.claude-plugin/plugin.json`
   - link it in `README.md` (Skills section)
   - list it in `skills/README.md`
5. Run `node scripts/validate.mjs` — it must pass.
6. Open a pull request.

## Quality bar

Skills should read like a senior engineer wrote them: small, composable,
model-agnostic, reusable in any repo. Favor durable principles over ceremony.
See `CLAUDE.md` for the conventions the validator enforces.
```

- [ ] **Step 6: Run the validator to verify it passes (green)**

Run: `node scripts/validate.mjs`
Expected: `All 5 skills valid.` and exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/validate.mjs skills/README.md CLAUDE.md CONTRIBUTING.md
git commit -m "chore: governance files + validator enforces wiring & metadata"
```

---

## Task 2: README masterclass

**Files:**
- Modify: `README.md` (full overwrite)

- [ ] **Step 1: Overwrite `README.md` with the masterclass version**

````markdown
# andreas-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-skills-7c3aed.svg)](https://claude.com/claude-code)

> A full-lifecycle engineering skill system that makes your coding agent work
> like a senior engineer — from idea to production — and never lose the plot.

Most skill collections are a drawer of loose tools. **andreas-skills** is a
connected lifecycle, unified by a project-memory store called the **Spine**.
Every skill reads from and writes to it, so your agent carries understanding
across phases *and* across sessions.

## The problems it solves

Coding agents fail in three predictable ways. andreas-skills attacks all three
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
        ┌──────────────────────────────────────────────┐
        │                THE SPINE (.spine/)             │
        │   context · conventions · journal · decisions  │
        └──────────────────────────────────────────────┘
           ▲      ▲       ▲        ▲          ▲
  init → align → build → verify → remember
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the conventions in
[CLAUDE.md](./CLAUDE.md).

## License

[MIT](./LICENSE)
````

- [ ] **Step 2: Run the validator to confirm README still wires all 5 skills (green)**

Run: `node scripts/validate.mjs`
Expected: `All 5 skills valid.` and exit 0. (The README still contains `skills/<name>/SKILL.md` for all five.)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: masterclass README (narrative + Spine walkthrough)"
```

---

## Task 3: Distribution-readiness (quiet)

**Files:**
- Create: `docs/launch/launch-post.md`
- Create: `docs/launch/awesome-claude-code-entry.md`

- [ ] **Step 1: Create `docs/launch/launch-post.md` (DRAFT — do not publish)**

```markdown
# Launch post (DRAFT — do not publish until v1.1)

**Title:** andreas-skills — give your coding agent a memory

Most Claude Code skill collections are a drawer of loose tools. I wanted
something that works like a senior engineer across a whole feature — and
remembers what it learned.

So I built **andreas-skills**, unified by one idea: the **Spine**, a `.spine/`
project-memory store every skill reads and writes. Your agent carries context
across phases (align → build → verify) *and* across sessions.

The v1 loop:
- `init` seeds the Spine and detects your stack
- `align` grills intent into testable criteria before building
- `build` does TDD vertical slices following your conventions
- `verify` demands evidence before "done"
- `remember` distills the session back into the Spine

The payoff: close your laptop, open a fresh session tomorrow, and the agent
resumes cold from `.spine/` — no re-explaining.

Install: `npx skills@latest add AndrewTtofi/andreas-skills`
Repo: https://github.com/AndrewTtofi/andreas-skills

Roadmap: design, ship, troubleshoot, new-skill — plus deeper reference files per
skill. Feedback welcome.
```

- [ ] **Step 2: Create `docs/launch/awesome-claude-code-entry.md` (DRAFT — do not submit)**

```markdown
# awesome-claude-code entry (DRAFT — do not submit until v1.1)

Target list: https://github.com/hesreallyhim/awesome-claude-code (Skills/Plugins section)

Proposed entry line:

- [andreas-skills](https://github.com/AndrewTtofi/andreas-skills) — A full-lifecycle skill system unified by a `.spine/` project-memory store, so your agent carries context across phases and sessions (align → build → verify → remember).

Submission checklist (for later):
- [ ] Confirm the list's contribution format and section.
- [ ] Ensure README + install command are verified working.
- [ ] Open PR only after v1.1 depth lands.
```

- [ ] **Step 3: Commit the drafts**

```bash
git add docs/launch
git commit -m "docs: draft (unpublished) launch + awesome-list material"
```

- [ ] **Step 4: Set GitHub repo description + topics (public metadata, not an announcement)**

Run:
```bash
gh repo edit AndrewTtofi/andreas-skills \
  --description "A full-lifecycle Claude Code skill system unified by a .spine/ project-memory store — your agent works like a senior engineer and never loses context." \
  --add-topic claude-code --add-topic ai-agents --add-topic skills \
  --add-topic developer-tools --add-topic llm
```
Expected: command succeeds (exit 0). If `gh` lacks permission or network, report it and leave repo metadata unchanged — do not block.

- [ ] **Step 5: Verify the skills.sh install path resolves (best-effort)**

Run: `npx skills@latest add AndrewTtofi/andreas-skills --help` or attempt a dry resolution if supported. If network is unavailable, document that the command is unverified rather than failing the task.

---

## Self-Review

**Spec coverage** (vs `docs/specs/2026-06-11-polish-and-distribution-design.md`):
- README masterclass with all sections incl. worked walkthrough → Task 2. ✓
- Governance: `CLAUDE.md`, `skills/README.md`, `CONTRIBUTING.md` → Task 1. ✓
- Validator enforces skill index wiring + plugin metadata → Task 1 Step 1. ✓
- Distribution-readiness: repo description/topics, unpublished launch drafts,
  install verification → Task 3. ✓
- Non-goals (no announcement, no new skills, no prose-policing) → respected;
  drafts are explicitly marked "do not publish". ✓

**Placeholder scan:** No TBD/TODO. The `<...>` inside the existing `init`
templates is untouched and out of scope here.

**Consistency:** The wiring check uses substring `${name}/SKILL.md`, which
matches both README (`skills/init/SKILL.md`) and skills/README (`./init/SKILL.md`).
plugin.json already has name/description/version/author (added in the v1 polish
commit), so the metadata check passes from the start. README rewrite (Task 2)
retains all five `skills/<name>/SKILL.md` links, keeping the validator green.
Badges use shields.io (always resolvable); no unverified skills.sh badge is
shipped, per the spec's open-question fail-safe.
```
