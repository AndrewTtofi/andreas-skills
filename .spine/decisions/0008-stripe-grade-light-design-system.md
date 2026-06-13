# 0008. Stripe-grade light design system

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, ux
- Supersedes [[0007-refined-dark-professional-palette]].

## Context

Two dark iterations (neon, then refined-dark indigo) were both rejected as not
professional enough — including the fonts. Asked for an "ultra professional"
north-star, the choice was **Stripe**: a light, high-polish enterprise look.

## Decision

Adopt a light design system modelled on Stripe's tokens:

- **Surfaces** white `#ffffff` / subtle `#f6f9fc`; **ink** navy `#0a2540`,
  secondary `#425466`, muted `#697386`; **borders** `#e3e8ee`.
- **One accent**: blurple `#635bff`.
- **Type**: **Inter** for everything (UI + headings, tight tracking, weights
  400–700); **IBM Plex Mono** for code/labels. The serif brand mark (Instrument
  Serif) and IBM Plex Sans are dropped.
- Soft layered shadows for depth (`--shadow-sm/md`); hairline borders; generous
  spacing.

Tokens live as CSS variables; `app.js`'s Cytoscape colour constants and the graph
text-outline (now white `#f6f9fc`) are rewritten to match.

Rejected: Vercel stark mono, Notion warm-neutral, and any dark theme.

## Consequences

- A calm, premium, high-legibility surface across graph and docs.
- Graph labels need a light text-outline (white) for legibility over edges.
- The design is now light-first; any future node/edge styling must read on white.
