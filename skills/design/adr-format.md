# ADR format

An Architecture Decision Record captures one significant decision and, crucially,
*why* it was made — so future sessions don't relitigate it.

Write each ADR to `.spine/decisions/NNNN-short-title.md`, where `NNNN` is the
next 4-digit number after the highest existing ADR (start at `0001`).

## Template

```markdown
# NNNN. <Short title in the imperative, e.g. "Use Postgres for the data store">

- **Status:** accepted
- **Date:** <YYYY-MM-DD>
- **Labels:** <comma-separated tags for filtering — area + topic, e.g. `data, infra`>

## Context

<The forces at play: the problem, the constraints, what we know. Use the
project's shared language from context.md.>

## Decision

<The choice we made, stated plainly.>

## Consequences

<What this makes easy, what it makes hard, and what we're now committed to.
Include notable trade-offs we accepted.>
```

## Guidance

- One decision per ADR. If you're tempted to write "and also", split it.
- Record the alternatives you rejected and why — that's the most valuable part.
- ADRs are immutable history. To change a decision, write a new ADR that
  supersedes the old one (note it in both).
- **Labels** make decisions queryable. Use a small, reusable vocabulary (the same
  tags across ADRs and journal entries) so they can be filtered together.
