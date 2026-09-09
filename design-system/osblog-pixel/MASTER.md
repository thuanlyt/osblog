# OSBLOG PIXEL — DESIGN SYSTEM MASTER V2

status: **production-active**
owner reference: uploaded 1448×1086 retro pixel blog screenshot, 2026-09-09
scope: public OSBLOG frontend only
admin/login: intentionally outside this visual system

## 1. Authority

This file is the source of truth for the public OSBLOG pixel frontend. The owner-supplied reference defines the visual grammar; OSBLOG keeps its own identity, text, routes, data and original artwork.

The public UI must not drift back to the previous Swiss/editorial theme or become a modern SaaS layout decorated with a few pixel stickers.

Functional contracts remain mandatory: bilingual VI/EN, semantic HTML, keyboard/focus behavior, 44px touch targets, reduced motion, Markdown readability, SEO/feed behavior, comments, auth boundaries and responsive behavior.

## 2. Visual target

The target is a cheerful late-1990s/early-2000s game portal:

- cream paper panels framed by navy pixel outlines
- cyan/sky outer field
- teal footer and mint utility surfaces
- warm gold separators and hard offset shadows
- dense header with oversized mascot/logo and compact icon navigation
- wide pixel-game hero with scenery visible around a centered announcement card
- category band immediately under the hero
- desktop main area near 2/3 article feed + 1/3 sidebar
- hard square/stepped corners; no soft modern card language
- original OSBLOG pixel scenery, not copied OviGame art

## 3. Token architecture

Follow the UI/UX Pro Max three-layer model: **primitive → semantic → component**.

### Primitive colors

| Primitive | Value | Role |
|---|---:|---|
| `sky-500` | `#71C4E4` | hero / outer sky |
| `sky-800` | `#2F819F` | page frame field |
| `paper-100` | `#FFF8E3` | bright panel |
| `paper-200` | `#FFF1CE` | main cream |
| `paper-400` | `#F4DFAD` | inset/depth |
| `teal-300` | `#8CC9C4` | footer |
| `teal-700` | `#4D898A` | teal border/depth |
| `navy-600` | `#286074` | regular outline |
| `navy-900` | `#173F57` | strongest outline/text |
| `blue-500` | `#6177C2` | primary button/navigation accent |
| `blue-700` | `#3F559E` | hover/headings |
| `gold-500` | `#E6AC4C` | separator/shadow |
| `gold-300` | `#FFD878` | sparkle/highlight |
| `green-500` | `#4F9B4F` | scenery/accent |
| `green-800` | `#2F7040` | scenery outline/kicker |
| `red-500` | `#D7656D` | heart/warm accent |
| `pink-400` | `#E68DA0` | secondary sprite accent |

### Semantic aliases

```css
--surface-page: var(--paper-200);
--surface-panel: var(--paper-100);
--surface-utility: #DCEFE7;
--surface-footer: var(--teal-300);
--border-default: var(--navy-600);
--border-strong: var(--navy-900);
--text-primary: var(--navy-900);
--text-link: var(--blue-700);
--accent-primary: var(--blue-500);
--accent-warm: var(--gold-500);
--accent-positive: var(--green-800);
```

### Component aliases

Components may expose aliases such as `--header-bg`, `--panel-border`, `--button-bg`, `--button-shadow`, `--hero-card-bg`, but application TSX must not grow page-specific raw hex values.

Pixel artwork is allowed its own compact `--art-*` palette when that improves sprite maintenance.

## 4. Geometry lock

### 1440-class desktop

Reference order is fixed:

1. header ≈ 8–12% viewport composition height
2. hero ≈ 300–360px
3. category band ≈ 80–96px
4. main feed + sidebar
5. compact teal footer

Outer frame: 4–6px navy.
Main internal gaps: 10–18px.
Primary panel borders: 3px.
Strong structural boundaries: 4–5px.
Hard offset shadow: 3–6px, never Gaussian blur.

### Header

- logo block occupies roughly 28–34% desktop width
- navigation is dense, horizontally separated by warm dashed rules
- navigation icon + short label
- utility controls are visually secondary to the five primary items

### Hero

- scenery must remain visible on both sides and along the ground line
- centered cream notice consumes roughly 70–78% of hero width
- headline is blocky, high contrast and compact
- one large blue primary CTA
- HTML text remains live; never bake VI/EN hero copy into raster artwork

### Home content

- latest-post panel: 3 columns at wide desktop
- sidebar: About → Stats → Feed/utility
- cards are information-dense and visually framed
- use actual application data only; never fake member/comment counts

## 5. Typography

The visual language should read as pixel/block display without sacrificing Vietnamese glyph quality.

