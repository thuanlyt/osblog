# OSBLOG Pixel Public Design System — MASTER

status: active for public pixel redesign
owner decision: `knowledge/decisions/0007-pixel-public-ui.md`
reference: owner-supplied pixel-game blog screenshot (2026-09-09)

## Authority

This file is the public visual source of truth for the pixel redesign. It supersedes the legacy Swiss/editorial visual style for public pages only. The protected admin/login UI remains outside this redesign.

Accessibility, semantic HTML, responsive behavior, keyboard/focus, touch-target, reduced-motion and performance requirements from the existing project remain mandatory.

## Visual thesis

OSBLOG should feel like a polished late-1990s/early-2000s game portal rebuilt with modern responsive HTML: cheerful pixel scenery, cream paper-like panels, cyan/blue structural framing, navy hard outlines, small warm-gold highlights, compact iconography, and clear content density.

It must not look like a modern SaaS dashboard with a pixel font sprinkled on top.

### Required traits

- hard-edged pixel/stepped borders and shadows
- framed cream panels on a cool sky-blue page field
- dense but orderly navigation and content modules
- hero scene with obvious pixel-game atmosphere
- reusable 8px-grid-compatible spacing
- flat colors; no glassmorphism, blur panels or glossy gradients
- tiny decorative stars/sparkles/grass/clouds may support the composition
- OSBLOG branding and real application content only

### Forbidden traits

- copied OviGame logo, mascot, wording, domain or proprietary artwork
- generic rounded SaaS cards
- oversized empty whitespace typical of minimalist landing pages
- glass/frosted panels, soft floating shadows or neon cyberpunk styling
- emoji used as interface icons
- fake counters or placeholder social proof presented as real data
- pixelation filter applied to ordinary modern icons as a substitute for coherent art direction

## Core palette

All public components should consume semantic tokens rather than page-specific color literals.

| Token | Value | Use |
|---|---:|---|
| `--px-sky` | `#59B9DD` | page field / outer framing |
| `--px-sky-light` | `#A9E4F1` | inner sky / quiet secondary field |
| `--px-paper` | `#FFF6D8` | primary cream panels |
| `--px-paper-light` | `#FFFBEA` | article/card surfaces |
| `--px-ink` | `#153457` | primary navy outline/text |
| `--px-ink-deep` | `#0A2543` | strongest outline / headings |
| `--px-blue` | `#4169B2` | navigation/button fill |
| `--px-blue-light` | `#7895D4` | inset/button highlight |
| `--px-gold` | `#F0B24A` | separators, stars, small accents |
| `--px-gold-light` | `#FFD97A` | highlight pixels |
| `--px-green` | `#4F9B4F` | positive/scenery accent |
| `--px-green-deep` | `#2D6D3D` | green outline/shadow |
| `--px-red` | `#D96668` | favorite/error/accent |
| `--px-pink` | `#E98E9E` | secondary warm accent |
| `--px-muted` | `#7A8793` | secondary text only after contrast check |
| `--px-white` | `#FFFFFF` | sparse highlight pixels / high contrast surface |

These are starting production tokens, not permission to bypass contrast QA. Normal text must still meet the project's WCAG-oriented contrast gate.

## Border and depth language

Preferred primitives:

```css
--px-border: 3px;
--px-border-strong: 4px;
--px-shadow-x: 3px;
--px-shadow-y: 3px;
```

- Primary modules: 3px navy outline + 1px warm/cool inner highlight where useful.
- Buttons/tabs: hard offset shadow, no Gaussian blur.
- Corners: square or tiny stepped/pixel corners. Avoid 8–16px smooth radius.
- Hover may shift fill/shadow state but must not move layout bounds.
- `image-rendering: pixelated` is valid for intentionally low-resolution sprite assets only.

## Spacing and density

Use a 4px base rhythm, with 8/12/16/24/32px as dominant values. The reference is intentionally denser than the previous editorial layout.

