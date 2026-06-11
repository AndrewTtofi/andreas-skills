---
name: build
description: Use to implement a feature or bugfix as small TDD vertical slices that follow the repo's conventions. Produces working, tested code one slice at a time. Reads acceptance criteria and conventions from the Spine.
---

# build — TDD vertical slices

Implement work the way a senior engineer does: smallest valuable slice first,
test-first, frequent commits, following the repo's existing patterns.

## Steps

1. **Read the Spine.** Load `conventions.md` (commands + patterns to follow),
   `context.md` (architecture + language), and the acceptance criteria in
   `journal.md`. If there are no criteria yet, run `align` first.
2. **Pick the smallest vertical slice** that delivers one acceptance criterion
   end to end.
3. **Red:** write a failing test that pins the desired behavior. Run it; confirm
   it fails for the *expected* reason.
4. **Green:** write the minimal code to pass. Run the test; confirm it passes.
5. **Refactor:** improve names and structure with tests green. Favor deep
   modules with simple interfaces — avoid balls of mud.
6. **Commit** the slice with a clear message.
7. **Update the Spine.** In `journal.md`, tick the criterion, set the next step.
8. Repeat until all criteria are met. Stop and report if a criterion is blocked.

## Spine I/O

- **Reads:** `conventions.md`, `context.md`, `journal.md`.
- **Writes:** `journal.md` (progress, next step).

## Notes

- Use the test/typecheck commands from `conventions.md`, not invented ones.
- Name code using the Spine's shared language for consistency.
- Don't claim a slice is done without running its test — that's `verify`'s rule
  too, applied continuously here.
