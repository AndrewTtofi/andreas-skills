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

## Next step

`verify`: `cd dashboard && node --test` + `node scripts/validate.mjs` green;
confirm every criterion against evidence. Then `ship`.

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