- display/logo: heavy condensed system/block face + hard outline/shadow treatment
- navigation/labels/meta: `ui-monospace`, Consolas-compatible stack
- article body: readable existing font stack, normal anti-aliased text
- body copy should not imitate bitmap text
- normal body target ≥ 15–16px on article surfaces; compact card/meta text may be smaller only with passing contrast

Do not add a webfont dependency until Vietnamese coverage and production loading are verified.

## 6. Pixel shape language

Allowed:

- square corners
- stepped `clip-path` corners
- 2–5px hard outlines
- hard offset box shadows
- tiny block sparkles
- crisp sprite assets with `image-rendering: pixelated`

Forbidden:

- glassmorphism
- backdrop blur
- soft 12–24px rounded cards
- diffuse shadows
- modern gradient SaaS buttons
- emoji as interface icons
- random visual mixing of pixel and glossy 3D styles

## 7. Original art contract

Reserved namespace:

```text
public/pixel/
  brand/
  hero/
  icons/
  scenery/
  decorations/
  sprites/
```

Current hero art is OSBLOG-owned and stored under `public/pixel/hero/`.

Rules:

- never copy OviGame logo, mascot, copy, domain or proprietary sprite art
- style grammar may be referenced; actual assets must be original
- SVG pixel scenes should use `shape-rendering="crispEdges"`
- raster sprites must reserve width/height to avoid CLS
- decorative assets use empty alt / `aria-hidden`

## 8. Component specifications

### Primary panel

| State | Border | Surface | Depth |
|---|---|---|---|
| default | 3px navy | cream | 3px gold/neutral offset |
| hoverable | same bounds | warm cream | deeper 4–5px hard offset |
| focus-within | strong visible outline | unchanged | unchanged |

### Primary button

| State | Fill | Text | Border |
|---|---|---|---|
| default | blue | white | 3–5px navy |
| hover | lighter blue | white | unchanged |
| active | blue-deep | white | shadow reduced, no layout shift |
| focus-visible | blue | white | explicit outer focus indicator |
| disabled | muted surface | high-contrast muted text | still legible |

### Post card

- image 16:8.5–16:9
- 3px outline
- category eyebrow
- title max visual weight inside card
- short excerpt
- bottom metadata row separated by dashed warm rule

## 9. Responsive contract

Required validation widths: **1440 / 1024 / 768 / 375 CSS px**.

### 1440
Full logo, horizontal nav, 3-card feed, sidebar.

### 1024
Compact logo/nav, 2-card feed allowed, sidebar may remain beside feed only if readable.

### 768
Mobile navigation becomes explicit accessible control; content prioritizes feed; sidebar stacks.

### 375
Single column. No horizontal scrolling. Hero notice nearly full width while scenery remains visible. Category grid becomes 2 columns. Minimum touch target 44×44px.

Never scale the desktop page as an image. Recompose.

## 10. Route rules

### Home
Closest route to the reference and visual fidelity benchmark.

### Archive
Keep search/category/year/sort/pagination behavior; pixelize only presentation.

### Article
Pixel chrome outside, calmer reading surface inside. Markdown, code, tables, images, links and comment form must remain usable.

### Docs
Pixel library/sidebar treatment but preserve information architecture and mobile contents drawer.

### About / Error / 404
Use the same banner/panel/button primitives; no fallback to the legacy public theme.

## 11. QA stack

Three complementary gates:

1. **source gate** — lint, typecheck, focused tests/build
2. **Playwright** — deterministic route, interaction and accessibility regression
3. **Chrome DevTools MCP** — rendered screenshots/snapshots, responsive emulation, console, network, Lighthouse and performance traces

Vercel build status proves deployability, not visual correctness.

### Browser matrix

- `/` — 1440 / 1024 / 768 / 375
- `/archive` — 1440 / 768 / 375
- one published article — 1440 / 768 / 375
- `/docs` + one doc — 1440 / 375
- `/about` — 375 + desktop spot-check
- unknown route — 375

## 12. Stop / challenge rules

The supervisor should challenge a requested visual change when it:

- improves screenshot similarity by reducing readability/accessibility
- fakes real application statistics
- introduces copied third-party assets
- causes horizontal overflow or mobile scaling
- expands into backend/auth/database changes without a real integration defect

A bounded cycle stops when its declared visual outcome is achieved. Do not opportunistically restyle a second route.

The whole pixel program can stop when:

- no open P0/P1 visual/functional/a11y regression
- 1440/1024/768/375 have no horizontal overflow
- Home clearly preserves header → hero → category → feed/sidebar geometry
- all public routes use the same visual grammar
- full source/build gates are green
- two consecutive visual-QA rounds produce only low-value micro adjustments

At that point additional polish has diminishing return and should require a new owner goal.
