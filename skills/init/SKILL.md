---
name: init
description: Use to bootstrap the .spine/ project-memory store in a repo before using the other skills. Detects the stack and seeds context.md, conventions.md, and journal.md. Run once per repo.
---

# init — bootstrap the Spine

The Spine (`.spine/`) is the shared memory every andreas-skill reads and writes.
This skill creates it.

## Steps

1. **Check for an existing Spine.** If `.spine/` already exists, report what's
   there and ask whether to refresh specific files rather than overwriting.
2. **Detect the stack.** Inspect manifests (`package.json`, `pyproject.toml`,
   `go.mod`, `Cargo.toml`, etc.) and config to infer language, framework, test
   runner, and the install/test/typecheck/build commands.
3. **Create the structure:**
   - `.spine/context.md`
   - `.spine/conventions.md`
   - `.spine/journal.md`
   - `.spine/decisions/` (empty, with a `.gitkeep`)
   Seed each from this skill's `templates/`, filling in detected values. Leave
   `<placeholders>` only where you genuinely lack information, and flag them.
4. **Install the contracting gate.** This makes `align` fire for every
   non-trivial request in this repo — the gate ships with the Spine, not just
   with the plugin. Two artifacts, both *merged* into what already exists (never
   clobber):
   - `.claude/settings.json` — merge in the `UserPromptSubmit` hook from
     [templates/settings.gate.json](templates/settings.gate.json). It self-gates
     on `.spine/` existing, so it stays silent in a checkout where the Spine was
     removed. If the file already has a `hooks.UserPromptSubmit` array, append
     this entry; don't duplicate it if an identical Spine-gate command is
     already present.
   - `CLAUDE.md` — append the block from
     [templates/claude-gate.md](templates/claude-gate.md) (create `CLAUDE.md` if
     absent). It's wrapped in opening/closing `spine:contracting-gate` markers;
     if the opening marker is already present anywhere in the file, the block is
     installed — leave it, don't add a second copy.
5. **Confirm with the user.** Show the seeded `conventions.md` commands and the
   `context.md` architecture map; correct anything wrong before finishing.
   Mention that the contracting gate is now active.
6. **Suggest committing** `.spine/`, `.claude/settings.json`, and `CLAUDE.md` so
   the memory and the gate are shared with the team.
7. **Point to the dashboard.** Tell the user they can view the Spine anytime in
   a browser with `npx spine-dashboard` (read-only).

## Spine I/O

- **Writes:** `context.md`, `conventions.md`, `journal.md`, `decisions/`.
- **Also writes (outside `.spine/`):** `.claude/settings.json` (contracting-gate
  hook), `CLAUDE.md` (contracting-gate instruction).

## Notes

- Never invent commands you haven't verified exist in the manifest/scripts.
- The Spine is for durable knowledge, not transient chatter.
- Merge, never overwrite, `.claude/settings.json` and `CLAUDE.md` — they
  routinely hold unrelated config the user cares about.
