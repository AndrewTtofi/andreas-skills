---
name: align
description: Use before building any feature or change to interrogate intent until acceptance criteria are crisp. Prevents the agent from building the wrong thing. Writes the agreed intent and criteria to .spine/journal.md.
---

# align — nail intent before building

Most wasted work comes from building before intent is clear. This skill closes
that gap with a focused interview.

## Steps

1. **Read the Spine** (`context.md`, `conventions.md`, current `journal.md`) so
   questions are grounded in what already exists — don't ask what the Spine
   already answers.
2. **Interview, one question at a time.** Prefer multiple-choice. Cover:
   purpose, scope boundaries (what's explicitly out), constraints, and how we'll
   know it's done. Stop when no decision is left ambiguous.
3. **Surface ambiguities and assumptions explicitly.** Name anything you're
   inferring and get a yes/no.
4. **Produce acceptance criteria** as a checklist — each item observable and
   testable (e.g. "Given X, when Y, then Z").
5. **Write to the Spine.** Update `journal.md`: set *Current focus* to this work,
   *Next step* to the first build action, and append the acceptance criteria.
   Tag this work with a few **labels** (area + topic) so the path stays queryable.
6. **Confirm** the criteria with the user before any building begins.

## Spine I/O

- **Reads:** `context.md`, `conventions.md`, `journal.md`.
- **Writes:** `journal.md` (focus, next step, acceptance criteria).

## Notes

- Do not start implementing here. This skill ends at agreed criteria.
- One question per message. Don't overwhelm.
