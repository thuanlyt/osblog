# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** osblog
**Generated:** 2026-09-05 02:38:43
**Category:** Magazine/Blog

**Authority:** This file is the global visual and interaction source of truth for
the public blog and protected admin UI. A page-specific override may narrow these
rules, but may not weaken the accessibility, responsive, or performance contracts.

**Implementation target:** Vite + React + TypeScript. Keep colors and spacing in
semantic CSS custom properties; components must not introduce ad-hoc page colors.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#18181B` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#3F3F46` | `--color-secondary` |
| Accent/CTA | `#EC4899` | `--color-accent` |
| Background | `#FAFAFA` | `--color-background` |
| Foreground | `#09090B` | `--color-foreground` |
| Muted | `#E8ECF0` | `--color-muted` |
| Border | `#E4E4E7` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#18181B` | `--color-ring` |

**Color Notes:** Editorial black + accent pink

#### Accessible semantic extensions

The generated accent is intentionally not used with white for normal text:
`#EC4899` on `#FFFFFF` is only 3.53:1. Use dark ink on accent fills and the
darker accent ink for small-text links.

| Token | Light value | Approved use |
|-------|-------------|--------------|
| `--color-surface` | `#FFFFFF` | Cards, form controls, modal surfaces |
| `--color-on-surface` | `#09090B` | Text and icons on surfaces |
| `--color-on-accent` | `#09090B` | Text/icons on `--color-accent` fills |
| `--color-accent-ink` | `#9D174D` | Small-text links and emphasis on light surfaces |
| `--color-focus-ring` | `#18181B` | 3px keyboard focus ring with 2px offset |

Verified WCAG light-theme pairs: foreground/background `19.06:1`,
secondary/background `10.01:1`, primary/white `17.72:1`,
accent-ink/background `7.55:1`, and destructive/background `4.63:1`.
The accent fill with on-accent ink is `5.64:1`. Treat these as minimums;
recheck any future token change with a contrast calculator.
The primary button uses this same `--color-accent`/`--color-on-accent` pair in
both its default and hover states, so hover preserves the `5.64:1` normal-text
contrast while adding a shadow affordance.

#### Dark-theme mapping

Dark mode is token-driven, not a raw inversion. Use `#09090B` for the page
background, `#18181B` for surfaces, `#FAFAFA` for primary text,
`#D4D4D8` for secondary text, `#3F3F46` for borders, `#F472B6` for the
accent fill with `#18181B` on top, and `#F9A8D4` for accent text/rings.
Verify both themes independently before release.

### Typography

- **Heading Font:** Playfair Display
- **Body Font:** Source Serif 4
- **Mood:** monochrome, editorial, austere, typographic, pocket manifesto, luxury, high contrast, brutalist mobile
- **Google Fonts:** [Playfair Display + Source Serif 4](https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400|Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
  padding: 12px 24px;
  border-radius: 8px;
  min-height: 44px;
  font-weight: 600;
  transition: background-color 200ms ease, box-shadow 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  /* Preserve the approved 5.64:1 accent/on-accent contrast pair. */
  background: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 12px 24px;
  border-radius: 8px;
  min-height: 44px;
  font-weight: 600;
  transition: background-color 200ms ease, color 200ms ease;
  cursor: pointer;
}

.btn-primary:focus-visible,
.btn-secondary:focus-visible,
.card-interactive:focus-visible,
.input:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
}

.card-interactive {
  transition: box-shadow 200ms ease, background-color 200ms ease;
  cursor: pointer;
}

.card-interactive:hover {
  box-shadow: var(--shadow-lg);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  min-height: 44px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--color-ring);
  outline: none;
  box-shadow: 0 0 0 3px #FBCFE8;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Swiss Modernism 2.0

**Keywords:** Grid system, Helvetica, modular, asymmetric, international style, rational, clean, mathematical spacing

**Best For:** Corporate sites, architecture, editorial, SaaS, museums, professional services, documentation

**Key Effects:** display: grid, grid-template-columns: repeat(12 1fr), gap: 1rem, mathematical ratios, clear hierarchy

### Page Pattern

**Pattern Name:** Newsletter / Content First

- **Conversion Strategy:** Single field form (Email only). Show 'Join X, 000 readers'. Read sample link.
- **CTA Placement:** Hero inline form + Sticky header form
- **Section Order:** 1. Hero (Value Prop + Form), 2. Recent Issues/Archives, 3. Social Proof (Subscriber count), 4. About Author

---

## Anti-Patterns (Do NOT Use)

- ❌ Poor typography
- ❌ Slow loading

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

## Responsive Layout Contract

Start at the smallest supported viewport and enhance upward. The reference
states are 375px (small phone), 768px (tablet), 1024px (desktop), and 1440px
(wide desktop); do not introduce one-off breakpoints without a layout reason.

- Base gutter is 16px; use 24px from 768px and 32px from 1024px upward.
- Keep the global container fluid with `width: min(100% - 2 * gutter, 72rem)`.
- Keep article prose at 60–75 characters per line (`max-width: 65ch`); mobile
  prose may be 35–60 characters per line.
