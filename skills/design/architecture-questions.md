# Architecture question bank

The decisions worth interviewing on. Pick the ones that matter for this work;
skip what the Spine already answers. Ask one at a time.

## Greenfield (new project)

- **Stack & scaffolding** — language, framework, and how the project is bootstrapped. What does `conventions.md` already imply?
- **Data model** — the core entities and their relationships. What's the source of truth?
- **Persistence** — where state lives (DB, files, external service) and why.
- **Module boundaries** — the top-level pieces and the single responsibility of each.
- **Key interfaces** — how the major modules talk to each other (the contracts).
- **External dependencies** — third-party services/libraries, and what we're coupling ourselves to.
- **Data / control flow** — how a representative request or action moves through the system.
- **Failure modes** — what can go wrong, and how the design contains it.
- **Boundaries of v1** — what's explicitly out of scope for the first build.

## Existing codebase (feature within current architecture)

- **Current shape** — which existing modules does this touch? Read them first.
- **Fit** — does this extend an existing pattern, or introduce a new one? Prefer extending.
- **New boundaries** — what new module/interface is needed, and where does it sit?
- **Data model delta** — what entities/fields/migrations change?
- **Blast radius** — what else depends on the code being changed? What could regress?
- **Consistency** — which existing ADRs and conventions constrain this design?

## For every decision

- What are the 2–3 viable approaches and their trade-offs?
- Which gives the deepest module / simplest interface?
- What's the cost of being wrong, and how reversible is it?
- Is this needed now (YAGNI), or are we designing for an imagined future?
