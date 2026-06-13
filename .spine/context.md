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
- `scripts/validate.mjs` — the **test harness** + CLI wrapper. Enforces
  structural invariants: every skill in `plugin.json` exists, has valid
  frontmatter (name == folder), and is wired into `README.md` +
  `skills/README.md`. Reads both manifests, parses JSON with clean errors, then
  delegates shape-checking to `manifest-schema.mjs` and prints a **two-tier**
  report (errors fail, warnings inform). See
  [[0014-manifest-schema-validation-pure-module]].
- `scripts/manifest-schema.mjs` — **pure** manifest validators
  (`validateManifest`, `validateMarketplace`): parsed object → `{errors,
  warnings}`, no fs/exit. Encodes the Claude Code install-blocker rules (author/
  owner must be objects, name kebab-case, keywords array, source `./`-prefixed,
  …). Unit-tested hermetically in `manifest-schema.test.mjs` (`node --test`).
- `package.json` (root) — minimal, zero-dep; `test: node --test` scoped to the
  validator tests (the `dashboard/` package keeps its own suite).
- `dashboard/` — a separate zero-dep npm package, `spine-dashboard`: a read-only
  local web view of any repo's `.spine/`. Backend modules (Node ESM):
  - `spine-reader.mjs` — pure read of `.spine/` → structured data.
  - `git-reader.mjs` — pure read of git history via `git log --name-only`
    (shelled, injectable `run`); each commit carries its `files[]`. The commit
    backbone. See [[0001-git-history-as-commit-backbone]].
  - `graph-builder.mjs` — builds a **knowledge graph** `{nodes, edges}`: clusters
    every commit by PR/segment ([[0004-cluster-commits-by-pull-request]],
    [[0006-cluster-every-commit-into-segments]]), overlays Spine meaning
    ([[0002-spine-overlays-the-commit-timeline]]), adds non-sequential **module
    hubs** + **concept** nodes ([[0009-knowledge-graph-brain-with-hubs]]), and
    attaches **labels** (derived `type`/`scope` + explicit Spine labels) and
    `time` to every node ([[0010-labels-as-a-queryable-layer]]).
  - `markdown.mjs` — markdown → HTML.
  - `server.mjs` — composes the above; serves `/api/spine`, `/api/graph`, static
    `public/`.
  - `public/` — frontend (vanilla JS + Cytoscape + fcose via CDN), **Stripe-grade
    light theme** ([[0008-stripe-grade-light-design-system]]). Graph mode is a
    knowledge-graph **brain** with a **deterministic spring+collision layout** —
    clusters chained in time order (sequence in line), satellites spring to their
    connections, hard collision = zero overlap
    ([[0009-knowledge-graph-brain-with-hubs]],
    [[0013-deterministic-spring-collision-brain]]) — navigated by fit/zoom/search,
    clusters collapse to commits, with a **filter bar** (time range + label chips)
    and a **WIP anchor** ([[0011-filter-bar-and-wip-anchor]]);
    Docs mode is a three-pane layout ([[0005-docs-three-pane-with-generated-toc]]).
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

**Cluster**: a `pr` node (commits of one pull request) or a `segment` node (a run
of non-merge mainline commits — newest = "Current branch", older = "Direct to
main"). Every commit belongs to exactly one cluster.

**Module hub**: a `module` node for a code path touched by ≥2 clusters — the
non-sequential connector in the brain (clusters link to it via `touches`).
Meta/doc paths (README, docs, manifests) are excluded as noise.

**Concept node**: a `concept` node for a shared-language term named by ≥2 ADRs,
linked via `mentions` — the conceptual layer of the brain.

**The brain**: the force-directed knowledge graph the dashboard renders — clusters
+ ADRs + module hubs + concepts, with sequential and non-sequential edges.

**Label**: a queryable tag on a node — derived (`type/feat`, `scope/dashboard`
from commit subjects) or explicit (ADR `labels:`, journal `{labels}`). The basis
for the dashboard's filter bar. See [[0010-labels-as-a-queryable-layer]].

**WIP anchor**: the "Current branch" cluster, styled as the always-visible
reference point for current work-in-progress.

**Install-blocker**: a manifest mistake that is valid JSON but causes
`/plugin install` to fail (e.g. `author` as a string, a non-kebab-case `name`,
`keywords` as a string). `validate.mjs` fails the build on these; lesser
best-practice issues are warnings. See
[[0014-manifest-schema-validation-pure-module]].

**Two-tier validation**: the validator's report split into `errors` (fail the
build, exit 1) and `warnings` (inform, don't fail).
