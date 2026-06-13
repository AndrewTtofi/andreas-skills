# 0014. Validate manifests against the install schema in a pure, tested module

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** tooling, validate, manifest, ci, tests

## Context

`scripts/validate.mjs` is the repo's **test harness** — it enforces structural
invariants and gates CI (the required `validate` check). But for plugin metadata
it only checked *truthiness* (`!plugin[field]`), so manifests that are
well-formed-but-wrong slipped through. The worst case is documented in
`conventions.md`: `author: "a string"` passes the gate yet **blocks
`/plugin install`**, because Claude Code requires `author` to be an *object*. The
validator also never looked at `.claude-plugin/marketplace.json` at all.

The authoritative Claude Code plugin spec (plugins-reference + plugin-marketplaces
docs) pins the install-blocking rules: in `plugin.json` only `name` is strictly
required and must be **kebab-case**; `author`, if present, must be an object with
`name`; wrong-typed fields (e.g. `keywords` as a string) fail to load. In
`marketplace.json`, `name`, `owner` (object with `name`), and `plugins[]` (each
with a `name` and a `source` that, when a string, starts with `./`) are required.

Constraints: the repo is deliberately **zero-dependency**; tests are **hermetic**
(pure functions fed fixtures, `node --test`, per the dashboard's convention);
existing frontmatter + wiring checks and the current real manifests must keep
passing. We are validating *this repo's own* manifests, so we also keep the
repo-convention requirement that `description`/`version` be present even though
the spec treats them as optional.

## Decision

Extract the schema logic into a **pure, importable module**
`scripts/manifest-schema.mjs` exporting `validateManifest(plugin)` and
`validateMarketplace(marketplace)`, each taking a parsed object and returning
`{ errors, warnings }` (no filesystem, no `process.exit`). `validate.mjs` stays
the **thin CLI wrapper**: it reads files, parses JSON with clean error handling,
calls the pure validators, keeps its existing fs-based skill/wiring checks, then
prints a **two-tier** report — `errors` fail (exit 1), `warnings` inform — and
sets the exit code.

Rules enforced as **errors** (install-blockers + repo convention): `name`
present + kebab-case string (plugin, marketplace, and each `plugins[]` entry);
`author`/`owner` if present must be objects with a string `name`; `description`
and `version` present (repo convention, backward-compat); `keywords` if present
must be an array; `marketplace.plugins` a non-empty array; each entry's `source`
present and, if a string, `./`-prefixed; malformed/missing JSON; missing
`marketplace.json`. **Warnings**: missing `license`/`keywords`, and a
`version` mismatch between `plugin.json` and the marketplace entry.

Tests live in `scripts/manifest-schema.test.mjs` (`node --test`, inline object
fixtures — a valid base plus targeted mutations). A minimal root `package.json`
adds `test: node --test`, scoped to the validator tests so it never collides with
the dashboard's separate suite, and the `validate` CI workflow runs validate +
tests so the required check covers both.

Rejected: a JSON-Schema/AJV dependency (breaks zero-dep); validating *format*
extras like semver/SPDX (declined in align as low-value lint — but `name`
kebab-case was pulled in once the spec confirmed it is install-blocking, not
lint); refactoring the frontmatter/wiring checks too (out of scope, already pass).

## Consequences

- A wrong-shaped manifest now fails the gate **before** it can reach a user as a
  broken `/plugin install` — the harness stops giving false confidence.
- The schema rules are unit-tested in isolation, so they can grow safely; the
  pure-function boundary keeps them hermetic and fast.
- The repo gains its first **root-level** test target and a second CI command;
  `npm test` at root now means "validator tests" (the dashboard keeps its own).
- We deliberately encode two repo-specific-but-not-install-blocking rules
  (`description`/`version` required) as errors; if the repo ever wants to ship a
  manifest without them, this ADR must be revisited.
- The validator now knows two manifests; adding a third (or new fields) means
  extending the pure module + its fixtures, not the CLI plumbing.
