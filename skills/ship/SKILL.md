---
name: ship
description: Use when verified work is ready to land — turns it into a clean branch, commits, and a pull request whose body is drawn from the Spine (criteria, decisions, evidence). Refuses to ship work that hasn't passed verify. Reads the Spine; writes the shipped status back to it.
---

# ship — land verified work

Shipping is a claim to the rest of the team: *this is done, here's the proof, here's
why*. This skill assembles that claim from the Spine instead of from memory.

## Steps

1. **Read the Spine.** Load `journal.md` (acceptance criteria + the latest
   verification result), `conventions.md` (test/build commands and any VCS or PR
   conventions), `context.md` (shared language), and `decisions/` (ADRs to cite).
2. **Gate on verify.** Confirm every acceptance criterion is met *with evidence*
   in `journal.md`. If anything is unverified or failing, stop and run `verify`
   first — do not ship unproven work.
3. **Prepare the branch.** If you're on the default branch, create a feature
   branch first. Make sure the working tree is clean and the diff is only what
   this work intends to ship.
4. **Commit hygiene.** Group changes into clear, conventional commits with
   messages that explain *why*, following any pattern in `conventions.md`.
5. **Compose the PR body from the Spine.** Summary of what changed and why; the
   acceptance criteria as a ticked checklist; links to the ADRs that justify the
   approach; and the verification evidence (the real command output, not a
   claim). Name things using the Spine's shared language.
6. **Push and open the PR** against the base branch. Run the test/build commands
   from `conventions.md` one last time if CI won't.
7. **Record in the Spine.** Update `journal.md`: mark the work shipped, link the
   PR, and set *Next step* (await review / merge). Leave the merge to the user
   unless they ask you to land it.

## Spine I/O

- **Reads:** `journal.md` (criteria + verification result), `conventions.md`
  (commands, VCS/PR conventions), `context.md` (language), `decisions/` (ADRs to cite).
- **Writes:** `journal.md` (shipped status, PR link, next step).

## Notes

- Never ship work that `verify` hasn't passed — the PR body's evidence comes from
  a real run, not an assertion.
- The PR body is a Spine read-out: criteria, decisions, evidence. If those are
  thin, the earlier phases were skipped — go back, don't paper over it.
- Branch off the default branch; never commit straight to it.
