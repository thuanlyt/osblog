# OSBLOG Pixel Reference Geometry

This file translates the owner-provided desktop reference into layout constraints. Values are intentionally proportional so the implementation can remain responsive rather than copying a fixed screenshot.

## Desktop composition target

At 1440px-class viewports, the page should visually read as one framed game portal rather than disconnected full-width sections.

| Region | Target behavior |
|---|---|
| Outer page frame | cool blue field with visible left/right breathing room; content nearly full-width but still framed |
| Header | compact, approximately 9–12% of first-screen visual height; brand left, nav right |
| Hero | dominant block immediately below header; roughly 28–34% of the first desktop screen |
| Category strip | compact horizontal band, roughly 7–10% of the first screen |
| Main content | begins immediately after category strip; feed left and sidebar right |
| Main columns | approximately 65–68% feed / 32–35% sidebar including gutter |
| Footer | framed closure using the same border/palette language |

## Header

- Brand zone: roughly 30–36% of header width on wide desktop.
- Navigation: remaining width, horizontally distributed with clear separators or icon-label groups.
- Header height should be visually compact. Avoid a modern 80–96px floating navbar with large empty padding.
- Header panel uses cream/paper fill, navy/cyan structural border and tiny warm-gold decoration.

## Hero

Hero is not a conventional photo card. It is a scene.

Layer order:

1. sky/background field,
2. distant pixel scenery,
3. central cream announcement/content panel or legible title zone,
4. OSBLOG headline/plaque,
5. foreground terrain/decorations,
6. optional small character/object sprites.

Text and CTA/plaque stay inside a safe central region so scenery can crop responsively.

Desktop aspect target: visually around 3.3:1 to 4.0:1 depending on viewport width and content. Do not force the exact screenshot ratio if it harms readability.

## Category strip

- full content width
- one compact framed band
- category items presented as icon + short label
- equal or near-equal distribution on desktop
- active/hover state through fill, inset border or hard-shadow change
- may become horizontal scroll only as a last resort; prefer wrapped/compact accessible mobile controls

## Main grid

Desktop target:

```text
┌──────────────────────────────────────────────┬──────────────────────┐
│                                              │                      │
│  latest / archive content                   │  sidebar panels      │
│  card grid                                   │                      │
│                                              │                      │
└──────────────────────────────────────────────┴──────────────────────┘
```

Feed side:
- Home uses a 3-card row when width permits.
- Card thumbnails carry strong pixel frames.
- Title/excerpt/metadata remain actual HTML text.

Sidebar:
- stacked panels with compact headers
- About OSBLOG can be the first panel
- statistics only when backed by real data
- project/docs/repository links are acceptable secondary panels

## Responsive transformations

### 1024px

- retain the framed portal feeling
- reduce brand/nav spacing
- hero decorations may crop or disappear before core text does
- feed/sidebar can remain two columns if each stays usable

### 768px

- header navigation may collapse to a menu
- hero height becomes content-driven and less panoramic
- feed becomes two columns or one depending on title lengths
- sidebar moves below primary content unless a two-column layout remains comfortable

### 375px

- one content column
- compact brand/header
- accessible menu button with at least 44×44px target
- hero becomes a short stacked pixel scene with central title/CTA
- category controls stack/wrap without clipped labels
- sidebar panels follow main feed
- decorative sprites can be removed; no essential information may disappear

## Similarity priority

When exact reference similarity conflicts with functionality, use this priority:

1. existing application correctness and truthful data
2. accessibility / readable VI+EN content
3. overall reference geometry and visual hierarchy
4. pixel border/palette/component language
5. decorative sprite fidelity

This allows the public UI to remain recognizably close to the reference while staying a production blog rather than a screenshot recreation.
