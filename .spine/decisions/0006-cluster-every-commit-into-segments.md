# 0006. Every mainline commit belongs to a cluster

- **Status:** accepted
- **Date:** 2026-06-13

## Context

PR clustering ([[0004-cluster-commits-by-pull-request]]) grouped *merged* commits,
but left everything else as bare loose dots: the initial commits, direct-to-main
chores, and — most visibly — the **in-flight branch** (an open PR has no merge
commit yet, so its commits couldn't cluster). The result reads as scatter around
the neat PR chips. The graph should have no orphan dots: every commit belongs to
exactly one cluster.

## Decision

Extend `graph-builder` so the first-parent mainline is fully partitioned:

- A `Merge pull request #N` commit → a `pr` cluster (unchanged).
- Each maximal run of **consecutive non-merge** mainline commits → a `segment`
  cluster node. The newest run (commits above the latest PR merge — i.e. the
  unmerged HEAD work) is labelled **"Current branch"**; older runs are labelled
  **"Direct to main"** with their date. Members carry a `group` tag like commits
  in a PR.
- Result: `pr` and `segment` are both collapsible group nodes; no commit is loose.

Computed from the first-parent chain we already derive — no extra git calls.

Rejected: leaving in-flight commits loose (the exact complaint); a single catch-all
"other" bucket (loses chronological place on the spine).

## Consequences

- The in-flight PR's work now clusters ("Current branch"), and the graph is a
  clean column of group nodes — nothing floats.
- "Current branch" is a heuristic (newest non-merge run), not a real PR number,
  until it merges; good enough and honest.
- `segment` nodes reuse the `pr` collapse/expand machinery; the frontend treats
  both as groups.
