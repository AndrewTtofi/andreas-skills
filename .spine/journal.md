# Journal

## Current focus

**Handoff:** spine is a v1.1.0 Claude Code plugin (9 lifecycle skills) plus a
`spine-dashboard` that renders any repo's `.spine/`. The dashboard's graph is a
**deterministic spring+collision "brain"** in a Stripe-grade light theme: clusters
flow **left→right by time** (oldest left, newest/WIP right) along a traceable
`parent` chain, with ADRs, module hubs and concept nodes webbing around — **zero
overlap, identical every reload**, navigated by fit/zoom/**search + a filter bar**
(date range + **label** chips). Labels are a first-class queryable layer the skills
themselves produce (ADR `Labels:`, journal `{labels}`). All of it was built by
**dogfooding the spine lifecycle on this repo**, so `.spine/` here is both the
memory and the worked example. Everything is merged to `main` (PRs #7–#11).
Nothing is in flight.

No open focus.

## Next step

None pending. Candidate follow-ups (not committed to):
- Apply the collision pass to the **expanded** commit-ring too (a ring can
  currently overlap a neighbour; the default brain is overlap-free).
- Surface more `concept` nodes (only "Spine" crosses the ≥2-ADR bar today).
- Harden `scripts/validate.mjs` against Claude Code's manifest schema.

## History

- 2026-06-13 {dashboard, graph, ux, labels, layout} — **PR #11 (merged,
  `95b78e6`)**: a queryable + navigable brain — a **labels** layer (derived
  `type`/`scope` + explicit Spine labels the skills write)
  [[0010-labels-as-a-queryable-layer]]; a **filter bar** (date range + label chips)
  and a **WIP anchor** [[0011-filter-bar-and-wip-anchor]]; and the
  **deterministic spring+collision layout** — left→right by time, zero overlap, no
  scramble [[0012-deterministic-sequenced-organic-layout]],
  [[0013-deterministic-spring-collision-brain]]. 42/42 tests.
- 2026-06-13 {dashboard, graph, ux} — **PR #10 (merged)**: expanding a cluster no
  longer reshuffles the brain (pin existing nodes), focus-on-expand fades the
  unrelated set, and the focus star was removed.
- 2026-06-13 {dashboard, graph} — **PR #9 (merged, `7472942`)**: the force-directed
  knowledge-graph brain — every commit clustered
  [[0006-cluster-every-commit-into-segments]], Stripe-grade light reskin
  [[0008-stripe-grade-light-design-system]], module hubs / concepts /
  non-sequential edges [[0009-knowledge-graph-brain-with-hubs]].
  **Lesson:** verify a PR is still open before claiming a push lands in it.
- 2026-06-13 {dashboard, graph, docs} — **PR #8 (merged)**: PR-clustering +
  three-pane enterprise docs [[0004-cluster-commits-by-pull-request]],
  [[0005-docs-three-pane-with-generated-toc]].
- 2026-06-13 {skills, dashboard} — **PR #7 (merged, `df26c02`)**: v1.1 skills
  (ship/troubleshoot/new-skill) + `plugin.json` author fix + the first dashboard
  graph redesign [[0001-git-history-as-commit-backbone]],
  [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`.
- 2026-06-13 {spine, dogfood} — Seeded this `.spine/` via `init`; dogfooded the
  full spine lifecycle to produce the work above.
