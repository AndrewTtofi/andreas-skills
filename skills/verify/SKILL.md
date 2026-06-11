---
name: verify
description: Use when work is supposedly complete, before claiming it is done or merging. Checks the change against the acceptance criteria by running tests, typecheck, and review — and reports evidence, never bare assertions. Reads criteria from the Spine.
---

# verify — evidence before "done"

"Done" is a claim that requires proof. This skill produces the proof.

## Steps

1. **Read the acceptance criteria** from `journal.md` and the commands from
   `conventions.md`.
2. **Run the checks.** Execute the test suite, typecheck, and build/lint
   commands. Capture the actual output.
3. **Review the diff** against `conventions.md` and the Spine's language: naming,
   module boundaries, dead code, missing tests.
4. **Check each criterion** off only with concrete evidence (a passing test, an
   observed behavior). Anything unverified stays open.
5. **Report** a short verdict: each criterion → met / not-met → the evidence.
   Quote real command output. If anything failed, say so plainly.
6. **Write the result** to `journal.md`. Do not mark the work complete in the
   Spine unless every criterion is met with evidence.

## Spine I/O

- **Reads:** `journal.md` (criteria), `conventions.md` (commands).
- **Writes:** `journal.md` (verification result).

## Notes

- Never assert "tests pass" without showing the run. Evidence before assertions.
- If a check can't be run, say why — don't skip silently.
