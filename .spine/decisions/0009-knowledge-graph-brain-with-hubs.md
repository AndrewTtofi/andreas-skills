# 0009. The graph is a force-directed knowledge graph (a "brain")

- **Status:** accepted
- **Date:** 2026-06-13
- Supersedes the timeline layout of [[0003-vertical-timeline-via-cytoscape-preset]]
  (the clustering of [[0006-cluster-every-commit-into-segments]] still holds as
  node grouping).

## Context

A vertical timeline answers "what happened when" but not "what connects to what",
and even PR-clustered it scrolls forever past ~40 PRs. The ask: make it look like
a **brain** — parts of the repo connected by **non-sequential** relationships.
The earlier "constellation" failed because its edges were text-mention noise; a
real brain needs real edges.

## Decision

Render a **force-directed knowledge graph**, navigated by **fit-all / zoom /
search** (which also retires the scroll problem).

- **Nodes**: `pr`/`segment` clusters, `decision` (ADR), `module` hubs (a file or
  module path), `concept` (a Spine shared-language term), `focus`. Commits stay
  collapsed inside clusters; expand to reveal them.
- **Edges**: sequential `parent`/`decides`/`supersedes`/`focuses` **plus**
  non-sequential — `touches` (cluster/commit ↔ the module it changed, from
  `git log --name-only`), `references` (ADR ↔ ADR via `[[wikilinks]]`),
  `mentions` (concept ↔ ADR/cluster that names it).
- **No noise**: a `module` hub or `concept` node exists only when **≥2** things
  connect to it. Singletons are dropped.
- **Layout**: Cytoscape **fcose** (re-added via CDN — force layout is the right
  tool for a brain; the timeline's `preset` is retired). Default `fit()` to the
  whole graph; scroll-zoom + drag-pan; a search box centres+highlights a node.

Rejected: a timeline-with-cross-link-arcs hybrid (user chose the full brain);
mention-matching edges (the original noise); creating a hub per file (cluttered).

## Consequences

- Related work pulls together organically (PRs sharing a module cluster near it;
  ADRs sit by their concepts) — the "brain".
- New data path: `git-reader` must read files per commit; `graph-builder` maps
  files→modules and emits hub/concept nodes + non-sequential edges.
- fcose CDN scripts return to `index.html` (a CDN dep, like Cytoscape itself; no
  npm dependency added).
- Scale is handled by navigation (fit/zoom/search), not pagination.
