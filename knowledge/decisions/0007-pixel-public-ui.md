# Decision 0007 — Pixel public UI redesign

status: accepted
owner: project owner
accepted_on: 2026-09-09
scope: public frontend presentation

## Outcome

Replace the existing **public** osblog visual language with a cohesive pixel-game blog interface that closely follows the geometry, density, panel hierarchy, hard-edged borders, palette feel, and retro-game atmosphere of the owner-provided reference image while remaining recognizably **OSBLOG** rather than copying OviGame branding or content.

The target is a high-fidelity desktop interpretation (roughly 90–95% structural/visual similarity where implementation assets permit), plus responsive layouts designed from the same visual DNA at 375, 768, 1024, and 1440px.

## Owner constraints

- Keep the current Vite + React + TypeScript application architecture.
- Preserve backend/API behavior, database schema and migrations, Better Auth/admin behavior, Markdown publishing, bilingual VI/EN behavior, SEO, feeds, comments, and deployment adapters.
- Public routes are in scope: shell/header/navigation/footer, Home, Archive, Article, Docs, About, Error and 404.
- Protected admin/login presentation is out of scope unless the owner explicitly expands it later.
- Do not copy OviGame identity, mascot, text, domain, or proprietary-looking artwork. Build an OSBLOG-specific pixel identity and asset namespace.
- Do not fake statistics, comments, members, views, categories, or other data that the application does not actually expose.
- Keep accessibility, responsive behavior, reduced-motion support, performance discipline, semantic HTML, focus/keyboard behavior and touch-target requirements from the existing design contract.
- No framework migration, Tailwind/shadcn rewrite, or unnecessary UI dependency expansion.
- No deployment or merge to production without a later explicit owner decision.

## Reference geometry contract

The desktop public shell should preserve the reference's major visual rhythm:

1. framed brand/header row with primary navigation,
2. large pixel-scene hero,
3. category/navigation strip,
4. two-column main region with article/feed content on the left and stacked sidebar panels on the right,
5. framed footer/decorative closing region.

Exact content belongs to OSBLOG and existing application data. Responsive views must reflow rather than simply scale the desktop canvas.

## Implementation strategy

Use bounded, checkpointable cycles with one primary writer to keep the visual system coherent:

- P0 — owner decision / instruction conflict removal / baseline
- P1 — pixel visual contract and tokens
- P2 — reusable pixel primitives
- P3 — public shell
- P4 — Home hero + category strip
- P5 — Home posts + sidebar
- P6 — Archive
- P7 — Article reading system
- P8 — Docs/About/Error/404
- P9 — responsive, accessibility and visual QA
- P10 — independent review and release-candidate gate

Discovery/review may run independently, but overlapping application writes are serialized.

## UseAgent boundary

`thuanlyt/UseAgent` is read-only reference material for this redesign. Its current supervisor/autopilot/orchestrator/review guidance is used as a workflow model: bounded outcomes, narrow writer scopes, evidence-driven review, checkpoints, and stop conditions.

Do **not** blindly copy the current UseAgent control plane into osblog. The upstream CLI has materially diverged from the embedded osblog control plane, so any future synchronization must be treated as its own compatibility task with validation rather than being mixed into the pixel UI rewrite.

## Superseded visual direction

For **public pages only**, this decision supersedes the old Swiss/editorial black-pink visual style described by `design-system/osblog/MASTER.md` and the prior UI/UX Pro Max output. Those files remain historical/reference material and may continue to govern the out-of-scope admin UI until a separate owner decision changes that boundary.

## Acceptance gate

The redesign is not production-ready until:

- all public routes use one coherent pixel visual system,
- existing public behavior has no known regression,
- VI/EN behavior remains intact,
- lint, typecheck, tests and production build pass on the source intended to ship,
- browser/E2E and 375/768/1024/1440 visual checks are evidenced,
- independent review has no open P0/P1 finding,
- the owner accepts the final visual result before merge/deploy.
