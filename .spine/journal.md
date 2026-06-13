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

Brain built + verified (37/37, validator green). **Opened PR #9**
(https://github.com/AndrewTtofi/spine/pull/9) for the cohesion + Stripe-light +
brain work — which had been committed to the branch *after* PR #8 merged and so
was orphaned (not in main / no PR). Awaiting review/merge, then `remember`.

Process note: PR #8 (PR-clustering + three-pane docs) was merged at 08:55 UTC; I
kept committing to the same branch and wrongly reported "pushed to PR #8". Check
PR state before claiming a push lands in it.

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
- [x] The graph is force-directed (fcose); related nodes cluster organically.
- [x] Node types: `pr`/`segment` clusters, `decision`, `module` hub, `concept`,
      `focus`; commits appear when a cluster is expanded. (/tmp/spine-brain.png)
- [x] Non-sequential edges: `touches`, `references`, `mentions` + existing
      `parent`/`decides`/`supersedes`/`focuses`. (real repo: 44 touches, 7 refs,
      7 mentions)
- [x] Hubs/concepts only when shared by ≥2 things (real repo: 14 hubs, 1 concept).
- [x] fit-all on load; scroll-zoom + drag-pan; search centres+highlights and
      expands clusters of matching commits. (/tmp/spine-brain-search.png)
- [x] Reads as a brain in the light theme.

Data:
- [x] `git-reader` returns `files[]` per commit.
- [x] `graph-builder` emits module/concept nodes + non-sequential edges.

Cross-cutting:
- [x] No new npm deps (fcose via CDN, like Cytoscape).
- [x] git-reader/graph-builder unit tests (13 brain-related); `node --test`
      37/37; `node scripts/validate.mjs` → All 9 skills valid.

## History

- 2026-06-13 — **PR #9 (open)**: cohesion (every commit clustered + in-flight
  "Current branch") [[0006-cluster-every-commit-into-segments]]; Stripe-grade light
  reskin [[0008-stripe-grade-light-design-system]]; and the force-directed
  knowledge-graph **brain** (module hubs, concept nodes, non-sequential edges,
  fit/zoom/search) [[0009-knowledge-graph-brain-with-hubs]]. Built on the branch
  after #8 merged. 37/37 tests. ([[0007-refined-dark-professional-palette]] was an
  intermediate dark step, superseded by 0008.)
- 2026-06-13 — **PR #8 (merged)**: PR-clustering + three-pane enterprise docs
  [[0004-cluster-commits-by-pull-request]], [[0005-docs-three-pane-with-generated-toc]].
- 2026-06-13 — **PR #7 (merged, `df26c02`)**: v1.1 skills (ship/troubleshoot/
  new-skill) + plugin author fix + the original dashboard graph redesign
  (git-reader backbone, Spine overlay, vertical timeline). 26/26 tests.
  ADRs [[0001-git-history-as-commit-backbone]],
  [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`.
- 2026-06-13 — Seeded this `.spine/` via `init`; dogfooded the full spine
  lifecycle to produce the work above.
