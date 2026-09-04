# UI design-system module card

freshness: verified
verified_on: 2026-09-05
owner: supervisor

## Responsibility

`design-system/osblog/MASTER.md` owns the global visual and interaction source of truth for public blog and protected admin UI. `docs/ui-design.md` explains how the contract maps to Vite/React implementation. The card does not own application components, routing code, data persistence, or deployment.

## Entry points

- `design-system/osblog/MASTER.md:Authority` — tokens, typography, component specs, style, accessibility, responsive, motion, and image performance rules.
- `docs/ui-design.md:React/Vite implementation map` — shell, routing, article, forms, admin CRUD, and icon contracts.
- `docs/ui-design.md:Responsive and accessibility gates` — 375/768/1024/1440 checks, keyboard/focus, touch, reduced motion, and zoom behavior.

## Public contracts and invariants

- Components consume semantic CSS variables; page-specific overrides may not weaken accessibility, responsive, or performance rules.
- Normal text must meet 4.5:1 contrast; the pink accent is paired with dark on-accent ink, not white.
- Interactive areas are at least 44×44px with visible focus and keyboard semantics; icons are consistent SVGs, never emoji.
- Mobile-first layouts preserve browser zoom, reserve image space, use responsive media, and respect `prefers-reduced-motion`.
- The current primary button default and hover states both use `--color-accent` + `--color-on-accent` at 5.64:1.

## Dependency edges

The verified UA-0020 Vite/React scaffold consumes this card for the shell, routes, tokens, focus behavior, responsive layout, and reduced-motion CSS. Future content/admin components remain separate. QA must still verify the contract at the four reference widths, both themes, keyboard-only interaction, reduced motion, and image loading behavior.

## Verification

```powershell
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "open source bilingual editorial blog minimalist content-first" --design-system --persist -p "osblog" --output-dir F:\dev\test-useagent
python tools/useagent.py validate
```

UA-0005 worker report and UA-0008 review provide current evidence; independent contrast verification is recorded in the registry.

## Known gaps

The shell and placeholder routes are implemented and local deep-link checks passed under UA-0020. Visual browser QA, content/admin component coverage, and performance measurements remain pending. The canonical UI/UX search script is available from the host skill path; the target copy contains the skill instructions but not the script implementation.
