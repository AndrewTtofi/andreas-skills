# Contributing

Thanks for helping make spine better.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter:
   - `name:` must equal `<name>` (the folder name).
   - `description:` one line with explicit trigger phrases ("Use when ...").
2. Keep `SKILL.md` thin. Put depth in sibling reference files
   (e.g. `skills/<name>/patterns.md`) and link to them — progressive disclosure.
3. If it's a lifecycle skill, declare its **Spine I/O** (what it reads from and
   writes to `.spine/`).
4. Wire it in:
   - add the path to `.claude-plugin/plugin.json`
   - link it in `README.md` (Skills section)
   - list it in `skills/README.md`
5. Run `node scripts/validate.mjs` — it must pass.
6. Open a pull request.

## Quality bar

Skills should read like a senior engineer wrote them: small, composable,
model-agnostic, reusable in any repo. Favor durable principles over ceremony.
See `CLAUDE.md` for the conventions the validator enforces.
