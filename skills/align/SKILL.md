---
name: align
description: Use before building any feature or change to interrogate intent until both you and the user are certain the context is right. Runs an extensive, multi-dimensional interview, then gates on an explicit confidence score and a context playback the user must confirm. Prevents building the wrong thing. Proactively invoke this (do NOT start building) whenever the user requests a non-trivial feature, change, or fix. Writes the agreed intent and criteria to .spine/journal.md.
---

# align — reach mutual certainty before building

Most wasted work comes from building before intent is clear. This skill closes
that gap with an extensive interview and a hard gate: **you do not start building
until you can state high confidence *and* the user has confirmed your playback of
the context.** Both parties must be certain the context is right.

## Steps

1. **Read the Spine** (`context.md`, `conventions.md`, current `journal.md`) so
   questions are grounded in what already exists — never ask what the Spine
   already answers.
2. **Interrogate every dimension.** Work through
   [interrogation.md](interrogation.md): problem, outcome, users, scope in/out,
   constraints, prior art, integration, edge cases, non-functionals, risks. The
   goal isn't to ask all of them — it's to leave **none silently assumed**. For
   each: the Spine answers it, the user answers it, or you name your assumption
   and get a yes/no.
3. **Ask in batches, iterate in rounds.** Group related questions into a single
   round (multiple-choice where possible) rather than one slow question at a
   time — extensive, but not a slog. After each round, fold answers in and open
   the next round on what's still ambiguous. Keep going until you have **zero
   open assumptions**.
4. **Score your confidence (0–100%).** State, explicitly, how confident you are
   that you understand the intent well enough to build the *right* thing, and
   *why*. If it's below ~90%, you are not done — name exactly what's missing and
   run another round.
5. **Play back the context.** Once confidence is high, restate — in your own
   words, compactly — for the user to check:
   - the problem and why it matters,
   - the outcome / definition of done,
   - scope **in** and scope **out**,
   - key constraints and decisions made during the interview,
   - **remaining unknowns / assumptions** you're proceeding on (state them even
     at high confidence — honesty about the last 10% is the point).
6. **Produce acceptance criteria** as a checklist — each item observable and
   testable ("Given X, when Y, then Z").
7. **Gate.** You may proceed only when **both** hold: your confidence is high
   *and* the user confirms the playback is correct. If the user corrects
   anything, update and replay before continuing.
8. **Write to the Spine.** Update `journal.md`: set *Current focus* to this work,
   *Next step* to the first build action, append the acceptance criteria, and
   record the confidence level and any stated assumptions. Tag the work with a
   few **labels** (area + topic) so the path stays queryable.

## Spine I/O

- **Reads:** `context.md`, `conventions.md`, `journal.md`.
- **Writes:** `journal.md` (focus, next step, acceptance criteria, confidence,
  assumptions).

## Notes

- Do not start implementing here. This skill ends at confirmed criteria.
- Extensive ≠ exhausting. Batch, use multiple-choice, and skip what the Spine
  already settles — depth without dragging.
- A high confidence score with honestly-named unknowns beats a fake 100%. The
  playback exists so the user catches the assumption you got wrong.
