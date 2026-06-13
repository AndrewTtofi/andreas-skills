---
name: troubleshoot
description: Use when something is broken — a failing test, a bug, an error, behavior that regressed. Drives a disciplined investigate → reproduce → root-cause → fix loop, checks the Spine for prior art, and records the root cause so the failure mode isn't repeated. Iron law — no fix without a confirmed root cause.
---

# troubleshoot — root cause, not symptom

The fast fix that doesn't understand the bug just moves it. This skill refuses to
patch a symptom until the root cause is proven, and writes the lesson back so the
next session doesn't relearn it.

## Steps

1. **Read the Spine.** Load `context.md` (architecture + language), `conventions.md`
   (test/debug commands), and `decisions/` — has this surface bitten us before? A
   prior ADR may already hold the answer.
2. **Reproduce first.** Get a reliable, minimal repro. If you can't reproduce it,
   you can't confirm a fix — gather more evidence before guessing.
3. **Investigate.** Follow the evidence: read the failing path, logs, recent
   diffs, and state. Narrow the surface methodically. No speculative edits.
4. **Hypothesize.** State a single falsifiable hypothesis about the *root* cause,
   then confirm it with evidence before changing anything. **Iron law: no fix
   without a confirmed root cause.**
5. **Pin it with a test.** Write a failing test that reproduces the bug (RED).
   This is the proof of the cause and the guard against regression.
6. **Fix at the root.** Make the minimal change that addresses the cause, not the
   symptom. Confirm the test goes GREEN and the original repro is gone.
7. **Record in the Spine.** Write the root cause and fix to `journal.md`. If the
   failure mode is a durable lesson, add an ADR in `.spine/decisions/NNNN-title.md`
   so it's remembered. Hand off to `verify` to confirm against criteria.

## Spine I/O

- **Reads:** `context.md`, `conventions.md`, `decisions/` (prior art), `journal.md`.
- **Writes:** `journal.md` (root cause + fix), `decisions/` (ADR for durable lessons).

## Notes

- Reproduce before you fix; a fix you can't see fail is a fix you can't trust.
- Check `decisions/` early — the cheapest debugging is the bug you already solved.
- The regression test is non-negotiable: without it, the bug comes back.
