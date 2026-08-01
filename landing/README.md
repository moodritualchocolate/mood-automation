# mood — cinematic landing (source)

Two deliverables, both self-contained (all libs/fonts/textures inlined, CSP-safe):

- `mood-experience.html` — the full 6-act scroll experience (self-contained, ~1MB).
  Open directly in a browser, or deploy as a static file. Source template with
  placeholder tokens is `mood-experience.template.html`.
- (hero-only variant lives in the artifact history; template `mood-energy.template.html`.)

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
