# Interface design — deep modules

The best modules are **deep**: a simple interface hiding a substantial
implementation. They let a lot of functionality be used through a small surface.

## Principles

- **Small interface, deep implementation.** Maximize the functionality behind
  the smallest possible interface. One method that does a lot beats five that
  each leak internals.
- **Information hiding.** Each module should encapsulate a design decision the
  rest of the system doesn't need to know. If changing an internal choice forces
  changes in callers, the boundary is wrong.
- **Avoid shallow modules.** A wrapper that adds an interface as complex as what
  it wraps earns nothing. Pass-through methods and "manager" classes that just
  delegate are red flags.
- **Define errors out of existence** where you can — design interfaces so common
  error cases simply can't arise, rather than making every caller handle them.
- **General-purpose beats special-purpose.** A slightly more general interface is
  usually simpler and more reusable than several special-cased ones.

## Questions to ask of each module

- Can a caller use this without understanding its internals?
- Can I change the implementation without changing callers?
- Does the interface expose decisions that should be hidden?
- Is this module pulling its weight, or is it a shallow pass-through?

## Boundaries

Group what changes together; split what changes for different reasons. A good
boundary is one you can describe in a sentence: "everything about X lives here,
and the rest of the system only knows Y about it."