- The mobile order is skip link/header, primary navigation, page title/hero,
  main content, related content, then secondary/footer content. Do not hide
  essential content or require horizontal scrolling.
- Use a single-column feed on phones, a two-column editorial grid from 768px,
  and a 12-column Swiss grid from 1024px. Preserve source order in the DOM.
- Fixed or sticky UI must reserve equivalent top/bottom padding. Use
  `min-height: 100dvh` where viewport height is needed and never disable zoom.
- Use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for fixed
  mobile control bars.

## Editorial Type and Rhythm

- Set the root body size to 16px with line-height 1.5 or greater. Body and
  article copy use Source Serif 4; headings use Playfair Display. Metadata may
  use a system sans or monospace face at 12px only when supplemental.
- Use a restrained type scale: 16/24 body, 18/27 lead, 24/29 section title,
  and 32/38 article title on mobile; scale article titles to 48/56 at 1024px.
- Use the existing 4px/8px spacing rhythm. Prefer 16/24/32/48/64px for page
  hierarchy; never use spacing as the only indicator of grouping.
- Bilingual content keeps a stable reading order. Set the correct `lang` on
  each language region, preserve diacritics, and let titles wrap rather than
  truncate. A language switcher is a labeled button or link, not flag-only UI.

## Accessibility and Interaction Contract

- Include a visible-on-focus “Skip to main content” link, one `main` landmark,
  labeled `nav` landmarks, sequential heading levels, and focus placement on
  the main heading or `main` after a client-side route change.
- Use native `a`, `button`, `input`, `select`, and `dialog` semantics. Every
  form control has a persistent `<label>`; errors sit beside the field, explain
  the cause and fix, and use `aria-describedby` plus an `aria-live`/`role=alert`
  region as appropriate.
- Icon-only controls require an accessible name (`aria-label` or visible text),
  and decorative SVGs use `aria-hidden="true"`. Use one outline SVG family
  (Phosphor or Lucide) at consistent 1.5–2px stroke; never use emoji as icons.
- All interactive areas are at least 44×44px with at least 8px between adjacent
  targets. Add `touch-action: manipulation`; do not make essential behavior
  hover-only. Show hover, pressed, disabled, loading, and error states without
  changing layout bounds.
- Keep keyboard order equal to visual order. Enter/Space activate buttons,
  Escape closes menus/dialogs and returns focus to the trigger, and dialogs
  trap focus only while open. Use `:focus-visible` rings; never remove outlines
  without an equivalent ring.
- Never communicate status by color alone. Pair success/error/warning with
  text or an icon and ensure state text remains readable in both themes.

## Motion and Performance Contract

- Use only meaningful micro-interactions, typically 150–300ms with ease-out on
  entry and ease-in on exit. Animate `transform` and `opacity`, not width,
  height, top, or left; avoid layout-shifting hover transforms. Limit motion to
  one or two purposeful elements per view.
- Under `@media (prefers-reduced-motion: reduce)`, set non-essential
  transitions/animations to near-zero, remove parallax/staggering, and keep
  content immediately readable. Loading indicators may continue only when they
  communicate active work.
- Article and card images use AVIF/WebP with a JPEG/PNG fallback when needed,
  responsive `srcset`/`sizes`, explicit `width`/`height` or `aspect-ratio`, and
  `decoding="async"`. The hero image may be eager; below-fold images use
  `loading="lazy"`. Meaningful images get concise alt text; decorative images
  use `alt=""`. Reserve media space to protect CLS (<0.1 target).
- Keep above-the-fold content and critical CSS small. Lazy-load below-fold
  routes/media, show skeleton/progress feedback for async work over 300ms, and
  use stable content IDs as React list keys. Do not add decorative continuous
  animation or unnecessary third-party scripts.

## Page Overrides

- **Home / Trang chủ:** content-first hero with the blog value proposition,
  language switch, latest posts, and a single email subscription CTA. Keep the
  first post visible before secondary social proof.
- **Archive / Lưu trữ:** searchable/filterable list with a labeled search field,
  category controls, year grouping, and an explicit empty state. Filters remain
  keyboard reachable and collapse into a labeled control on phones.
- **Article / Bài viết:** article title, language/date/read-time metadata,
  responsive hero media, 65ch prose, headings, related/random/most-viewed
  content after the article, and comments with visible moderation/error states.
- **Admin:** reuse tokens and landmarks but prioritize task clarity: labeled
  CRUD forms, inline validation, status text, confirmation before destructive
  actions, an undo path where practical, and no color-only publication status.

## Source Search and Verification

The baseline was generated by UI/UX Pro Max. Re-run from any checkout with:

```text
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "open source bilingual editorial blog minimalist content-first" --design-system --persist -p "osblog" --output-dir F:\dev\test-useagent
```

Focused guidance searches used for this contract:

```text
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "animation accessibility z-index loading" --domain ux
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "responsive images rerender list loading" --stack react
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "outline navigation svg" --domain icons
```
