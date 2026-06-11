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
4. **Confirm with the user.** Show the seeded `conventions.md` commands and the
   `context.md` architecture map; correct anything wrong before finishing.
5. **Suggest committing** `.spine/` so the memory is shared with the team.
6. **Point to the dashboard.** Tell the user they can view the Spine anytime in
   a browser with `npx spine-dashboard` (read-only).

## Spine I/O

- **Writes:** `context.md`, `conventions.md`, `journal.md`, `decisions/`.

## Notes

- Never invent commands you haven't verified exist in the manifest/scripts.
- The Spine is for durable knowledge, not transient chatter.
