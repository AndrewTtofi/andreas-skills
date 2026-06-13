# Journal

## Current focus

**Dashboard approachability pass** (iteration 2 on the graph + docs):
1. **Graph — cluster by PR, collapsed.** The flat commit-per-row timeline scrolls
   endlessly and won't scale. Group commits by the `Merge pull request #N` they
   landed in; show one collapsible group node per PR (newest few unmerged/direct
   commits stay standalone), expandable to commits. ADRs/focus attach to the
   group containing their commit.
2. **Docs — full enterprise redesign.** Constrained reading measure, refined type
   hierarchy, sectioned sidebar with active-state + ADR count, per-doc TOC rail,
   document header.

Assumptions: a PR's commits = reachable from merge's 2nd parent, not its 1st
(derived from the DAG we already read — no extra git calls); commits not under a
merge render standalone ("loose"); clustering keys on merge commits, so squash/
rebase repos show loose commits (known limit); zero new deps.

## Current focus

**Dashboard iteration 3 — professional + cohesive graph** (lands in the open
PR #8). Feedback: the node-graph still looks scattered (loose dots, far-right ADR
lane, floating focus), the colours aren't professional, and PR #8 (unmerged) isn't
clustered. Keep it **nodes-and-links**, but: cluster every commit, nest decisions
into clusters, integrate focus into the spine, and reskin to a **refined-dark**
palette (charcoal + slate + one indigo accent; no neon, no starfield).

## Next step

Iteration 3 verified (suite 32/32, validator green; no console errors) and pushed
to the open PR #8. Awaiting review/merge, then `remember`. The dashboard is live
at :4317 on this branch.

## Build plan (iteration 3)

Design in [[0006-cluster-every-commit-into-segments]],
[[0007-refined-dark-professional-palette]].

1. **`graph-builder` segments** — RED: injected history with a PR merge + an
   unmerged run above it + a pre-PR run; assert `segment` nodes ("Current branch"
   newest, "Direct to main" older), every commit tagged with a group, no loose
   commits. GREEN + commit.
2. **`app.js` cohesion + palette** — single vertical column; nest decisions into
   clusters (count when collapsed, adjacent when expanded); focus node at the top
   of the spine; rewrite Cytoscape colours to charcoal/slate/indigo. Verify live.
3. **`styles.css` + `index.html`** — refined-dark palette variables; delete the
   starfield. Verify live (graph + docs).
4. **verify** — suite + validator green; screenshots; criteria. PR #8 updates.

## Acceptance criteria (iteration 3)

Graph cohesion + completeness (still Cytoscape nodes+links):
- [x] Every mainline commit belongs to a cluster — no bare loose dots (real repo:
      0 loose). PR merges → PR clusters; non-merge runs → segment clusters.
- [x] In-flight work clusters as "Current branch" (real repo: 8 commits) — PR #8
      now clusters.
- [x] Decisions nest into their cluster: collapsed cluster shows a ◆count badge;
      expanding reveals ADR cards in the cluster's block (no far-right lane).
- [x] Focus integrated at the top of the spine (star linked into the column).
- [x] Single tidy vertical column. (/tmp/spine-v3-collapsed.png, -pr7.png)

