---
name: remember
description: Use at the end of a work session to distill what happened back into the .spine/ store so the next session starts informed instead of cold. Updates context and conventions, records decisions as ADRs, and compacts the journal.
---

# remember — close the loop

The Spine is only valuable if it stays current. This skill is the closing ritual
that pays that forward.

## Steps

1. **Review the session.** What was decided, built, learned, or reversed?
2. **Update `context.md`** if the architecture map or shared language changed —
   add new terms, update the module map.
3. **Update `conventions.md`** if a new pattern or command became standard.
4. **Record decisions.** For each non-obvious choice with lasting impact, add an
   ADR in `.spine/decisions/NNNN-short-title.md` (context, decision, why,
   consequences).
5. **Compact `journal.md`.** Collapse the blow-by-blow into: *Current focus*,
   *Next step*, and a short *History* of dated milestones. Drop transient noise.
6. **Write a one-paragraph handoff** at the top of *Current focus* so a fresh
   session — yours or a teammate's — can resume immediately.
7. **Suggest committing** the updated `.spine/`.

## Spine I/O

- **Writes:** `context.md`, `conventions.md`, `journal.md`, `decisions/`.

## Notes

- Record durable knowledge only. The journal is a runway, not a diary.
- An ADR captures *why*, not just *what* — that's what prevents future regressions.
