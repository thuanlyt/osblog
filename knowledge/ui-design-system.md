# UI design-system module card

freshness: verified
verified_on: 2026-09-09
owner: supervisor

## Responsibility

Visual authority is now split by owner decision `knowledge/decisions/0007-pixel-public-ui.md`:

- **Public frontend:** the pixel redesign program is authoritative for visual direction. The supplied pixel-game blog reference controls geometry and visual DNA; a dedicated pixel design contract will be added during P1 before broad application changes.
- **Protected admin/login:** `design-system/osblog/MASTER.md` and `docs/ui-design.md` remain the current presentation contract unless scope is explicitly expanded.
- **All UI:** existing accessibility, responsive, reduced-motion, semantic HTML, focus/keyboard, touch-target and performance invariants remain mandatory and cannot be weakened by the redesign.

This card does not own routing, data persistence, authentication, API behavior, Markdown publishing, SEO/feeds or deployment.

## Entry points

- `knowledge/decisions/0007-pixel-public-ui.md` — owner-approved public redesign outcome, reference geometry, scope boundaries, cycles and release gate.
- `design-system/osblog/MASTER.md` — legacy tokens/components and continuing admin visual contract; no longer authoritative for public visual style.
- `docs/ui-design.md` — existing implementation/accessibility/responsive guidance that remains applicable where it does not conflict with the public pixel direction.

## Public contracts and invariants

- Public pages must use a coherent OSBLOG-specific pixel system rather than a mixture of the legacy Swiss/editorial presentation and the new direction.
- The reference's desktop hierarchy is a geometry contract: framed header/navigation, large pixel hero, category strip, feed + sidebar main region, then footer.
- Do not copy OviGame branding, text, domain, mascot or artwork. Pixel assets must belong to the OSBLOG identity.
- Components should continue to consume semantic tokens; page-specific styling must not weaken accessibility, responsive or performance rules.
- Normal text must meet WCAG-oriented contrast requirements; visible keyboard focus and semantic controls remain required.
- Interactive areas remain at least 44×44px where practical for touch interaction, with keyboard semantics and no essential hover-only behavior.
- Responsive views at 375/768/1024/1440 must reflow without horizontal scrolling; do not shrink the desktop composition as a single canvas.
- Respect `prefers-reduced-motion`; reserve media space and avoid unnecessary decorative continuous animation.
- Do not fabricate data to mimic the visual reference.

## Dependency edges

The public shell and public routes consume this card together with decision 0007. Admin continues to consume the legacy design system. Backend/API/auth/database/Markdown/SEO/feed/comment behavior is outside the redesign boundary and should remain unchanged unless a directly evidenced compatibility bug requires a minimal fix.

## Verification

For the pixel program, verification is source-bound and milestone-based:

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e   # milestone/release gate, not necessarily every bounded cycle
```

Visual QA must additionally cover 375, 768, 1024 and 1440px and compare desktop geometry/density against the owner-supplied reference. A green code test suite alone is not evidence of visual fidelity.

## Known gaps / next action

P0 only establishes the owner override and safe boundary. P1 must create the dedicated pixel visual contract (tokens, palette, typography, borders/shadows, geometry, assets and page rules) before reusable public pixel primitives or page rewrites begin.
