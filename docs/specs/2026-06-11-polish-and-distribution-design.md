# Polish & Distribution-Readiness — Design Spec

**Date:** 2026-06-11
**Status:** Approved (design) → pending implementation plan
**Author:** Andreas Ttofi
**Builds on:** `2026-06-11-spine-design.md` (v1)

## Goal

Make spine v1 look and feel like a senior, trustworthy, *launch-ready*
project — without announcing it yet. Close the polish/governance/distribution
gap vs `mattpocock/skills` while v1 still has only 5 skills.

## Decisions (locked during brainstorming)

- **Launch timing:** Package quietly now; hold the loud announcement until v1.1
  depth lands. Polish is done now; announcement is deferred.
- **README:** Full masterclass (narrative + worked example), not a light tidy.

## Scope

### 1. README masterclass (`README.md`)

Restructure into:

1. Hero — title, one-liner, badges (skills.sh, MIT license, Claude Code).
2. The pitch — drawer-of-tools → the Spine.
3. **The 3 problems it solves** — original failure-mode narrative:
   builds-the-wrong-thing, fragile/over-complex code, lost context across
   sessions. Each names the fix (a skill + the Spine).
4. The Spine — what `.spine/` is (the file table) + the lifecycle-loop diagram.
5. **Worked walkthrough** (the killer section) — a concrete run of
   `init → align → build → verify → remember`, showing the `.spine/` files
   filling up, then a *fresh session resuming cold* from the Spine. This makes
   the moat visible.
6. Install.
7. Skills reference — the 5 skills, each linked to its `SKILL.md`.
8. Philosophy / design tenets.
9. Roadmap (v1.1: design, ship, troubleshoot, new-skill).
10. Contributing pointer + License.

### 2. Governance

- `CLAUDE.md` — repo rules. Every shipped skill MUST appear in `plugin.json`,
  `README.md`, and `skills/README.md`. Skill structure conventions (frontmatter
  `name` matches folder; thin `SKILL.md` + optional reference files; Spine I/O
  declared). Mirrors the discipline in `mattpocock/skills` CLAUDE.md.
- `skills/README.md` — index listing each skill with a one-line description,
  name linked to its `SKILL.md`.
- `CONTRIBUTING.md` — how to add a skill, the quality bar, "run the validator."

### 3. Validator extensions (`scripts/validate.mjs`)

Enforce the governance automatically:
- Each skill in `plugin.json` is referenced in `skills/README.md`.
- `plugin.json` carries `name`, `description`, `version`, `author`.
Keep checks **structural** — no prose-policing.

### 4. Distribution-readiness (quiet)

- Confirm `npx skills add AndrewTtofi/spine` resolves (note: requires
  network; verify or document).
- Set the GitHub repo **description + topics** so it is findable (public
  metadata, not an announcement) via `gh repo edit`.
- **Draft but do NOT publish** launch material under `docs/launch/`:
  - `launch-post.md` — a Show-HN / newsletter-style post draft.
  - `awesome-claude-code-entry.md` — the one-line entry + where it goes.

## Non-goals

- No announcement: no `awesome-claude-code` PR opened, no post published, no
  newsletter. Deferred to v1.1.
- No new skills in this thread (that's the Breadth thread).
- No prose-quality enforcement in the validator.

## Success criteria

- README has all 10 sections incl. the worked walkthrough; every skill linked.
- `node scripts/validate.mjs` passes and now fails closed if a skill is missing
  from `skills/README.md` or `plugin.json` lacks required metadata.
- `CLAUDE.md`, `skills/README.md`, `CONTRIBUTING.md` exist and are consistent
  with the actual repo.
- GitHub repo has a description + topics.
- `docs/launch/` holds the two unpublished drafts.

## Open questions

- Badge for skills.sh: use the `skills.sh/b/<user>/<repo>` badge pattern Matt
  uses; confirm the exact slug at implementation time. If it can't be verified,
  omit rather than ship a broken badge.
