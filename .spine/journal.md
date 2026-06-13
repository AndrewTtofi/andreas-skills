# Journal

## Current focus

**Iteration 6 — a true brain that keeps the sequence in line and never overlaps.**
Feedback: the layout must be brain-like (organic web), keep a legible chronological
**sequence "in line"** within it, have **zero overlap**, stay **deterministic**
(no scramble on reload), and scale to ~100 PRs with **no scrolling** (navigate one
fit-to-view brain via search + filters + zoom). {dashboard, graph, ux, layout}

### Acceptance criteria (iteration 6)

- [x] Brain-like organic web (deterministic spring sim), not a line or columns.
- [x] The cluster chain (`parent` path, drawn as a bold blue thread) is kept
      **in line** — tight chain springs keep consecutive clusters adjacent and
      ordered; you can trace the sequence through the brain.
- [x] **Zero overlap**: collision pass on label-inclusive boxes → verified
      **0 overlapping node boxes** programmatically.
- [x] **Deterministic**: cluster positions identical across reloads.
- [x] Scales without scrolling: 2D fit-to-view brain; navigate via search +
      filters + zoom.
- [x] Interactions intact: expand→commit ring (9 commits), filter (git → 2),
      search — no console errors.
- [x] `node --test` 42/42 + `node scripts/validate.mjs` green; no new deps
      (hand-rolled spring+collision, fcose removed).

### Prior focus (iteration 5 — shipped to PR #11)

**Iteration 5 — labels, timeline filtering, and a WIP anchor (woven through the
Spine + skills, not just the dashboard).** Make the whole path queryable and
filterable.

1. **Labels** — derived (conventional-commit `type`+`scope`) AND explicit Spine
   labels (`labels:` on ADRs, `{labels}` on journal entries, written by the
   skills). Every node carries labels.
2. **Filter bar** over the brain — date-range slider + label chips; filtering
   **hides** non-matching nodes (no relayout). Time AND label combine.
3. **WIP anchor** — the "Current branch" cluster, accent-filled with a `WIP`
   badge, always visible.
4. **Spine + skills convention** — ADR template gains `labels:`; journal History
   becomes `- <date> {labels} — …`; align/design/remember SKILL.md record them;
   documented in `CLAUDE.md`; our own `.spine/` adopts it (dogfood).

## Next step

Iteration 6 built + verified (brain + in-line sequence chain, 0 overlaps,
deterministic, 42/42, validator green). Pushed to PR #11. Then `remember`.

## Build plan (iteration 5)

Design in [[0010-labels-as-a-queryable-layer]], [[0011-filter-bar-and-wip-anchor]].

1. **`graph-builder` labels** — RED: from injected commits/ADRs, assert commit
   nodes carry `type/`·`scope/` labels, clusters union them, ADR nodes read
   `labels:` frontmatter, every node has `labels` + `time`. GREEN + commit.
2. **Filter bar + WIP** (`public/`) — time-range inputs + label chips that hide
   non-matching nodes/edges (display:none, no relayout); "Current branch"
   accent-filled with a `WIP` badge. Verify live.
3. **Spine + skills convention** — `adr-format.md` `labels:`; journal template
   `{labels}` format; align/design/remember SKILL.md; `CLAUDE.md`; backfill our
   own `.spine/` ADRs + journal with labels. `validate.mjs` green.
4. **verify + ship** — suite + validator green; screenshots; criteria; PR.

## Acceptance criteria (iteration 5)

Labels (data — `graph-builder`):
- [x] Every commit node carries derived labels: a `type/<t>` and (if present)
      `scope/<s>` parsed from its conventional-commit subject.
- [x] Cluster (`pr`/`segment`) labels = the union of their commits' labels.
- [x] ADR nodes carry explicit `labels:` read from the ADR frontmatter. (Module
      hubs get a `scope/` label too; journal `{labels}` deferred — not needed yet.)
- [x] Every node carries `labels[]` + `time`; the frontend derives the label set
      and `[minTime,maxTime]` (slice 2). Real repo: 20 distinct labels.

Filter bar (dashboard):
- [x] A date-range control (two sliders) hides nodes outside the window — no
      relayout (display:none, positions unchanged).
- [x] Label chips toggle; a node shows iff (no chips OR it carries a selected
      label) AND in the window. (verified: `ux` → only ux-labelled nodes + WIP)
- [x] Clear restores every node to its place.

WIP anchor:
- [x] The "Current branch" cluster is accent-filled with a `● WIP` badge and is
      exempt from filters (always visible as "now"). (/tmp/filter-ux.png)

Spine + skills convention:
- [x] `skills/design/adr-format.md` ADR template includes a `Labels:` field + guidance.
- [x] `skills/init/templates/journal.md` History format is `- <date> {labels} — …`.
- [x] `align`, `design`, `remember` SKILL.md instruct recording labels.
- [x] `CLAUDE.md` documents the labels convention.
- [x] Our own `.spine/` ADRs (0001–0011) + journal History carry labels — the
      dashboard reads them (22 distinct labels).

Cross-cutting:
- [x] `graph-builder` unit tests for derived + explicit labels (slice 1).
- [x] `node --test` 42/42 + `node scripts/validate.mjs` green; zero new deps.

## History

- 2026-06-13 {dashboard, graph, ux} — **PR #9 (merged, `7472942`)**: the dashboard **brain** — every
  commit clustered (segments + in-flight "Current branch")
  [[0006-cluster-every-commit-into-segments]], Stripe-grade light reskin
  [[0008-stripe-grade-light-design-system]], and the force-directed knowledge
  graph with module hubs / concept nodes / non-sequential edges + fit/zoom/search
  [[0009-knowledge-graph-brain-with-hubs]]. 38/38 tests. (Intermediate dark step
  [[0007-refined-dark-professional-palette]] superseded by 0008.) **Lesson:**
  verify a PR is still open before claiming a push lands in it — work committed
  after #8 merged orphaned on the branch until gathered into #9.
- 2026-06-13 {dashboard, graph, docs} — **PR #8 (merged)**: PR-clustering + three-pane enterprise docs
  [[0004-cluster-commits-by-pull-request]], [[0005-docs-three-pane-with-generated-toc]].
- 2026-06-13 {skills, dashboard} — **PR #7 (merged, `df26c02`)**: v1.1 skills (ship/troubleshoot/
  new-skill) + `plugin.json` author fix + the first dashboard graph redesign
  (git-reader backbone, Spine overlay, vertical timeline). ADRs
  [[0001-git-history-as-commit-backbone]], [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`.
- 2026-06-13 {spine, dogfood} — Seeded this `.spine/` via `init`; installed the
  plugin locally and dogfooded the full spine lifecycle to produce the work above.