- wide desktop outer gutter: 12–24px visual frame
- module gap: 8–16px
- card interior: 12–16px
- long-form article interior: 20–32px for readability
- hero can be visually dense but text must remain legible at 1024px and below

## Typography

The UI needs a pixel identity without sacrificing Vietnamese readability.

- Display/navigation labels: use a pixel/block display face only if it has complete Vietnamese coverage; otherwise use a robust system/condensed sans with pixel-style outline treatment.
- Body/article copy: readable sans or serif with full VI/EN glyph coverage; do not force a bitmap font for paragraphs.
- Headings: strong navy weight, compact line-height, optional 1–2px hard shadow/outline in decorative contexts.
- Never rasterize article text into images.
- Preserve actual `lang` attributes and allow Vietnamese diacritics to wrap naturally.

P1 deliberately does not add a new font dependency. Font selection is an implementation task only after glyph coverage is verified.

## Icon contract

- Use a single consistent pixel icon family or OSBLOG-owned sprite set for public chrome.
- Existing semantic SVGs may remain temporarily during migration when replacing them would risk functionality, but P9 visual QA must flag mixed icon language.
- Decorative sprites require `aria-hidden="true"` / empty alt text.
- Functional icon-only controls require accessible names.

## Public page hierarchy

### Desktop shell

1. framed header/brand + primary navigation
2. large pixel hero scene
3. category/navigation strip
4. main content grid (approximately 2/3 feed + 1/3 sidebar)
5. footer/decorative close

### Home

- pixel hero is the strongest visual anchor
- latest posts appear as framed image cards in a dense grid
- sidebar uses stacked pixel panels
- only real application data may populate metadata/statistics

### Archive

Keep search/category/year/sort/pagination behavior intact; restyle controls as pixel panels/buttons without reducing labels, focus visibility or keyboard reachability.

### Article

Use pixel chrome around the article, but reduce decorative density inside the reading column. Prose stays near the existing readable line-length contract; code, tables, quotes, images and comments must remain usable.

### Docs / About / Error / 404

Use the same shell, panel, button, heading and decoration primitives. No route may fall back to the old public Swiss/editorial visual language.

## Responsive contract

Reference widths remain 375 / 768 / 1024 / 1440px.

- 1440: full framed shell, wide hero, feed + sidebar
- 1024: preserve two-column identity where readable; reduce decorative density
- 768: primary content first; sidebar can stack below; navigation may collapse
- 375: single column; compact hero; no horizontal scrolling; mobile navigation is a real accessible control

Do not scale the desktop page like a screenshot. Recompose it.

## Motion

Pixel UI should feel responsive, not animated for its own sake.

- hard state changes may still use short 100–180ms opacity/background transitions
- no looping parallax or sprite animation is required
- respect `prefers-reduced-motion`
- avoid animation that changes layout dimensions

## Asset namespace

Reserved public path:

```text
public/pixel/
  brand/
  hero/
  icons/
  scenery/
  decorations/
  sprites/
```

Assets must be OSBLOG-specific, optimized, explicitly sized and used with reserved aspect ratios to protect CLS.

## Implementation order

Do not hard-code whole pages before primitives exist.

1. semantic pixel tokens
2. frame/panel/button/nav primitives
3. shell
4. Home hero/category
5. Home feed/sidebar
6. Archive
7. Article
8. remaining pages
9. cross-width visual/a11y QA

## Visual acceptance checklist

A public page fails the pixel gate if any of these are true:

- it still reads primarily as the old Swiss/editorial theme
- rounded/blurred modern cards dominate the page
- header → hero → category → feed/sidebar geometry is lost on desktop Home
- pixel visuals are merely decorative stickers around an otherwise unchanged layout
- OSBLOG identity is confused with OviGame
- content/controls regress, bilingual text breaks, or mobile horizontally scrolls
- visual density or readability is materially worse than the reference target
