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
