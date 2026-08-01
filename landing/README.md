# mood — cinematic landing (source)

Self-contained deliverables (all libs/fonts/images inlined, CSP-safe).

- **`mood-warm.html` — the brand-true landing (primary).** Warm cream/chocolate
  world, real product photography, honest scroll narrative. This is the on-brand
  version; open directly or deploy as a static file. Template: `mood-warm.template.html`,
  real product art in `warm-assets/`, reference frames `warm-assets/frame_*.png`.
- `mood-experience.html` — the earlier dark-luxe 6-act experience (kept for
  reference; the aesthetic was judged off-brand). Template `mood-experience.template.html`.
- (hero-only variant lives in the artifact history; template `mood-energy.template.html`.)

## mood-warm — design intent
Warm cream (`#F1E7D6`) / deep chocolate palette, amber cacao-dust point-field that
subtly sweeps hue with scroll (amber → sage → dusk — the mood-shift metaphor, kept
warm, never neon). Real ENERGY pouch + real dark-chocolate bars (white backgrounds
flood-fill keyed to transparent so they float on cream). Honest Hebrew-first
narrative: ritual → the shift → real 70% cacao product → transparent formula
(exact mg per ingredient) → born-in-Israel → CTA. Signature "warm background wash"
crossfades the page tint across the same amber→sage→dusk arc.

Stack: vanilla Three.js + custom GLSL point shader + GSAP ScrollTrigger + Heebo
(all inlined). Renders on software WebGL.

## Stack (live version)
Vanilla Three.js (r160) + custom GLSL point-cloud (simplex-noise displacement +
cursor force-field) + GSAP ScrollTrigger + glassmorphism UI + Heebo (inlined).
Acts: hero → the shift → 3D product bar (scroll-rotated, orange rim-lit) →
formula/ingredients → SKU range (scene accent color transitions Energy→Relax→Sleep)
→ launch. Hebrew-first, dark-luxe.

## Build (inject libs/fonts/textures into the template)
Read/write in UTF-8 (critical — a non-UTF-8 pass corrupts the Hebrew) and prepend
`<meta charset="utf-8">`. Tokens:
`__HEEBO_LAT__ __HEEBO_HE__ __BAR_ALBEDO__ __BAR_NORMAL__ /*__THREE__*/ /*__GSAP__*/ /*__SCROLLTRIGGER__*/`

## Production target
Port to Next.js (App Router) + @react-three/fiber + drei in `src/`, Tailwind for UI.
