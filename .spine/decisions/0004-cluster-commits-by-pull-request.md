# 0004. Cluster the timeline by pull request via DAG reachability

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, graph

## Context

The vertical commit timeline ([[0003-vertical-timeline-via-cytoscape-preset]])
renders one row per commit. At 47 commits it already scrolls endlessly, and the
repo is young — this does not scale. We need hierarchy. The git history has clean
`Merge pull request #N` boundaries (7 of them), and a PR is the unit work actually
ships in.

## Decision

`graph-builder` groups commits by the pull request they landed in, computed from
the commit DAG it already reads — **no extra git calls**.

- The **mainline** is the first-parent chain from HEAD.
- A mainline merge whose subject matches `Merge pull request #(\d+)` becomes a
  **`pr` group node** (`id: pr:N`, `label: #N · <title>`, `count`). Its members
  are the merge plus the branch commits = commits reachable from the merge's 2nd
  parent but **not** its 1st (a BFS over the parent map). A commit is claimed by
  the nearest PR (process merges newest-first; skip already-claimed).
- Commits on mainline that are not part of any PR render as standalone **loose**
  `commit` nodes on the spine.
- `graph-builder` stays **presentation-agnostic**: it returns all commit nodes
  (each tagged with its `group`), the `pr` group nodes, and the parent edges. The
  **frontend** owns collapse/expand — all groups collapsed by default; clicking a
  `pr` node toggles its members' visibility and reflows the `preset` layout.
- ADR `decides` edges and the `focus` edge now target the **group** (or loose
  commit) containing the relevant commit, so links stay meaningful when collapsed.

Rejected: time-bucket grouping (a date is not a unit of work); decisions-only view
(too sparse — hides the commits entirely); server-side pagination (doesn't give
structure, just less data).

## Consequences

- The default view collapses 47 commits to ≤ ~10 top-level nodes; it scales with
  PR count, not commit count.
- Clustering keys on **merge commits**. Squash/rebase workflows (no merge commit)
  will show their commits as loose — acceptable; this repo uses merge commits.
- Grouping is O(merges × commits) via per-merge BFS — fine at this scale; not
  optimized (YAGNI).
- The collapse/expand state lives in the frontend; `/api/graph` gains `pr` nodes
  and a `group` field on commits but stays a pure data read.