Palette (refined dark, professional):
- [x] Charcoal bg (#0d0f14), slate text, hairline borders, one indigo accent
      (#6e7bf2). Neon + starfield removed.
- [x] Applied across graph, topbar, and docs (named CSS vars repointed).

Cross-cutting:
- [ ] Zero new deps; graph-builder tests for segment + in-flight clustering;
      `node --test` + `validate.mjs` green.

## Verification (2026-06-13, iteration 2)

All 15 acceptance criteria met with evidence.

- Tests: `cd dashboard && node --test` → `# tests 30 # pass 30 # fail 0`
  (4 new PR-clustering tests in graph-builder).
- Validator: `node scripts/validate.mjs` → `All 9 skills valid.`
- Graph (live): default view = 7 PR chips + loose commits + ADRs + focus (~12
  top-level, no endless scroll) — /tmp/spine-collapsed.png; expand re-flows with
  member commits + re-pointed edges — /tmp/spine-expanded.png. No console errors.
- Docs (live): three-pane (sectioned sidebar + active + ADR-count badge,
  ~720px content + header, generated TOC) — /tmp/spine-docs2.png,
  /tmp/spine-docs-decisions.png. No console errors.
- Diff: +413/−154 across 5 files; no dead code; zero new deps.

Caveat (unchanged): collapse/expand + panel are verified via the page's own
functions + screenshots, not a headless canvas click (Cytoscape `<canvas>`).

## Build plan (TDD vertical slices)

Design in ADRs [[0004-cluster-commits-by-pull-request]],
[[0005-docs-three-pane-with-generated-toc]].

1. **`graph-builder` PR grouping** — RED: injected git history with a
   `Merge pull request #N` (2 parents) + its branch commits + a loose mainline
   commit; assert a `pr:N` group node (label, count), commit `group` tags, branch
   commits claimed, loose commit standalone, `decides`/`focuses` retarget to the
   group. GREEN + commit.
2. **Frontend collapse/expand** (`public/app.js`,`styles.css`) — render `pr`
   nodes collapsed by default; click toggles member visibility + reflows the
   `preset` layout. Verify live (screenshots: collapsed + expanded). Commit.
3. **Docs three-pane** (`public/`) — sectioned sidebar (active + ADR count),
   ~720px content + header, client-generated TOC rail from rendered headings.
   Verify live (screenshot). Commit.
4. **verify** — `cd dashboard && node --test` + `node scripts/validate.mjs` green;
   screenshots; check every criterion. Then `ship`.

## Acceptance criteria

Graph — PR clustering:
- [x] Commits that landed via `Merge pull request #N` are grouped under one
      `pr` node labeled `#N · <title>`, showing its commit count. (real repo: 7
      groups, titles from merge bodies.)
- [x] A PR group's commits = reachable from the merge's 2nd parent but not its
      1st (the branch's commits), computed from the DAG.
- [x] Commits not under any merged PR render as standalone `commit` nodes (real
      repo: 47 grouped, 5 loose).
- [x] Groups are collapsed by default; clicking a `pr` node expands/collapses its
      commits inline and the layout reflows. (verified: /tmp/spine-collapsed.png,
      /tmp/spine-expanded.png)
- [x] ADR `decision` nodes attach to the PR group (or loose commit) containing
      their commit; focus pins to the latest group. (boundary edges re-point on
      collapse — decides reach the group when collapsed, the commit when expanded)
- [x] At the repo's real scale (47 commits), the default view shows ~12 top-level
      nodes (7 PR chips + loose + ADRs + focus) — no endless scroll.
- [x] No-git fallback unchanged; `/api/graph` stays valid.

Docs — enterprise redesign:
- [x] Content is constrained to a ~720px measure with a refined hierarchy +
      doc header. (/tmp/spine-docs2.png)
- [x] Sidebar is sectioned (Overview / Knowledge) with active state + ADR count
      badge (5). 
- [x] In-page TOC rail (section headings for prose docs, ADR titles for
      decisions); hidden when < 3 headings or on narrow widths.
- [x] Each doc renders a header (kicker + title).

Cross-cutting:
- [ ] Zero new runtime dependencies.
- [ ] `graph-builder` unit tests cover PR grouping (branch commits grouped, loose
      commits standalone) from injected git history.
- [ ] `cd dashboard && node --test` and `node scripts/validate.mjs` green.

## History

- 2026-06-13 — Shipped v1.1: skills `ship`, `troubleshoot`, `new-skill` + the
  `plugin.json` `author`-object fix, plus the dashboard graph redesign
  (`git-reader` backbone, Spine-overlay `graph-builder`, vertical Cytoscape
  `preset` timeline). 26/26 dashboard tests, validator green, 16/16 criteria.
  Design in ADRs [[0001-git-history-as-commit-backbone]],
  [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec at
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`. Merged as PR #7 (`df26c02`).
- 2026-06-13 — Seeded this `.spine/` via `init`; installed the plugin locally and
  dogfooded the full lifecycle to produce the redesign above.
