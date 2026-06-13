# 0013. Deterministic spring + collision brain (sequence in line, zero overlap)

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, graph, ux, layout
- Supersedes [[0012-deterministic-sequenced-organic-layout]] (spine + side-scatter
  wasn't brain-like and still overlapped).

## Context

Requirements that must hold together: a **brain-like** organic web; the
chronological **sequence kept "in line"** within it; **zero overlap** (verified,
not by eye); **deterministic** (no reload scramble); and **scale to ~100 PRs with
no scrolling** (one fit-to-view brain, navigate by search + filters + zoom). A
real force layout (fcose) gives the brain but scrambles and can't guarantee
no-overlap; a rigid spine gives sequence but isn't a brain.

## Decision

Hand-roll a **deterministic spring-embedder with a hard collision pass** in
`layoutBrain()` — no force library, no `Math.random`:

1. **Nodes** = visible nodes (clusters + module/ADR/concept satellites; commits
   stay hidden when collapsed).
2. **Seed** positions deterministically — clusters along a serpentine/phyllotaxis
   by chronological index (gives the sequence a flow direction); satellites near
   their connected clusters (by a hashed offset).
3. **Force iterations** (a fixed count, deterministic):
   - **chain springs** on `parent` edges (cluster↔cluster): strong, short ideal
     length → consecutive clusters stay adjacent and ordered = the sequence *in
     line*, but free to curve organically.
   - **satellite springs** on `touches`/`decides`/`references`/`mentions`:
     medium → communities form around their clusters (the brain).
   - **repulsion**: all-pairs inverse-distance → spreads the web.
4. **Collision pass**: separate overlapping node **bounding boxes**
   (`outerWidth`/`outerHeight` + a gap) along the least-penetration axis, iterated
   to convergence → **guaranteed zero overlap** (chips, labels, hubs).
5. `fit()` to the whole brain.

Same seed + fixed iterations → **identical every reload**. Scale is handled by
navigation (fit/zoom/search/filter), not by aggregation.

Rejected: fcose / any force library (non-deterministic, no overlap guarantee); a
rigid timeline spine (not a brain); collapsing old PRs into bundles (the user
chose "navigate one big brain").

## Consequences

- One layout satisfies brain + sequence + zero-overlap + determinism + scale.
- Hand-rolled physics lives in `layoutBrain()`; O(n²) per iteration is fine at the
  ~130-node scale and acceptable into the hundreds.
- Collision needs rendered node sizes, so it runs after `cy.add`.
- Expand (commit ring) and search continue to reuse these deterministic positions.
- The `parent` (chain) edge is styled to stand out as the traceable sequence line.
