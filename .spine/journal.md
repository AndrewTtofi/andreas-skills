# Journal

## Current focus

**Redesign the dashboard knowledge graph** into a sequenced, dependency-connected
view of everything that was done. Today's graph (`dashboard/graph-builder.mjs`) is
a static mention-graph (modules/ADRs/conventions linked by name mentions) — no
time, no commits, no dependencies. New model: **git history is the commit
backbone; the Spine (ADRs, acceptance criteria, focus) attaches meaning onto
commits**. Layout is **time-lanes + dependency edges**. This **replaces** the
Cytoscape constellation home view with a **full, hand-rolled (zero-dep) visual
redesign**.

Assumptions: attach ADRs/criteria to commits by SHA (from journal History) else
nearest-by-date; "dependencies" = `parent` (git) + `implements` (criterion→commit)
+ `supersedes` (ADR→ADR); include all commits; no new runtime deps.

## Next step

`verify`: full suite (`cd dashboard && node --test`) + `node scripts/validate.mjs`
green; confirm each acceptance criterion against evidence. Then `ship`.

## Build plan (TDD vertical slices)

Design recorded in ADRs [[0001-git-history-as-commit-backbone]],
[[0002-spine-overlays-the-commit-timeline]],
[[0003-vertical-timeline-via-cytoscape-preset]].

1. **`git-reader.mjs`** — ✅ DONE. 5 tests green; verified on the real repo (43
   commits, merge parents, timezones). `readGitHistory(repoDir,{run})` with
   injectable `run`; no-git → `{available:false}`.
2. **`graph-builder.mjs` rewrite + `server.mjs` wiring** — ✅ DONE (merged slices
   2+3: the model and API are coupled). 9 builder tests + updated server test;
   full suite 26/26 green. Verified on the real repo: 45 commits, 50 parent
   edges, 3 ADRs attached, focus pinned, 2 milestones annotated. `server.mjs`
   passes `repoDir = process.cwd()`.
4. **Frontend timeline** (`public/`) — Cytoscape `preset`, vertical layout
   (newest top); compute positions from node `time`/`type`; restyle spine + lane
   guides; panel shows commit body / ADR / focus+criteria; update legend. No unit
   test — verify live. Commit.
5. **verify** — `cd dashboard && node --test` all green; `node scripts/validate.mjs`
   green; load the dashboard, screenshot, check criteria against evidence.

## Acceptance criteria

Data model (`graph-builder.mjs`):
- [x] In a repo with git history, the graph has one `commit` node per commit
      (short SHA, subject, author, date), ordered chronologically.
- [x] Each commit links to its parent(s) via a `parent` edge — the git DAG,
      merges included.
- [x] Each `.spine/decisions/` ADR is a `decision` node attached to the commit
      it was decided in (by SHA referenced in Spine, else nearest commit by date).
- [x] Current-focus attaches to HEAD via a `focuses` edge; acceptance criteria
      render in the focus detail (refined per ADR-0002 — no fabricated nodes).
- [x] ADR→ADR `supersedes` edges are emitted when an ADR declares it supersedes
      another.
- [x] With no `.git` (or git unavailable), it degrades to a Spine-only timeline
      (decisions + focus) and never crashes.

API:
- [x] `/api/graph` returns `{nodes, edges}` where each node has a `type`
      (`commit`|`decision`|`focus`) and a `time`, and each edge has a `rel`
      (`parent`|`decides`|`supersedes`|`focuses`).

View (home, full redesign, zero new deps):
- [x] Commits render along a primary chronological axis (vertical, newest top),
      replacing the Cytoscape constellation.
- [x] Dependency edges (`parent`/`decides`/`supersedes`/`focuses`) are drawn and
      visually distinguishable by relation (cyan spine / amber dashed / violet
      dotted / mint dashed).
- [x] Each node is scannable — commit shows subject + short SHA + date; ADR shows
      title; selecting a node opens its detail (commit body / ADR doc / focus).
- [x] Legible at the repo's real scale (46 commits): clear vertical sequence, no
      hairball. Screenshot: /tmp/spine-timeline.png.
- [x] No new runtime dependencies — and removed the fcose CDN scripts (preset
      layout needs only Cytoscape core).

Tests:
- [ ] `cd dashboard && node --test` covers: commit nodes + parent edges from a git
      fixture, ADR/criterion attachment (SHA and date-fallback), and graceful
      no-git degradation. All pass.
- [ ] `node scripts/validate.mjs` stays green.

## History

- 2026-06-13 — Added v1.1 skills `ship`, `troubleshoot`, `new-skill`; wired all
  three; bumped plugin + marketplace to 1.1.0 (commit `7ad49e1`).
- 2026-06-13 — Fixed `plugin.json` `author` to an object; unblocked
  `/plugin install` (commit `e36af7b`). Found by dogfooding the local install.
- 2026-06-13 — Installed the plugin locally and ran `init` to seed this `.spine/`.
