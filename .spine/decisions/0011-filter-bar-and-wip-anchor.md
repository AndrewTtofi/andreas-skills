# 0011. Dashboard filter bar (time + labels) and a WIP anchor

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, ux, labels, filter

## Context

With labels and time on every node ([[0010-labels-as-a-queryable-layer]]), the
brain can become filterable. The user also wants a structural reference point for
"now" — the current work-in-progress — having removed the focus star.

## Decision

Add a **filter bar** above the graph and a **WIP anchor**, both within the Stripe
light theme.

- **Time range**: two range inputs over the sorted distinct dates (a from/to
  window), shown as `Jun 9 – Jun 13`. Nodes whose `time` falls outside the window
  are hidden.
- **Label chips**: one chip per distinct label in the graph. A node passes the
  label filter iff **no chip is active** OR its `labels` intersect the active set.
- **Combine**: a node is shown iff it passes the time window AND the label filter.
  Filtering **hides** non-matching nodes + their edges via Cytoscape `display:none`
  — positions are untouched, so there is **no relayout/reshuffle** (consistent with
  the expand behaviour). A "Clear" control restores everything.
- **WIP anchor**: the "Current branch" `segment` cluster renders accent-filled with
  a `WIP` badge in its label, so "now" is always identifiable; a "Now" affordance
  re-centres on it.

Rejected: hiding by removing elements (would lose positions); a separate Timeline
mode (the filter bar on the brain is enough for now — YAGNI); fading instead of
hiding (the ask is to "filter out", i.e. remove from view).

## Consequences

- The brain answers "what, when, and of what kind" — filter to a date window
  and/or a set of labels, live.
- Hiding (not relayout) keeps the graph stable while filtering.
- The WIP cluster gives a durable "you are here", replacing the rejected star with
  something structural.
- The frontend computes the label set + date domain from node data; no API change
  beyond the per-node `labels`/`time` from [[0010-labels-as-a-queryable-layer]].
