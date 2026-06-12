# spine dashboard — Design Spec

**Date:** 2026-06-11
**Status:** Approved (design) → pending implementation plan
**Author:** Andreas Ttofi
**Part of:** spine (companion app, separate from the skills)

## Goal

A zero-dependency local web app that renders the current repo's `.spine/` as a
read-only dashboard — the architecture map, journal timeline, and browsable
ADRs. Makes an agent's project memory *visible*. Distributed via `npx`, pointed
to from `init`.

## Decisions (locked during brainstorming)

- **Purpose:** read-only viewer (cannot corrupt the Spine).
- **Tech:** zero-dependency Node local HTTP server (no framework, no build step).
- **Distribution:** `npx spine-dashboard` — nothing is copied into user repos.
  `init` gains a one-line pointer to the command. No setup skill; no file
  scaffolding.
- **Layout:** A — left sidebar nav + main content panel.
- **Dark mode:** deferred. v1 is a light theme with the spine purple
  (`#7c3aed`) accent.

## Architecture (the app's own modules)

Built with the deep-module discipline the `design` skill preaches — each file
one responsibility behind a small interface.

| File | Responsibility |
|---|---|
| `dashboard/spine-reader.mjs` | `readSpine(dir)` → structured data from `.spine/` (context, conventions, journal, ADRs). Hides all filesystem detail. |
| `dashboard/markdown.mjs` | Minimal zero-dep markdown→HTML (headings, lists, code, tables, links, bold/italic, paragraphs). Renders our own controlled markdown, so it stays small. |
| `dashboard/server.mjs` | Tiny `http` server: serves the static shell + `GET /api/spine` (calls `readSpine()` fresh per request) + `GET /` and assets. Picks a port, prints the URL. |
| `dashboard/public/index.html` | The Layout-A shell. |
| `dashboard/public/app.js` | Fetches `/api/spine`, renders sections, handles sidebar nav + ADR list/detail. |
| `dashboard/public/styles.css` | Light theme, purple accent, generous whitespace. |
| `dashboard/package.json` | name `spine-dashboard`, `bin` → `server.mjs`, `files` → `dashboard/`, `type: module`, engines node. |

## UI — Layout A (sidebar sections)

- **Overview** — current focus + next step from the journal, front and center
  ("where are we"). Plus quick counts (e.g. N ADRs).
- **Architecture** — renders `context.md` (architecture map + shared language).
- **Conventions** — renders `conventions.md`.
- **Journal** — current focus, next step, and history as a timeline.
- **Decisions** — ADR list on the left, selected ADR rendered on the right.

## Behavior

- Strictly read-only. No writes, ever.
- Reads `.spine/` fresh on each `/api/spine` request, so a browser refresh shows
  current state.
- **Empty state:** if there's no `.spine/` in the cwd, show a friendly panel —
  "No Spine here yet. Run `init` to create one."
- No file-watching / live reload in v1 (that's the future "live monitor"
  upgrade).

## Distribution

- The package lives at `dashboard/` in the spine repo and is publishable to npm
  as `spine-dashboard` (`npx spine-dashboard` runs `server.mjs` in the user's
  cwd). Publishing requires an npm account/login — structure it now, publish
  when ready; until published, it runs via `node dashboard/server.mjs`.
- `init` SKILL.md gains a closing step: tell the user they can view the Spine
  with `npx spine-dashboard`.
- README documents the dashboard + the command.

## Testing (`node --test`, built-in, zero-dep)

- `spine-reader` against a fixture `.spine/` directory (asserts structured
  output incl. ADR ordering and the empty-Spine case).
- `markdown` against known inputs (headings, lists, code, table, links, escaping).
- A smoke test that starts the server on an ephemeral port and asserts
  `GET /api/spine` returns the fixture data and `GET /` returns HTML.

## Non-goals

- No editing/writing the Spine (read-only).
- No live file-watching (v1).
- No dark mode (v1).
- No auth, no remote hosting — it's a local dev tool.

## Success criteria

- Running the dashboard in a repo with a `.spine/` opens a browser showing the
  five sections rendered from the real files, with working sidebar nav and ADR
  list/detail.
- The empty state appears when no `.spine/` exists.
- `node --test dashboard/` passes.
- No third-party runtime dependencies.

## Open questions

- npm name `spine-dashboard` availability — verify before publishing; if taken,
  fall back to a scoped name (e.g. `@andrewttofi/spine-dashboard`).
- Default port + fallback if busy (resolve in the plan; default 4317, then try
  the next free port).
