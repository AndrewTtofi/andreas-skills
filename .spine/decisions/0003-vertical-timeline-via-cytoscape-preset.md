# 0003. Render a vertical timeline via Cytoscape's preset layout

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, graph, ux

## Context

The old graph used Cytoscape with an **fcose force layout** (loaded from the
unpkg CDN), which produces an organic "constellation" — the hairball the user
disliked. We want a clear, sequenced, dependency-connected view. The data is now
time-ordered ([[0002-spine-overlays-the-commit-timeline]]). Cytoscape can place
nodes at explicit coordinates via its `preset` layout, and already provides the
pan/zoom/tap interaction the frontend depends on.

## Decision

Keep Cytoscape but replace the force layout with a deterministic **`preset`**
layout: the frontend computes positions and feeds them in.

- **Orientation:** vertical scroll-timeline — newest commit at top, oldest at
  bottom. `y` increases with age; commits sit on a primary lane (`x = 0`);
  `decision` nodes offset to a side lane near their commit's `y`; `focus` pins
  near HEAD at the top.
- **Edges** are styled per `rel`; consecutive `parent` edges draw the visible
  spine. The graph view is restyled for the timeline (spine line, lane guides);
  the Docs mode and overall Archive theme are unchanged.

Rejected: hand-rolled SVG — cleaner zero-dep story and full styling control, but
discards the working pan/zoom/tap and interaction code; the user chose to keep
Cytoscape. Rejected: keeping the force layout — it is the cause of the problem.

## Consequences

- Determinism: the same history always lays out the same way — a real sequence,
  not a physics simulation.
- The dashboard stays CDN-coupled to Cytoscape (an accepted trade for reusing the
  interaction layer); removing that coupling is a future option, not this change.
- Layout is computed frontend-side from node `time`/`type`; `graph-builder` stays
  presentation-agnostic (returns data, not coordinates).
- Branch/merge lanes are kept simple (single commit spine; merges just draw both
  `parent` edges) — multi-lane railroad layout is YAGNI for this repo's history.
