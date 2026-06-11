# Launch post (DRAFT — do not publish until v1.1)

**Title:** andreas-skills — give your coding agent a memory

Most Claude Code skill collections are a drawer of loose tools. I wanted
something that works like a senior engineer across a whole feature — and
remembers what it learned.

So I built **andreas-skills**, unified by one idea: the **Spine**, a `.spine/`
project-memory store every skill reads and writes. Your agent carries context
across phases (align → build → verify) *and* across sessions.

The v1 loop:
- `init` seeds the Spine and detects your stack
- `align` grills intent into testable criteria before building
- `build` does TDD vertical slices following your conventions
- `verify` demands evidence before "done"
- `remember` distills the session back into the Spine

The payoff: close your laptop, open a fresh session tomorrow, and the agent
resumes cold from `.spine/` — no re-explaining.

Install: `npx skills@latest add AndrewTtofi/andreas-skills`
Repo: https://github.com/AndrewTtofi/andreas-skills

Roadmap: design, ship, troubleshoot, new-skill — plus deeper reference files per
skill. Feedback welcome.
