# Journal

## Current focus

**Dashboard iteration 4 — the knowledge graph becomes a brain** (lands in the
open PR #8). The graph pivots from a vertical *timeline* to a force-directed
**knowledge graph**: PR/segment clusters, ADRs, **module/file hubs**, and
**concept** nodes, connected by both sequential and **non-sequential** edges
(touches-module, ADR↔ADR references, concept mentions). Navigated by
**fit-all / zoom / search** — which also fixes the 40-PR scroll problem.
Stays in the approved Stripe-grade light theme.

Only *real* edges (no mention-noise): module hubs and concept nodes are created
only when shared by ≥2 things. Commits stay collapsed inside clusters by default,
so the default brain is ~7 clusters + a few hubs + ADRs + concepts — organic,
readable.

## Next step

`build` slice 1: `git-reader` returns files-touched per commit, test-first.

## Build plan (iteration 4)

Design in [[0008-stripe-grade-light-design-system]],
[[0009-knowledge-graph-brain-with-hubs]].

1. **`git-reader` files-per-commit** — RED: injected `git log --name-only`
   output; assert each commit carries its `files[]`. GREEN + commit.
2. **`graph-builder` hubs + non-sequential edges** — RED: derive `module` hubs
   from file paths (only modules touched by ≥2 clusters), `concept` nodes from
   context.md Language (≥2 mentions), and edges `touches`/`references`/`mentions`.
   GREEN + commit.
3. **Frontend brain** (`public/`) — force-directed layout (re-add fcose CDN),
   fit-all on load, zoom/pan, a search box that centres+highlights a node; brain
   styling in the light theme; keep cluster collapse/expand. Verify live.
4. **verify** — suite + validator green; screenshots; criteria. PR #8 updates.

## Acceptance criteria (iteration 4)

Brain graph:
- [ ] The graph is force-directed (related nodes cluster organically), not a
      vertical timeline.
- [ ] Node types: `pr`/`segment` clusters, `decision`, `module` hub, `concept`,
      `focus`; commits appear when a cluster is expanded.
- [ ] Non-sequential edges present: `touches` (cluster/commit↔module),
      `references` (ADR↔ADR from [[wikilinks]]), `mentions` (concept↔ADR/cluster);
      plus existing `parent`/`decides`/`supersedes`/`focuses`.
- [ ] Hubs/concepts only when shared by ≥2 things (no noise).
- [ ] Navigation: fit-all on load; scroll-zoom + drag-pan; a search box centres &
      highlights a matching node. No infinite scroll.
- [ ] Reads as a clean brain in the light theme, not a hairball (screenshot).

Data:
- [ ] `git-reader` returns `files[]` per commit.
- [ ] `graph-builder` emits module/concept nodes + non-sequential edges.

Cross-cutting:
- [ ] No new npm deps (fcose via CDN, consistent with Cytoscape).
- [ ] `git-reader`/`graph-builder` unit tests for the above; `node --test` +
      `node scripts/validate.mjs` green.

## History

- 2026-06-13 — **PR #8 (open)** iterations on the dashboard:
  (a) PR-clustering + three-pane enterprise docs [[0004-cluster-commits-by-pull-request]],
  [[0005-docs-three-pane-with-generated-toc]];
  (b) cohesion + refined-dark, every commit clustered + in-flight "Current branch"
  [[0006-cluster-every-commit-into-segments]], [[0007-refined-dark-professional-palette]];
  (c) Stripe-grade light reskin (Inter, white, #635bff)
  [[0008-stripe-grade-light-design-system]];
  (d) — in progress — the brain [[0009-knowledge-graph-brain-with-hubs]].
- 2026-06-13 — **PR #7 (merged, `df26c02`)**: v1.1 skills (ship/troubleshoot/
  new-skill) + plugin author fix + the original dashboard graph redesign
  (git-reader backbone, Spine overlay, vertical timeline). 26/26 tests.
  ADRs [[0001-git-history-as-commit-backbone]],
  [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`.
- 2026-06-13 — Seeded this `.spine/` via `init`; dogfooded the full spine
  lifecycle to produce the work above.
