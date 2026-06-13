# Journal

## Current focus

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

`build` slice 2: filter bar (time range + label chips, hide non-matching) + WIP
anchor on the Current-branch cluster.

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
- [ ] A date-range control filters the brain to nodes within the window; nodes
      outside are hidden (no relayout — positions unchanged).
- [ ] Label chips (all labels in the graph) toggle a filter; a node shows iff
      (no chips selected OR it carries a selected label) AND it's in the window.
- [ ] Clearing filters restores every node to its place.

WIP anchor:
- [ ] The "Current branch" cluster is accent-filled with a `WIP` badge and stays
      visible/identifiable as "now".

Spine + skills convention:
- [ ] `skills/design/adr-format.md` ADR template includes a `labels:` field.
- [ ] `skills/init/templates/journal.md` History format is `- <date> {labels} — …`.
- [ ] `align`, `design`, `remember` SKILL.md instruct recording labels + dates.
- [ ] `CLAUDE.md` documents the labels convention.
- [ ] Our own `.spine/` ADRs + journal carry labels (dashboard shows them).

Cross-cutting:
- [ ] `graph-builder` unit tests for derived + explicit labels and the time range.
- [ ] `node --test` + `node scripts/validate.mjs` green; zero new deps.

## History

- 2026-06-13 — **PR #9 (merged, `7472942`)**: the dashboard **brain** — every
  commit clustered (segments + in-flight "Current branch")
  [[0006-cluster-every-commit-into-segments]], Stripe-grade light reskin
  [[0008-stripe-grade-light-design-system]], and the force-directed knowledge
  graph with module hubs / concept nodes / non-sequential edges + fit/zoom/search
  [[0009-knowledge-graph-brain-with-hubs]]. 38/38 tests. (Intermediate dark step
  [[0007-refined-dark-professional-palette]] superseded by 0008.) **Lesson:**
  verify a PR is still open before claiming a push lands in it — work committed
  after #8 merged orphaned on the branch until gathered into #9.
- 2026-06-13 — **PR #8 (merged)**: PR-clustering + three-pane enterprise docs
  [[0004-cluster-commits-by-pull-request]], [[0005-docs-three-pane-with-generated-toc]].
- 2026-06-13 — **PR #7 (merged, `df26c02`)**: v1.1 skills (ship/troubleshoot/
  new-skill) + `plugin.json` author fix + the first dashboard graph redesign
  (git-reader backbone, Spine overlay, vertical timeline). ADRs
  [[0001-git-history-as-commit-backbone]], [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`.
- 2026-06-13 — Seeded this `.spine/` via `init`; installed the plugin locally and
  dogfooded the full spine lifecycle to produce the work above.
