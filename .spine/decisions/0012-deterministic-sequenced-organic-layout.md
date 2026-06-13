# 0012. Deterministic sequenced-and-organic layout (sequence + brain)

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, graph, ux, layout
- Supersedes the force-directed layout of [[0009-knowledge-graph-brain-with-hubs]]
  (the knowledge-graph *content* — clusters, hubs, concepts, edges — still holds).

## Context

The fcose force layout (`randomize: true`) re-randomised on **every reload**, so
the graph scrambled — you could never build a mental map of it. It also had no
time axis, so the **sequence** (what happened when) was invisible. The user wants
**both**: a readable chronological sequence *and* the organic, brain-like web —
and it must be stable across reloads.

## Decision

Replace the force layout with a **deterministic** one (no `Math.random`, no force
library — fcose CDN removed), computed in `layoutBrain()`:

- **Clusters** run down a **gently meandering chronological spine**: `y = time
  index` (the sequence, newest at top), `x = sin(i)·95` (a wave, so it reads
  organic rather than a rigid line). Consecutive clusters are joined by the
  `parent` path.
- **Satellites** (module hubs, ADRs, concepts) are **scattered around the
  centroid of their connections** at a hash-derived angle + radius (a web),
  biased right (modules) / left (ADRs, concepts).
- A **de-overlap pass** pushes colliding nodes apart while keeping the cluster
  spine **fixed**, so nothing overlaps and the sequence stays intact.

Same input → identical positions every reload (verified: cluster positions are
byte-stable across reloads).

Rejected: fcose with `randomize:false` + constraints (force layouts risk residual
non-determinism in the spectral phase); a rigid single-column timeline (loses the
brain); a pure force web (scrambles, no sequence).

## Consequences

- Sequence and brain in one view; stable mental map across reloads.
- Expand (commit ring) and search reuse these deterministic positions — no
  relayout, no reshuffle.
- The layout is hand-tuned (spine wave, scatter radius, de-overlap gap); future
  tweaks live in `layoutBrain()`.
