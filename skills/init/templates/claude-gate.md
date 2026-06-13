<!-- spine:contracting-gate (managed by spine init) -->
## The contracting gate

This repo uses the **Spine** (`.spine/`). Every non-trivial request starts with
`align`. Before writing code or making a change for a feature, fix, or anything
ambiguous, invoke `align` and run it to completion — an extensive interview, an
explicit confidence score, and a context playback the user confirms. **Do not
start building until confidence is high and the user has confirmed the
playback.** The point is that *both* the agent and the user are certain the
context is right.

Trivial work is exempt: one-line edits, answering a question, mechanical chores,
or anything the user has already specified unambiguously. When in doubt, align.
<!-- /spine:contracting-gate -->
