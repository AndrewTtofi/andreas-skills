# 0007. Refined-dark professional palette (charcoal + slate + one accent)

- **Status:** accepted
- **Date:** 2026-06-13
- **Labels:** dashboard, ux
- Supersedes the visual language of
  [[0003-vertical-timeline-via-cytoscape-preset]].

## Context

The dashboard's original look — a near-black "space" background with a starfield
and four saturated neon node colours (cyan / amber / violet / mint) — reads as
playful/cosmic, not professional. The graph also relied on those four hues to
distinguish node types, which compounded the noise.

## Decision

Reskin to a restrained, refined-dark system:

- **Background** charcoal `#0d0f14`; **text** slate `#e6e8ee` / muted `#9aa0ad`;
  **borders** hairline `rgba(255,255,255,0.08)`.
- **One accent**: indigo `#6e7bf2`, used for emphasis (active nav, cluster nodes,
  focus, key edges).
- Node/edge types are distinguished by **shape, weight, and a single accent**, not
  by a rainbow: clusters = accent-bordered chips, commits = small slate dots,
  decisions = outlined chips, focus = accent. Milestones = a subtle accent ring.
- **Remove the starfield** entirely.

These values live as CSS variables; `app.js`'s hardcoded Cytoscape colours are
rewritten to read the same palette.

Rejected: light enterprise theme (user chose dark); keeping dark but only
desaturating (didn't go far enough — the structure, not just saturation, needed
to change).

## Consequences

- A calmer, more professional surface; type differentiation now comes from form,
  not neon.
- The graph colour constants in `app.js` and the CSS variables must stay in sync
  (one accent, one slate ramp).
- The starfield code (`makeStars`, `.stars`) is deleted.
