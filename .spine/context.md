# Project Context

> Shared vocabulary and architecture map. Keep it concise — one concept per entry.

## What this project is

**spine** is a full-lifecycle engineering skill system for coding agents,
packaged as an installable Claude Code plugin. Its skills map to the phases of
engineering work (init → align → design → build → verify → ship → troubleshoot →
remember) and are unified by a per-repo project-memory store, the **Spine**
(`.spine/`), that every skill reads from and writes to — so the agent carries
understanding across phases and across sessions. For developers who want their
coding agent to work like a senior engineer and not lose the plot.

## Architecture map

- `skills/<name>/SKILL.md` — the skills (9): the lifecycle loop `init`, `align`,
  `design`, `build`, `verify`, `ship`, `troubleshoot`, `remember`, plus the meta
  skill `new-skill`. Each `SKILL.md` is thin (progressive disclosure); depth
  lives in sibling reference files (e.g. `design/adr-format.md`).
- `.claude-plugin/plugin.json` — lists the shipped skills; makes the repo an
  installable plugin. `author` must be an **object** (`{name}`).
- `.claude-plugin/marketplace.json` — marketplace wrapper so the plugin installs
  via `/plugin marketplace add` + `/plugin install spine@spine`.
- `scripts/validate.mjs` — the **test harness**. Enforces structural invariants:
  every skill in `plugin.json` exists, has valid frontmatter (name == folder),
  and is wired into `README.md` + `skills/README.md`; plus plugin metadata.
- `dashboard/` — a separate zero-dep npm package, `spine-dashboard`: a read-only
  local web view of any repo's `.spine/`. Backend modules (Node ESM):
  - `spine-reader.mjs` — pure read of `.spine/` → structured data.
  - `git-reader.mjs` — pure read of git history via `git log` (shelled,
    injectable `run` for tests); the commit backbone. See
    [[0001-git-history-as-commit-backbone]].
  - `graph-builder.mjs` — overlays the Spine onto the commit timeline →
    `{nodes, edges}`, and clusters commits into `pr` group nodes by the pull
    request they landed in (DAG reachability). See
    [[0002-spine-overlays-the-commit-timeline]],
    [[0004-cluster-commits-by-pull-request]].
  - `markdown.mjs` — markdown → HTML.
  - `server.mjs` — composes the above; serves `/api/spine`, `/api/graph`, static
    `public/`.
  - `public/` — frontend (vanilla JS + Cytoscape via CDN). Graph mode renders a
    vertical timeline via Cytoscape `preset` layout
    ([[0003-vertical-timeline-via-cytoscape-preset]]) with PR groups collapsed by
    default and expandable to commits; Docs mode is a three-pane layout (sectioned
    sidebar · constrained content · generated TOC),
    [[0005-docs-three-pane-with-generated-toc]].
- `docs/` — `plans/`, `specs/`, and `launch/` (unpublished launch material).
- `.spine/` — this memory store: `context.md`, `conventions.md`, `journal.md`,
  `decisions/`. The connective tissue across phases and sessions.

## Language

**Spine**: the `.spine/` folder a skill maintains in a repo (context ·
conventions · journal · decisions). _Avoid_: memory bank, context store.

**Lifecycle skill**: a skill mapped to one phase of engineering work that reads
from and writes to the Spine.

**Spine I/O contract**: what a skill reads from / writes to the Spine, declared
in its `SKILL.md`.

**Wiring**: the three places a shipped skill must appear — `plugin.json`,
`README.md`, `skills/README.md` — enforced by `validate.mjs`.

**Commit backbone**: the git commit history (`git-reader`) that forms the
dashboard graph's primary, ordered, dependency-bearing spine.

**Overlay**: Spine meaning (ADRs, focus) attached onto commits in the graph —
`decision` nodes, the `focus` node, and milestone annotations on commits.

**PR group**: a `pr` node clustering the commits that landed in one pull request
(the merge + its branch commits). The default unit shown in the graph.

**Loose commit**: a mainline commit not part of any merged PR; rendered standalone.
