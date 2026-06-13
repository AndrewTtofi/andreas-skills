# 0010. Labels as a first-class, queryable layer (derived + Spine)

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** spine, labels, graph

## Context

The graph shows structure but isn't *queryable* — you can't ask "show me the UX
work" or "everything that touched the plugin." We want labels you can filter by,
and — crucially — they must be produced by the **skills** into the Spine, not just
inferred in the dashboard, so the queryable layer is part of the product.

## Decision

Labels come from **two sources**, attached to graph nodes by `graph-builder`:

1. **Derived** (free, broad): parse each commit's conventional-commit subject —
   `^(\w+)(\(([^)]+)\))?!?:` → `type/<type>` and `scope/<scope>` labels (e.g.
   `type/feat`, `scope/dashboard`). Non-conforming subjects (merges) yield none.
2. **Explicit Spine labels** (curated): an ADR carries `labels:` in its frontmatter
   → the `decision` node's labels; a journal History entry carries `{a, b}` →
   labels on the commit/milestone it cites.

Aggregation: a `pr`/`segment` cluster's labels = the **union** of its member
commits' labels. Every node ends up with `labels: string[]` and a `time`.
`/api/graph` carries these per node; the frontend derives the distinct label set
and `[minTime, maxTime]` from them (no extra endpoint).

**Skill/Spine convention** (the production side):
- `skills/design/adr-format.md` template gains a `labels:` field.
- `skills/init/templates/journal.md` History format becomes
  `- <date> {labels} — <what happened>`.
- `align` / `design` / `remember` SKILL.md instruct recording labels.
- `CLAUDE.md` documents the convention. This repo's own `.spine/` adopts it.

Rejected: dashboard-only derivation (doesn't satisfy "add it to the skills");
a free-form taxonomy with no namespacing (the `type/`·`scope/` prefixes let the
filter group derived labels cleanly).

## Consequences

- The graph becomes filterable by meaning, and the Spine gains a durable, queryable
  metadata layer that any tool (not just this dashboard) can read.
- Skills now have a small new responsibility: tag the work. Cheap, and it compounds.
- `graph-builder` gains a label-derivation step; nodes carry `labels` + `time`.
