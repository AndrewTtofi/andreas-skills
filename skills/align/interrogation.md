# Interrogation dimensions

The checklist `align` works through. The goal is not to ask *all* of these every
time — it is to **leave none of them silently assumed**. For each dimension,
either the Spine already answers it, the user answers it, or you state the
assumption you're making and get a yes/no. Nothing stays implicit.

Skip a dimension only when the Spine or an earlier answer has already settled it.
Batch related dimensions into a single round of questions (see SKILL.md) rather
than marching through them one at a time.

## 1. Problem & motivation
- What is the actual pain or opportunity? Who feels it?
- Why now? What happens if we do nothing?
- Is this the real problem, or a symptom of a deeper one?

## 2. Outcome & success
- What does "done" look like, concretely?
- How will we *observe* success — a metric, a behaviour, a passing test?
- What would make this a 10/10 result vs. a 6/10 result?

## 3. Users & stakeholders
- Who uses or is affected by this? (end users, other code, future maintainers)
- Whose expectations must it meet? Any non-obvious consumer?

## 4. Scope — in
- The specific things this change *will* do.

## 5. Scope — out (the highest-value dimension)
- What is explicitly **not** part of this work?
- What's tempting to include but should wait?

## 6. Constraints
- Technical: stack, versions, compatibility, platforms.
- Non-negotiables: deadlines, budget, must-not-break behaviours.
- Conventions the change must follow (from `conventions.md`).

## 7. Existing context & prior art
- What already exists in the repo that this touches or resembles?
- Related decisions in `.spine/decisions/`? Past attempts in `journal.md`?

## 8. Integration & dependencies
- What does it read from / write to / call / get called by?
- Upstream and downstream effects. Migration or data implications.

## 9. Edge cases & failure modes
- What inputs or states could break it?
- What should happen when it fails? (errors, retries, fallbacks)

## 10. Non-functional requirements
- Performance, security, accessibility, reliability expectations.
- UX tone / quality bar where relevant.

## 11. Risks & unknowns
- What does *neither* party know yet?
- Where are we guessing? What's the cost of guessing wrong?

## 12. Acceptance criteria
- Translate everything above into observable, testable checks.
- Each item: "Given X, when Y, then Z." No vague verbs ("improve", "handle").
