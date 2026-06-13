# Journal

## Current focus

**Handoff:** The spine plugin is at v1.1.0 (9 skills) and the dashboard's graph
has been redesigned into a sequenced, dependency-connected commit timeline — both
landed in `main` via PR #7. The whole dashboard redesign was done by dogfooding
the spine lifecycle on this repo (`init → align → design → build → verify → ship`),
so `.spine/` here is both the project memory *and* the worked example. Nothing is
in flight. To resume: pick the next thing.

No open focus.

## Next step

None pending. Candidate follow-ups (not committed to):
- Manual click-through of the dashboard detail panel (the one thing not verified
  headlessly — Cytoscape renders to `<canvas>`).
- Harden `scripts/validate.mjs` to check the plugin/marketplace manifests against
  Claude Code's schema (the gap that let the `author: string` bug reach install).
- Optionally remove the Cytoscape CDN coupling (noted as future in ADR-0003).

## History

- 2026-06-13 — Shipped v1.1: skills `ship`, `troubleshoot`, `new-skill` + the
  `plugin.json` `author`-object fix, plus the dashboard graph redesign
  (`git-reader` backbone, Spine-overlay `graph-builder`, vertical Cytoscape
  `preset` timeline). 26/26 dashboard tests, validator green, 16/16 criteria.
  Design in ADRs [[0001-git-history-as-commit-backbone]],
  [[0002-spine-overlays-the-commit-timeline]],
  [[0003-vertical-timeline-via-cytoscape-preset]]; spec at
  `docs/specs/2026-06-13-dashboard-graph-redesign.md`. Merged as PR #7 (`df26c02`).
- 2026-06-13 — Seeded this `.spine/` via `init`; installed the plugin locally and
  dogfooded the full lifecycle to produce the redesign above.
