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
memory and the worked example. Everything is merged to `main` (PRs #7–#12); CI (`validate` workflow) + branch
protection now gate `main`.

**Active ({tooling, validate, manifest, ci, tests}, confidence ~92%):** harden
`scripts/validate.mjs` against the Claude Code **manifest schema**. Today it only
checks truthiness, so `author: "string"` passes but silently blocks
`/plugin install` (footgun noted in `conventions.md`), and `marketplace.json`
isn't validated at all. Scope: enforce **core install-blocker** type/shape rules
on **both** manifests, two tiers (errors fail / warnings inform), refactor the
schema logic into pure importable functions (`validate.mjs` = thin CLI wrapper),
add a `node:test` suite, and have CI run validate + tests. Out: full JSON-Schema
deps, format-lint extras (semver/name-pattern/SPDX), the dashboard.
Assumptions: malformed JSON → clean error; missing `marketplace.json` → error;
exact schema rules confirmed against the authoritative spec in `design`.

## Next step

**Ship.** Verify passed — all 15 criteria met with evidence (below).

## Verification (2026-06-13)

**Verdict: all 15 acceptance criteria MET.** Evidence:
- `node --test scripts/` → **22 pass / 0 fail** (covers criteria 1–5, 9, 13–15
  as pure-function tests; 10/15 = pure module imported directly).
- `node scripts/validate.mjs` on the real repo → **exit 0**, all 9 skills `ok`,
  one warning surfaced (`plugin.json: missing "license"`) → criteria 8, 9, 12.
- CLI failure sweep (throwaway repo), each **exit 1** with a clean message:
  author-as-string → `"author" must be an object … not a string` (C1); missing
  version (C2); `author.name is required` (C3); owner-as-string (C4); entry
  missing `source` (C5); `invalid JSON in marketplace.json: …` (C6, no stack
  trace); `marketplace.json missing` (C7); non-kebab name (C13); `keywords` as
  string + `source` not `./`-prefixed (C14).
- `npm test` → exit 0; workflow runs validate + `npm test`; the required
  `validate` check covers both (C11) — **live PR run confirmed at ship**.
- Diff: +435/-17 across `scripts/` + `package.json` + workflow; no TODOs, stubs,
  or dead code; `manifest-schema.mjs` is pure (no fs/exit), `validate.mjs` the
  thin CLI wrapper (C10, C15).

## Build plan (slices) — TDD, smallest vertical slices

1. **Pure `validateManifest(plugin)`** in `scripts/manifest-schema.mjs` +
   `manifest-schema.test.mjs`: name present+kebab-case, description/version
   present (repo convention), author-if-present object w/ name, keywords-if-present
   array. Returns `{errors, warnings}`. (criteria 1,2,3,9-part)
2. **Pure `validateMarketplace(marketplace)`**: name kebab-case, owner object w/
   name, plugins non-empty array, each entry name kebab-case + source present
   (string ⇒ `./`-prefixed), author-if-present object. (criteria 4,5,13,14)
3. **Wire into `validate.mjs`**: clean JSON read/parse (missing/malformed →
   readable error), missing `marketplace.json` → error, call both validators,
   merge with existing checks, two-tier print + exit. (criteria 6,7,8,10,12)
4. **Cross-checks → warnings**: plugin↔marketplace `version` mismatch, missing
   `license`/`keywords`. (criterion 9)
5. **CI + root scaffold**: root `package.json` (`test: node --test`, scoped to
   validator tests), extend the `validate` workflow to run validate + tests.
   (criterion 11)

## Acceptance criteria (active work)

## Acceptance criteria (active work)

- [x] 1. `plugin.json` `author` as a bare string → **fails** (exit 1), message names "author must be an object with a name".
- [x] 2. `plugin.json` missing/empty `name`/`description`/`version` → fails, field-specific.
- [x] 3. `author` object missing `name` → fails.
- [x] 4. `marketplace.json` missing/non-object `owner` or missing `owner.name` → fails.
- [x] 5. `plugins[]` entry missing `name` or `source` → fails.
- [x] 6. Malformed JSON in either manifest → fails with `invalid JSON in <file>` (no raw stack trace).
- [x] 7. Missing `marketplace.json` → fails.
- [x] 8. Current real manifests → **passes** (exit 0).
- [x] 9. Best-practice nits (missing `license`/`keywords`, plugin↔marketplace `version` mismatch) → **warnings**, build still passes.
- [x] 10. Schema logic in pure importable functions returning `{errors, warnings}`; `validate.mjs` only prints + sets exit code.
- [x] 11. `node --test` passes a suite covering 1–9; CI runs validate + tests under the required `validate` check.
- [x] 12. Pre-existing checks (skill frontmatter, README/skills wiring) remain and still pass.
- [x] 13. Non-kebab-case `name` (plugin.json, marketplace.json, or a `plugins[]` entry) → **fails** (install-blocker, pulled into scope after schema research).
- [x] 14. `keywords` present but not an array → fails; a `plugins[]` `source` that's a string not starting with `./` → fails.
- [x] 15. Schema logic lives in pure `scripts/manifest-schema.mjs` (no fs/exit); `validate.mjs` is the thin CLI wrapper that reads/parses/prints/exits.

## Prior candidate follow-ups (not committed to):
- Apply the collision pass to the **expanded** commit-ring too (a ring can
  currently overlap a neighbour; the default brain is overlap-free).
- Surface more `concept` nodes (only "Spine" crosses the ≥2-ADR bar today).
- Harden `scripts/validate.mjs` against Claude Code's manifest schema.

## History

- 2026-06-13 {skills, align, init, gate, dogfood} — **PR #12 (merged, `4f02c64`)**: the
  **contracting gate**. `align` reworked into an extensive, certainty-gated
  intent interview — 12 interrogation dimensions, an explicit confidence score,
  and a context playback the user must confirm before any building. `init` now
  **installs the gate into any repo** (self-gating `UserPromptSubmit` hook in
  `.claude/settings.json` + marker-delimited `CLAUDE.md` block), so enforcement
  ships with the Spine rather than living only here. Installed + dogfooded on
  this repo; `.gitignore` narrowed so the shared hook is committed.
  `validate.mjs` green; hook verified silent-without/fires-with `.spine/`; merge
  proven idempotent.
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
