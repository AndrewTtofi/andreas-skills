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

`build` slice 1: PR-grouping in `graph-builder` (DAG reachability), test-first.

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
- [ ] Commits that landed via `Merge pull request #N` are grouped under one
      collapsible `pr` node labeled `#N · <title>`, showing its commit count.
- [ ] A PR group's commits = reachable from the merge's 2nd parent but not its
      1st (the branch's commits), computed from the DAG.
- [ ] Commits not under any merged PR render as standalone `commit` nodes on the
      main spine.
- [ ] Groups are collapsed by default; clicking a `pr` node expands/collapses its
      commits inline and the layout reflows.
- [ ] ADR `decision` nodes attach to the PR group (or loose commit) containing
      their commit; focus pins to the latest group.
- [ ] At the repo's real scale (47 commits), the default view shows ≤ ~10
      top-level nodes — no endless scroll. Verified by screenshot.
- [ ] No-git fallback unchanged; `/api/graph` stays valid.

Docs — enterprise redesign:
- [ ] Content is constrained to a readable measure (~720px), centered, with a
      refined heading/type hierarchy.
- [ ] Sidebar is sectioned with a clear active state and shows the ADR count.
- [ ] Long docs show an in-page table-of-contents rail; short docs omit it
      gracefully.
- [ ] Each doc renders a header (title + kicker/meta).

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
