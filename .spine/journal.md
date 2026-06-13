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

`build` slice 2: rewrite `graph-builder.mjs` (Spine overlay on the commit
backbone), test-first with an injected git history.

## Build plan (TDD vertical slices)

Design recorded in ADRs [[0001-git-history-as-commit-backbone]],
[[0002-spine-overlays-the-commit-timeline]],
[[0003-vertical-timeline-via-cytoscape-preset]].

1. **`git-reader.mjs`** — ✅ DONE. 5 tests green; verified on the real repo (43
   commits, merge parents, timezones). `readGitHistory(repoDir,{run})` with
   injectable `run`; no-git → `{available:false}`.
2. **`graph-builder.mjs` rewrite** — RED: given a fake spine + injected git
   history, assert `commit` nodes, `parent` edges (incl. a merge's two parents),
   `decides` edge by SHA, `decides` by nearest-date fallback, `supersedes`,
   `focus` node + `focuses` edge, commit `milestone` annotation from journal
   History, and no-git Spine-only fallback. Replace the old module-mention tests
   and extend the fixture (journal History with a SHA; an ADR citing a SHA).
   GREEN + commit.
3. **`server.mjs`** — RED: `/api/graph` returns `commit` nodes when served with a
   git repo cwd (pass `repoDir = process.cwd()`). GREEN + commit.
4. **Frontend timeline** (`public/`) — Cytoscape `preset`, vertical layout
   (newest top); compute positions from node `time`/`type`; restyle spine + lane
   guides; panel shows commit body / ADR / focus+criteria; update legend. No unit
   test — verify live. Commit.
5. **verify** — `cd dashboard && node --test` all green; `node scripts/validate.mjs`
   green; load the dashboard, screenshot, check criteria against evidence.

## Acceptance criteria

Data model (`graph-builder.mjs`):
- [ ] In a repo with git history, the graph has one `commit` node per commit
      (short SHA, subject, author, date), ordered chronologically.
- [ ] Each commit links to its parent(s) via a `parent` edge — the git DAG,
      merges included.
- [ ] Each `.spine/decisions/` ADR is a `decision` node attached to the commit
      it was decided in (by SHA referenced in Spine, else nearest commit by date).
- [ ] Journal acceptance-criteria / current-focus items attach to the commit(s)
      that implemented them via an `implements` edge (by SHA, else by date).
- [ ] ADR→ADR `supersedes` edges are emitted when an ADR declares it supersedes
      another.
- [ ] With no `.git` (or git unavailable), it degrades to a Spine-only timeline
      (journal milestones + ADRs) and never crashes.

API:
- [ ] `/api/graph` returns `{nodes, edges}` where each node has a `type`
      (`commit`|`decision`|`criterion`|`focus`) and a `time`, and each edge has a
      `rel` (`parent`|`implements`|`supersedes`).

View (home, full redesign, zero new deps):
- [ ] Commits render along a primary chronological axis (time-ordered),
      replacing the Cytoscape constellation.
- [ ] Dependency edges (`parent`/`implements`/`supersedes`) are drawn across the
      timeline and are visually distinguishable by relation.
- [ ] Each node is scannable — commit shows subject + short SHA + date; ADR shows
      title; selecting a node reveals/links its detail (commit message or ADR doc).
- [ ] Legible at the repo's real scale (~20+ commits): clear sequence, no overlap,
      no hairball.
- [ ] No new runtime dependencies; rendering is hand-rolled SVG/DOM.

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
