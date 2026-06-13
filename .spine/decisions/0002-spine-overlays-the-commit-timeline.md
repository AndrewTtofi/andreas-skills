# 0002. The Spine overlays meaning onto the commit timeline

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, graph, spine

## Context

Commits give sequence and dependency ([[0001-git-history-as-commit-backbone]]),
but not *why*. The Spine holds the why: ADRs (`decisions/`), the current focus
and acceptance criteria, and the journal History (dated milestones, often citing
a commit SHA). We need to attach that meaning to commits without fabricating
links that aren't real.

## Decision

`buildGraph(spineDir, repoDir)` combines git history with a Spine overlay and
returns `{ nodes, edges }`:

- **Nodes:** `commit` (every commit: shortSha, subject, body, author, date, and a
  `milestone` flag/text when the journal History cites its SHA), `decision` (each
  ADR), and a single `focus` node (current focus; acceptance criteria carried in
  its detail, *not* as separate nodes).
- **Edges:** `parent` (commit→parent, the git DAG incl. merges), `decides`
  (ADR→the commit it was decided in), `supersedes` (ADR→ADR when declared),
  `focuses` (focus→HEAD).
- **Attachment:** an ADR attaches to a commit by a SHA referenced in the ADR or
  in the journal; absent that, the nearest commit by date (ADRs carry a Date).

Rejected: turning each acceptance criterion into a node with an `implements`
edge to a commit — the mapping is fuzzy and would invent false dependencies.
Criteria belong to the focus, shown in its panel. Rejected: separate
"milestone" nodes duplicating commits — instead a milestone annotates its commit.

## Consequences

- Commits are the single backbone; ADRs and focus decorate it. No duplicate or
  fabricated nodes — the graph stays truthful.
- This refines the `align` criteria: criteria render via the focus node's detail;
  History milestones annotate commits; edge vocab is
  `parent`/`decides`/`supersedes`/`focuses`.
- `/api/graph` nodes gain `type` + `time`; the commit body travels in the node so
  the detail panel needs no extra endpoint.
