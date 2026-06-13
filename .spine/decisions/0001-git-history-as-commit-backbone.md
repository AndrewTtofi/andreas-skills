# 0001. Read git history as the dashboard graph's commit backbone

- **Status:** accepted
- **Date:** 2026-06-13

## Context

The dashboard graph must show "everything that was done" as a sequence connected
by dependencies. Commits are the only complete, ordered, dependency-bearing
record of what happened (each commit knows its parents). The existing
`graph-builder.mjs` reads only `.spine/` and has no notion of time or commits.
The dashboard runs from any repo's cwd (`spineDir = cwd/.spine`), so the repo is
`dirname(spineDir)`. The repo's hard convention is **zero npm dependencies**.

## Decision

Add a new module **`git-reader.mjs`** (sibling to `spine-reader.mjs`) that returns
git history by shelling out to `git log` via `node:child_process` `execFileSync`
with a stable `--pretty=format` and an explicit record/field delimiter, parsed
into `{ available, commits: [{ sha, shortSha, parents[], subject, body, author,
date }] }`. It takes an injectable `run` function so tests feed canned `git log`
output without needing a real repo (hermetic). No git, git not installed, or
empty history → `{ available: false, commits: [] }`.

Rejected: reimplementing a `.git` object reader (huge, pointless); adding a git
library (violates zero-dependency). Shelling `git` keeps zero npm deps.

## Consequences

- The dashboard now reads the repo's git, not just `.spine/`. With no `.git` it
  degrades to a Spine-only timeline ([[0002-spine-overlays-the-commit-timeline]]).
- `git` must be on PATH where the dashboard runs (true for any dev machine).
- The `run`-injection seam makes `git-reader` unit-testable without a fixture repo.
- `git-reader` is a deep module: small interface (`readGitHistory(repoDir)`),
  all the format/parse/fallback complexity hidden behind it.
