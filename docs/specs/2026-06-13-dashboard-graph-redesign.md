# spine dashboard — Knowledge Graph Redesign Spec

**Date:** 2026-06-13
**Status:** Approved (design) → pending build
**Author:** Andreas Ttofi
**Part of:** spine dashboard (`dashboard/`)
**Produced via:** spine lifecycle — `align` → `design` (dogfooded on this repo).
Canonical decisions live in `.spine/decisions/0001–0003`; this is the
human-reviewable consolidation.

## Goal

Replace the dashboard's home graph with a **clear, sequenced, dependency-connected
knowledge graph of everything that was done** — the commits, in order, connected
by their dependencies, with the project's decisions and current focus attached.

### Problem with today's graph

`dashboard/graph-builder.mjs` builds a **static mention-graph**: nodes are modules
(parsed from `context.md` bullets), ADRs, conventions, and "current focus"; edges
mean only "this ADR's text mentions this module's name." There is **no time, no
commits, no sequence, no dependency ordering** — and the frontend lays it out with
a Cytoscape **force layout** (fcose, via CDN), producing an organic "constellation"
hairball rather than a readable sequence.

## Decisions (locked in align + design)

- **Commit data source:** *git backbone + Spine meaning.* `git log` provides the
  full, ordered, dependency-bearing commit spine; the Spine (ADRs, focus) attaches
  meaning on top.
- **Layout model:** *time-lanes + dependency edges.* Chronological primary axis
  with dependency edges drawn across it.
- **Scope:** *replace* the Cytoscape constellation home view, with a full visual
  redesign of the graph.
- **Renderer:** *keep Cytoscape*, but swap the force layout for a deterministic
  **`preset`** layout (frontend-computed positions). Reuses the existing
  pan/zoom/tap interaction. (Hand-rolled SVG considered and rejected.)
- **Orientation:** *vertical scroll-timeline* — newest commit at top, scroll down
  through history.
- **Zero new dependencies** (hard repo convention) — backend shells `git`; no npm
  packages added. The existing Cytoscape CDN coupling is retained, not deepened.

### Refinements design forced (vs the raw align criteria)

- Acceptance criteria are **not** turned into graph nodes/edges (that would
  fabricate false links). They render in the **focus node's detail panel**.
- Journal-History milestones **annotate the commit they cite** (a `milestone`
  badge) instead of becoming duplicate nodes.
- Edge vocabulary: `parent` · `decides` · `supersedes` · `focuses`
  (replacing the vaguer `implements`).

## Architecture

Deep modules, small interfaces — consistent with the existing dashboard.

| File | Change | Responsibility |
|---|---|---|
| `dashboard/git-reader.mjs` | **new** | `readGitHistory(repoDir, {run})` → `{available, commits:[{sha, shortSha, parents[], subject, body, author, date}]}`. Shells `git log` with a stable `--pretty=format` + delimiter; injectable `run` for hermetic tests; no git → `{available:false, commits:[]}`. |
| `dashboard/graph-builder.mjs` | **rewrite** | `buildGraph(spineDir, repoDir)` overlays the Spine onto the commit timeline → `{nodes, edges}`. Presentation-agnostic (returns data, not coordinates). |
| `dashboard/server.mjs` | **edit** | `/api/graph` calls `buildGraph(spineDir, process.cwd())`. Commit body travels in the node payload — no extra endpoint for the detail panel. |
| `dashboard/public/app.js` | **rewrite (graph mode)** | Compute `preset` positions from node `time`/`type`; vertical timeline; restyle; panel renders commit body / ADR / focus+criteria; updated legend. Docs mode unchanged. |
| `dashboard/public/styles.css` | **edit** | Timeline spine + lane guides; graph restyle. Archive theme + topbar retained. |
| `dashboard/public/index.html` | **edit** | Legend/hint copy; Cytoscape CDN scripts retained. |

### Graph model (`/api/graph` payload)

- **Nodes** — `{ id, type, label, time, ...meta }`:
  - `commit` — every commit (`shortSha`, `subject`, `body`, `author`, `date`); a
    `milestone` flag/text when the journal History cites its SHA.
  - `decision` — one per ADR in `.spine/decisions/`.
  - `focus` — single node for the current focus; acceptance criteria carried in
    its detail.
- **Edges** — `{ source, target, rel }`:
  - `parent` — commit → parent commit (the git DAG, merges included).
  - `decides` — ADR → the commit it was decided in (by SHA referenced in the ADR
    or journal; else nearest commit by date).
  - `supersedes` — ADR → ADR (when declared).
  - `focuses` — focus → HEAD.

### Failure modes

- **No `.git` / git not installed / empty history** → `git-reader` returns
  `available:false`; `graph-builder` degrades to a **Spine-only timeline**
  (decisions ordered by date + focus). Never crashes.
- **No `.spine/`** → existing empty-state behavior is preserved.

## Build plan (TDD vertical slices)

1. **`git-reader.mjs`** — RED with an injected `run` returning canned `git log`
   output; assert the parsed shape + no-git fallback. GREEN, commit.
2. **`graph-builder.mjs` rewrite** — RED with a fake spine + injected history;
   assert `commit` nodes, `parent` edges (incl. a merge's two parents), `decides`
   by SHA, `decides` by nearest-date, `supersedes`, `focus` + `focuses`, commit
   `milestone` annotation, and no-git fallback. Replace the old mention tests;
   extend the fixture (journal History with a SHA; an ADR citing a SHA). GREEN,
   commit.
3. **`server.mjs`** — RED: `/api/graph` returns `commit` nodes for a git cwd.
   GREEN, commit.
4. **Frontend timeline** — Cytoscape `preset`, vertical; restyle; panel + legend.
   Verify live (no unit test). Commit.
5. **verify** — `cd dashboard && node --test` green; `node scripts/validate.mjs`
   green; load the dashboard, screenshot, check every acceptance criterion against
   evidence.

## Acceptance criteria

See `.spine/journal.md` (the authoritative checklist). Summarized: commit nodes +
git DAG; ADR/criteria attachment with date fallback; `supersedes`; no-git
degradation; `/api/graph` typed nodes/edges with `time`; vertical timeline
replacing the constellation; relation-distinct edges; scannable, non-overlapping
at ~20+ commits; zero new deps; tests green.

## Non-goals

- Multi-lane "railroad" branch rendering (this repo's history is near-linear;
  merges just draw both `parent` edges). YAGNI.
- Removing the Cytoscape CDN dependency (possible future change, not this one).
- Pagination / large-repo performance work (current scale ~20 commits).
- Any write path — the dashboard stays strictly read-only.
