# 0005. Docs view: three-pane layout with a client-generated TOC

- **Status:** accepted
- **Date:** 2026-06-13

## Context

The Docs mode renders each Spine file as full-width markdown with a flat sidebar —
functional but plain. The goal is an "enterprise" docs feel: easy to scan, easy to
navigate, comfortable to read. The content is already pre-rendered to HTML by
`markdown.mjs` and served via `/api/spine`.

## Decision

Restructure Docs mode as a **three-pane layout**: sectioned sidebar · constrained
content · table-of-contents rail.

- **Content** is capped to a ~720px reading measure and centered, with a refined
  type hierarchy and a per-document header (title + kicker).
- **Sidebar** is grouped into sections (Overview: Architecture / Conventions /
  Journal; Decisions, with a live ADR count) and shows a clear active state.
- **TOC** is generated **client-side** from the rendered HTML: the frontend parses
  the document's `h2`/`h3` headings, injects anchor ids, and lists them in the
  right rail. Documents with fewer than ~3 headings omit the rail gracefully.

No backend change: this is layout, CSS, and a small amount of DOM in `app.js`.
The TOC is derived from the already-trusted, already-rendered HTML — no new
markdown parsing, no new dependency.

Rejected: server-side TOC generation in `markdown.mjs` (couples the renderer to a
view concern; the frontend already has the HTML). Rejected: a markdown/UI library
(violates zero-dependency).

## Consequences

- Reading is comfortable and navigable; long docs (context, journal) get in-page
  jump links.
- The TOC depends on heading structure in the Spine files — a reason to keep those
  documents well-headed (which they already are).
- Still zero runtime dependencies; the change is confined to `public/`.
