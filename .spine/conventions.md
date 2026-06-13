# Conventions

> Patterns Claude MUST follow in this repo. Derived from the codebase, refined over time.

## Stack

Markdown skills (`SKILL.md`) + JSON manifests. Node ≥20 (ESM) powers the
validator and the dashboard. **Zero runtime dependencies** — model-agnostic,
generic. The repo root has no `package.json`; only `dashboard/` is an npm package.

## Commands

- Install: none at root (no deps). Dashboard: none (zero deps).
- Test: `node scripts/validate.mjs` (skills/wiring — the test harness).
  Dashboard: `cd dashboard && node --test`.
- Typecheck: none (no TypeScript).
- Build/Run: dashboard — `cd dashboard && node server.mjs`, or `npx spine-dashboard`
  from any repo with a `.spine/`.

## Patterns

- **Wiring is mandatory.** Every shipped skill must be (1) listed in
  `.claude-plugin/plugin.json`, (2) linked in `README.md`, (3) listed in
  `skills/README.md`. `validate.mjs` fails otherwise.
- **Frontmatter `name` must equal the skill's folder name.**
- `description` includes explicit "Use when …" trigger phrases.
- **Keep `SKILL.md` thin.** Put depth in sibling reference files (progressive
  disclosure) and link to them.
- Every lifecycle skill declares its **Spine I/O** (reads/writes).
- `plugin.json` must carry `name`, `description`, `version`, `author` — and
  `author` must be an **object** (`{name}`), to satisfy Claude Code's manifest
  schema. (A bare string passes `validate.mjs` but blocks `/plugin install`.)
- **Run `node scripts/validate.mjs` before every commit. It must pass.**
- Skill prose reads like a senior engineer wrote it: terse, durable principles,
  no process ceremony. Match the existing skills' voice.
- **Shell-out code takes an injectable runner.** Code that shells to an external
  command (e.g. `git-reader.mjs`'s `git log`) accepts an optional `run` function
  defaulting to the real `execFileSync`, so tests feed canned output and stay
  hermetic — no real repo/process needed. See [[0001-git-history-as-commit-backbone]].
- Dashboard graph data stays presentation-agnostic: `graph-builder` returns
  `{nodes, edges}` with a `type`; the frontend (Cytoscape fcose) computes layout.
- **Before claiming a push lands in a PR, verify the PR is still open**
  (`gh pr view <n> --json state`). A merged PR's branch keeps accepting commits,
  but they go nowhere — they orphan on the branch (not in main, not in a PR).
- The dashboard's design system is **Stripe-grade light** (white, navy ink, one
  blurple accent `#635bff`, Inter); new UI must read on white. See
  [[0008-stripe-grade-light-design-system]].
- **The graph layout is deterministic** — no `Math.random`, no force library; a
  hand-rolled spring+collision sim in `layoutBrain()` so it never scrambles on
  reload and guarantees zero overlap. Interactions (expand, search, filter) reuse
  those positions and never trigger a relayout. See
  [[0013-deterministic-spring-collision-brain]].
